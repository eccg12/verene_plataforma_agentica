import { describe, expect, it } from 'vitest'

import { mappedObjects, mappingDictionary } from '@/data/mapping-dictionary'
import { alteracoesRegra, historicoDaRegra, versaoCorrente, versoesPlaybook } from '@/data/playbook-history'
import { PLAYBOOK_VERSION, playbookRules, ruleById } from '@/data/playbook'
import { divergenciasDoPadraoSap, requiredFields, valueDomains } from '@/data/target/tenant-config'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { emptyApprovals, runPipeline, type Approvals, type Signature } from '@/engine/pipeline'
import { sealPlaybook } from '@/engine/kanon'
import { resumoDoPlaybook, usoDasRegras } from '@/engine/playbook-usage'

const sig: Signature = {
  by: 't', role: 't', decision: 'approved', at: '2026-01-12T09:00:00.000Z',
  playbookVersion: PLAYBOOK_VERSION, note: null,
}
const SPE1 = nasajonSuppliers.filter((s) => s.spe === 'SPE-1')

function runAprovado(): ReturnType<typeof runPipeline> {
  const approvals: Approvals = { ...emptyApprovals, mapeamentoSme: sig, mapeamento: sig }
  return runPipeline({ records: SPE1, approvals })
}

describe('histórico do playbook', () => {
  it('a versão corrente é a que as regras publicam', () => {
    expect(versaoCorrente).toBe(PLAYBOOK_VERSION)
    expect(versoesPlaybook.some((v) => v.versao === versaoCorrente)).toBe(true)
  })

  it('toda alteração aponta para uma regra que existe e uma versão declarada', () => {
    const versoes = new Set(versoesPlaybook.map((v) => v.versao))
    for (const a of alteracoesRegra) {
      expect(ruleById.has(a.ruleId), `${a.ruleId} não existe no playbook`).toBe(true)
      expect(versoes.has(a.versao), `${a.versao} não está declarada`).toBe(true)
      expect(a.nota, a.ruleId).not.toBe('')
    }
  })

  it('nenhuma regra entrou em versão posterior à que a publica', () => {
    const ordem = versoesPlaybook.map((v) => v.versao)
    for (const r of playbookRules) {
      expect(ordem, r.id).toContain(r.introducedIn)
      expect(
        ordem.indexOf(r.introducedIn) <= ordem.indexOf(r.playbookVersion),
        `${r.id} entrou em ${r.introducedIn} mas publica em ${r.playbookVersion}`,
      ).toBe(true)
    }
  })

  it('o histórico de uma regra vem ordenado por versão', () => {
    const historico = historicoDaRegra('R-SUP-010')
    expect(historico.length).toBeGreaterThan(1)
    const versoes = historico.map((h) => h.versao)
    expect([...versoes].sort()).toEqual(versoes)
  })

  it('as versões anteriores estão seladas', () => {
    for (const v of versoesPlaybook) expect(v.selada, v.versao).toBe(true)
  })
})

describe('uso das regras nesta onda', () => {
  it('conta registros distintos a partir da trilha, não de contador paralelo', () => {
    const run = runAprovado()
    const uso = usoDasRegras(run)
    for (const [ruleId, u] of uso) {
      const esperado = run.records.filter((r) => r.trail.some((tr) => tr.ruleId === ruleId)).length
      expect(u.registros, ruleId).toBe(esperado)
      expect(u.codigos).toHaveLength(esperado)
      expect([...u.codigos].sort()).toEqual([...u.codigos])
    }
  })

  it('regra candidata nunca aparece aplicada: proposta não executa', () => {
    const run = runAprovado()
    const uso = usoDasRegras(run)
    for (const r of playbookRules.filter((x) => x.status === 'candidate')) {
      expect(uso.get(r.id)?.registros, `${r.id} candidata não deveria ter rodado`).toBe(0)
    }
  })

  it('o resumo conta a versão vigente, não todas as redações já escritas', () => {
    const resumo = resumoDoPlaybook(runAprovado())
    // O playbook tem mais linhas que regras vigentes: a R-SUP-023 tem duas
    // redações. O que a tela mostra é o que está vigente — senão o total do
    // cabeçalho não bate com a lista logo abaixo dele.
    expect(resumo.total).toBe(sealPlaybook(PLAYBOOK_VERSION).totalRegras)
    expect(resumo.total).toBeLessThan(playbookRules.length)
    expect(resumo.ativas + resumo.candidatas).toBe(resumo.total)
    expect(resumo.deterministicas + resumo.generativas).toBe(resumo.total)
    expect(resumo.aplicadasNestaOnda).toBeGreaterThan(0)
    expect(resumo.aplicadasNestaOnda).toBeLessThanOrEqual(resumo.ativas)
  })
})

describe('dicionário de mapeamento', () => {
  it('cobre os quatro objetos e tem id único', () => {
    for (const objeto of mappedObjects) {
      expect(mappingDictionary.filter((m) => m.objeto === objeto).length, objeto).toBeGreaterThan(0)
    }
    const ids = mappingDictionary.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda regra citada existe no playbook', () => {
    for (const m of mappingDictionary) {
      if (m.ruleId === null) continue
      expect(ruleById.has(m.ruleId), `${m.id} cita ${m.ruleId}, que não existe`).toBe(true)
    }
  })

  it('todo value domain citado existe na configuração do tenant', () => {
    const ids = new Set(valueDomains.map((d) => d.id))
    for (const m of mappingDictionary) {
      if (m.valueDomainId === null) continue
      expect(ids.has(m.valueDomainId), `${m.id} cita o domínio ${m.valueDomainId}`).toBe(true)
    }
  })

  it('toda divergência citada existe e cobre o objeto da linha', () => {
    for (const m of mappingDictionary) {
      if (m.divergenciaId === null) continue
      const div = divergenciasDoPadraoSap.find((d) => d.id === m.divergenciaId)
      expect(div, `${m.id} cita ${m.divergenciaId}`).toBeDefined()
      expect(div?.objetos, `${m.divergenciaId} não cobre ${m.objeto}`).toContain(m.objeto)
    }
  })

  it('marca as divergências do padrão SAP e nenhuma fica sem linha no dicionário', () => {
    const marcadas = new Set(
      mappingDictionary.map((m) => m.divergenciaId).filter((d): d is string => d !== null),
    )
    // toda divergência declarada aparece marcada em ao menos uma linha
    for (const div of divergenciasDoPadraoSap) {
      expect(marcadas.has(div.id), `${div.id} declarada mas não marcada no dicionário`).toBe(true)
    }
    expect(marcadas.size).toBe(divergenciasDoPadraoSap.length)
  })

  it('todo campo obrigatório do tenant nos objetos mapeados tem linha no dicionário', () => {
    const alvos = new Set(mappingDictionary.flatMap((m) => m.campoAlvo.split(' + ').map((c) => c.trim())))
    const faltando = requiredFields
      .filter((f) => f.obrigatorio && mappedObjects.includes(f.objeto))
      .map((f) => f.campo)
      .filter((campo) => ![...alvos].some((a) => a.includes(campo) || campo.includes(a)))
    expect(faltando, `campos obrigatórios sem mapeamento: ${faltando.join(', ')}`).toEqual([])
  })

  it('toda linha diz o que fazer na exceção', () => {
    for (const m of mappingDictionary) {
      expect(m.tratamentoExcecao, m.id).not.toBe('')
      expect(m.campoAlvo, m.id).not.toBe('')
    }
  })
})
