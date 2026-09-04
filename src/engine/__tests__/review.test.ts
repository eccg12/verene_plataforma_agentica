import { describe, expect, it } from 'vitest'

import { defectTypes } from '@/data/defect-taxonomy'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonMaterials } from '@/data/source/nasajon-materials'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { runContractLine } from '@/engine/contract-pipeline'
import {
  propostasDeMaterial,
  propostasDeServico,
  propostasParaFornecedor,
} from '@/engine/enrichment'
import { filaDeExcecoes, resumoDaFila } from '@/engine/exception-queue'
import { analisarCluster } from '@/engine/matching'
import { emptyApprovals, pipelineSteps, runPipeline, type Approvals, type Signature } from '@/engine/pipeline'
import { PlaybookViolation } from '@/engine/kanon'

const sig: Signature = { by: 't', role: 't', decision: 'approved', at: '2026-01-12T09:00:00.000Z', note: null }

function runCompleto() {
  const base: Approvals = { ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig }
  const p1 = runPipeline({ records: nasajonSuppliers, approvals: base })
  const comClusters: Approvals = {
    ...base,
    clusters: Object.fromEntries(p1.clusters.map((c) => [c.id, sig])),
  }
  return runPipeline({ records: nasajonSuppliers, approvals: comClusters })
}

describe('trilha campo a campo', () => {
  it('carimba instante determinístico em toda entrada', () => {
    const a = runCompleto()
    const b = runCompleto()
    const trilhaA = a.records.flatMap((r) => r.trail.map((e) => e.at))
    const trilhaB = b.records.flatMap((r) => r.trail.map((e) => e.at))
    expect(trilhaA).toEqual(trilhaB)
    for (const at of trilhaA) expect(at).toMatch(/^2026-01-12T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('cada entrada nomeia campo, regra, versão e agente do passo', () => {
    const run = runCompleto()
    for (const r of run.records) {
      for (const e of r.trail) {
        const passo = pipelineSteps.find((p) => p.id === e.step)
        expect(e.agent, `${r.codigo}/${e.ruleId}`).toBe(passo?.agent)
        expect(e.field).not.toBe('')
        expect(e.playbookVersion).not.toBe('')
      }
    }
  })
})

describe('a mesma esteira na linha de contrato', () => {
  const contrato = nasajonContracts.find((c) => c.numero === 'CTR-2023-404')
  const linha = contrato?.linhas.find((l) => l.item === 10)

  it('roda os nove passos com os mesmos agentes', () => {
    expect(contrato).toBeDefined()
    expect(linha).toBeDefined()
    if (!contrato || !linha) return
    const r = runContractLine(contrato, linha)
    expect(r.id).toBe('CTR-2023-404~10')
    expect(r.trail.length).toBeGreaterThan(5)
    for (const e of r.trail) {
      const passo = pipelineSteps.find((p) => p.id === e.step)
      expect(passo, e.step).toBeDefined()
      expect(e.agent).toBe(passo?.agent)
    }
  })

  it('é determinística: duas execuções dão saída idêntica', () => {
    if (!contrato || !linha) return
    expect(JSON.stringify(runContractLine(contrato, linha))).toBe(
      JSON.stringify(runContractLine(contrato, linha)),
    )
  })

  it('pega os dois defeitos plantados deste contrato', () => {
    if (!contrato || !linha) return
    const r = runContractLine(contrato, linha)
    // unidade METRO normalizada para M
    const uom = r.trail.find((e) => e.ruleId === 'R-CTR-010')
    expect(uom?.before).toBe('METRO')
    expect(uom?.after).toBe('M')
    // cabeçalho não reconcilia com as linhas
    expect(r.exceptions.map((e) => e.defectTypeId)).toContain('DEF-SRC-05')
    expect(r.outcome).toBe('held')
  })

  it('não deixa a quantidade mudar junto com a unidade', () => {
    if (!contrato || !linha) return
    const r = runContractLine(contrato, linha)
    const conv = r.trail.find((e) => e.ruleId === 'R-CTR-020')
    expect(conv?.before).toBe(String(linha.quantidade))
    expect(conv?.after).toBe(String(linha.quantidade))
  })

  it('passa pelo mesmo guarda de KANON: regra de outro agente é recusada', () => {
    // R-CTR-011 é candidata; nenhuma chamada de apply pode tê-la executado
    if (!contrato || !linha) return
    const r = runContractLine(contrato, linha)
    expect(r.trail.some((e) => e.ruleId === 'R-CTR-011')).toBe(false)
    expect(() => runContractLine(contrato, linha, 'v0.0.0')).toThrow(PlaybookViolation)
  })
})

describe('score e racional do match', () => {
  it('dá score alto para os pares plantados, com os sinais que o compõem', () => {
    const run = runCompleto()
    for (const cluster of run.clusters) {
      const a = analisarCluster(cluster, nasajonSuppliers)
      expect(a.sinais.length).toBeGreaterThan(0)
      // o score é exatamente a soma dos pesos que batem
      const esperado = a.sinais.filter((s) => s.bate).reduce((acc, s) => acc + s.peso, 0)
      expect(a.score).toBe(esperado)
      // documento igual é o sinal que sustenta o cluster
      expect(a.sinais.find((s) => s.id === 'documento')?.bate).toBe(true)
      expect(a.score).toBeGreaterThanOrEqual(60)
    }
  })

  it('lista campos divergentes com o valor de cada membro', () => {
    const run = runCompleto()
    const cluster = run.clusters.find((c) => c.id.startsWith('CL-0481'))
    expect(cluster).toBeDefined()
    if (!cluster) return
    const a = analisarCluster(cluster, nasajonSuppliers)
    expect(a.divergentes.length).toBeGreaterThan(0)
    for (const d of a.divergentes) {
      expect(d.valores).toHaveLength(cluster.membros.length)
      expect(new Set(d.valores.map((v) => v.valor)).size).toBeGreaterThan(1)
    }
    expect(a.divergentes.map((d) => d.campo)).toContain('razaoSocial')
  })

  it('é determinístico', () => {
    const run = runCompleto()
    const cluster = run.clusters[0]
    if (!cluster) return
    expect(JSON.stringify(analisarCluster(cluster, nasajonSuppliers))).toBe(
      JSON.stringify(analisarCluster(cluster, nasajonSuppliers)),
    )
  })
})

describe('fila de exceções', () => {
  it('classifica toda exceção e roteia para um dono nomeado', () => {
    const run = runCompleto()
    const fila = filaDeExcecoes(run, {})
    expect(fila.length).toBeGreaterThan(0)
    for (const item of fila) {
      expect(['tecnica', 'negocio']).toContain(item.classe)
      expect(item.encaminhadaA).not.toBe('')
      expect(item.prazo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(item.prazoDias).toBeGreaterThan(0)
      expect(item.estado).toBe('aberta')
    }
  })

  it('encaminha técnica ao SAP SME e negócio ao data owner', () => {
    const fila = filaDeExcecoes(runCompleto(), {})
    for (const item of fila) {
      expect(item.encaminhadaA).toBe(
        item.classe === 'tecnica' ? 'Verene · Arquitetura S/4HANA' : 'Verene · Data owner',
      )
    }
    const resumo = resumoDaFila(fila)
    expect(resumo.tecnicas + resumo.negocio).toBe(resumo.total)
  })

  it('todo tipo de defeito da taxonomia declara classe e prazo', () => {
    for (const t of defectTypes) {
      expect(['tecnica', 'negocio'], t.id).toContain(t.classe)
      expect(t.prazoDias, t.id).toBeGreaterThan(0)
    }
  })

  it('a decisão muda o estado, e não existe caminho de valor padrão', () => {
    const run = runCompleto()
    const primeira = filaDeExcecoes(run, {})[0]
    expect(primeira).toBeDefined()
    if (!primeira) return
    const liberada = filaDeExcecoes(run, { [primeira.excecao.id]: sig })
    expect(liberada.find((e) => e.excecao.id === primeira.excecao.id)?.estado).toBe('liberada')
    const retida = filaDeExcecoes(run, {
      [primeira.excecao.id]: { ...sig, decision: 'rejected' },
    })
    expect(retida.find((e) => e.excecao.id === primeira.excecao.id)?.estado).toBe('mantida-retida')
  })
})

describe('enriquecimento com evidência', () => {
  it('IBGE derivado traz a tabela e o município que sustentam o valor', () => {
    const semIbge = nasajonSuppliers.filter((s) => s.codigoIbge === null)
    expect(semIbge.length).toBe(6)
    for (const s of semIbge) {
      const proposta = propostasParaFornecedor(s.codigo).find((p) => p.campo === 'codigoIbge')
      expect(proposta, s.codigo).toBeDefined()
      expect(proposta?.valorProposto, s.codigo).toMatch(/^\d{7}$/)
      expect(proposta?.evidencia?.fonte).toContain('IBGE')
      expect(proposta?.evidencia?.referencia).toContain(s.uf)
    }
  })

  it('CNAE NÃO recebe proposta: sem fonte de referência, sem valor', () => {
    const semCnae = nasajonSuppliers.filter((s) => s.cnae === null)
    expect(semCnae.length).toBe(5)
    for (const s of semCnae) {
      const proposta = propostasParaFornecedor(s.codigo).find((p) => p.campo === 'cnae')
      expect(proposta, s.codigo).toBeDefined()
      expect(proposta?.valorProposto, `${s.codigo} não deveria ter valor proposto`).toBeNull()
      expect(proposta?.evidencia).toBeNull()
      expect(proposta?.motivoSemProposta).not.toBeNull()
    }
  })

  it('toda proposta com valor tem evidência, e toda sem valor tem motivo', () => {
    const todas = [
      ...nasajonSuppliers.flatMap((s) => propostasParaFornecedor(s.codigo)),
      ...propostasDeMaterial(),
    ]
    expect(todas.length).toBeGreaterThan(0)
    for (const p of todas) {
      if (p.valorProposto === null) {
        expect(p.evidencia, p.id).toBeNull()
        expect(p.motivoSemProposta, p.id).not.toBeNull()
      } else {
        expect(p.evidencia, `${p.id} tem valor sem evidência`).not.toBeNull()
        expect(p.evidencia?.referencia, p.id).not.toBe('')
        expect(p.motivoSemProposta, p.id).toBeNull()
      }
    }
  })

  it('NCM é proposto só quando há material equivalente identificável, com os termos citados', () => {
    const propostas = propostasDeMaterial()
    expect(propostas.length).toBe(nasajonMaterials.filter((m) => m.ncm === null).length)

    // MAT-1007 ("CABO 336 MCM - VER COM JOSE") casa com MAT-1001 pelos termos
    const cabo = propostas.find((p) => p.recordCode === 'MAT-1007')
    expect(cabo?.valorProposto).toBe('7614.10.00')
    expect(cabo?.evidencia?.referencia).toContain('MAT-1001')
    expect(cabo?.evidencia?.detalhe).toContain('CABO')

    // os demais não têm equivalente identificável e por isso NÃO recebem proposta
    for (const codigo of ['MAT-2004', 'MAT-3005', 'MAT-4004']) {
      const p = propostas.find((x) => x.recordCode === codigo)
      expect(p?.valorProposto, `${codigo} não deveria ter proposta`).toBeNull()
      expect(p?.motivoSemProposta, codigo).not.toBeNull()
    }
  })

  it('LC 116 propõe item da lista com o fundamento citado, e recusa onde não incide ISS', () => {
    const propostas = propostasDeServico()
    expect(propostas.length).toBeGreaterThan(0)
    const comItem = propostas.filter((p) => p.valorProposto !== null)
    expect(comItem.length).toBeGreaterThan(0)
    for (const p of comItem) {
      expect(p.valorProposto).toMatch(/^\d+\.\d+$/)
      expect(p.evidencia?.fonte).toContain('LC 116')
      expect(p.evidencia?.referencia).toContain(p.valorProposto ?? '')
    }
    // toda recusa explica o motivo
    for (const p of propostas.filter((x) => x.valorProposto === null)) {
      expect(p.motivoSemProposta, p.id).not.toBeNull()
    }
  })
})
