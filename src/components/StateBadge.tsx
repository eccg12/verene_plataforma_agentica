import { strings } from '@/copy/strings'

import type { StateToken } from '../../tailwind.config'

/**
 * Situação de um objeto. A cor nunca carrega o significado sozinha — o rótulo
 * sempre acompanha.
 */
const TONE: Record<StateToken, string> = {
  signed: 'bg-signed-bg text-signed',
  held: 'bg-held-bg text-held',
  exception: 'bg-exception-bg text-exception',
  'pending-gate': 'bg-pending-gate-bg text-pending-gate',
}

interface StateBadgeProps {
  readonly state: StateToken
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded-sm text-xs font-medium whitespace-nowrap ${TONE[state]}`}
    >
      {strings.states[state]}
    </span>
  )
}
