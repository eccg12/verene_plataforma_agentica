import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const BASE =
  'inline-flex items-center gap-1.5 h-7 px-2.5 text-sm font-medium rounded-sm ' +
  'transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent-fill text-on-accent-fill hover:bg-accent-fill-hover',
  secondary: 'border border-line-strong text-fg hover:border-accent hover:text-accent',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-raised',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant
  readonly children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
