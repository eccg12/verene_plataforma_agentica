import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * As regras `no-restricted-*` abaixo tornam verificáveis as regras do CLAUDE.md
 * que, de outra forma, dependeriam só de disciplina. Ao liberar a rota autorizada
 * do P9, abra a exceção por arquivo — não afrouxe a regra global.
 */
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Regra 1 — nenhuma chamada de rede (exceto a rota autorizada no P9).
      // Regra 6 — sem localStorage/sessionStorage.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Regra 1 do CLAUDE.md: sem chamadas de rede.' },
        { name: 'XMLHttpRequest', message: 'Regra 1 do CLAUDE.md: sem chamadas de rede.' },
        { name: 'WebSocket', message: 'Regra 1 do CLAUDE.md: sem chamadas de rede.' },
        { name: 'EventSource', message: 'Regra 1 do CLAUDE.md: sem chamadas de rede.' },
        { name: 'localStorage', message: 'Regra 6 do CLAUDE.md: sem localStorage.' },
        { name: 'sessionStorage', message: 'Regra 6 do CLAUDE.md: sem sessionStorage.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Regra 4 do CLAUDE.md: use createRng de src/engine/random.ts.',
        },
        { object: 'window', property: 'fetch', message: 'Regra 1 do CLAUDE.md: sem chamadas de rede.' },
        { object: 'window', property: 'localStorage', message: 'Regra 6 do CLAUDE.md: sem localStorage.' },
        { object: 'window', property: 'sessionStorage', message: 'Regra 6 do CLAUDE.md: sem sessionStorage.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // Regra 2 — nenhum texto literal em JSX; tudo em src/copy/strings.ts.
          selector: 'JSXText[value=/\\S/]',
          message: 'Regra 2 do CLAUDE.md: texto visível vive em src/copy/strings.ts.',
        },
      ],
    },
  },
  {
    // O epoch fixo da simulação é justamente o que substitui Date.now().
    files: ['src/engine/clock.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
)
