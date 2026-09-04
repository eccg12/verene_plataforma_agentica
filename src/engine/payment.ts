/**
 * Liberação de pagamento por Gate.
 *
 * A regra é a mesma da tela de Gates, sem exceção comercial: a parcela é
 * liberada quando o ARTEFATO do Gate está assinado. Gate com entrada recusada
 * não libera parcela nenhuma, e o motivo mostrado é o artefato que falta — não
 * "em andamento".
 */
import { parcelasPorGate, type ParcelaDeGate } from '@/data/payment'
import type { EstadoDeGate, GateStatus, RecusaDeEntrada } from '@/engine/gates'

export interface ParcelaAvaliada {
  readonly parcela: ParcelaDeGate
  readonly gateNome: string
  readonly status: GateStatus
  readonly liberada: boolean
  /** Preenchido quando a entrada do Gate foi recusada. */
  readonly recusa: RecusaDeEntrada | null
}

export interface LiberacaoDePagamento {
  readonly parcelas: readonly ParcelaAvaliada[]
  readonly liberado: number
  readonly retido: number
}

export function liberacaoDePagamento(estados: readonly EstadoDeGate[]): LiberacaoDePagamento {
  const parcelas = parcelasPorGate.map((parcela): ParcelaAvaliada => {
    const estado = estados.find((e) => e.gate.id === parcela.gate)
    return {
      parcela,
      gateNome: estado?.gate.nome ?? parcela.gate,
      status: estado?.status ?? 'entrada-recusada',
      liberada: estado?.artefatoAssinado === true,
      recusa: estado?.recusa ?? null,
    }
  })
  const liberado = parcelas.filter((p) => p.liberada).reduce((acc, p) => acc + p.parcela.percentual, 0)
  const total = parcelas.reduce((acc, p) => acc + p.parcela.percentual, 0)
  return { parcelas, liberado, retido: total - liberado }
}
