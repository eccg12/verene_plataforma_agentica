import type { ReactNode } from 'react'

/**
 * Primitivas de tabela densa: linha de 28px, cabeçalho fixo em maiúsculas
 * pequenas, numerais tabulares e alinhamento à direita nas colunas numéricas.
 */

export function Table({ children }: { readonly children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-base">{children}</table>
    </div>
  )
}

export function Thead({ children }: { readonly children: ReactNode }) {
  return <thead className="bg-surface-sunken">{children}</thead>
}

export function Tbody({ children }: { readonly children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Tr({ children }: { readonly children: ReactNode }) {
  return <tr className="h-7 border-t border-line first:border-t-0 hover:bg-surface-raised">{children}</tr>
}

interface CellProps {
  readonly children: ReactNode
  readonly numeric?: boolean
}

export function Th({ children, numeric = false }: CellProps) {
  return (
    <th
      scope="col"
      className={`h-7 px-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle ${
        numeric ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

export function Td({ children, numeric = false }: CellProps) {
  return (
    <td className={`px-2 align-middle ${numeric ? 'text-right tnum text-fg' : 'text-left text-fg-muted'}`}>
      {children}
    </td>
  )
}
