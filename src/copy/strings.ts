/**
 * Todo texto visível ao usuário vive aqui (regra 2 do CLAUDE.md).
 *
 * Nenhum componente em `src/` pode conter string literal renderizada em JSX.
 * Termos em inglês usados abaixo vêm de `glossary.ts` e não são traduzidos.
 */

export const strings = {
  app: {
    name: 'KEPLER',
    provider: 'Monoda Consulting Group',
    client: 'Verene Energia',
    descriptor: 'Plataforma agêntica de dados',
  },
  screens: {
    home: {
      wordmark: 'KEPLER',
    },
  },
} as const

export type Strings = typeof strings
