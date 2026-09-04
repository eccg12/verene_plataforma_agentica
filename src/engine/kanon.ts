/**
 * KANON — governança do playbook.
 *
 * KANON não ocupa passo da esteira. Ele publica a versão do playbook, sela com
 * checksum e é o único caminho pelo qual um agente chega a uma regra.
 *
 * É aqui que a tese deixa de ser slogan. `resolveRule` recusa:
 *   - regra que não existe na versão pedida;
 *   - regra `candidate`, isto é, generativa não promovida por um humano;
 *   - regra cujo agente não é o agente do passo que está executando.
 *
 * Como a esteira inteira só muta registro através de `apply`, e `apply` passa
 * por aqui, um agente não consegue — por construção, não por disciplina —
 * aplicar regra que não esteja publicada para ele naquela versão.
 */
import type { AgentName } from '@/data/agents'
import { PLAYBOOK_VERSION, playbookRules, type PlaybookRule } from '@/data/playbook'
import { ordemDaVersao } from '@/data/playbook-history'
import { hashSeed } from '@/engine/random'

export class PlaybookViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlaybookViolation'
  }
}

export interface SealedPlaybook {
  readonly version: string
  readonly rules: readonly PlaybookRule[]
  /** Checksum não criptográfico. Serve para provar que a mesma versão tem o mesmo conteúdo. */
  readonly checksum: string
  readonly totalRegras: number
  readonly regrasAtivas: number
  readonly regrasCandidatas: number
}

const canonical = (rule: PlaybookRule): string =>
  [
    rule.id,
    rule.agent,
    rule.object,
    rule.field,
    rule.type,
    rule.expression,
    rule.status,
    rule.nature,
    // O parâmetro entra no checksum: duas redações que só diferem no parâmetro
    // produzem saídas diferentes, então não podem selar igual.
    JSON.stringify(rule.parametros ?? {}),
  ].join('')

const cache = new Map<string, SealedPlaybook>()

/**
 * A regra está vigente nesta versão?
 *
 * Vigência, não igualdade: a regra vale da versão em que entrou até a versão em
 * que foi substituída (exclusive). É o que permite uma regra ter mais de uma
 * redação sem duplicar o playbook inteiro a cada publicação — e é o que faz
 * "corrigir uma regra" ser uma operação de versão, não de edição no lugar.
 */
function vigenteEm(rule: PlaybookRule, ordem: number): boolean {
  const entrou = ordemDaVersao(rule.introducedIn)
  if (entrou < 0 || entrou > ordem) return false
  if (rule.vigenteAte === undefined) return true
  const saiu = ordemDaVersao(rule.vigenteAte)
  return saiu < 0 ? true : ordem < saiu
}

/** Publica e sela uma versão do playbook. Selada, é imutável. */
export function sealPlaybook(version: string = PLAYBOOK_VERSION): SealedPlaybook {
  const cached = cache.get(version)
  if (cached) return cached

  const ordem = ordemDaVersao(version)
  if (ordem < 0) {
    throw new PlaybookViolation(`Versão ${version} não está declarada no histórico do playbook.`)
  }

  const rules = playbookRules
    .filter((r) => vigenteEm(r, ordem))
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  if (rules.length === 0) {
    throw new PlaybookViolation(`Nenhuma regra vigente na versão ${version} do playbook.`)
  }

  const sealed: SealedPlaybook = {
    version,
    rules,
    checksum: hashSeed(rules.map(canonical).join('')).toString(16).padStart(8, '0'),
    totalRegras: rules.length,
    regrasAtivas: rules.filter((r) => r.status === 'active').length,
    regrasCandidatas: rules.filter((r) => r.status === 'candidate').length,
  }
  cache.set(version, sealed)
  return sealed
}

/**
 * Resolve UMA regra para UM agente numa versão, e recusa tudo que não seja
 * exatamente isso. É o guarda que torna a tese verificável em teste.
 */
export function resolveRule(ruleId: string, agent: AgentName, version: string): PlaybookRule {
  const sealed = sealPlaybook(version)
  const rule = sealed.rules.find((r) => r.id === ruleId)
  if (!rule) {
    throw new PlaybookViolation(`Regra ${ruleId} não está publicada na versão ${version} do playbook.`)
  }
  if (rule.status !== 'active') {
    throw new PlaybookViolation(
      `Regra ${ruleId} está com status "${rule.status}" e não executa. Regra generativa precisa ser promovida por um humano antes.`,
    )
  }
  if (rule.agent !== agent) {
    throw new PlaybookViolation(
      `Regra ${ruleId} pertence a ${rule.agent} e foi invocada por ${agent}. Agente não executa regra de outro agente.`,
    )
  }
  return rule
}

/**
 * Parâmetro de uma regra, lido pelo MESMO caminho que a regra: `resolveRule`.
 *
 * Um agente não alcança um parâmetro sem passar pelo guarda — se pudesse, a
 * correção de uma regra viraria edição de código do agente, e a tese caía.
 */
export function parametroDaRegra(
  ruleId: string,
  agent: AgentName,
  version: string,
  nome: string,
): string | number | boolean {
  const rule = resolveRule(ruleId, agent, version)
  const valor = rule.parametros?.[nome]
  if (valor === undefined) {
    throw new PlaybookViolation(
      `Regra ${ruleId} não declara o parâmetro "${nome}" na versão ${version}. Agente não inventa parâmetro.`,
    )
  }
  return valor
}

/** Todas as regras de um agente numa versão. */
export function rulesForAgent(agent: AgentName, version: string = PLAYBOOK_VERSION): readonly PlaybookRule[] {
  return sealPlaybook(version).rules.filter((r) => r.agent === agent)
}

export interface DocRuleEntry {
  readonly id: string
  readonly titulo: string
  readonly expressao: string
  readonly porque: string
  readonly dono: string
  readonly natureza: string
  readonly status: string
}

export interface DocSection {
  readonly agent: AgentName
  readonly regras: readonly DocRuleEntry[]
}

/**
 * Documentação gerada A PARTIR do playbook, nunca escrita à mão. Se a regra
 * muda e a documentação não muda junto, é porque alguém escreveu documentação
 * fora daqui — que é exatamente o que este projeto não faz.
 */
export function generateDocumentation(version: string = PLAYBOOK_VERSION): readonly DocSection[] {
  const sealed = sealPlaybook(version)
  const agentes = [...new Set(sealed.rules.map((r) => r.agent))].sort()
  return agentes.map((agent) => ({
    agent,
    regras: sealed.rules
      .filter((r) => r.agent === agent)
      .map((r) => ({
        id: r.id,
        titulo: `${r.object} / ${r.field}`,
        expressao: r.expression,
        porque: r.rationale,
        dono: r.owner,
        natureza: r.nature,
        status: r.status,
      })),
  }))
}
