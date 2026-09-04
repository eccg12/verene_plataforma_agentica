import { strings } from '@/copy/strings'

import monodaMarkup from '@/assets/logos/monoda.svg?raw'
import vereneMarkup from '@/assets/logos/verene.svg?raw'

type Brand = 'verene' | 'monoda'

const MARKUP: Record<Brand, string> = { verene: vereneMarkup, monoda: monodaMarkup }

interface BrandLogoProps {
  readonly brand: Brand
  readonly className?: string
}

/**
 * Slot de logo. O SVG é injetado inline para que um arquivo que use
 * `currentColor` acompanhe a superfície. Os arquivos atuais são placeholders —
 * ver `src/assets/logos/README.md`.
 */
export function BrandLogo({ brand, className = 'h-8' }: BrandLogoProps) {
  return (
    <span
      className={`inline-block text-fg-muted [&>svg]:h-full [&>svg]:w-auto ${className}`}
      title={strings.brands[brand]}
      dangerouslySetInnerHTML={{ __html: MARKUP[brand] }}
    />
  )
}
