/**
 * Lista de serviços da Lei Complementar 116/2003 — referência para incidência
 * de ISS.
 *
 * NOVA usa esta tabela para propor o código do serviço, sempre com o item
 * citado junto ao valor. É o que sustenta a regra da fila de exceções: sem
 * evidência, sem proposta.
 *
 * Subconjunto da lista, cobrindo os serviços contratados no escopo. Item fora
 * desta tabela não recebe proposta — a esteira não adivinha enquadramento
 * fiscal.
 */

export interface ItemLc116 {
  readonly item: string
  readonly descricao: string
  /** Palavras que, presentes na descrição da linha, indicam este item. */
  readonly indicadores: readonly string[]
}

export const itensLc116: readonly ItemLc116[] = [
  { item: '7.02', descricao: 'Execução de obras de construção civil, hidráulica ou elétrica e congêneres',
    indicadores: ['montagem', 'construcao', 'implantacao'] },
  { item: '7.03', descricao: 'Elaboração de planos, estudos, projetos básicos e executivos de engenharia',
    indicadores: ['projeto', 'estudo', 'engenharia', 'comissionamento'] },
  { item: '7.05', descricao: 'Reparação, conservação e reforma de edifícios, estradas, pontes e congêneres',
    indicadores: ['manutencao', 'reparo', 'corretiva', 'preventiva', 'linha viva'] },
  { item: '7.10', descricao: 'Limpeza, manutenção e conservação de vias, imóveis, parques e jardins',
    indicadores: ['limpeza', 'conservacao'] },
  { item: '7.16', descricao: 'Florestamento, reflorestamento, corte e descascamento de árvores e congêneres',
    indicadores: ['rocada', 'destoca', 'poda', 'faixa de servidao'] },
  { item: '7.20', descricao: 'Cartografia, mapeamento, levantamentos topográficos e geodésicos',
    indicadores: ['topografico', 'topografia', 'georreferenciamento', 'levantamento'] },
  { item: '8.02', descricao: 'Instrução, treinamento e orientação pedagógica de qualquer natureza',
    indicadores: ['treinamento', 'capacitacao'] },
  { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas',
    indicadores: ['vigilancia', 'seguranca patrimonial'] },
  { item: '17.09', descricao: 'Perícias, laudos, exames técnicos e análises técnicas',
    indicadores: ['inspecao', 'ensaio', 'termografica', 'analise'] },
]

/**
 * Locação de bem móvel sem operador não é serviço para fins de ISS. Não é
 * lacuna da tabela: é o enquadramento correto, e a proposta tem que dizer isso
 * em vez de forçar um item.
 */
export const NAO_INCIDE_ISS = {
  motivo: 'Locação de bem móvel não constitui prestação de serviço para fins de ISS.',
  fundamento: 'Súmula Vinculante 31 do STF',
  indicadores: ['locacao', 'aluguel'],
} as const

const semAcento = (v: string): string =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export interface ResultadoLc116 {
  readonly item: string | null
  readonly descricao: string
  readonly fundamento: string
  readonly incide: boolean
}

/** Busca determinística por indicador na descrição. Sem correspondência, devolve `null`. */
export function classificarLc116(descricao: string): ResultadoLc116 | null {
  const alvo = semAcento(descricao)
  if (NAO_INCIDE_ISS.indicadores.some((i) => alvo.includes(i))) {
    return { item: null, descricao: NAO_INCIDE_ISS.motivo, fundamento: NAO_INCIDE_ISS.fundamento, incide: false }
  }
  const encontrado = itensLc116.find((i) => i.indicadores.some((ind) => alvo.includes(ind)))
  if (!encontrado) return null
  return {
    item: encontrado.item,
    descricao: encontrado.descricao,
    fundamento: `Lista de serviços da LC 116/2003, item ${encontrado.item}`,
    incide: true,
  }
}
