import { describe, expect, it } from 'vitest'

import { PARAM_REGRA, paths } from '@/app/paths'
import { PLAYBOOK_VERSION, PROXIMA_VERSAO, ruleById } from '@/data/playbook'
import {
  DEFEITO_QUE_SE_CORRIGE_NA_REGRA,
  DURACAO_DO_ROTEIRO,
  NIVEIS,
  decorridoAte,
  passoPorNumero,
  passosDoRoteiro,
  REGRA_DA_CORRECAO,
  TOTAL_DE_PASSOS,
} from '@/data/presentation'
import { CASO_FORNECEDOR } from '@/data/record-cases'
import { estadoDosGates } from '@/engine/gates'
import { regraCorrigida } from '@/engine/regeneration'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const estado = () => useSimulation.getState()

/** Vai ao passo `n` a partir do começo do roteiro. */
function ateOPasso(n: number) {
  estado().reset()
  for (let i = 1; i <= n; i += 1) estado().irParaPasso(i)
  return estado()
}

const runCorrente = () => runDeTodasSpes(estado().playbookVersion, estado().approvals)

// ============================================================ o roteiro

describe('o roteiro', () => {
  it('tem nove passos, na ordem que a sala precisa', () => {
    expect(passosDoRoteiro).toHaveLength(9)
    expect(passosDoRoteiro.map((p) => p.path)).toEqual([
      paths.missionControl,
      paths.mapping,
      `${paths.recordBase}/${CASO_FORNECEDOR}`,
      paths.duplicates,
      paths.exceptions,
      `${paths.playbook}?${PARAM_REGRA}=${REGRA_DA_CORRECAO}`,
      paths.candidate,
      paths.reconciliation,
      paths.gates,
    ])
    expect(passosDoRoteiro.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('dura cerca de nove minutos', () => {
    expect(DURACAO_DO_ROTEIRO).toBeGreaterThanOrEqual(8 * 60)
    expect(DURACAO_DO_ROTEIRO).toBeLessThanOrEqual(10 * 60)
    expect(decorridoAte(1)).toBe(0)
    expect(decorridoAte(TOTAL_DE_PASSOS) + passoPorNumero(TOTAL_DE_PASSOS).duracao).toBe(
      DURACAO_DO_ROTEIRO,
    )
  })

  it('todo passo tem nome, frase-chave, o que fazer na tela e o que sustentar', () => {
    for (const p of passosDoRoteiro) {
      expect(p.nome.length, p.id).toBeGreaterThan(8)
      expect(p.fraseChave.length, p.id).toBeGreaterThan(40)
      expect(p.acoes.length, p.id).toBeGreaterThanOrEqual(2)
      expect(p.notas.length, p.id).toBeGreaterThanOrEqual(3)
      expect(p.duracao, p.id).toBeGreaterThan(0)
    }
  })

  it('o estado exigido nunca anda para trás ao longo do roteiro', () => {
    for (let i = 1; i < passosDoRoteiro.length; i += 1) {
      expect(passosDoRoteiro[i]!.nivel, passosDoRoteiro[i]!.id).toBeGreaterThanOrEqual(
        passosDoRoteiro[i - 1]!.nivel,
      )
    }
  })
})

// ============================================================ cada passo chega pronto

describe('cada passo encontra a onda no estado que precisa', () => {
  it('passos 1 e 2: nada assinado — o aviso do mapeamento precisa estar visível', () => {
    for (const n of [1, 2]) {
      const s = ateOPasso(n)
      expect(s.approvals.mapeamento, `passo ${n}`).toBeNull()
      expect(s.approvals.mapeamentoSme, `passo ${n}`).toBeNull()
      expect(runCorrente().blockedAt).toBe('transform')
    }
  })

  it('passo 3: mapeamento assinado, e a trilha do registro canônico existe', () => {
    ateOPasso(3)
    expect(estado().approvals.mapeamento).not.toBeNull()
    const registro = runCorrente().records.find((r) => r.codigo === CASO_FORNECEDOR)
    expect(registro).toBeDefined()
    expect(registro!.trail.length).toBeGreaterThan(8)
  })

  it('passo 4: há cluster para decidir, e nenhum decidido ainda', () => {
    ateOPasso(4)
    const run = runCorrente()
    expect(run.clusters.length).toBeGreaterThan(0)
    expect(Object.keys(estado().approvals.clusters)).toHaveLength(0)
  })

  it('passo 5: clusters decididos, e a fila de exceções em aberto', () => {
    ateOPasso(5)
    const run = runCorrente()
    expect(run.clusters.every((c) => estado().approvals.clusters[c.id])).toBe(true)
    expect(run.exceptions.length).toBeGreaterThan(0)
    expect(Object.keys(estado().approvals.excecoes)).toHaveLength(0)
  })

  it('passo 6: exceções decididas, e o defeito da regra fica RETIDO, não aprovado', () => {
    ateOPasso(6)
    const run = runCorrente()
    expect(run.exceptions.every((e) => estado().approvals.excecoes[e.id])).toBe(true)

    const doCorte = run.exceptions.filter((e) => e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA)
    expect(doCorte).toHaveLength(8)
    for (const e of doCorte) {
      expect(estado().approvals.excecoes[e.id]?.decision, e.id).toBe('rejected')
    }
    // e a versão ainda é a antiga: a correção é o que o apresentador faz ao vivo
    expect(estado().playbookVersion).toBe(PLAYBOOK_VERSION)
  })

  it('passo 8: a v1.4.0 já foi adotada e a propagação tem o que mostrar', () => {
    ateOPasso(8)
    expect(estado().playbookVersion).toBe(PROXIMA_VERSAO)
    expect(estado().regeneracao).toEqual({ de: PLAYBOOK_VERSION, para: PROXIMA_VERSAO })
    expect(
      runCorrente().exceptions.filter((e) => e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA),
    ).toHaveLength(0)
  })

  it('passo 9: o G6 está pronto para assinar, e ainda não assinado', () => {
    ateOPasso(9)
    const s = estado()
    const gates = estadoDosGates({
      run: runDeTodasSpes(s.playbookVersion, s.approvals),
      approvals: s.approvals,
      playbookVersion: s.playbookVersion,
      assinaturasDeGate: s.assinaturasDeGate,
    })
    const g6 = gates.find((g) => g.gate.id === 'G6')!
    expect(g6.entradaAdmitida).toBe(true)
    expect(g6.artefatoAssinado).toBe(false)
    expect(g6.status).toBe('em-avaliacao')
    // e tudo antes dele está aprovado: o roteiro não deixa Gate recusado para trás
    for (const id of ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'] as const) {
      expect(gates.find((g) => g.gate.id === id)?.status, id).toBe('aprovado')
    }
  })
})

// ============================================================ andar e rebobinar

describe('andar para a frente e voltar', () => {
  it('para a frente, o que o apresentador fez ao vivo não é desfeito', () => {
    ateOPasso(6)
    // o apresentador publica a correção durante o passo 6
    estado().publicarVersao(PROXIMA_VERSAO)
    expect(estado().playbookVersion).toBe(PROXIMA_VERSAO)

    estado().irParaPasso(7)
    expect(estado().playbookVersion).toBe(PROXIMA_VERSAO)
  })

  it('para trás, rebobina exatamente até o passo — dá para remostrar', () => {
    ateOPasso(8)
    expect(estado().playbookVersion).toBe(PROXIMA_VERSAO)

    estado().irParaPasso(6)
    expect(estado().playbookVersion).toBe(PLAYBOOK_VERSION)
    expect(estado().regeneracao).toBeNull()
    expect(
      runCorrente().exceptions.filter((e) => e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA),
    ).toHaveLength(8)
  })

  it('voltar ao passo 4 devolve a fila de duplicatas em aberto', () => {
    ateOPasso(8)
    estado().irParaPasso(4)
    expect(Object.keys(estado().approvals.clusters)).toHaveLength(0)
    expect(estado().approvals.mapeamento).not.toBeNull()
  })

  it('não passa dos limites do roteiro', () => {
    ateOPasso(1)
    estado().irParaPasso(0)
    expect(estado().apresentacao.passo).toBe(1)
    estado().irParaPasso(99)
    expect(estado().apresentacao.passo).toBe(TOTAL_DE_PASSOS)
  })
})

// ============================================================ o modo em si

describe('o modo de apresentação', () => {
  it('começa desligado e liga no passo 1', () => {
    estado().reset()
    estado().sairDaApresentacao()
    expect(estado().apresentacao.ativa).toBe(false)

    estado().alternarApresentacao()
    expect(estado().apresentacao).toEqual({ ativa: true, passo: 1, notas: false })
  })

  it('as notas abrem e fecham, e nascem fechadas', () => {
    estado().reset()
    expect(estado().apresentacao.notas).toBe(false)
    estado().alternarNotas()
    expect(estado().apresentacao.notas).toBe(true)
    estado().alternarNotas()
    expect(estado().apresentacao.notas).toBe(false)
  })

  it('reiniciar zera a onda mas NÃO derruba o roteiro — é o que permite reapresentar', () => {
    estado().sairDaApresentacao()
    estado().alternarApresentacao()
    ;[2, 3, 4, 5, 6].forEach((n) => estado().irParaPasso(n))
    estado().alternarNotas()
    expect(estado().apresentacao.passo).toBe(6)

    estado().reset()

    expect(estado().apresentacao.ativa).toBe(true)
    expect(estado().apresentacao.passo).toBe(1)
    expect(estado().apresentacao.notas).toBe(false)
    expect(estado().approvals.mapeamento).toBeNull()
    expect(estado().playbookVersion).toBe(PLAYBOOK_VERSION)
    estado().sairDaApresentacao()
  })

  it('a regra que o passo 6 corrige existe e é a que tem correção publicada', () => {
    expect(ruleById.has(REGRA_DA_CORRECAO)).toBe(true)
    expect(regraCorrigida(REGRA_DA_CORRECAO, PLAYBOOK_VERSION)?.versao).toBe(PROXIMA_VERSAO)
  })

  it('o nível de cada passo cobre o que a tela daquele passo precisa', () => {
    const porId = Object.fromEntries(passosDoRoteiro.map((p) => [p.id, p.nivel]))
    expect(porId['mission-control']).toBe(NIVEIS.nada)
    expect(porId['mapping']).toBe(NIVEIS.nada)
    expect(porId['duplicates']).toBe(NIVEIS.mapeamento)
    expect(porId['exceptions']).toBe(NIVEIS.duplicatas)
    expect(porId['velocidade']).toBe(NIVEIS.excecoes)
    expect(porId['contencao']).toBe(NIVEIS.excecoes)
    expect(porId['reconciliacao']).toBe(NIVEIS.corrigido)
    expect(porId['gate']).toBe(NIVEIS.carga)
  })
})
