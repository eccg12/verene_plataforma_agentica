import { BrandLogo } from '@/components/BrandLogo'
import { strings } from '@/copy/strings'
import { cycleById, type Cycle } from '@/data/scope'

interface TopBarProps {
  readonly playbookVersion: string
  readonly ciclo: Cycle
}

/**
 * Barra superior. A versão do playbook e o ciclo corrente ficam sempre
 * visíveis: são o que dá contexto a qualquer número em qualquer tela.
 */
export function TopBar({ playbookVersion, ciclo }: TopBarProps) {
  const t = strings.shell
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <BrandLogo brand="verene" className="h-6" />

      <span className="text-md font-medium tracking-tight text-fg">{t.projectTitle}</span>

      <div className="ml-auto flex items-center gap-4">
        <span className="flex items-baseline gap-1.5 rounded-sm border border-line-strong px-2 py-0.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.playbookLabel}</span>
          <span className="tnum text-xs font-medium text-accent">{playbookVersion}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.cycleLabel}</span>
          <span className="text-xs font-medium text-fg">{cycleById[ciclo].nome}</span>
        </span>
        <BrandLogo brand="monoda" className="h-6" />
      </div>
    </header>
  )
}
