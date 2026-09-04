import { describe, expect, it } from 'vitest'

import { flagsNaBusca, PARAM_FLAG } from '@/app/flags'
import { artefatoIds, gateIds, gates, type GateId } from '@/data/gates'
import { parcelasPorGate, PERCENTUAL_TOTAL } from '@/data/payment'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { estadoDosGates, type EntradaDeGates, type EstadoDeGate } from '@/engine/gates'
import { liberacaoDePagamento } from '@/engine/payment'
import {
  emptyApprovals,
  runPipeline,
  type Approvals,
  type Signature,
} from '@/engine/pipeline'

const assinatura = (versao = PLAYBOOK_VERSION): Signature => ({
  by: 'Teste',
  role: 'Verene',
  decision: 'approved',
  at: '2026-01-12T09:00:00.000Z',
  playbookVersion: versao,
  note: null,
})

function estados(
  approvals: Approvals,
  assinaturasDeGate: EntradaDeGates['assinaturasDeGate'] = {},
  playbookVersion = PLAYBOOK_VERSION,
): readonly EstadoDeGate[] {
  const run = runPipeline({ records: nasajonSuppliers, playbookVersion, approvals, spe: 'todas' })
  return estadoDosGates({ run, approvals, playbookVersion, assinaturasDeGate })
}

const de = (lista: readonly EstadoDeGate[], id: GateId): EstadoDeGate =>
  lista.find((e) => e.gate.id === id)!

/** Aprova, na ordem, tudo o que a esteira e os Gates fora dela exigem. */
function tudoAssinado(): {
  approvals: Approvals
  assinaturasDeGate: EntradaDeGates['assinaturasDeGate']
} {
  const sig = assinatura()
  const comMapeamento: Approvals = { ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig }
  const run1 = runPipeline({ records: nasajonSuppliers, approvals: comMapeamento, spe: 'todas' })
  const clusters = Object.fromEntries(run1.clusters.map((c) => [c.id, sig]))

  const comClusters: Approvals = { ...comMapeamento, clusters }
  const run2 = runPipeline({ records: nasajonSuppliers, approvals: comClusters, spe: 'todas' })
  const excecoes = Object.fromEntries(run2.exceptions.map((e) => [e.id, sig]))

  return {
    approvals: { ...comClusters, excecoes, pacote: sig, reconciliacao: sig },
    assinaturasDeGate: { G5: sig, G7: sig },
  }
}

describe('sequência dos Gates', () => {
  it('declara oito Gates encadeados: cada um exige o artefato do anterior', () => {
    expect(gates.map((g) => g.id)).toEqual([...gateIds])
    expect(gates.map((g) => g.artefato.id)).toEqual([...artefatoIds])
    expect(gates[0]!.exigeArtefato).toBeNull()
    for (let i = 1; i < gates.length; i += 1) {
      expect(gates[i]!.exigeArtefato).toBe(gates[i - 1]!.artefato.id)
    }
  })

  it('todo Gate tem quando ocorre, o que é aprovado, evidência e aprovador nomeado', () => {
    for (const gate of gates) {
      expect(gate.quandoOcorre.length).toBeGreaterThan(20)
      expect(gate.oQueEAprovado.length).toBeGreaterThan(20)
      expect(gate.evidencias.length).toBeGreaterThan(0)
      expect(gate.assinantes.length).toBeGreaterThan(0)
    }
  })

  it('cada assinante do Gate resolve para uma pessoa nomeada', () => {
    for (const estado of estados(emptyApprovals)) {
      for (const item of estado.trilha) {
        expect(item.responsavel, `${estado.gate.id} · ${item.area}`).not.toBeNull()
        expect(item.responsavel!.nome.length).toBeGreaterThan(3)
      }
    }
  })
})

describe('entrada recusada', () => {
  it('no estado inicial só o G0 está aprovado e do G2 em diante a entrada é recusada', () => {
    const lista = estados(emptyApprovals)
    expect(de(lista, 'G0').status).toBe('aprovado')
    expect(de(lista, 'G1').status).toBe('em-avaliacao')
    expect(de(lista, 'G1').entradaAdmitida).toBe(true)
    for (const id of ['G2', 'G3', 'G4', 'G5', 'G6', 'G7'] as const) {
      expect(de(lista, id).status, id).toBe('entrada-recusada')
      expect(de(lista, id).entradaAdmitida, id).toBe(false)
    }
  })

  it('a recusa nomeia o artefato que falta e o Gate que o assina', () => {
    const recusa = de(estados(emptyApprovals), 'G2').recusa
    expect(recusa).not.toBeNull()
    expect(recusa!.artefato).toBe('A1')
    expect(recusa!.gate).toBe('G1')
    expect(recusa!.artefatoNome).toBe(gates.find((g) => g.id === 'G1')!.artefato.nome)
  })

  it('assinar o G1 abre a entrada do G2 e empurra a recusa para o G3', () => {
    const sig = assinatura()
    const lista = estados({ ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig })
    expect(de(lista, 'G1').status).toBe('aprovado')
    expect(de(lista, 'G2').entradaAdmitida).toBe(true)
    expect(de(lista, 'G2').status).toBe('em-avaliacao')
    expect(de(lista, 'G3').status).toBe('entrada-recusada')
    expect(de(lista, 'G3').recusa!.artefato).toBe('A2')
  })

  it('uma assinatura só do SAP SME não abre o G1: as duas são exigidas', () => {
    const lista = estados({ ...emptyApprovals, mapeamentoSme: assinatura() })
    expect(de(lista, 'G1').artefatoAssinado).toBe(false)
    expect(de(lista, 'G2').status).toBe('entrada-recusada')
  })

  it('assinar fora de ordem não contorna a recusa: Gate que não abriu não assina artefato', () => {
    // G5 e G7 assinados com tudo o mais em branco. A cascata não pode ceder.
    const lista = estados(emptyApprovals, { G5: assinatura(), G7: assinatura() })
    expect(de(lista, 'G5').artefatoAssinado).toBe(false)
    expect(de(lista, 'G5').status).toBe('entrada-recusada')
    expect(de(lista, 'G6').status).toBe('entrada-recusada')
    expect(de(lista, 'G7').artefatoAssinado).toBe(false)
  })

  it('Gate com entrada recusada não recebe evidência da esteira', () => {
    const g4 = de(estados(emptyApprovals), 'G4')
    expect(g4.evidencias.filter((e) => e.produzidaPor !== null).every((e) => !e.disponivel)).toBe(true)
  })
})

describe('trilha de assinatura', () => {
  it('toda assinatura registra quem, quando e sobre qual versão de playbook', () => {
    const { approvals, assinaturasDeGate } = tudoAssinado()
    const lista = estados(approvals, assinaturasDeGate)
    const dadas = lista.flatMap((e) => e.trilha).filter((i) => i.assinatura !== null)
    expect(dadas.length).toBeGreaterThan(0)
    for (const item of dadas) {
      expect(item.assinatura!.by.length).toBeGreaterThan(0)
      expect(item.assinatura!.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(item.assinatura!.playbookVersion).toBe(PLAYBOOK_VERSION)
    }
  })

  it('assinatura dada sobre outra versão do playbook não vale para a corrente', () => {
    const antiga = assinatura('v0.9.0')
    const lista = estados({ ...emptyApprovals, mapeamentoSme: antiga, mapeamento: antiga })
    expect(de(lista, 'G1').artefatoAssinado).toBe(false)
    expect(de(lista, 'G2').status).toBe('entrada-recusada')
  })

  it('assinatura rejeitada é decisão registrada, não artefato assinado', () => {
    const recusada: Signature = { ...assinatura(), decision: 'rejected' }
    const lista = estados({ ...emptyApprovals, mapeamentoSme: assinatura(), mapeamento: recusada })
    expect(de(lista, 'G1').artefatoAssinado).toBe(false)
    expect(de(lista, 'G1').trilha[1]!.assinatura!.decision).toBe('rejected')
  })

  it('o G2 exige um cluster por vez: com um só pendente, o artefato não fecha', () => {
    const sig = assinatura()
    const base: Approvals = { ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig }
    const run = runPipeline({ records: nasajonSuppliers, approvals: base, spe: 'todas' })
    const menosUm = run.clusters.slice(0, -1)
    const lista = estados({
      ...base,
      clusters: Object.fromEntries(menosUm.map((c) => [c.id, sig])),
    })
    const g2 = de(lista, 'G2')
    expect(g2.artefatoAssinado).toBe(false)
    expect(g2.trilha[0]!.assinadas).toBe(run.clusters.length - 1)
    expect(g2.trilha[0]!.requeridas).toBe(run.clusters.length)
    expect(g2.pendencias.some((p) => p.tipo === 'clusters' && p.quantidade === 1)).toBe(true)
  })

  it('assinando na ordem, os oito Gates ficam aprovados', () => {
    const { approvals, assinaturasDeGate } = tudoAssinado()
    const lista = estados(approvals, assinaturasDeGate)
    expect(lista.map((e) => e.status)).toEqual(gates.map(() => 'aprovado'))
    expect(lista.every((e) => e.pendencias.length === 0)).toBe(true)
  })
})

describe('liberação de pagamento', () => {
  it('as parcelas somam 100% e ficam nos Gates contratados', () => {
    expect(parcelasPorGate.map((p) => p.gate)).toEqual(['G1', 'G2', 'G4', 'G6', 'G7'])
    expect(parcelasPorGate.map((p) => p.percentual)).toEqual([20, 20, 20, 25, 15])
    expect(parcelasPorGate.reduce((a, p) => a + p.percentual, 0)).toBe(PERCENTUAL_TOTAL)
  })

  it('no estado inicial nada é liberado, e a retenção é o contrato inteiro', () => {
    const liberacao = liberacaoDePagamento(estados(emptyApprovals))
    expect(liberacao.liberado).toBe(0)
    expect(liberacao.retido).toBe(PERCENTUAL_TOTAL)
    expect(liberacao.parcelas.every((p) => !p.liberada)).toBe(true)
  })

  it('parcela só é liberada pelo Gate aprovado — recusa de entrada retém', () => {
    const sig = assinatura()
    const liberacao = liberacaoDePagamento(
      estados({ ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig }),
    )
    expect(liberacao.liberado).toBe(20)
    expect(liberacao.retido).toBe(80)
    const g4 = liberacao.parcelas.find((p) => p.parcela.gate === 'G4')!
    expect(g4.liberada).toBe(false)
    expect(g4.recusa).not.toBeNull()
  })

  it('com os oito Gates aprovados, libera 100%', () => {
    const { approvals, assinaturasDeGate } = tudoAssinado()
    const liberacao = liberacaoDePagamento(estados(approvals, assinaturasDeGate))
    expect(liberacao.liberado).toBe(PERCENTUAL_TOTAL)
    expect(liberacao.retido).toBe(0)
  })

  it('G0, G3 e G5 existem sem parcela: nem todo ponto de decisão é faturamento', () => {
    const comParcela = new Set(parcelasPorGate.map((p) => p.gate))
    expect(gateIds.filter((id) => !comParcela.has(id))).toEqual(['G0', 'G3', 'G5'])
  })
})

describe('flag do painel comercial', () => {
  it('lê a flag da query string e ignora valor desconhecido', () => {
    expect(flagsNaBusca(`?${PARAM_FLAG}=comercial`)).toEqual(['comercial'])
    expect(flagsNaBusca(`?${PARAM_FLAG}=outra`)).toEqual([])
    expect(flagsNaBusca('')).toEqual([])
    expect(flagsNaBusca('?comercial=1')).toEqual([])
  })
})
