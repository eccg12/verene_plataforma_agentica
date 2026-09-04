import { strings } from '@/copy/strings'
import type { GateStatus } from '@/engine/gates'

/**
 * Situação de um Gate. Usa a mesma escala quente de estado do design system, e
 * como toda pílula do projeto, leva rótulo: cor nunca carrega o significado
 * sozinha.
 */
const TONE: Record<GateStatus, string> = {
  aprovado: 'bg-signed-bg text-signed',
  'em-avaliacao': 'bg-pending-gate-bg text-pending-gate',
  'evidencia-pendente': 'bg-held-bg text-held',
  'entrada-recusada': 'bg-exception-bg text-exception',
}

interface GateStatusBadgeProps {
  readonly status: GateStatus
}

export function GateStatusBadge({ status }: GateStatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-5 items-center whitespace-nowrap rounded-sm px-1.5 text-xs font-medium ${TONE[status]}`}
    >
      {strings.gates.status[status]}
    </span>
  )
}
