/**
 * Entrega formal ao time de carga.
 *
 * O pacote não é "mandado por e-mail": é entregue com escopo declarado, versão
 * de playbook, exceções conhecidas listadas uma a uma e calendário acordado. É
 * o documento que responde, depois, à pergunta "isto foi combinado?".
 *
 * A simulação no Migration Cockpit é pré-requisito da liberação: pacote que não
 * passou na simulação não é entregue, e o estado disso vive aqui.
 */

export type EstadoSimulacao = 'nao-executada' | 'aprovada' | 'reprovada'

export interface JanelaCarga {
  readonly ciclo: 'ciclo-1' | 'ciclo-2'
  readonly nome: string
  readonly inicio: string
  readonly fim: string
  readonly observacao: string
}

export interface DestinatarioEntrega {
  readonly parte: string
  readonly responsavel: string
  readonly papel: string
}

/** A quem o pacote é entregue para execução da carga. */
export const destinatarioDaCarga: DestinatarioEntrega = {
  parte: 'Verene · Basis',
  responsavel: 'Tiago Fontes',
  papel: 'Coordenador Basis — executa a carga no tenant',
}

export const calendarioAcordado: readonly JanelaCarga[] = [
  {
    ciclo: 'ciclo-1',
    nome: 'Janela do ciclo de teste',
    inicio: '2026-02-07',
    fim: '2026-02-09',
    observacao: 'Fim de semana, com o tenant de qualidade reservado. Reprocessamento permitido sem novo Gate.',
  },
  {
    ciclo: 'ciclo-2',
    nome: 'Janela do cutover de produção',
    inicio: '2026-03-13',
    fim: '2026-03-16',
    observacao: 'Cutover. Congelamento do Nasajon a partir de 12/03 às 18h. Reprocessamento exige novo Gate.',
  },
]

/**
 * Limite de tamanho por arquivo do Migration Cockpit. Pacote maior é dividido
 * em partes, e cada parte tem checksum próprio.
 */
export const LIMITE_ARQUIVO_MB = 100

/**
 * Tamanho de lote acima do qual o Migration Cockpit falha por timeout sem dizer
 * qual registro quebrou. Regra R-PKG-004.
 */
export const LIMITE_REGISTROS_POR_PARTE = 500

export interface SimulacaoCockpit {
  readonly objetoId: string
  readonly estado: EstadoSimulacao
  readonly executadaEm: string | null
  readonly registrosSimulados: number
  readonly mensagens: readonly string[]
}

/**
 * Estado da simulação por objeto. Só o que já foi empacotado tem simulação; o
 * resto não foi executado, e a tela diz isso em vez de mostrar verde.
 */
export const simulacoesCockpit: readonly SimulacaoCockpit[] = [
  {
    objetoId: 'fornecedores',
    estado: 'aprovada',
    executadaEm: '2026-01-19',
    registrosSimulados: 340,
    mensagens: [
      'Simulação sem erro de estrutura em 340 registros.',
      'Três avisos de campo opcional vazio (INSCRICAO_MUNICIPAL). Não bloqueiam.',
    ],
  },
  {
    objetoId: 'materiais-servicos',
    estado: 'reprovada',
    executadaEm: '2026-01-21',
    registrosSimulados: 95,
    mensagens: [
      'Quatro registros sem NCM rejeitados na simulação: campo obrigatório no tenant.',
      'Pacote não liberado. Reexecutar após a fila de exceções decidir os quatro.',
    ],
  },
  {
    objetoId: 'contratos',
    estado: 'nao-executada',
    executadaEm: null,
    registrosSimulados: 0,
    mensagens: ['A onda 3 depende das ondas 1 e 2 concluídas. Simulação ainda não faz sentido.'],
  },
]

export const simulacaoPorObjeto: ReadonlyMap<string, SimulacaoCockpit> = new Map(
  simulacoesCockpit.map((s) => [s.objetoId, s]),
)
