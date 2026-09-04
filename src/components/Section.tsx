import type { ReactNode } from 'react'

interface SectionProps {
  readonly title: string
  readonly note?: string
  readonly children: ReactNode
}

/** Bloco do styleguide: título curto, nota opcional, conteúdo denso. */
export function Section({ title, note, children }: SectionProps) {
  return (
    <section className="border-t border-line pt-4">
      <h2 className="text-md font-medium text-fg">{title}</h2>
      {note === undefined ? null : <p className="mt-1 max-w-[70ch] text-sm text-fg-subtle">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
