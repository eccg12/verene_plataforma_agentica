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
  // Símbolos e separadores também são texto visível: entram aqui, não no JSX.
  simbolos: {
    porcento: '%',
    separador: ' · ',
  },
  shell: {
    projectTitle: 'GALAXY | Transformação de Dados',
    playbookLabel: 'playbook',
    cycleLabel: 'Ciclo',
    navLabel: 'Telas',
    skipToContent: 'Ir para o conteúdo',
  },
  nav: {
    missionControl: 'Mission Control',
    styleguide: 'Design system',
  },
  packageStates: {
    'nao-iniciado': 'Não iniciado',
    'em-processamento': 'Em processamento',
    retido: 'Retido',
    'aguardando-gate': 'Aguardando Gate',
    aprovado: 'Aprovado',
  },
  qualityDimensions: {
    completude: 'Completude',
    validade: 'Validade',
    unicidade: 'Unicidade',
    consistencia: 'Consistência',
    conformidade: 'Conformidade',
    precisao: 'Precisão',
  },
  agentActivity: {
    concluido: 'Concluído',
    'em-execucao': 'Em execução',
    bloqueado: 'Bloqueado',
    aguardando: 'Aguardando',
    continuo: 'Contínuo',
  },
  missionControl: {
    title: 'Mission Control',
    subtitle: 'Escopo, recebimento, qualidade e agentes em um lugar só',
    grid: {
      title: 'Pacotes de carga',
      note: 'Seis objetos, quatro SPEs, dois ciclos. Quarenta e oito pacotes — este é o escopo inteiro, não uma amostra. O número em cada célula é o volume previsto do pacote.',
      colObjeto: 'Objeto',
      colTotal: 'Volume',
      legenda: 'Estado',
      resumoPacotes: 'pacotes',
      resumoRegistros: 'registros no escopo',
    },
    waves: {
      title: 'Plano de ondas',
      note: 'A ordem não é arbitrária: documento transacional aponta para cadastro. Migrar fora de ordem é criar referência para o que ainda não existe.',
      objetosLabel: 'Objetos',
      dependenciaLabel: 'Por que nesta posição',
      volumeLabel: 'Volume',
      waveLabel: 'Wave',
    },
    defects: {
      title: 'Mapa de defeitos',
      note: 'Perfilagem do VEGA sobre o que já foi recebido. Taxa é defeitos por cem registros; um registro pode carregar mais de um defeito, então a taxa passa de cem quando a densidade é alta.',
      porObjeto: 'Por objeto',
      porDimensao: 'Por dimensão de qualidade',
      matriz: 'Objeto por dimensão',
      colObjeto: 'Objeto',
      colDimensao: 'Dimensão',
      colRegistros: 'Registros',
      colDefeitos: 'Defeitos',
      colTaxa: 'Taxa',
      colCriticos: 'Críticos',
      resumoPerfilados: 'registros perfilados',
      resumoDefeitos: 'defeitos',
      resumoCriticos: 'críticos',
      resumoTaxa: 'taxa geral',
    },
    intake: {
      title: 'Recebimento',
      note: 'Cada arquivo entregue pelo fornecedor de extração, com layout conferido, contagem lida do conteúdo e fingerprint. O recibo é emitido a partir do que foi lido, nunca do que foi declarado.',
      colArquivo: 'Arquivo',
      colSpe: 'SPE',
      colFormato: 'Formato',
      colLayout: 'Layout',
      colDeclarados: 'Declarados',
      colLidos: 'Lidos',
      colFingerprint: 'Fingerprint',
      colRecibo: 'Recibo',
      layoutOk: 'Validado',
      layoutDivergente: 'Divergente',
      reciboAceito: 'Aceito',
      reciboRessalva: 'Com ressalva',
      resumoArquivos: 'arquivos',
      resumoLayout: 'com layout validado',
      resumoContagem: 'com contagem divergente',
      resumoRegistros: 'registros lidos',
      emitidoPara: 'Recibo emitido a',
    },
    agents: {
      title: 'Agentes',
      note: 'Cada agente tem um revisor humano nomeado. Nenhum agente é accountable: quem assina é a pessoa.',
      revisorLabel: 'Revisor',
      regrasLabel: 'regras aplicadas',
      transversalLabel: 'Transversal — não ocupa passo',
    },
  },
} as const

export type Strings = typeof strings
