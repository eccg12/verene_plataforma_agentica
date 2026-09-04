import { describe, expect, it } from 'vitest'

import { loadPackageBoard } from '@/data/packages'
import { PLAYBOOK_VERSION, PROXIMA_VERSAO } from '@/data/playbook'
import { scopeObjects, speIds, totalVolume } from '@/data/scope'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import {
  resumoDefeitos,
  resumoRecebimento,
  taxaPorDimensao,
  taxaPorObjeto,
} from '@/engine/mission-control'
import { dividirPacote, gerarXml } from '@/engine/package-builder'
import {
  contagemPorSpe,
  contagemTotal,
  placarDeAceite,
  registroDeDefeitos,
} from '@/engine/reconciliation'
import {
  emptyApprovals,
  runPipeline,
  type Approvals,
  type PipelineRun,
  type Signature,
} from '@/engine/pipeline'

/**
 * Consistência aritmética entre telas.
 *
 * Um cliente atento soma. Se o Mission Control diz um número, a reconciliação
 * diz outro e o placar um terceiro, não importa qual está certo — a demonstração
 * inteira perde crédito. Este arquivo é o que impede isso de voltar.
 */

const sig = (v: string): Signature => ({
  by: 'Teste', role: 'Verene', decision: 'approved',
  at: '2026-01-12T09:00:00.000Z', playbookVersion: v, note: null,
})

function ondaCompleta(versao: string): PipelineRun {
  const s = sig(versao)
  let a: Approvals = { ...emptyApprovals, mapeamentoSme: s, mapeamento: s }
  let r = runPipeline({ records: nasajonSuppliers, approvals: a, playbookVersion: versao, spe: 'todas' })
  a = { ...a, clusters: Object.fromEntries(r.clusters.map((c) => [c.id, s])) }
  r = runPipeline({ records: nasajonSuppliers, approvals: a, playbookVersion: versao, spe: 'todas' })
  a = {
    ...a,
    excecoes: Object.fromEntries(
      r.exceptions.map((e) => [
        e.id,
        e.defectTypeId === 'DEF-TRF-02' ? { ...s, decision: 'rejected' as const } : s,
      ]),
    ),
  }
  return runPipeline({ records: nasajonSuppliers, approvals: a, playbookVersion: versao, spe: 'todas' })
}

const VERSOES = [PLAYBOOK_VERSION, PROXIMA_VERSAO]

// ============================================================ escopo

describe('o escopo fecha consigo mesmo', () => {
  it('o volume total é a soma dos 48 pacotes e dos volumes por objeto', () => {
    const porObjeto = scopeObjects.reduce((a, o) => a + o.volume, 0)
    const porPacote = loadPackageBoard.reduce((a, p) => a + p.registros, 0)
    expect(porObjeto).toBe(totalVolume)
    // cada objeto aparece em 2 ciclos: a grade conta o volume duas vezes
    expect(porPacote).toBe(totalVolume * 2)
  })

  it('o volume de cada objeto é a soma das quatro SPEs, em cada ciclo', () => {
    for (const objeto of scopeObjects) {
      for (const ciclo of ['ciclo-1', 'ciclo-2']) {
        const porSpe = loadPackageBoard
          .filter((p) => p.objetoId === objeto.id && p.ciclo === ciclo)
          .reduce((a, p) => a + p.registros, 0)
        expect(porSpe, `${objeto.id}/${ciclo}`).toBe(objeto.volume)
      }
      expect(loadPackageBoard.filter((p) => p.objetoId === objeto.id)).toHaveLength(speIds.length * 2)
    }
  })
})

// ============================================================ Mission Control

describe('o Mission Control fecha consigo mesmo', () => {
  it('perfila exatamente o que o recebimento leu', () => {
    expect(resumoDefeitos.registrosPerfilados).toBe(resumoRecebimento.registrosLidos)
  })

  it('a soma por objeto, por dimensão e o resumo dão o mesmo número', () => {
    const porObjeto = taxaPorObjeto.reduce((a, t) => a + t.defeitos, 0)
    const porDimensao = taxaPorDimensao.reduce((a, t) => a + t.defeitos, 0)
    expect(porObjeto).toBe(porDimensao)
    expect(porObjeto).toBe(resumoDefeitos.defeitos)
  })

  it('a linha de fornecedores conta os mesmos registros que a esteira processa', () => {
    const fornecedores = taxaPorObjeto.find((t) => t.chave === 'fornecedores')
    expect(fornecedores?.registros).toBe(ondaCompleta(PLAYBOOK_VERSION).records.length)
  })
})

// ============================================================ reconciliação

describe('a reconciliação fecha consigo mesma, nas duas versões', () => {
  for (const versao of VERSOES) {
    it(`${versao}: origem = destino + retidos + fundidos`, () => {
      const run = ondaCompleta(versao)
      const total = contagemTotal(run)
      const conta = (o: string) => run.records.filter((r) => r.outcome === o).length

      expect(total.origem).toBe(run.records.length)
      expect(total.destino).toBe(conta('migrated') + conta('reused'))
      expect(total.origem).toBe(total.destino + conta('held') + conta('merged'))
      expect(total.fecha).toBe(true)
    })

    it(`${versao}: o total é a soma das quatro SPEs, nos dois lados`, () => {
      const run = ondaCompleta(versao)
      const total = contagemTotal(run)
      const porSpe = contagemPorSpe(run)
      expect(porSpe).toHaveLength(speIds.length)
      expect(porSpe.reduce((a, l) => a + l.origem, 0)).toBe(total.origem)
      expect(porSpe.reduce((a, l) => a + l.destino, 0)).toBe(total.destino)
    })

    it(`${versao}: o destino é exatamente o que entra no pacote`, () => {
      const run = ondaCompleta(versao)
      expect(run.loadPackage?.total).toBe(contagemTotal(run).destino)
      expect(run.loadPackage?.registros).toHaveLength(contagemTotal(run).destino)
      // e o XML gerado carrega o mesmo número de registros
      expect(gerarXml(run).registros).toBe(contagemTotal(run).destino)
    })

    it(`${versao}: o registro de defeitos soma as exceções abertas`, () => {
      const run = ondaCompleta(versao)
      const registro = registroDeDefeitos(run)
      expect(registro.reduce((a, r) => a + r.total, 0)).toBe(run.exceptions.length)
      for (const linha of registro) {
        expect(linha.criticos + linha.naoCriticos, linha.origin).toBe(linha.total)
      }
    })
  }
})

// ============================================================ placar

describe('o placar não contradiz a tela que o alimenta', () => {
  for (const versao of VERSOES) {
    it(`${versao}: CA-03 é a contagem crítica da origem transformation`, () => {
      const run = ondaCompleta(versao)
      const transformacao = registroDeDefeitos(run).find((r) => r.origin === 'transformation')
      const ca03 = placarDeAceite(run).find((p) => p.criterio.id === 'CA-03')
      expect(ca03?.medido).toBe(transformacao?.criticos)
      expect(ca03?.atende).toBe(transformacao?.criticos === 0)
    })

    it(`${versao}: CA-01 e CA-02 medem 100% sobre os registros da onda`, () => {
      const run = ondaCompleta(versao)
      const placar = placarDeAceite(run)
      for (const id of ['CA-01', 'CA-02']) {
        const criterio = placar.find((p) => p.criterio.id === id)
        expect(criterio?.medido, id).toBe(100)
        expect(criterio?.comoMedido, id).toContain(String(run.records.length))
      }
    })

    it(`${versao}: CA-04 é o percentual não crítico sobre os mesmos registros`, () => {
      const run = ondaCompleta(versao)
      const transformacao = registroDeDefeitos(run).find((r) => r.origin === 'transformation')
      const ca04 = placarDeAceite(run).find((p) => p.criterio.id === 'CA-04')
      const esperado = Number(
        (((transformacao?.naoCriticos ?? 0) / run.records.length) * 100).toFixed(1),
      )
      expect(ca04?.medido).toBe(esperado)
    })
  }
})

// ============================================================ esteira parada

describe('esteira parada não produz número de destino', () => {
  it('com nada assinado, a contagem não é mensurável e o placar concorda', () => {
    const run = runPipeline({ records: nasajonSuppliers, approvals: emptyApprovals, spe: 'todas' })
    expect(run.blockedAt).not.toBeNull()
    expect(contagemTotal(run).mensuravel).toBe(false)
    expect(contagemPorSpe(run).every((l) => !l.mensuravel)).toBe(true)
    // e o placar já dizia isso: as duas leituras da mesma tela não podem divergir
    expect(placarDeAceite(run).every((p) => !p.mensurável)).toBe(true)
  })

  it('com a onda completa, as duas leituras voltam a ser mensuráveis juntas', () => {
    const run = ondaCompleta(PLAYBOOK_VERSION)
    expect(contagemTotal(run).mensuravel).toBe(true)
    expect(placarDeAceite(run).some((p) => p.mensurável)).toBe(true)
  })
})

// ============================================================ pacote

describe('a divisão do pacote fecha', () => {
  it('as partes somam o total, e nenhuma passa dos dois tetos', () => {
    const run = ondaCompleta(PLAYBOOK_VERSION)
    const objeto = scopeObjects.find((o) => o.id === 'fornecedores')!
    const xml = gerarXml(run, 3)
    const divisao = dividirPacote(objeto.id, objeto.volume, xml.bytesPorRegistro)

    expect(divisao.partes.reduce((a, p) => a + p.registros, 0)).toBe(divisao.registrosTotais)
    expect(divisao.registrosTotais).toBe(objeto.volume)
    for (const parte of divisao.partes) {
      expect(parte.registros, parte.nomeArquivo).toBeLessThanOrEqual(500)
      expect(parte.bytes / (1024 * 1024), parte.nomeArquivo).toBeLessThanOrEqual(100)
    }
  })
})
