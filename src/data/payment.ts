/**
 * Parcelas de pagamento por Gate.
 *
 * O que liga a governança ao contrato: cada parcela é liberada por um Gate
 * específico, e um Gate cuja entrada foi recusada não libera nada. Gate que não
 * tem parcela — G0, G3 e G5 — está aqui pela ausência: nem todo ponto de decisão
 * é ponto de faturamento.
 *
 * Só percentual. O valor do contrato não vive no protótipo, e escrever um número
 * inventado ao lado de um percentual real seria pior do que não mostrar valor.
 */
import type { GateId } from '@/data/gates'

export interface ParcelaDeGate {
  readonly gate: GateId
  readonly percentual: number
  /** O que a parcela remunera. */
  readonly oQueLibera: string
}

export const parcelasPorGate: readonly ParcelaDeGate[] = [
  { gate: 'G1', percentual: 20, oQueLibera: 'Playbook publicado e de-para aprovado contra o tenant vivo.' },
  { gate: 'G2', percentual: 20, oQueLibera: 'Escopo transformado e deduplicado, com cada cluster decidido.' },
  { gate: 'G4', percentual: 20, oQueLibera: 'Pacote conforme, com manifest, checksum e simulação aprovada.' },
  { gate: 'G6', percentual: 25, oQueLibera: 'Reconciliação assinada, com toda diferença explicada.' },
  { gate: 'G7', percentual: 15, oQueLibera: 'Aceite da onda contra os quatro critérios contratados.' },
]

/** A soma tem que fechar em 100. Há teste. */
export const PERCENTUAL_TOTAL = 100
