import { describe, expect, it } from 'vitest'

import { PLAYBOOK_VERSION, PROXIMA_VERSAO, playbookRules } from '@/data/playbook'
import { ordemDasVersoes } from '@/data/playbook-history'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { PlaybookViolation, parametroDaRegra, resolveRule, sealPlaybook } from '@/engine/kanon'
import {
  cortouPalavra,
  emptyApprovals,
  runPipeline,
  splitNome,
  type Approvals,
  type PipelineRun,
  type Signature,
} from '@/engine/pipeline'
import { diffDeRegeneracao, mapeamentoSobrevive, regrasAlteradasEntre } from '@/engine/regeneration'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const sig = (playbookVersion: string): Signature => ({
  by: 'Teste', role: 'Verene', decision: 'approved',
  at: '2026-01-12T09:00:00.000Z', playbookVersion, note: null,
})

/**
 * Assina os três primeiros checkpoints e devolve o run resultante.
 *
 * O defeito de transformação é decidido como MANTIDO RETIDO, que é o caminho
 * real: aprovar o registro com o nome cortado só carimbaria o corte errado. É
 * corrigindo a regra que ele sai da fila — e é isso que o Momento 1 mostra.
 */
function ateOPacote(versao: string): { run: PipelineRun; approvals: Approvals } {
  const s = sig(versao)
  let approvals: Approvals = { ...emptyApprovals, mapeamentoSme: s, mapeamento: s }
  let run = runPipeline({ records: nasajonSuppliers, approvals, playbookVersion: versao, spe: 'todas' })
  approvals = { ...approvals, clusters: Object.fromEntries(run.clusters.map((c) => [c.id, s])) }
  run = runPipeline({ records: nasajonSuppliers, approvals, playbookVersion: versao, spe: 'todas' })
  approvals = {
    ...approvals,
    excecoes: Object.fromEntries(
      run.exceptions.map((e) => [
        e.id,
        e.defectTypeId === 'DEF-TRF-02' ? { ...s, decision: 'rejected' as const } : s,
      ]),
    ),
  }
  run = runPipeline({ records: nasajonSuppliers, approvals, playbookVersion: versao, spe: 'todas' })
  return { run, approvals }
}

// ============================================================ vigência

describe('KANON sela por vigência, não por igualdade', () => {
  it('a R-SUP-023 resolve para a redação vigente em cada versão', () => {
    const antiga = resolveRule('R-SUP-023', 'ATLAS', PLAYBOOK_VERSION)
    const nova = resolveRule('R-SUP-023', 'ATLAS', PROXIMA_VERSAO)
    expect(antiga.parametros?.corte).toBe('caractere')
    expect(nova.parametros?.corte).toBe('palavra')
    expect(antiga.expression).not.toBe(nova.expression)
  })

  it('só uma redação de cada regra está vigente por versão', () => {
    for (const versao of ordemDasVersoes) {
      const ids = sealPlaybook(versao).rules.map((r) => r.id)
      expect(new Set(ids).size, versao).toBe(ids.length)
    }
  })

  it('as demais regras seguem vigentes nas duas versões, sem duplicar o playbook', () => {
    const antes = sealPlaybook(PLAYBOOK_VERSION).rules.map((r) => r.id).sort()
    const depois = sealPlaybook(PROXIMA_VERSAO).rules.map((r) => r.id).sort()
    expect(depois).toEqual(antes)
    // e o playbook tem UMA linha a mais que a contagem selada: a segunda redação
    expect(playbookRules.length).toBe(antes.length + 1)
  })

  it('recusa versão não declarada no histórico', () => {
    expect(() => sealPlaybook('v9.9.9')).toThrow(PlaybookViolation)
  })

  it('o parâmetro só se alcança pelo mesmo guarda da regra', () => {
    expect(parametroDaRegra('R-SUP-023', 'ATLAS', PROXIMA_VERSAO, 'corte')).toBe('palavra')
    // agente errado
    expect(() => parametroDaRegra('R-SUP-023', 'NOVA', PROXIMA_VERSAO, 'corte')).toThrow(PlaybookViolation)
    // parâmetro que a regra não declara
    expect(() => parametroDaRegra('R-SUP-023', 'ATLAS', PROXIMA_VERSAO, 'inventado')).toThrow(PlaybookViolation)
  })

  it('a mudança de parâmetro move o checksum: mesma contagem, selo diferente', () => {
    const a = sealPlaybook(PLAYBOOK_VERSION)
    const b = sealPlaybook(PROXIMA_VERSAO)
    expect(b.totalRegras).toBe(a.totalRegras)
    expect(b.checksum).not.toBe(a.checksum)
  })
})

// ============================================================ a quebra do nome

describe('quebra de NAME_ORG1', () => {
  const longos = nasajonSuppliers.map((s) => s.razaoSocial).filter((n) => n.length > 40)

  it('há razão social longa o bastante para a regra importar', () => {
    expect(longos.length).toBeGreaterThanOrEqual(10)
  })

  it('o corte por caractere parte palavra ao meio; o corte por palavra não', () => {
    const partidasPorCaractere = longos.filter((n) => cortouPalavra(n, splitNome(n, 40, 'caractere')[0]))
    const partidasPorPalavra = longos.filter((n) => cortouPalavra(n, splitNome(n, 40, 'palavra')[0]))
    expect(partidasPorCaractere.length).toBe(8)
    expect(partidasPorPalavra.length).toBe(0)
  })

  it('nenhum dos dois modos passa do limite do campo', () => {
    for (const n of longos) {
      for (const modo of ['caractere', 'palavra'] as const) {
        const [org1, org2] = splitNome(n, 40, modo)
        expect(org1.length, `${n} / ${modo}`).toBeLessThanOrEqual(40)
        expect((org2 ?? '').length, `${n} / ${modo}`).toBeLessThanOrEqual(40)
      }
    }
  })
})

// ============================================================ o defeito e a correção

describe('o defeito de transformação e a regeneração', () => {
  it('a v1.0.0 abre 8 exceções críticas de transformação e a v1.4.0 abre nenhuma', () => {
    const antes = ateOPacote(PLAYBOOK_VERSION).run
    const depois = ateOPacote(PROXIMA_VERSAO).run

    const trfAntes = antes.exceptions.filter((e) => e.defectTypeId === 'DEF-TRF-02')
    expect(trfAntes).toHaveLength(8)
    for (const e of trfAntes) {
      expect(e.origin).toBe('transformation')
      expect(e.monodaResponsavel).toBe(true)
      expect(e.severidade).toBe('critical')
      expect(e.ruleId).toBe('R-SUP-048')
    }
    expect(depois.exceptions.filter((e) => e.defectTypeId === 'DEF-TRF-02')).toHaveLength(0)
  })

  it('quem encontra o corte errado é NOVA, não o agente que cortou', () => {
    const regra = resolveRule('R-SUP-048', 'NOVA', PLAYBOOK_VERSION)
    expect(regra.agent).toBe('NOVA')
    expect(resolveRule('R-SUP-023', 'ATLAS', PLAYBOOK_VERSION).agent).toBe('ATLAS')
  })

  it('o diff nomeia a regra alterada, os registros retocados e o pacote novo', () => {
    const antes = ateOPacote(PLAYBOOK_VERSION).run
    const depois = ateOPacote(PROXIMA_VERSAO).run
    const diff = diffDeRegeneracao(antes, depois)

    expect(diff.de).toBe(PLAYBOOK_VERSION)
    expect(diff.para).toBe(PROXIMA_VERSAO)
    expect(diff.checksumDe).not.toBe(diff.checksumPara)
    expect(diff.regrasAlteradas.map((r) => r.id)).toEqual(['R-SUP-023'])
    expect(diff.regrasAlteradas[0]!.parametrosDe?.corte).toBe('caractere')
    expect(diff.regrasAlteradas[0]!.parametrosPara?.corte).toBe('palavra')
    expect(diff.registrosRetocados.length).toBe(8)
    expect(diff.excecoesFechadas).toHaveLength(8)
    expect(diff.excecoesNovas).toHaveLength(0)
    expect(diff.pacoteDe?.id).toContain(PLAYBOOK_VERSION)
    expect(diff.pacotePara?.id).toContain(PROXIMA_VERSAO)
    expect(diff.pacoteDe?.datasetChecksum).not.toBe(diff.pacotePara?.datasetChecksum)
    // Sete dos oito ficam retidos; o oitavo já tinha sido fundido num cluster de
    // duplicata, e `merged` vem antes de `held` na resolução do estado final.
    const fundidosComCorteErrado = antes.records.filter(
      (r) => r.outcome === 'merged' && r.exceptions.some((e) => e.defectTypeId === 'DEF-TRF-02'),
    )
    expect(fundidosComCorteErrado).toHaveLength(1)
    expect(diff.retidosDe).toBe(7)
    expect(diff.retidosPara).toBe(0)
    expect(diff.pacotePara!.total).toBe(diff.pacoteDe!.total + 7)
  })

  it('a correção é de ATLAS, então o de-para do LYRA sobrevive à regeneração', () => {
    expect(mapeamentoSobrevive(regrasAlteradasEntre(PLAYBOOK_VERSION, PROXIMA_VERSAO))).toBe(true)
  })
})

// ============================================================ publicarVersao

describe('publicarVersao', () => {
  const estado = () => useSimulation.getState()

  it('carrega as assinaturas cujo artefato não mudou e derruba pacote e reconciliação', () => {
    estado().reset()
    const { approvals } = ateOPacote(PLAYBOOK_VERSION)
    const s = sig(PLAYBOOK_VERSION)
    useSimulation.setState({
      approvals: { ...approvals, pacote: s, reconciliacao: s },
      run: runDeTodasSpes(PLAYBOOK_VERSION, { ...approvals, pacote: s, reconciliacao: s }),
    })

    const clustersAntes = Object.keys(estado().approvals.clusters).length
    expect(clustersAntes).toBeGreaterThan(0)

    estado().publicarVersao(PROXIMA_VERSAO)
    const depois = estado()

    expect(depois.playbookVersion).toBe(PROXIMA_VERSAO)
    expect(depois.regeneracao).toEqual({ de: PLAYBOOK_VERSION, para: PROXIMA_VERSAO })

    // preservadas, e marcadas como revalidadas — não reassinadas
    expect(Object.keys(depois.approvals.clusters)).toHaveLength(clustersAntes)
    for (const a of Object.values(depois.approvals.clusters)) {
      expect(a.playbookVersion).toBe(PLAYBOOK_VERSION)
      expect(a.revalidadaEm).toBe(PROXIMA_VERSAO)
    }
    expect(depois.approvals.mapeamento?.revalidadaEm).toBe(PROXIMA_VERSAO)

    // as 8 exceções que sumiram não deixam assinatura órfã para trás
    const idsVivos = new Set(runDeTodasSpes(PROXIMA_VERSAO, depois.approvals).exceptions.map((e) => e.id))
    for (const id of Object.keys(depois.approvals.excecoes)) expect(idsVivos.has(id)).toBe(true)

    // o artefato mudou: estas duas caem sempre
    expect(depois.approvals.pacote).toBeNull()
    expect(depois.approvals.reconciliacao).toBeNull()
    estado().reset()
  })

  it('publicar a mesma versão é no-op', () => {
    estado().reset()
    estado().publicarVersao(PLAYBOOK_VERSION)
    expect(estado().regeneracao).toBeNull()
  })

  it('reset volta para a versão de abertura da onda', () => {
    estado().publicarVersao(PROXIMA_VERSAO)
    expect(estado().playbookVersion).toBe(PROXIMA_VERSAO)
    estado().reset()
    expect(estado().playbookVersion).toBe(PLAYBOOK_VERSION)
    expect(estado().regeneracao).toBeNull()
  })
})

// ============================================================ determinismo

describe('determinismo em ambas as versões', () => {
  it('mesma entrada e mesma versão dão saída idêntica byte a byte', () => {
    for (const versao of [PLAYBOOK_VERSION, PROXIMA_VERSAO]) {
      const a = ateOPacote(versao).run
      const b = ateOPacote(versao).run
      expect(JSON.stringify(a), versao).toBe(JSON.stringify(b))
    }
  })
})
