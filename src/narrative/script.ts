/**
 * O roteiro narrado — a camada que explica o protótipo para quem nunca viu.
 *
 * O modo de apresentação (`src/data/presentation.ts`) conduz QUEM APRESENTA:
 * pressupõe alguém falando por cima e leva a demonstração de tela em tela. Este
 * arquivo é outra coisa: conduz QUEM ASSISTE, sem intermediário. O critério é
 * que uma pessoa que nunca ouviu falar do projeto veja as quinze cenas sozinha e
 * consiga, no fim, dizer o que a plataforma faz e o que faz cada agente.
 *
 * REGRA DE ESCRITA DOS BULLETS. Frase curta. Nada de jargão de SAP sem
 * explicação junto, nada de palavra inventada. "Lê os arquivos que chegaram e
 * mede o estado de cada campo" — não "executa profiling multidimensional". Os
 * termos preservados do glossário aparecem, mas sempre com o que eles são dito
 * ao lado na primeira vez.
 *
 * ESTA CAMADA NÃO TOCA EM NADA. Não altera tela, motor, fixture nem dado: lê o
 * que já existe e narra por cima. O único ponto de contato com as telas é o
 * campo `destaque`, um seletor do elemento a iluminar.
 */
import { PARAM_REGRA, paths } from '@/app/paths'
import type { AgentName } from '@/data/agents'
import { CASO_FORNECEDOR } from '@/data/record-cases'
import { REGRA_CANDIDATA } from '@/data/candidate-hypothesis'
import { NIVEIS, REGRA_DA_CORRECAO, type NivelDeEstado } from '@/data/presentation'

/** Os cinco atos. O ato é o que o espectador está aprendendo naquele trecho. */
export const atos = ['abertura', 'agentes', 'esteira', 'momentos', 'fechamento'] as const
export type AtoId = (typeof atos)[number]

export const rotuloDoAto: Readonly<Record<AtoId, string>> = {
  abertura: 'O problema',
  agentes: 'Os agentes',
  esteira: 'A esteira',
  momentos: 'Os dois momentos',
  fechamento: 'O aceite',
}

/**
 * O cartão do agente. Responde as quatro perguntas que a tabela de Mission
 * Control não responde: o que faz, o que recebe, o que entrega, quem assina.
 *
 * O nome do revisor sai de `src/data/agents.ts` — não é repetido aqui, para não
 * haver duas verdades sobre quem responde por cada agente.
 */
export interface CartaoDeAgente {
  readonly especialidade: string
  readonly oQueFaz: string
  readonly recebe: string
  readonly entrega: string
}

export interface Cena {
  readonly n: number
  readonly id: string
  readonly ato: AtoId
  readonly titulo: string
  /** Dois a três. Frase curta, em português de quem não conhece migração de SAP. */
  readonly bullets: readonly string[]
  /** Rota da tela que fica ao fundo. */
  readonly path: string
  /**
   * Seletor do elemento a destacar na tela de fundo. `null` quando a cena fala
   * da tela inteira e iluminar um pedaço só atrapalharia.
   */
  readonly destaque: string | null
  /** O que dizer se alguém perguntar. Não vai para a tela do cliente. */
  readonly notaDoApresentador: string
  /** Preenchido nas sete cenas de agente. */
  readonly agente?: AgentName
  readonly cartao?: CartaoDeAgente
  /**
   * Estado que a onda precisa ter para a cena mostrar o que ela afirma.
   *
   * A cena 11 fala de um registro atravessando os nove passos: com a esteira
   * parada no passo 3, a trilha está pela metade e a cena mente. A preparação
   * assina exatamente o que um humano assinaria, pela API pública da store —
   * o mesmo caminho que as telas usam.
   */
  readonly nivel: NivelDeEstado
  /** Tempo de leitura no modo automático, em segundos. */
  readonly duracao: number
}

export const cenas: readonly Cena[] = [
  // ============================================================ ABERTURA
  {
    n: 1,
    id: 'problema',
    ato: 'abertura',
    titulo: 'Quatro empresas, quatro cadastros, um sistema só',
    bullets: [
      'A Verene comprou quatro empresas. Cada uma tem o próprio sistema antigo e o próprio jeito de cadastrar fornecedor, material e contrato.',
      'Tudo isso precisa entrar no sistema novo da Verene — e duas vezes: uma de ensaio, outra pra valer, na virada.',
      'São 2.080 registros em 48 pacotes de carga. Registro errado não dá erro na hora: aparece meses depois, no fechamento fiscal.',
    ],
    path: paths.missionControl,
    destaque: '[data-cena="grade-pacotes"]',
    notaDoApresentador:
      'A grade é derivada do escopo, não digitada: seis objetos × quatro empresas × dois ciclos. Se perguntarem por que pedidos, requisições e estoque estão como "não iniciado": não há extrato desses três ainda, e declarar estado de dado que não existe seria inventar.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 2,
    id: 'cadeia',
    ato: 'abertura',
    titulo: 'Três partes, e onde a Monoda está',
    bullets: [
      'Quem produziu o dado é a Verene, nos sistemas das empresas compradas. Dado que chega errado de lá continua sendo dela.',
      'Quem recebe o dado é o sistema novo, configurado pela Verene junto com o integrador. O que ele exige fora do padrão é decisão dela.',
      'A Monoda fica no meio e responde pela travessia: a regra que move o dado de um lado para o outro. Nos outros três casos ela detecta, evidencia e encaminha — não responde pelo defeito.',
    ],
    path: paths.reconciliation,
    destaque: '[data-cena="defeitos-por-origem"]',
    notaDoApresentador:
      'Esta é a conversa que consome projeto de migração: não "tem defeito?", mas "de quem é este defeito?". A taxonomia é acordada antes, e por isso a tela separa visualmente o que é da Monoda do que é de terceiros.',
    nivel: NIVEIS.duplicatas,
    duracao: 36,
  },
  {
    n: 3,
    id: 'kepler',
    ato: 'abertura',
    titulo: 'O que é a KEPLER',
    bullets: [
      'A regra de negócio vive num lugar só, versionada, e os agentes a executam — nenhum agente decide por conta própria.',
      'Toda decisão que a máquina não pode tomar sozinha para numa fila, com uma pessoa de nome e sobrenome do lado.',
      'No fim, cada campo de cada registro tem a trilha inteira: de onde veio o valor, que regra o mudou, em que versão da regra.',
    ],
    path: `${paths.recordBase}/${CASO_FORNECEDOR}`,
    destaque: '[data-cena="trilha"]',
    notaDoApresentador:
      'Uma frase só, se precisar resumir: a KEPLER é a esteira que leva o dado do sistema antigo ao novo com a regra escrita fora do código e a decisão humana onde ela é obrigatória.',
    nivel: NIVEIS.excecoes,
    duracao: 32,
  },

  // ============================================================ AGENTES
  {
    n: 4,
    id: 'vega',
    ato: 'agentes',
    agente: 'VEGA',
    titulo: 'VEGA recebe e mede',
    cartao: {
      especialidade: 'Recepção e perfilagem',
      oQueFaz: 'Lê os arquivos que chegaram e mede o estado de cada campo.',
      recebe: 'Os arquivos de extração das quatro empresas.',
      entrega: 'O recibo do que chegou de fato e o mapa do que está errado.',
    },
    bullets: [
      'Conta os registros do arquivo e compara com o número que o fornecedor da extração declarou. Quando não bate, o recibo sai com ressalva.',
      'Mede campo a campo: quantos vieram em branco, quantos vieram num formato diferente do resto, quantos têm número que não fecha.',
      'Não corrige nada. Só registra o que existe — corrigir calado aqui seria assumir a autoria do número.',
    ],
    path: paths.missionControl,
    destaque: '[data-cena="recebimento"]',
    notaDoApresentador:
      'A contagem e a impressão digital do arquivo são calculadas do conteúdo, não repetidas do que o vendor disse. É isso que faz o recibo valer alguma coisa.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 5,
    id: 'lyra',
    ato: 'agentes',
    agente: 'LYRA',
    titulo: 'LYRA lê o sistema de destino',
    cartao: {
      especialidade: 'Mapeamento contra o tenant',
      oQueFaz: 'Monta o de-para campo a campo contra a configuração que está ligada hoje no sistema novo.',
      recebe: 'Os campos do sistema antigo e a configuração ativa do sistema novo.',
      entrega: 'O dicionário de mapeamento e a lista de onde a Verene fez diferente do padrão.',
    },
    bullets: [
      'Não mapeia contra o SAP de fábrica: mapeia contra o que está ativo no sistema da Verene hoje.',
      'Onde a Verene configurou algo fora do padrão, a divergência aparece nomeada. É aí que a carga costuma quebrar — e sempre tarde.',
      'Nenhuma conversão roda antes de o de-para ser aprovado por duas pessoas.',
    ],
    path: paths.mapping,
    destaque: '[data-cena="dicionario"]',
    notaDoApresentador:
      'A coluna do domínio de valor é lida da configuração viva. Não existe tabela paralela mantida à mão — há teste garantindo que toda regra, todo domínio e toda divergência citados existem de fato.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 6,
    id: 'atlas',
    ato: 'agentes',
    agente: 'ATLAS',
    titulo: 'ATLAS converte e agrupa',
    cartao: {
      especialidade: 'Transformação e deduplicação',
      oQueFaz: 'Converte cada valor para o formato do destino e agrupa os cadastros que são a mesma empresa.',
      recebe: 'Os registros mapeados e as regras de conversão publicadas.',
      entrega: 'Os valores convertidos e os grupos de duplicata, com o racional de cada um.',
    },
    bullets: [
      'Acha o mesmo fornecedor cadastrado em mais de uma das empresas compradas, com a razão social escrita de jeitos diferentes.',
      'Propõe qual dos cadastros sobrevive e mostra os sinais que sustentam a proposta, um a um, com o peso de cada um.',
      'Não funde nada sozinho. Quem junta dois cadastros é uma pessoa, e o código aposentado continua visível depois.',
    ],
    path: paths.duplicates,
    destaque: '[data-cena="clusters"]',
    notaDoApresentador:
      'O número que aparece como score é a soma dos pesos dos sinais que conferem — não um número solto de um modelo. Abrir um cluster mostra os sinais somando.',
    nivel: NIVEIS.mapeamento,
    duracao: 36,
  },
  {
    n: 7,
    id: 'nova',
    ato: 'agentes',
    agente: 'NOVA',
    titulo: 'NOVA preenche o que tem como preencher',
    cartao: {
      especialidade: 'Enriquecimento e validação',
      oQueFaz: 'Completa o que dá para completar com fonte de referência e valida o resto contra as regras do negócio.',
      recebe: 'Os registros convertidos e as tabelas de referência.',
      entrega: 'Os valores propostos com a fonte anexada, e a fila de exceções com dono e prazo.',
    },
    bullets: [
      'Quando falta o código do município, busca na tabela do IBGE e anexa a linha que sustenta o valor.',
      'Onde não há fonte que sustente o valor, não propõe nada — e escreve na tela por quê. É o caso do CNAE.',
      'O que não passa na validação fica retido, com o motivo e a pessoa a quem foi encaminhado.',
    ],
    path: paths.exceptions,
    destaque: '[data-cena="enriquecimento"]',
    notaDoApresentador:
      'Não existe "aplicar valor padrão" em lugar nenhum desta tela, de propósito. Preencher por padrão é exatamente o que produz base suja com aparência de limpa.',
    nivel: NIVEIS.duplicatas,
    duracao: 36,
  },
  {
    n: 8,
    id: 'orion',
    ato: 'agentes',
    agente: 'ORION',
    titulo: 'ORION monta o pacote',
    cartao: {
      especialidade: 'Empacotamento',
      oQueFaz: 'Gera o arquivo de carga a partir dos registros aprovados, e só deles.',
      recebe: 'Os registros com decisão humana registrada.',
      entrega: 'O arquivo, a divisão em partes e o cabeçalho que identifica o conteúdo.',
    },
    bullets: [
      'Carimba no cabeçalho a versão da regra e uma impressão digital do conteúdo. É isso que prova, depois da carga, qual regra gerou qual registro.',
      'Divide o pacote pelos dois limites da ferramenta de carga: tamanho do arquivo e número de registros por lote.',
      'Confere tamanho de campo, formato e obrigatoriedade antes de entregar. Liberar uma exceção não lava o dado.',
    ],
    path: paths.packages,
    destaque: '[data-cena="manifest"]',
    notaDoApresentador:
      'O arquivo é gerado dos registros de fato, não é texto de exemplo. O tamanho por registro é medido nele, e a divisão em partes é aritmética sobre esse número.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 9,
    id: 'sirius',
    ato: 'agentes',
    agente: 'SIRIUS',
    titulo: 'SIRIUS fecha a conta',
    cartao: {
      especialidade: 'Reconciliação',
      oQueFaz: 'Confere que o que entrou é igual ao que saiu, mais o que ficou retido.',
      recebe: 'A contagem da origem e o resultado do destino.',
      entrega: 'A reconciliação com toda diferença explicada e o registro de defeitos por origem.',
    },
    bullets: [
      'Reconcilia por contagem e, onde há dinheiro envolvido, também por valor.',
      'Toda diferença vem com a causa nomeada. Diferença sem explicação é registro perdido que ninguém procurou.',
      'Separa os defeitos por origem, para a conversa de responsabilidade não virar negociação no fim do projeto.',
    ],
    path: paths.reconciliation,
    destaque: '[data-cena="contagem"]',
    notaDoApresentador:
      'Valor só aparece onde há montante: contratos. Fornecedor é cadastro e não tem valor — inventar um para preencher a tela seria número que não sobrevive a uma pergunta.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 10,
    id: 'kanon',
    ato: 'agentes',
    agente: 'KANON',
    titulo: 'KANON guarda a regra',
    cartao: {
      especialidade: 'Governança do playbook',
      oQueFaz: 'Publica e sela a versão das regras, e é o único caminho por onde um agente chega a uma regra.',
      recebe: 'As regras escritas, com dono e justificativa.',
      entrega: 'A versão selada, a documentação gerada dela e a recusa de tudo que não estiver publicado.',
    },
    bullets: [
      'Não ocupa passo nenhum da esteira. Cuida da regra, o tempo todo.',
      'Recusa três coisas: regra que não está publicada naquela versão, regra ainda não aprovada por um humano, e regra de um agente pedida por outro.',
      'Corrigir uma regra não é editar código: é publicar uma redação nova numa versão nova, e a trilha antiga continua válida.',
    ],
    path: paths.playbook,
    destaque: '[data-cena="selo"]',
    notaDoApresentador:
      'É por construção, não por disciplina: a esteira inteira só altera registro através de um único ponto, e esse ponto passa por aqui. Sem isso, "os agentes seguem o playbook" seria promessa.',
    nivel: NIVEIS.nada,
    duracao: 36,
  },

  // ============================================================ ESTEIRA
  {
    n: 11,
    id: 'esteira',
    ato: 'esteira',
    titulo: 'Um registro atravessando os nove passos',
    bullets: [
      'Este fornecedor chegou, foi medido, mapeado, convertido, comparado com os outros, completado, validado, empacotado e conferido.',
      'Cada linha da trilha diz qual regra tocou o campo, em que versão e em que instante. O identificador da regra abre a regra.',
      'É isso que permite responder, seis meses depois da carga: por que este campo está com este valor?',
    ],
    path: `${paths.recordBase}/${CASO_FORNECEDOR}`,
    destaque: '[data-cena="trilha"]',
    notaDoApresentador:
      'A linha de contrato roda pela mesma esteira, com o mesmo guarda — é o objeto com mais regra por registro do escopo. Se a esteira atende esse, atende os fáceis.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 12,
    id: 'checkpoints',
    ato: 'esteira',
    titulo: 'Quatro vezes em que a máquina para e espera',
    bullets: [
      'Depois do mapeamento: duas assinaturas distintas, a aprovação técnica e a do dono do dado. Uma não substitui a outra.',
      'Depois da deduplicação: cada grupo de duplicata é confirmado um a um. Não existe aprovação em lote.',
      'Depois da validação: cada exceção recebe decisão humana. E, no fim, o pacote e a conta final.',
    ],
    path: paths.gates,
    destaque: '[data-cena="gates-rail"]',
    notaDoApresentador:
      'Não é atrito de interface: sem a assinatura o passo seguinte nem roda, e a tela mostra a esteira parada. É o mesmo motor que move o resto.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },

  // ============================================================ MOMENTOS
  {
    n: 13,
    id: 'velocidade',
    ato: 'momentos',
    titulo: 'Defeito achado na sexta, reenviado na sexta',
    bullets: [
      'A regra que encurta o nome longo do fornecedor estava cortando no meio da palavra.',
      'O defeito não é do dado: é da regra. Aprovar o registro assim só carimbaria o corte errado.',
      'Corrige-se a regra, publica-se uma versão nova, e a onda inteira é refeita — em minutos, não numa nova rodada de extração.',
    ],
    path: `${paths.playbook}?${PARAM_REGRA}=${REGRA_DA_CORRECAO}`,
    destaque: '[data-cena="correcao"]',
    notaDoApresentador:
      'Quem encontrou o corte errado foi outra regra, de outro agente, independente da que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.',
    nivel: NIVEIS.excecoes,
    duracao: 38,
  },
  {
    n: 14,
    id: 'contencao',
    ato: 'momentos',
    titulo: 'O limite honesto da tecnologia',
    bullets: [
      'Duas pessoas prestam serviço para mais de uma das empresas compradas, com o mesmo documento — e o imposto retido é diferente em cada uma.',
      'O agente mostra os registros, a frequência e a hipótese do que explicaria isso. E para.',
      'Um agente consegue evidenciar que uma regra provavelmente existe. Ele não consegue confirmar que a regra está correta.',
    ],
    path: paths.candidate,
    destaque: '[data-cena="evidencia-candidata"]',
    notaDoApresentador: `Confirmar não executa a regra: ${REGRA_CANDIDATA} continua sendo proposta, e promover é ato de governança numa versão nova. Este é o momento que mais compra confiança — não corra.`,
    nivel: NIVEIS.excecoes,
    duracao: 38,
  },

  // ============================================================ FECHAMENTO
  {
    n: 15,
    id: 'aceite',
    ato: 'fechamento',
    titulo: 'O que foi combinado, medido',
    bullets: [
      'Quatro critérios de aceite, cada um medido num ponto definido do projeto, com a frase de como o número foi obtido ao lado.',
      'Oito pontos de decisão. Cada um aprova um documento nomeado, e o seguinte não abre enquanto o anterior não estiver assinado.',
      'Cada assinatura registra quem, quando e sobre qual versão de regra. Sem a versão, "revisado e aprovado" não diz o que foi revisado.',
    ],
    path: paths.reconciliation,
    destaque: '[data-cena="placar"]',
    notaDoApresentador:
      'Os dois critérios de defeito medem apenas a origem pela qual a Monoda responde. Defeito das outras três origens tem dono nomeado e conta na conversa com esse dono, não aqui.',
    nivel: NIVEIS.carga,
    duracao: 34,
  },
]

export const TOTAL_DE_CENAS = cenas.length

/** Duração do roteiro narrado no modo automático, em segundos. */
export const DURACAO_NARRADA = cenas.reduce((acc, c) => acc + c.duracao, 0)

export const cenaPorNumero = (n: number): Cena =>
  cenas.find((c) => c.n === n) ?? (cenas[0] as Cena)

/** Cenas de um ato, para a barra de progresso agrupar. */
export const cenasDoAto = (ato: AtoId): readonly Cena[] => cenas.filter((c) => c.ato === ato)
