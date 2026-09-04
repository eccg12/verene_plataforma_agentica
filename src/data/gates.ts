/**
 * Os Gates do projeto.
 *
 * Gate é ponto de DECISÃO, não reunião de status. Três coisas fazem a diferença
 * e estão modeladas aqui:
 *
 * 1. Cada Gate aprova um ARTEFATO nomeado — não "a etapa", não "o andamento".
 * 2. A entrada de um Gate é RECUSADA enquanto o artefato do Gate anterior não
 *    estiver assinado. Recusa não é atraso: é o Gate não acontecer.
 * 3. Cada assinatura registra quem, quando e SOBRE QUAL VERSÃO DE PLAYBOOK. Sem
 *    a versão, "revisado e assinado" não diz o que foi revisado.
 *
 * G1 a G4 correspondem aos quatro checkpoints da esteira. G0 é a linha de base
 * anterior à primeira execução, G5 é a carga (executada fora da esteira, pela
 * Verene), G6 é a assinatura da reconciliação e G7 o aceite da onda.
 */
import { paths } from '@/app/paths'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import type { CheckpointId, Signature, StepId } from '@/engine/pipeline'

export const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'] as const
export type GateId = (typeof gateIds)[number]

/** O artefato que cada Gate aprova. É ele que fica assinado — ou não fica. */
export const artefatoIds = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'] as const
export type ArtefatoId = (typeof artefatoIds)[number]

export interface Artefato {
  readonly id: ArtefatoId
  readonly nome: string
  /** O Gate que assina este artefato. Relação 1:1 — artefato sem Gate não existe. */
  readonly gate: GateId
}

/**
 * Evidência entregue ao Gate. `path` aponta para a tela onde ela vive: evidência
 * que não dá para abrir na hora não é evidência, é afirmação.
 */
export interface EvidenciaDeGate {
  readonly id: string
  readonly titulo: string
  readonly descricao: string
  readonly path: string
  /**
   * Passo da esteira que produz esta evidência. `null` = a evidência existe fora
   * da esteira (fixture de recepção, calendário de carga, configuração do tenant).
   */
  readonly produzidaPor: StepId | null
}

/** Quem assina. A área resolve o nome em `owners.ts` — Gate sem pessoa não é Gate. */
export interface Assinante {
  readonly area: string
  readonly oQueAssina: string
}

export interface Gate {
  readonly id: GateId
  readonly n: number
  readonly nome: string
  readonly descricao: string
  /** Quando o Gate ocorre no projeto. */
  readonly quandoOcorre: string
  /** O que exatamente é aprovado — o objeto da decisão. */
  readonly oQueEAprovado: string
  readonly artefato: Artefato
  /**
   * Artefato que precisa estar assinado para o Gate abrir. `null` só no G0, que
   * não tem antecessor. Ausente a assinatura, a ENTRADA É RECUSADA.
   */
  readonly exigeArtefato: ArtefatoId | null
  readonly evidencias: readonly EvidenciaDeGate[]
  readonly assinantes: readonly Assinante[]
  /** Checkpoint da esteira que corresponde a este Gate, quando houver. */
  readonly checkpoint: CheckpointId | null
  /**
   * `true` quando a assinatura é dada nesta tela. Os checkpoints da esteira são
   * assinados onde a evidência é revisada — o Gate mostra a trilha e leva até lá.
   */
  readonly assinaturaNoGate: boolean
}

export const gates: readonly Gate[] = [
  {
    id: 'G0', n: 0, nome: 'Linha de base da onda', checkpoint: null, assinaturaNoGate: false,
    descricao:
      'A onda só abre com escopo declarado, extrato recebido e conferido, e playbook selado. Sem os três, não há contra o que medir nada depois.',
    quandoOcorre: 'Na abertura da onda, antes da primeira execução da esteira.',
    oQueEAprovado:
      'O escopo declarado em pacotes e volumes, o recibo do extrato recebido do Nasajon e a versão selada do playbook que vai reger a onda.',
    artefato: { id: 'A0', nome: 'Escopo declarado, recibo de recepção e playbook selado', gate: 'G0' },
    exigeArtefato: null,
    evidencias: [
      {
        id: 'E0-1', titulo: 'Escopo declarado', path: paths.missionControl, produzidaPor: null,
        descricao: 'Objetos, SPEs, ciclos e volume de referência. É o denominador de todo percentual medido nos Gates seguintes.',
      },
      {
        id: 'E0-2', titulo: 'Recibo de recepção do extrato', path: paths.missionControl, produzidaPor: 'receive',
        descricao: 'Contagem e fingerprint calculados do conteúdo recebido, não repetidos do que o fornecedor declarou.',
      },
      {
        id: 'E0-3', titulo: 'Playbook selado com checksum', path: paths.playbook, produzidaPor: null,
        descricao: 'A versão que os agentes vão executar, com checksum. Mudança de regra sobe versão e reabre este Gate.',
      },
    ],
    assinantes: [
      { area: 'Verene · Data owner', oQueAssina: 'Escopo e recibo do extrato' },
      { area: 'Monoda · Governança', oQueAssina: 'Selo da versão do playbook' },
    ],
  },
  {
    id: 'G1', n: 1, nome: 'Mapeamento aprovado', checkpoint: 'mapeamento', assinaturaNoGate: false,
    descricao:
      'O de-para contra o tenant vivo está aprovado tecnicamente e assinado. Nenhuma transformação roda antes disto.',
    quandoOcorre: 'Depois do passo 3 (MAP), antes de qualquer transformação.',
    oQueEAprovado:
      'O dicionário campo a campo contra a configuração ativa do tenant, com as divergências do padrão SAP declaradas uma a uma.',
    artefato: { id: 'A1', nome: 'Dicionário de mapeamento aprovado', gate: 'G1' },
    exigeArtefato: 'A0',
    evidencias: [
      {
        id: 'E1-1', titulo: 'Dicionário de mapeamento', path: paths.mapping, produzidaPor: 'map',
        descricao: 'Campo de origem, campo de destino, domínio de valor lido do tenant e a regra do playbook que faz a conversão.',
      },
      {
        id: 'E1-2', titulo: 'Divergências do padrão SAP', path: paths.mapping, produzidaPor: null,
        descricao: 'O que no tenant da Verene não é SAP padrão. Mapear contra o padrão em vez do tenant é o erro que só aparece na carga.',
      },
    ],
    assinantes: [
      { area: 'Monoda · Arquitetura S/4HANA', oQueAssina: 'Aprovação técnica do de-para' },
      { area: 'Verene · Data owner', oQueAssina: 'Assinatura do de-para no Gate' },
    ],
  },
  {
    id: 'G2', n: 2, nome: 'Transformação concluída', checkpoint: 'duplicatas', assinaturaNoGate: false,
    descricao:
      'Todos os registros do escopo atravessaram os passos de transformação e deduplicação, com cada cluster confirmado individualmente.',
    quandoOcorre: 'Depois do passo 5 (DEDUPLICATE), com cada cluster de duplicata decidido um a um.',
    oQueEAprovado:
      'O resultado da deduplicação: quais cadastros são a mesma entidade, qual sobrevive e qual código é aposentado com cross-reference.',
    artefato: { id: 'A2', nome: 'Registro de deduplicação decidido', gate: 'G2' },
    exigeArtefato: 'A1',
    evidencias: [
      {
        id: 'E2-1', titulo: 'Fila de duplicatas com racional do match', path: paths.duplicates, produzidaPor: 'deduplicate',
        descricao: 'Sinal a sinal, com o peso de cada um. O score é a soma dos pesos que conferem, não um número solto.',
      },
      {
        id: 'E2-2', titulo: 'Rastreabilidade em nível de campo', path: `${paths.recordBase}/F1001`, produzidaPor: 'transform',
        descricao: 'Valor de origem, cada regra aplicada com id e versão, e o valor final. É o que sustenta "100% transformados".',
      },
    ],
    assinantes: [{ area: 'Verene · Suprimentos', oQueAssina: 'Cada cluster de duplicata, um a um' }],
  },
  {
    id: 'G3', n: 3, nome: 'Validação concluída', checkpoint: 'excecoes', assinaturaNoGate: false,
    descricao: 'Toda exceção aberta recebeu decisão humana. Não há registro pendente sem dono.',
    quandoOcorre: 'Depois do passo 7 (VALIDATE), com decisão humana em cada exceção aberta.',
    oQueEAprovado:
      'A decisão de cada exceção: liberada com evidência anexada, ou mantida retida com dono nomeado e prazo. Nada é defaultado para o lote passar.',
    artefato: { id: 'A3', nome: 'Registro de exceções decididas', gate: 'G3' },
    exigeArtefato: 'A2',
    evidencias: [
      {
        id: 'E3-1', titulo: 'Fila de exceções com dono e prazo', path: paths.exceptions, produzidaPor: 'validate',
        descricao: 'Exceção técnica roteada ao SAP SME, exceção de negócio ao data owner. Cada uma com pessoa, prazo e estado.',
      },
      {
        id: 'E3-2', titulo: 'Enriquecimento com evidência anexada', path: paths.exceptions, produzidaPor: 'enrich',
        descricao: 'Cada valor proposto mostra a fonte que o sustenta. Onde não há fonte, não há proposta.',
      },
    ],
    assinantes: [{ area: 'Verene · Fiscal', oQueAssina: 'Cada exceção aberta, uma a uma' }],
  },
  {
    id: 'G4', n: 4, nome: 'Pacote aprovado', checkpoint: 'pacote-reconciliacao', assinaturaNoGate: true,
    descricao:
      'O pacote está íntegro, dentro do limite de tamanho, com manifest e checksum, e a simulação no Migration Cockpit passou.',
    quandoOcorre: 'Depois do passo 8 (PACKAGE), antes da entrega formal ao time de carga.',
    oQueEAprovado:
      'O pacote que vai para a carga: o XML gerado, a divisão em partes, o manifest com versão e checksum do playbook, e a simulação aprovada.',
    artefato: { id: 'A4', nome: 'Pacote, manifest e checksum', gate: 'G4' },
    exigeArtefato: 'A3',
    evidencias: [
      {
        id: 'E4-1', titulo: 'Manifest com versão e checksum do playbook', path: paths.packages, produzidaPor: 'package',
        descricao: 'É por aqui que se prova, depois da carga, qual versão de regra gerou qual registro.',
      },
      {
        id: 'E4-2', titulo: 'Conformidade e divisão do pacote', path: paths.packages, produzidaPor: 'package',
        descricao: 'Tamanho de campo, formato, integridade referencial e obrigatoriedade do tenant, contra os dois tetos de arquivo.',
      },
      {
        id: 'E4-3', titulo: 'Simulação no Migration Cockpit', path: paths.packages, produzidaPor: null,
        descricao: 'Pacote que não passou na simulação não é entregue. O estado por objeto está declarado.',
      },
    ],
    assinantes: [{ area: 'Verene · Data owner', oQueAssina: 'Liberação do pacote para carga' }],
  },
  {
    id: 'G5', n: 5, nome: 'Carga executada', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'A carga rodou no tenant, na janela acordada. Fora da esteira: quem executa é o time de carga da Verene.',
    quandoOcorre: 'Na janela de carga acordada, depois da entrega formal do pacote.',
    oQueEAprovado:
      'O registro da execução: qual pacote entrou, em que janela, e o resultado devolvido pelo Migration Cockpit.',
    artefato: { id: 'A5', nome: 'Registro de execução da carga', gate: 'G5' },
    exigeArtefato: 'A4',
    evidencias: [
      {
        id: 'E5-1', titulo: 'Entrega formal e calendário acordado', path: paths.packages, produzidaPor: null,
        descricao: 'Destinatário, escopo declarado, exceções conhecidas e janela. É o documento que responde depois a "isto foi combinado?".',
      },
    ],
    assinantes: [{ area: 'Verene · Basis', oQueAssina: 'Execução da carga no tenant' }],
  },
  {
    id: 'G6', n: 6, nome: 'Reconciliação assinada', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'Origem e destino fecham em contagem e em valor, com toda diferença explicada e verificada nos apps Fiori.',
    quandoOcorre: 'Depois da carga, com origem e destino conferidos no tenant.',
    oQueEAprovado:
      'A reconciliação origem × destino, com cada diferença explicada, e o registro de defeitos separado por origem e dono contratual.',
    artefato: { id: 'A6', nome: 'Reconciliação origem × destino', gate: 'G6' },
    exigeArtefato: 'A5',
    evidencias: [
      {
        id: 'E6-1', titulo: 'Reconciliação por contagem e por valor', path: paths.reconciliation, produzidaPor: 'reconcile',
        descricao: 'Quebrada por objeto e por SPE. Diferença sem causa nomeada é registro perdido que ninguém procurou.',
      },
      {
        id: 'E6-2', titulo: 'Verificação guiada nos apps Fiori', path: paths.reconciliation, produzidaPor: null,
        descricao: 'Contagem prova que o número fecha; não prova que o registro está certo. A verificação no app fecha essa lacuna.',
      },
    ],
    assinantes: [{ area: 'Verene · Data owner', oQueAssina: 'Reconciliação e registro de defeitos' }],
  },
  {
    id: 'G7', n: 7, nome: 'Aceite da onda', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'O aceite formal da onda, medido contra os critérios contratados — não contra a impressão de que correu bem.',
    quandoOcorre: 'No encerramento da onda, depois da reconciliação assinada.',
    oQueEAprovado:
      'Os quatro critérios de aceite com o número medido em cada Gate, a documentação do playbook na versão da entrega e os defeitos remanescentes com dono.',
    artefato: { id: 'A7', nome: 'Termo de aceite da onda', gate: 'G7' },
    exigeArtefato: 'A6',
    evidencias: [
      {
        id: 'E7-1', titulo: 'Placar dos critérios de aceite', path: paths.reconciliation, produzidaPor: 'reconcile',
        descricao: 'Cada critério com o Gate onde é medido e a frase de como o número foi obtido.',
      },
      {
        id: 'E7-2', titulo: 'Documentação gerada do playbook', path: paths.playbook, produzidaPor: null,
        descricao: 'Montada a partir das próprias regras na versão da entrega. Documentação escrita à mão diverge do que rodou.',
      },
    ],
    assinantes: [
      { area: 'Verene · Data owner', oQueAssina: 'Aceite da onda' },
      { area: 'Monoda · Governança', oQueAssina: 'Encerramento e versão entregue' },
    ],
  },
]

export const gateById: Readonly<Record<GateId, Gate>> = Object.fromEntries(
  gates.map((g) => [g.id, g]),
) as Readonly<Record<GateId, Gate>>

/** Qual Gate assina qual artefato. Usado para nomear o motivo de uma recusa de entrada. */
export const gateDoArtefato: Readonly<Record<ArtefatoId, GateId>> = Object.fromEntries(
  gates.map((g) => [g.artefato.id, g.id]),
) as Readonly<Record<ArtefatoId, GateId>>

/**
 * Assinatura do G0, anterior à primeira execução da esteira.
 *
 * O extrato foi recebido em 05/01 e o playbook selado em 08/01; a linha de base
 * foi assinada em 09/01, três dias antes do epoch da simulação. É a condição de
 * partida da demonstração, não algo que a esteira produz — por isso é fixture.
 *
 * A versão é a do playbook vigente: se a versão corrente mudar, esta assinatura
 * não cobre a nova e o G0 volta a ficar sem artefato assinado.
 */
export const assinaturaDeBaseline: readonly Signature[] = [
  {
    by: 'Helena Duarte',
    role: 'Verene · Data owner',
    decision: 'approved',
    at: '2026-01-09T13:40:00.000Z',
    playbookVersion: PLAYBOOK_VERSION,
    note: 'Escopo e recibos de recepção conferidos contra o conteúdo dos arquivos.',
  },
  {
    by: 'Patrícia Lemos',
    role: 'Monoda · Governança',
    decision: 'approved',
    at: '2026-01-09T14:05:00.000Z',
    playbookVersion: PLAYBOOK_VERSION,
    note: 'Playbook selado. Alteração de regra a partir daqui sobe versão e reabre o Gate.',
  },
]

/** Como cada critério de aceite é medido, e em que Gate. */
export type TipoCriterio = 'percentual-minimo' | 'contagem-maxima' | 'percentual-maximo'

export interface CriterioAceite {
  readonly id: string
  readonly nome: string
  readonly descricao: string
  readonly gate: GateId
  readonly tipo: TipoCriterio
  /** Alvo numérico: 100 para percentual mínimo, 0 para contagem máxima, 5 para teto percentual. */
  readonly alvo: number
  readonly unidade: string
  /** Escopo da medição: `transformation` mede só o que é responsabilidade da Monoda. */
  readonly escopo: 'todos-os-registros' | 'defeitos-de-transformacao'
}

export const criteriosDeAceite: readonly CriterioAceite[] = [
  {
    id: 'CA-01', nome: '100% dos registros transformados', gate: 'G2',
    descricao: 'Todo registro do escopo atravessou a transformação e a deduplicação. Registro que some entre a recepção e o pacote é o defeito mais caro de achar depois.',
    tipo: 'percentual-minimo', alvo: 100, unidade: '%', escopo: 'todos-os-registros',
  },
  {
    id: 'CA-02', nome: '100% dos registros validados', gate: 'G3',
    descricao: 'Todo registro passou pela validação contra as regras de negócio e os campos obrigatórios do tenant, com decisão humana em cada exceção.',
    tipo: 'percentual-minimo', alvo: 100, unidade: '%', escopo: 'todos-os-registros',
  },
  {
    id: 'CA-03', nome: 'Zero defeito crítico de transformação', gate: 'G4',
    descricao: 'Defeito crítico de origem "transformation" é responsabilidade da Monoda e o teto é zero. Defeito das outras três origens não conta aqui — conta na conversa com o dono dele.',
    tipo: 'contagem-maxima', alvo: 0, unidade: 'defeitos', escopo: 'defeitos-de-transformacao',
  },
  {
    id: 'CA-04', nome: 'Até 5% de defeito não crítico de transformação', gate: 'G6',
    descricao: 'Teto de 5% sobre os registros processados, medido só sobre a origem "transformation". É o único bucket pelo qual a Monoda responde.',
    tipo: 'percentual-maximo', alvo: 5, unidade: '%', escopo: 'defeitos-de-transformacao',
  },
]
