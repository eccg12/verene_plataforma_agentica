import type { ReactNode } from 'react'

import type { Surface as SurfaceName } from '../../tailwind.config'

const SURFACE_CLASS: Record<SurfaceName, string> = {
  ink: 'surface-ink',
  paper: 'surface-paper',
}

interface SurfaceProps {
  readonly surface: SurfaceName
  readonly className?: string
  readonly children: ReactNode
}

/**
 * Define o contexto de superfície. Tudo abaixo herda os tokens semânticos —
 * componentes filhos nunca escolhem cor por superfície, só usam os tokens.
 */
export function Surface({ surface, className = '', children }: SurfaceProps) {
  return <div className={`${SURFACE_CLASS[surface]} ${className}`}>{children}</div>
}
