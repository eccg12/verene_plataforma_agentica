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
  'Fiori',
  'XML',
] as const

/** Nomes de artefatos contratuais e do processo de entrega. */
export const CONTRACT_ARTIFACTS = [
  'Gate',
  'playbook',
  'manifest',
  'checksum',
  'cutover',
] as const

/**
 * Nomes dos agentes do KEPLER. Nunca são traduzidos.
 *
 * A lista é preenchida conforme cada agente é definido — não invente nomes de
 * agente aqui nem em tela (ver regra 5 do CLAUDE.md).
 */
export const AGENT_NAMES: readonly string[] = []

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
