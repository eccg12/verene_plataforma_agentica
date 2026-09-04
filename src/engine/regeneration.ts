/**
 * O que muda quando o playbook sobe de versão.
 *
 * Serve a duas coisas, e as duas precisam do mesmo cálculo:
 *
 * 1. **A propagação na tela.** Regra corrigida → playbook selado → onda regerada
 *    → pacote refeito → manifest novo. Cada número do painel sai daqui; nenhum é
 *    escrito à mão.
 * 2. **Quais assinaturas sobrevivem.** Aprovação vale para o artefato que ela
 *    cobre. Se o artefato não mudou, a aprovação continua valendo e isso fica
 *    registrado; se mudou, ela cai. Zerar tudo seria conservador demais, e
 *    manter tudo seria mentira.
 *
 * Determinístico como o resto: é diferença entre dois runs da mesma esteira.
 */
import type { PlaybookRule } from '@/data/playbook'
import { ordemDaVersao, ordemDasVersoes } from '@/data/playbook-history'
import { sealPlaybook } from '@/engine/kanon'
import type { ExceptionRecord, PipelineRun, StepId } from '@/engine/pipeline'
import { pipelineSteps } from '@/engine/pipeline'

export interface RegraAlterada {
  readonly id: string
  readonly agent: string
  /** Passos da esteira que esta regra toca. É o que decide o que a mudança invalida. */
  readonly passos: readonly StepId[]
  readonly expressaoDe: string | null
  readonly expressaoPara: string | null
  readonly parametrosDe: Readonly<Record<string, string | number | boolean>> | null
  readonly parametrosPara: Readonly<Record<string, string | number | boolean>> | null
}

export interface DiffDePacote {
  readonly id: string
  readonly total: number
  readonly datasetChecksum: string
}

export interface DiffDeRegeneracao {
  readonly de: string
  readonly para: string
  readonly checksumDe: string
  readonly checksumPara: string
  readonly regrasAlteradas: readonly RegraAlterada[]
  /** Registros cujo valor final mudou. */
  readonly registrosRetocados: readonly string[]
  /** Campos que mudaram de valor, somados sobre todos os registros. */
  readonly camposRetocados: number
  readonly excecoesFechadas: readonly ExceptionRecord[]
  readonly excecoesNovas: readonly ExceptionRecord[]
  readonly retidosDe: number
  readonly retidosPara: number
  readonly pacoteDe: DiffDePacote | null
  readonly pacotePara: DiffDePacote | null
}

const canonicalDaRegra = (r: PlaybookRule): string =>
  [r.expression, r.type, r.field, r.status, r.nature, JSON.stringify(r.parametros ?? {})].join('|')

const passosDoAgente = (agent: string): readonly StepId[] =>
  pipelineSteps.filter((p) => p.agent === agent).map((p) => p.id)

/** Regras cuja redação difere entre as duas versões. */
export function regrasAlteradasEntre(de: string, para: string): readonly RegraAlterada[] {
  const antes = new Map(sealPlaybook(de).rules.map((r) => [r.id, r]))
  const depois = new Map(sealPlaybook(para).rules.map((r) => [r.id, r]))
  const ids = [...new Set([...antes.keys(), ...depois.keys()])].sort()

  return ids
    .filter((id) => {
      const a = antes.get(id)
      const b = depois.get(id)
      if (!a || !b) return true
      return canonicalDaRegra(a) !== canonicalDaRegra(b)
    })
    .map((id) => {
      const a = antes.get(id) ?? null
      const b = depois.get(id) ?? null
      return {
        id,
        agent: (b ?? a)!.agent,
        passos: passosDoAgente((b ?? a)!.agent),
        expressaoDe: a?.expression ?? null,
        expressaoPara: b?.expression ?? null,
        parametrosDe: a?.parametros ?? null,
        parametrosPara: b?.parametros ?? null,
      }
    })
}

const pacoteDe = (run: PipelineRun): DiffDePacote | null =>
  run.loadPackage === null
    ? null
    : {
        id: run.loadPackage.id,
        total: run.loadPackage.total,
        datasetChecksum: run.loadPackage.manifest.datasetChecksum,
      }

const alvoPorCodigo = (run: PipelineRun) => new Map(run.records.map((r) => [r.codigo, r.target]))

/** Diferença entre dois runs da mesma onda, em versões diferentes de playbook. */
export function diffDeRegeneracao(antes: PipelineRun, depois: PipelineRun): DiffDeRegeneracao {
  const alvosAntes = alvoPorCodigo(antes)
  const alvosDepois = alvoPorCodigo(depois)

  const retocados: string[] = []
  let camposRetocados = 0
  for (const [codigo, alvoDepois] of alvosDepois) {
    const alvoAntes = alvosAntes.get(codigo) ?? null
    const campos = new Set([...Object.keys(alvoAntes ?? {}), ...Object.keys(alvoDepois ?? {})])
    let mudou = 0
    for (const campo of campos) {
      const a = JSON.stringify((alvoAntes as Record<string, unknown> | null)?.[campo] ?? null)
      const b = JSON.stringify((alvoDepois as Record<string, unknown> | null)?.[campo] ?? null)
      if (a !== b) mudou += 1
    }
    if (mudou > 0) {
      retocados.push(codigo)
      camposRetocados += mudou
    }
  }

  const idsAntes = new Set(antes.exceptions.map((e) => e.id))
  const idsDepois = new Set(depois.exceptions.map((e) => e.id))

  return {
    de: antes.playbookVersion,
    para: depois.playbookVersion,
    checksumDe: antes.playbookChecksum,
    checksumPara: depois.playbookChecksum,
    regrasAlteradas: regrasAlteradasEntre(antes.playbookVersion, depois.playbookVersion),
    registrosRetocados: retocados.sort(),
    camposRetocados,
    excecoesFechadas: antes.exceptions.filter((e) => !idsDepois.has(e.id)),
    excecoesNovas: depois.exceptions.filter((e) => !idsAntes.has(e.id)),
    retidosDe: antes.records.filter((r) => r.outcome === 'held').length,
    retidosPara: depois.records.filter((r) => r.outcome === 'held').length,
    pacoteDe: pacoteDe(antes),
    pacotePara: pacoteDe(depois),
  }
}

/**
 * A próxima versão em que ESTA regra tem redação diferente, se houver.
 *
 * É o que a tela do playbook usa para oferecer "corrigir e publicar": a correção
 * já existe, selada, numa versão adiante — adotá-la é decisão de quem revisa.
 */
export function regraCorrigida(
  ruleId: string,
  versaoAtual: string,
): { readonly versao: string; readonly regra: PlaybookRule } | null {
  const atual = sealPlaybook(versaoAtual).rules.find((r) => r.id === ruleId)
  if (!atual) return null
  const posteriores = ordemDasVersoes.slice(ordemDaVersao(versaoAtual) + 1)
  for (const versao of posteriores) {
    const candidata = sealPlaybook(versao).rules.find((r) => r.id === ruleId)
    if (candidata && canonicalDaRegra(candidata) !== canonicalDaRegra(atual)) {
      return { versao, regra: candidata }
    }
  }
  return null
}

/**
 * O checkpoint 1 sobrevive à regeneração?
 *
 * Sobrevive quando nenhuma regra do passo que ele aprova mudou: o de-para é
 * evidência de LYRA, e corrigir uma regra de ATLAS não mexe nele.
 */
export function mapeamentoSobrevive(regras: readonly RegraAlterada[]): boolean {
  return !regras.some((r) => r.passos.includes('map'))
}
