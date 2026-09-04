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
    styleguide: {
      title: 'Design system',
      subtitle: 'Tokens, superfícies e componentes do KEPLER',
      surfaceLabel: 'Superfície',
      surfaceInk: 'Escura (cockpit)',
      surfacePaper: 'Clara (documento)',
      sections: {
        palette: 'Paleta base',
        paletteNote:
          'Os nove valores do deck Galaxy. Imutáveis: componentes não usam estas cores diretamente, usam os tokens semânticos derivados delas.',
        semantic: 'Tokens semânticos',
        semanticNote:
          'Resolvem por superfície. verene-violet reprova sobre a superfície escura (2,36:1) e signal-green reprova sobre a clara (2,08:1) — por isso o token troca de valor, e não a regra de uso.',
        typography: 'Tipografia',
        typographyNote:
          'Jost, geométrica, substituta web da Century Gothic do deck. Números sempre tabulares.',
        buttons: 'Botões',
        badges: 'Estados',
        badgesNote: 'Matizes quentes e o neutro frio marcam situação. Sempre com rótulo — cor nunca é o único portador de significado.',
        defects: 'Origem de defeito',
        defectsNote:
          'Escala categórica em matizes frios, separada por matiz e por luminância. Distinta da escala de estado, que é quente.',
        table: 'Tabela densa',
        tableNote: 'Linha de 28px, números tabulares, alinhamento à direita em toda coluna numérica.',
        logos: 'Logos',
        logosNote: 'Slots reservados. Os arquivos atuais são placeholders e seguem a cor da superfície.',
      },
      table: {
        columns: {
          object: 'Objeto',
          records: 'Registros',
          migrated: 'Migrados',
          defects: 'Defeitos',
          rate: 'Aderência',
          origin: 'Origem',
          state: 'Situação',
        },
      },
      typeSamples: {
        pageTitle: 'Título de tela',
        sectionTitle: 'Título de seção',
        body: 'Texto corrido em corpo de 13px, a medida padrão da interface.',
        small: 'Texto de apoio em 12px',
        label: 'RÓTULO EM 11PX',
        micro: 'MICRO 10PX',
        numerals: 'Numerais tabulares',
        // dois runs de mesmo comprimento: com tnum as colunas coincidem
        numeralsSampleA: '1234567890',
        numeralsSampleB: '1111111111',
      },
      buttonSamples: {
        primary: 'Executar playbook',
        secondary: 'Ver manifest',
        ghost: 'Cancelar',
        disabled: 'Indisponível',
      },
      swatch: {
        onInk: 'sobre escura',
        onPaper: 'sobre clara',
        contrast: 'contraste',
      },
    },
  },
  states: {
    signed: 'Assinado',
    held: 'Retido',
    exception: 'Exceção aberta',
    'pending-gate': 'Aguardando Gate',
  },
  defects: {
    'defect-source': 'Origem',
    'defect-transformation': 'Transformação',
    'defect-target-config': 'Configuração de destino',
    'defect-load': 'Carga',
  },
  brands: {
    verene: 'Verene Energia',
    monoda: 'Monoda Consulting Group',
  },
} as const

export type Strings = typeof strings
