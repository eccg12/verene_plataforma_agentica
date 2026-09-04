/**
 * Os Gates do projeto.
 *
 * Gate é ponto de medição contratual, não reunião. Cada critério de aceite é
 * medido em um Gate específico, e é lá que a evidência tem que existir — não
 * depois, não "no fechamento".
 *
 * G1 a G4 correspondem aos quatro checkpoints da esteira. G5 é a execução da
 * carga, que acontece fora dela. G6 é a assinatura da reconciliação.
 */
import type { CheckpointId } from '@/engine/pipeline'

export const gateIds = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'] as const
export type GateId = (typeof gateIds)[number]

export interface Gate {
  readonly id: GateId
  readonly nome: string
  readonly descricao: string
  /** Checkpoint da esteira que corresponde a este Gate, quando houver. */
  readonly checkpoint: CheckpointId | null
  readonly assinaPor: string
}

export const gates: readonly Gate[] = [
  {
    id: 'G1', nome: 'Mapeamento aprovado', checkpoint: 'mapeamento',
    descricao: 'O de-para contra o tenant vivo está aprovado tecnicamente e assinado. Nenhuma transformação roda antes disto.',
    assinaPor: 'SAP SME e data owner da Verene',
  },
  {
    id: 'G2', nome: 'Transformação concluída', checkpoint: 'duplicatas',
    descricao: 'Todos os registros do escopo atravessaram os passos de transformação e deduplicação, com cada cluster confirmado individualmente.',
    assinaPor: 'Verene · Suprimentos',
  },
  {
    id: 'G3', nome: 'Validação concluída', checkpoint: 'excecoes',
    descricao: 'Toda exceção aberta recebeu decisão humana. Não há registro pendente sem dono.',
    assinaPor: 'Verene · Fiscal e data owner',
  },
  {
    id: 'G4', nome: 'Pacote aprovado', checkpoint: 'pacote-reconciliacao',
    descricao: 'O pacote está íntegro, dentro do limite de tamanho, com manifest e checksum, e a simulação no Migration Cockpit passou.',
    assinaPor: 'Verene · Data owner',
  },
  {
    id: 'G5', nome: 'Carga executada', checkpoint: null,
    descricao: 'A carga rodou no tenant, na janela acordada. Fora da esteira: quem executa é o time de carga.',
    assinaPor: 'Verene · Basis',
  },
  {
    id: 'G6', nome: 'Reconciliação assinada', checkpoint: null,
    descricao: 'Origem e destino fecham em contagem e em valor, com toda diferença explicada e verificada nos apps Fiori.',
    assinaPor: 'Verene · Data owner',
  },
]

export const gateById: Readonly<Record<GateId, Gate>> = Object.fromEntries(
  gates.map((g) => [g.id, g]),
) as Readonly<Record<GateId, Gate>>

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
