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
  'Fiori',
  'XML',
] as const

/** Nomes de artefatos contratuais e do processo de entrega. */
export const CONTRACT_ARTIFACTS = [
  'Gate',
  'Wave',
  'Mission Control',
  'fingerprint',
  'playbook',
  'manifest',
  'checksum',
  'cutover',
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
  ...AGENT_NAMES,
]

/** Indica se `term` é um termo preservado (comparação exata, sem diferenciar caixa). */
export function isPreservedTerm(term: string): boolean {
  const needle = term.trim().toLowerCase()
  return PRESERVED_TERMS.some((preserved) => preserved.toLowerCase() === needle)
}
