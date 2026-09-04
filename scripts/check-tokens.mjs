/**
 * Garante que a paleta tipada de tailwind.config.ts não divirja do bloco
 * @theme de globals.css, que é o que vale em runtime.
 */
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/globals.css', import.meta.url), 'utf8')
const ts = readFileSync(new URL('../tailwind.config.ts', import.meta.url), 'utf8')

const themeStart = css.search(/@theme\b[^{]*\{/)
if (themeStart === -1) {
  console.error('check:tokens FALHOU\n  - bloco @theme não encontrado em globals.css')
  process.exit(1)
}
const theme = css.slice(themeStart, css.indexOf('\n}', themeStart))
const cssTokens = new Map(
  [...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, k, v]) => [k, v.toUpperCase()]),
)
const block = ts.slice(ts.indexOf('export const palette'), ts.indexOf('} as const'))
const tsTokens = new Map(
  [...block.matchAll(/'?([a-z-]+)'?:\s*'(#[0-9a-fA-F]{6})'/g)].map(([, k, v]) => [k, v.toUpperCase()]),
)

const problems = []
for (const [k, v] of tsTokens) {
  const from = cssTokens.get(k)
  if (!from) problems.push(`ausente no @theme de globals.css: --color-${k}`)
  else if (from !== v) problems.push(`divergência em ${k}: tailwind.config.ts=${v} globals.css=${from}`)
}
if (tsTokens.size === 0) problems.push('nenhum token lido de tailwind.config.ts')

if (problems.length) {
  console.error('check:tokens FALHOU\n' + problems.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`check:tokens ok — ${tsTokens.size} tokens da paleta conferem com globals.css`)
