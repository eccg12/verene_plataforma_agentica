/**
 * Glossário de termos preservados.
 *
 * A UI do KEPLER é integralmente em português do Brasil. Os termos abaixo são a
 * exceção: permanecem em inglês, com a grafia exata registrada aqui, em qualquer
 * lugar em que apareçam (strings, rótulos, tooltips, dados de fixture).
 *
 * Regra: nada desta lista é traduzido, aportuguesado ou flexionado. Ao precisar de
 * um novo termo preservado, adicione-o aqui antes de usá-lo em `strings.ts`.
 */

/** Termos técnicos do SAP. */
export const SAP_TERMS = [
  'Business Partner',
  'Outline agreement',
  'Migration Cockpit',
  'Product master',
  'Service master',
  'Purchase order',
  'Purchase requisition',
  'Incoterms',
  'tenant',
  'Value domain',
  'Fiori',
  'XML',
] as const

/**
 * Nomes próprios e termos da única chamada de rede do projeto. Não se traduzem
 * nem se aportuguesam.
 */
export const MODEL_TERMS = ['Anthropic', 'Claude', 'API'] as const

/** Nomes de artefatos contratuais e do processo de entrega. */
export const CONTRACT_ARTIFACTS = [
  'Gate',
  // O plural é usado o tempo todo na UI. Registrar a forma é mais honesto do que
  // fingir que "os Gate" resolve — mas ela continua sendo a ÚNICA flexão aceita.
  'Gates',
  'Wave',
  'Mission Control',
  'data owner',
  'fingerprint',
  'playbook',
  'manifest',
  'checksum',
  'cutover',
] as const

/**
 * Nomes dos passos da esteira. Aparecem em caixa alta na trilha de cada registro
 * e são o nome da operação, não uma descrição — traduzir tiraria a correspondência
 * com o que o playbook publica.
 */
export const PIPELINE_STEPS = [
  'RECEIVE',
  'PROFILE',
  'MAP',
  'TRANSFORM',
  'DEDUPLICATE',
  'ENRICH',
  'VALIDATE',
  'PACKAGE',
  'RECONCILE',
] as const

/**
 * Nomes dos agentes do KEPLER. Nunca são traduzidos, nem flexionados, nem
 * escritos em caixa mista. A especificação de cada um está em
 * `src/data/agents.ts`.
 */
export const AGENT_NAMES: readonly string[] = [
  'VEGA',
  'LYRA',
  'ATLAS',
  'NOVA',
  'ORION',
  'SIRIUS',
  'KANON',
]

/** Todos os termos que a UI mantém em inglês. */
export const PRESERVED_TERMS: readonly string[] = [
  ...SAP_TERMS,
  ...CONTRACT_ARTIFACTS,
  ...PIPELINE_STEPS,
  ...MODEL_TERMS,
  ...AGENT_NAMES,
]

/** Indica se `term` é um termo preservado (comparação exata, sem diferenciar caixa). */
export function isPreservedTerm(term: string): boolean {
  const needle = term.trim().toLowerCase()
  return PRESERVED_TERMS.some((preserved) => preserved.toLowerCase() === needle)
}
