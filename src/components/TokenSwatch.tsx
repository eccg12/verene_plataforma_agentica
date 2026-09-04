import { useEffect, useRef, useState } from 'react'

import type { SwatchSpec } from '@/data/designTokens'
import { contrastRatio, parseColor, toHex, wcagGrade, type WcagGrade } from '@/engine/color'

import type { Surface } from '../../tailwind.config'

interface Reading {
  readonly hex: string
  readonly ratio: number
  readonly grade: WcagGrade
  readonly against: string
}

interface TokenSwatchProps {
  readonly spec: SwatchSpec
  /** Só para reler quando a superfície muda. */
  readonly surface: Surface
}

/**
 * Amostra de um token. Lê a cor REALMENTE aplicada (`getComputedStyle`) em vez
 * de repetir o hex em TypeScript — assim o que a tela mostra não pode divergir
 * do que ela pinta.
 */
export function TokenSwatch({ spec, surface }: TokenSwatchProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [reading, setReading] = useState<Reading | null>(null)
  const against = spec.against ?? 'surface'

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const style = getComputedStyle(node)
    const value = parseColor(style.getPropertyValue(`--color-${spec.name}`))
    const reference = parseColor(style.getPropertyValue(`--color-${against}`))
    if (!value || !reference) return
    const ratio = contrastRatio(value, reference)
    setReading({ hex: toHex(value), ratio, grade: wcagGrade(ratio), against })
  }, [spec.name, against, surface])

  const detail =
    reading === null
      ? ''
      : spec.grade
        ? `${reading.hex} · ${reading.ratio.toFixed(2)}:1 ${reading.grade}`
        : reading.hex

  return (
    <div
      ref={ref}
      className="flex min-w-0 items-center gap-2"
      title={reading === null || !spec.grade ? spec.name : `${spec.name} sobre ${reading.against}`}
    >
      <span
        className="size-7 shrink-0 rounded-sm border border-line"
        style={{ backgroundColor: `var(--color-${spec.name})` }}
        aria-hidden="true"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-xs text-fg">{spec.name}</span>
        <span className="block truncate text-2xs tnum text-fg-subtle">{detail}</span>
      </span>
    </div>
  )
}
