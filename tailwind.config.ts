import type { Config } from 'tailwindcss'

/**
 * Tokens do design system KEPLER.
 *
 * Paleta extraída do deck Galaxy (co-branded Verene + Monoda). Os valores em
 * `palette` são os aprovados e não devem ser alterados sem nova aprovação.
 *
 * Onde os valores valem em runtime: o Tailwind v4 resolve tema pelo bloco
 * `@theme` de `src/styles/globals.css`, porque só ele emite as custom
 * properties que as superfícies redefinem (`--color-accent` etc.). Este arquivo
 * é o espelho tipado da mesma paleta, para consumo por TypeScript — e
 * `npm run check:tokens` falha se os dois divergirem.
 */

/** Os nove valores do deck. */
export const palette = {
  'verene-violet': '#7030A0',
  'verene-violet-lt': '#A56FD0',
  ink: '#111111',
  'monoda-navy': '#002B49',
  slate: '#2C3E50',
  'signal-green': '#00C771',
  paper: '#F7F7F7',
  'line-base': '#EAEAEA',
  mute: '#D2D2D2',
} as const

export type PaletteToken = keyof typeof palette

/** Semânticas de estado. Resolvem por superfície — ver globals.css. */
export const stateTokens = ['signed', 'held', 'exception', 'pending-gate'] as const
export type StateToken = (typeof stateTokens)[number]

/** Origens de defeito. Escala categórica: matizes frios, separados por matiz e luminância. */
export const defectTokens = [
  'defect-source',
  'defect-transformation',
  'defect-target-config',
  'defect-load',
] as const
export type DefectToken = (typeof defectTokens)[number]

/** As duas superfícies do produto. */
export const surfaces = ['ink', 'paper'] as const
export type Surface = (typeof surfaces)[number]

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: palette } },
} satisfies Config
