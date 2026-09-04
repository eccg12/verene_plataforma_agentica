import { describe, expect, it } from 'vitest'

import { agentNames } from '@/data/agents'
import { defectOriginIds } from '@/data/defect-taxonomy'
import { PLAYBOOK_VERSION, playbookRules, ruleTypes } from '@/data/playbook'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { generateDocumentation, PlaybookViolation, resolveRule, sealPlaybook } from '@/engine/kanon'
import {
  emptyApprovals,
  pipelineSteps,
  runPipeline,
  type Approvals,
  type Decision,
  type PipelineRun,
  type Signature,
} from '@/engine/pipeline'

const SPE1 = nasajonSuppliers.filter((s) => s.spe === 'SPE-1')
const TODOS = nasajonSuppliers

const assinatura = (decision: Decision = 'approved'): Signature => ({
  by: 'Teste',
  role: 'Verene',
  decision,
  at: '2026-01-12T09:00:00.000Z',
  note: null,
})

/** Roda a esteira até o fim, assinando cada checkpoint conforme ele aparece. */
function correrAteOFim(records: readonly (typeof nasajonSuppliers)[number][], decisaoExcecao: Decision = 'approved'): PipelineRun {
  let approvals: Approvals = { ...emptyApprovals, mapeamento: assinatura() }
  let run = runPipeline({ records, approvals })

  approvals = {
    ...approvals,
    clusters: Object.fromEntries(run.clusters.map((c) => [c.id, assinatura()])),
  }
  run = runPipeline({ records, approvals })

  approvals = {
    ...approvals,
    excecoes: Object.fromEntries(run.exceptions.map((e) => [e.id, assinatura(decisaoExcecao)])),
    pacote: assinatura(),
    reconciliacao: assinatura(),
  }
  return runPipeline({ records, approvals })
}

// ============================================================ playbook e KANON

describe('playbook GALAXY v1', () => {
  it('tem pelo menos 30 regras cobrindo os sete agentes', () => {
    expect(playbookRules.length).toBeGreaterThanOrEqual(30)
    for (const agent of agentNames) {
      expect(playbookRules.filter((r) => r.agent === agent).length, agent).toBeGreaterThan(0)
    }
  })

  it('tem id único e todos os campos de governança preenchidos', () => {
    const ids = playbookRules.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of playbookRules) {
      expect(r.owner, r.id).not.toBe('')
      expect(r.rationale, r.id).not.toBe('')
      expect(r.expression, r.id).not.toBe('')
      expect(r.createdAt, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(ruleTypes, r.id).toContain(r.type)
    }
  })

  it('distingue regra determinística de regra generativa, e toda generativa é candidata', () => {
    const generativas = playbookRules.filter((r) => r.nature === 'generative')
    expect(generativas.length).toBeGreaterThan(0)
    for (const r of generativas) expect(r.status, r.id).toBe('candidate')
    expect(playbookRules.filter((r) => r.nature === 'deterministic').length).toBeGreaterThan(0)
  })

  it('usa os oito tipos de regra previstos', () => {
    const usados = new Set(playbookRules.map((r) => r.type))
    expect([...usados].sort()).toEqual([...ruleTypes].sort())
  })
})

describe('KANON — a regra vive num lugar só', () => {
  it('sela a versão com checksum estável', () => {
    const a = sealPlaybook(PLAYBOOK_VERSION)
    const b = sealPlaybook(PLAYBOOK_VERSION)
    expect(a.checksum).toBe(b.checksum)
    expect(a.checksum).toMatch(/^[0-9a-f]{8}$/)
    expect(a.totalRegras).toBe(playbookRules.length)
  })

  it('recusa regra que não existe na versão', () => {
    expect(() => resolveRule('R-NAO-EXISTE', 'VEGA', PLAYBOOK_VERSION)).toThrow(PlaybookViolation)
  })

  it('recusa regra generativa: proposta não executa', () => {
    const candidata = playbookRules.find((r) => r.nature === 'generative')
    expect(candidata).toBeDefined()
    if (!candidata) return
    expect(() => resolveRule(candidata.id, candidata.agent, PLAYBOOK_VERSION)).toThrow(/não executa/)
  })

  it('recusa um agente executando regra de outro agente', () => {
    const doVega = playbookRules.find((r) => r.agent === 'VEGA' && r.status === 'active')
    expect(doVega).toBeDefined()
    if (!doVega) return
    expect(() => resolveRule(doVega.id, 'ORION', PLAYBOOK_VERSION)).toThrow(/não executa regra de outro agente/)
  })

  it('gera a documentação a partir do playbook, não de texto solto', () => {
    const doc = generateDocumentation(PLAYBOOK_VERSION)
    const total = doc.reduce((acc, s) => acc + s.regras.length, 0)
    expect(total).toBe(playbookRules.length)
    for (const secao of doc) {
      for (const regra of secao.regras) {
        const fonte = playbookRules.find((r) => r.id === regra.id)
        expect(regra.expressao).toBe(fonte?.expression)
        expect(regra.porque).toBe(fonte?.rationale)
      }
    }
  })
})

// ============================================================ a esteira

describe('esteira de nove passos', () => {
  it('declara os nove passos com os agentes certos, e KANON não ocupa passo', () => {
    expect(pipelineSteps).toHaveLength(9)
    expect(pipelineSteps.map((s) => `${s.n} ${s.nome} ${s.agent}`)).toEqual([
      '1 RECEIVE VEGA',
      '2 PROFILE VEGA',
      '3 MAP LYRA',
      '4 TRANSFORM ATLAS',
      '5 DEDUPLICATE ATLAS',
      '6 ENRICH NOVA',
      '7 VALIDATE NOVA',
      '8 PACKAGE ORION',
      '9 RECONCILE SIRIUS',
    ])
    expect(pipelineSteps.some((s) => s.agent === 'KANON')).toBe(false)
  })

  it('carimba a versão e o checksum do playbook no run', () => {
    const run = runPipeline({ records: SPE1 })
    expect(run.playbookVersion).toBe(PLAYBOOK_VERSION)
    expect(run.playbookChecksum).toBe(sealPlaybook(PLAYBOOK_VERSION).checksum)
  })
})

describe('checkpoints humanos bloqueantes', () => {
  it('para no checkpoint 1 sem aprovação de mapeamento', () => {
    const run = runPipeline({ records: SPE1 })
    expect(run.blockedAt).toBe('transform')
    expect(run.checkpoints).toHaveLength(1)
    expect(run.checkpoints[0]?.liberado).toBe(false)
    expect(run.steps.filter((s) => s.status === 'completed').map((s) => s.id)).toEqual([
      'receive', 'profile', 'map',
    ])
    expect(run.steps.find((s) => s.id === 'transform')?.status).toBe('blocked')
    expect(run.loadPackage).toBeNull()
  })

  it('para no checkpoint 2 até cada cluster ser confirmado um a um', () => {
    const run = runPipeline({ records: TODOS, approvals: { ...emptyApprovals, mapeamento: assinatura() } })
    expect(run.blockedAt).toBe('enrich')
    const cp2 = run.checkpoints.find((c) => c.id === 'duplicatas')
    expect(cp2?.liberado).toBe(false)
    expect(cp2?.requeridas).toBe(run.clusters.length)
    expect(cp2?.pendentes).toHaveLength(run.clusters.length)

    // aprovar todos menos um: ainda bloqueia
    const menosUm = Object.fromEntries(run.clusters.slice(1).map((c) => [c.id, assinatura()]))
    const parcial = runPipeline({
      records: TODOS,
      approvals: { ...emptyApprovals, mapeamento: assinatura(), clusters: menosUm },
    })
    expect(parcial.blockedAt).toBe('enrich')
    expect(parcial.checkpoints.find((c) => c.id === 'duplicatas')?.pendentes).toHaveLength(1)
  })

  it('para no checkpoint 3 até cada exceção ser decidida', () => {
    const approvals: Approvals = { ...emptyApprovals, mapeamento: assinatura() }
    const parcial = runPipeline({ records: SPE1, approvals })
    const comClusters: Approvals = {
      ...approvals,
      clusters: Object.fromEntries(parcial.clusters.map((c) => [c.id, assinatura()])),
    }
    const run = runPipeline({ records: SPE1, approvals: comClusters })
    expect(run.blockedAt).toBe('package')
    const cp3 = run.checkpoints.find((c) => c.id === 'excecoes')
    expect(cp3?.liberado).toBe(false)
    expect(cp3?.requeridas).toBe(run.exceptions.length)
    expect(run.exceptions.length).toBeGreaterThan(0)
  })

  it('não libera no checkpoint 4 sem as duas assinaturas do data owner', () => {
    const run = correrAteOFim(SPE1)
    const cp4 = run.checkpoints.find((c) => c.id === 'pacote-reconciliacao')
    expect(cp4?.liberado).toBe(true)

    // rodar de novo sem a assinatura da reconciliação
    let approvals: Approvals = { ...emptyApprovals, mapeamento: assinatura() }
    let parcial = runPipeline({ records: SPE1, approvals })
    approvals = { ...approvals, clusters: Object.fromEntries(parcial.clusters.map((c) => [c.id, assinatura()])) }
    parcial = runPipeline({ records: SPE1, approvals })
    approvals = {
      ...approvals,
      excecoes: Object.fromEntries(parcial.exceptions.map((e) => [e.id, assinatura()])),
      pacote: assinatura(),
    }
    const semReconciliacao = runPipeline({ records: SPE1, approvals })
    const cp = semReconciliacao.checkpoints.find((c) => c.id === 'pacote-reconciliacao')
    expect(cp?.liberado).toBe(false)
    expect(cp?.pendentes).toEqual(['reconciliacao'])
  })
})

// ============================================================ critério de aceite

describe('critério de aceite', () => {
  it('roda a SPE-1 e devolve trilha completa para todos os registros dela', () => {
    const run = correrAteOFim(SPE1)
    expect(run.records).toHaveLength(SPE1.length)
    for (const r of run.records) {
      expect(r.trail.length, `${r.codigo} sem trilha`).toBeGreaterThan(0)
      for (const entrada of r.trail) {
        expect(entrada.ruleId, r.codigo).toMatch(/^R-[A-Z]{3}-\d{3}$/)
        expect(entrada.playbookVersion, r.codigo).toBe(PLAYBOOK_VERSION)
      }
      // a trilha é sequencial e sem buraco
      expect(r.trail.map((t) => t.seq)).toEqual(r.trail.map((_, i) => i + 1))
    }
  })

  it('roda os 42 fornecedores e cada um sai com trilha completa: origem, regras, valor final ou held', () => {
    const run = correrAteOFim(TODOS)
    expect(run.records).toHaveLength(42)

    for (const r of run.records) {
      // valor de origem
      expect(r.source.codigo).toBe(r.codigo)
      // regras aplicadas, com id e versão
      expect(r.trail.length).toBeGreaterThan(0)
      // valor final OU held com exceção e dono
      if (r.outcome === 'held') {
        expect(r.target, `${r.codigo} retido deveria estar sem valor final`).toBeNull()
        expect(r.exceptions.length, `${r.codigo} retido sem exceção`).toBeGreaterThan(0)
        for (const e of r.exceptions) {
          expect(defectOriginIds).toContain(e.origin)
          expect(e.roteadoPara, `${e.id} sem dono`).not.toBe('')
        }
      } else {
        expect(r.target, `${r.codigo} deveria ter valor final`).not.toBeNull()
      }
    }
  })

  it('classifica os defeitos plantados por origem', () => {
    const run = correrAteOFim(TODOS)
    const plantados = TODOS.reduce((acc, s) => acc + s._plantedDefect.length, 0)
    expect(run.classifiedDefects).toHaveLength(plantados)

    for (const d of run.classifiedDefects) {
      expect(defectOriginIds).toContain(d.origin)
      expect(['critical', 'non-critical']).toContain(d.severidade)
      expect(d.roteadoPara).not.toBe('')
    }

    const porOrigem = Object.fromEntries(run.defectsByOrigin.map((t) => [t.origin, t.total]))
    // as quatro origens existem no resumo, mesmo com zero
    expect(Object.keys(porOrigem).sort()).toEqual([...defectOriginIds].sort())
    // os defeitos plantados caem nas origens esperadas
    expect(porOrigem['source-extract']).toBeGreaterThan(0)
    expect(porOrigem['transformation']).toBe(0)
    expect(porOrigem['target-config']).toBeGreaterThan(0)

    // só transformation é responsabilidade da Monoda
    for (const t of run.defectsByOrigin) {
      expect(t.monodaResponsavel).toBe(t.origin === 'transformation')
    }
    expect(run.defectsByOrigin.every((t) => t.critical + t.nonCritical === t.total)).toBe(true)
  })

  it('duas execuções com a mesma versão de playbook dão saída idêntica byte a byte', () => {
    const a = correrAteOFim(TODOS)
    const b = correrAteOFim(TODOS)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(a).length).toBeGreaterThan(1000)

    // e o mesmo vale para um run bloqueado no meio
    const p1 = runPipeline({ records: SPE1 })
    const p2 = runPipeline({ records: SPE1 })
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))

    // a ordem de entrada não muda a saída
    const embaralhado = [...TODOS].reverse()
    const c = correrAteOFim(embaralhado)
    expect(JSON.stringify(c)).toBe(JSON.stringify(a))
  })
})

describe('achados que a esteira precisa produzir', () => {
  it('retém os CNPJ com dígito verificador inválido, com origem source-extract', () => {
    const run = correrAteOFim(TODOS, 'rejected')
    const dv = run.exceptions.filter((e) => e.defectTypeId === 'DEF-SRC-01')
    expect(dv).toHaveLength(3)
    for (const e of dv) {
      expect(e.origin).toBe('source-extract')
      expect(e.severidade).toBe('critical')
      expect(e.monodaResponsavel).toBe(false)
      expect(run.records.find((r) => r.codigo === e.recordCode)?.outcome).toBe('held')
    }
  })

  it('forma 6 clusters: os 4 pares de grafia divergente mais os 2 PF repetidos entre SPEs', () => {
    const run = correrAteOFim(TODOS)
    // 4 pares de pessoa jurídica com grafia divergente + 2 pessoas físicas com o
    // mesmo CPF em duas SPEs. As PF também são duplicata: mesmo documento, dois
    // cadastros. A grafia é que não diverge nelas.
    expect(run.clusters).toHaveLength(6)

    const nomeDe = (codigo: string) => TODOS.find((s) => s.codigo === codigo)?.razaoSocial
    const grafiaDivergente = run.clusters.filter(
      (c) => new Set(c.membros.map(nomeDe)).size > 1,
    )
    expect(grafiaDivergente).toHaveLength(4)

    for (const c of run.clusters) {
      expect(c.membros).toHaveLength(2)
      expect(new Set(c.spes).size, `${c.id} deveria cruzar SPEs`).toBe(2)
      expect(c.membros).toContain(c.sobreviventePropostoCodigo)
      expect(c.confirmado).toBe(true)
      // membros do mesmo cluster compartilham o documento
      const docs = new Set(c.membros.map((m) => TODOS.find((s) => s.codigo === m)?.cnpjCpf.replace(/\D/g, '')))
      expect(docs.size).toBe(1)
    }

    // um não-sobrevivente por cluster foi fundido no outro
    const fundidos = run.records.filter((r) => r.outcome === 'merged')
    expect(fundidos).toHaveLength(6)
    for (const r of fundidos) expect(r.resolvidoPara).not.toBeNull()
  })

  it('reusa os 2 Business Partner que já existem, em vez de recriar', () => {
    const run = correrAteOFim(TODOS)
    const reusados = run.records.filter((r) => r.outcome === 'reused')
    expect(reusados).toHaveLength(2)
    for (const r of reusados) {
      expect(r.resolvidoPara).toMatch(/^\d{10}$/)
      expect(r.target?.businessPartner).toBe(r.resolvidoPara)
    }
    const excecoes = run.exceptions.filter((e) => e.defectTypeId === 'DEF-TGT-01')
    expect(excecoes).toHaveLength(2)
    for (const e of excecoes) expect(e.origin).toBe('target-config')
  })

  it('escala a divergência de retenção entre SPEs como decisão do cliente', () => {
    const run = correrAteOFim(TODOS, 'rejected')
    const divergencias = run.exceptions.filter((e) => e.defectTypeId === 'DEF-TGT-04')
    expect(divergencias).toHaveLength(2)
    for (const e of divergencias) {
      expect(e.origin).toBe('target-config')
      expect(e.monodaResponsavel).toBe(false)
      expect(e.roteadoPara).toBe('Verene · Fiscal')
      expect(e.ruleId).toBe('R-SUP-047')
    }
  })

  it('enriquece o código IBGE dos 6 municípios que vieram sem, pela tabela de referência', () => {
    const run = correrAteOFim(TODOS)
    const semIbge = TODOS.filter((s) => s.codigoIbge === null)
    expect(semIbge).toHaveLength(6)
    for (const s of semIbge) {
      const r = run.records.find((x) => x.codigo === s.codigo)
      const derivacao = r?.trail.find((t) => t.ruleId === 'R-SUP-040')
      expect(derivacao, `${s.codigo} sem derivação de IBGE`).toBeDefined()
      expect(derivacao?.after, `${s.codigo} não enriqueceu`).toMatch(/^\d{7}$/)
    }
  })

  it('normaliza as datas divergentes para ISO na transformação', () => {
    const run = correrAteOFim(TODOS)
    for (const r of run.records) {
      const conversao = r.trail.find((t) => t.ruleId === 'R-SUP-021')
      expect(conversao?.after, r.codigo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('quebra razão social maior que 40 caracteres sem cortar palavra ao meio', () => {
    const run = correrAteOFim(TODOS)
    const quebrados = run.records.filter((r) => (r.target?.nameOrg2 ?? null) !== null)
    expect(quebrados.length).toBeGreaterThan(0)
    for (const r of quebrados) {
      const org1 = r.target?.nameOrg1 ?? ''
      expect(org1.length, r.codigo).toBeLessThanOrEqual(40)
      // não corta palavra ao meio: o caractere seguinte na origem é espaço
      const origem =
        r.clusterId === null
          ? r.source.razaoSocial
          : (run.clusters.find((c) => c.id === r.clusterId)?.razaoSocialProposta ?? r.source.razaoSocial)
      expect(origem.startsWith(org1), `${r.codigo}: "${org1}" não é prefixo de "${origem}"`).toBe(true)
      expect([' ', ''], r.codigo).toContain(origem.charAt(org1.length))
    }
  })

  it('fecha a reconciliação: recebidos = migrated + reused + merged + held', () => {
    const run = correrAteOFim(TODOS)
    const rec = run.reconciliation
    expect(rec).not.toBeNull()
    if (!rec) return
    expect(rec.recebidos).toBe(42)
    expect(rec.migrated + rec.reused + rec.merged + rec.held).toBe(42)
    expect(rec.fecha).toBe(true)
    expect(rec.semTrilha).toEqual([])
    expect(rec.retidosSemExcecao).toEqual([])
  })

  it('empacota só o que foi aprovado, com manifest carregando versão e checksum', () => {
    const run = correrAteOFim(TODOS)
    const pkg = run.loadPackage
    expect(pkg).not.toBeNull()
    if (!pkg) return
    const empacotaveis = run.records.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')
    expect(pkg.total).toBe(empacotaveis.length)
    expect(pkg.registros).toEqual(empacotaveis.map((r) => r.codigo))
    expect(pkg.manifest.playbookVersion).toBe(PLAYBOOK_VERSION)
    expect(pkg.manifest.playbookChecksum).toBe(sealPlaybook(PLAYBOOK_VERSION).checksum)
    expect(pkg.manifest.datasetChecksum).toMatch(/^[0-9a-f]{8}$/)
    // nenhum registro retido entrou no pacote
    for (const codigo of pkg.registros) {
      expect(run.records.find((r) => r.codigo === codigo)?.outcome).not.toBe('held')
    }
  })

  it('mantém retido o registro cuja exceção foi recusada', () => {
    const liberado = correrAteOFim(TODOS, 'approved')
    const recusado = correrAteOFim(TODOS, 'rejected')
    expect(recusado.reconciliation?.held).toBeGreaterThan(liberado.reconciliation?.held ?? 0)
    expect(recusado.loadPackage?.total).toBeLessThan(liberado.loadPackage?.total ?? 0)
  })
})
