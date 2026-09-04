/**
 * Registro dos tokens do design system, para a tela /styleguide.
 *
 * Aqui ficam apenas NOMES e agrupamentos. Os valores em runtime vivem no
 * `@theme` de `src/styles/globals.css`; a tela lê a cor aplicada de fato via
 * `getComputedStyle`, para o que ela mostra nunca divergir do que ela aplica.
 */
import { defectTokens, palette, stateTokens, type DefectToken, type StateToken } from '../../tailwind.config'

export { defectTokens, palette, stateTokens }
export type { DefectToken, StateToken }

/**
 * Especificação de uma amostra do styleguide.
 *
 * `against` é a cor contra a qual medir contraste — por padrão a superfície.
 * Um preenchimento de botão não se mede contra a superfície e sim contra o
 * texto que fica em cima dele; e traço/superfície não são texto, então não
 * recebem nota WCAG nenhuma. Sem isso o styleguide marcaria "reprovado" em
 * token que não é texto, o que é ruído, não informação.
 */
export interface SwatchSpec {
  readonly name: string
  readonly against?: string
  readonly grade: boolean
}

/** Paleta base, na ordem de exibição. */
export const paletteSwatches: readonly SwatchSpec[] = [
  { name: 'verene-violet', grade: true },
  { name: 'verene-violet-lt', grade: true },
  { name: 'monoda-navy', grade: true },
  { name: 'slate', grade: true },
  { name: 'signal-green', grade: true },
  { name: 'ink', grade: false },
  { name: 'paper', grade: false },
  { name: 'line-base', grade: false },
  { name: 'mute', grade: false },
]

/** Tokens semânticos que trocam de valor conforme a superfície. */
export const semanticGroups: readonly { readonly key: string; readonly tokens: readonly SwatchSpec[] }[] = [
  {
    key: 'superficie',
    tokens: [
      { name: 'surface', grade: false },
      { name: 'surface-raised', grade: false },
      { name: 'surface-sunken', grade: false },
    ],
  },
  {
    key: 'texto',
    tokens: [
      { name: 'fg', grade: true },
      { name: 'fg-muted', grade: true },
      { name: 'fg-subtle', grade: true },
    ],
  },
  {
    key: 'traco',
    tokens: [
      { name: 'line', grade: false },
      { name: 'line-strong', grade: false },
    ],
  },
  {
    key: 'acao',
    tokens: [
      { name: 'accent', grade: true },
      { name: 'accent-hover', grade: true },
      { name: 'accent-fill', against: 'on-accent-fill', grade: true },
      { name: 'on-accent-fill', against: 'accent-fill', grade: true },
    ],
  },
]

/** Amostras das quatro origens de defeito. */
export const defectSwatches: readonly SwatchSpec[] = defectTokens.map((name) => ({ name, grade: true }))

/**
 * Linhas da tabela densa do styleguide.
 *
 * Usa os objetos e volumes declarados em `scope.ts` — não números inventados —
 * para o guia de estilo não contradizer o escopo em nenhuma tela. As colunas de
 * migrados e defeitos são ilustrativas do componente, não resultado de execução.
 */
import { scopeObjects } from '@/data/scope'

export interface StyleguideRow {
  readonly id: string
  readonly object: string
  readonly records: number
  readonly migrated: number
  readonly defects: number
  readonly origin: DefectToken
  readonly state: StateToken
}

const ILUSTRACAO: readonly {
  readonly migrated: number
  readonly defects: number
  readonly origin: DefectToken
  readonly state: StateToken
}[] = [
  { migrated: 1094, defects: 26, origin: 'defect-source', state: 'signed' },
  { migrated: 311, defects: 9, origin: 'defect-transformation', state: 'exception' },
  { migrated: 182, defects: 18, origin: 'defect-target-config', state: 'held' },
  { migrated: 200, defects: 0, origin: 'defect-load', state: 'signed' },
  { migrated: 113, defects: 7, origin: 'defect-load', state: 'pending-gate' },
]

export const styleguideRows: readonly StyleguideRow[] = scopeObjects.slice(0, 5).map((objeto, index) => {
  const ilustracao = ILUSTRACAO[index] ?? ILUSTRACAO[0]!
  return {
    id: objeto.id,
    object: objeto.nome,
    records: objeto.volume,
    migrated: ilustracao.migrated,
    defects: ilustracao.defects,
    origin: ilustracao.origin,
    state: ilustracao.state,
  }
})
