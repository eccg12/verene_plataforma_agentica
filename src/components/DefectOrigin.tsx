import { strings } from '@/copy/strings'

import type { DefectToken } from '../../tailwind.config'

const SWATCH: Record<DefectToken, string> = {
  'defect-source': 'bg-defect-source',
  'defect-transformation': 'bg-defect-transformation',
  'defect-target-config': 'bg-defect-target-config',
  'defect-load': 'bg-defect-load',
}

const TEXT: Record<DefectToken, string> = {
  'defect-source': 'text-defect-source',
  'defect-transformation': 'text-defect-transformation',
  'defect-target-config': 'text-defect-target-config',
  'defect-load': 'text-defect-load',
}

interface DefectOriginProps {
  readonly origin: DefectToken
  /** `swatch` = quadrado + rótulo neutro (tabela). `tinted` = rótulo colorido (legenda). */
  readonly tone?: 'swatch' | 'tinted'
}

/**
 * Origem de defeito. Forma distinta dos badges de estado (quadrado, não pílula)
 * para as duas escalas nunca se confundirem.
 */
export function DefectOrigin({ origin, tone = 'swatch' }: DefectOriginProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`size-2 shrink-0 rounded-[1px] ${SWATCH[origin]}`} aria-hidden="true" />
      <span className={tone === 'tinted' ? TEXT[origin] : 'text-fg-muted'}>{strings.defects[origin]}</span>
    </span>
  )
}
