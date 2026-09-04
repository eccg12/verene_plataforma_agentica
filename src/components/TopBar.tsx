import { Compass, Play } from 'lucide-react'

import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/Button'
import { DemoBadge } from '@/components/DemoBadge'
import { strings } from '@/copy/strings'
import { cycleById, type Cycle } from '@/data/scope'
import { useNarrative } from '@/narrative/store'

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
  const n = strings.narrativa
  const narrando = useNarrative((s) => s.ativa)
  const explorar = useNarrative((s) => s.explorar)
  const retomar = useNarrative((s) => s.retomar)
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <BrandLogo brand="verene" className="h-6" />

      <span className="text-md font-medium tracking-tight text-fg">{t.projectTitle}</span>

      <DemoBadge />

      <div className="ml-auto flex items-center gap-4">
        <span className="flex items-baseline gap-1.5 rounded-sm border border-line-strong px-2 py-0.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.playbookLabel}</span>
          <span className="tnum text-xs font-medium text-accent">{playbookVersion}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.cycleLabel}</span>
          <span className="text-xs font-medium text-fg">{cycleById[ciclo].nome}</span>
        </span>
        {/* Um botão só. Ou você assiste à apresentação, ou clica você mesmo — e o
            rótulo diz qual das duas coisas o clique faz. O roteiro do
            apresentador, que é outra coisa, continua na tecla P. */}
        {narrando ? (
          <Button variant="secondary" onClick={explorar} title={n.dicaSair}>
            <Compass size={14} aria-hidden="true" />
            {n.explorar}
          </Button>
        ) : (
          <Button variant="primary" onClick={retomar} title={n.dicaEntrar}>
            <Play size={14} aria-hidden="true" />
            {n.verApresentacao}
          </Button>
        )}
        <BrandLogo brand="monoda" className="h-6" />
      </div>
    </header>
  )
}
