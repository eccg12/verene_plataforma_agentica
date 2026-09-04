/**
 * Quantos registros cada regra tocou nesta onda.
 *
 * Sai da trilha do run corrente, não de contador paralelo: se a regra não
 * aparece na trilha de nenhum registro, ela não foi aplicada, e a tela mostra
 * zero. É o que transforma "a regra existe" em "a regra rodou".
 */
import { PLAYBOOK_VERSION, playbookRules } from '@/data/playbook'
import type { PipelineRun } from '@/engine/pipeline'

export interface RuleUsage {
  readonly ruleId: string
  /** Registros distintos em que a regra apareceu. */
  readonly registros: number
  /** Códigos dos registros, ordenados. */
  readonly codigos: readonly string[]
  /** Aplicações totais — uma regra pode tocar o mesmo registro mais de uma vez. */
  readonly aplicacoes: number
}

export function usoDasRegras(run: PipelineRun): ReadonlyMap<string, RuleUsage> {
  const porRegra = new Map<string, { codigos: Set<string>; aplicacoes: number }>()
  for (const registro of run.records) {
    for (const entrada of registro.trail) {
      const atual = porRegra.get(entrada.ruleId) ?? { codigos: new Set<string>(), aplicacoes: 0 }
      atual.codigos.add(registro.codigo)
      atual.aplicacoes += 1
      porRegra.set(entrada.ruleId, atual)
    }
  }
  return new Map(
    playbookRules.map((regra) => {
      const uso = porRegra.get(regra.id)
      const codigos = [...(uso?.codigos ?? [])].sort()
      return [regra.id, { ruleId: regra.id, registros: codigos.length, codigos, aplicacoes: uso?.aplicacoes ?? 0 }]
    }),
  )
}

/** Regras que efetivamente rodaram neste run. */
export function regrasAplicadas(run: PipelineRun): readonly string[] {
  return [...usoDasRegras(run).values()].filter((u) => u.registros > 0).map((u) => u.ruleId)
}

export interface ResumoPlaybook {
  readonly versao: string
  readonly total: number
  readonly ativas: number
  readonly candidatas: number
  readonly deterministicas: number
  readonly generativas: number
  readonly aplicadasNestaOnda: number
}

export function resumoDoPlaybook(run: PipelineRun): ResumoPlaybook {
  return {
    versao: run.playbookVersion || PLAYBOOK_VERSION,
    total: playbookRules.length,
    ativas: playbookRules.filter((r) => r.status === 'active').length,
    candidatas: playbookRules.filter((r) => r.status === 'candidate').length,
    deterministicas: playbookRules.filter((r) => r.nature === 'deterministic').length,
    generativas: playbookRules.filter((r) => r.nature === 'generative').length,
    aplicadasNestaOnda: regrasAplicadas(run).length,
  }
}
