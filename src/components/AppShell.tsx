import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { flagsNaBusca } from '@/app/flags'
import { SideNav } from '@/components/SideNav'
import { Surface } from '@/components/Surface'
import { TopBar } from '@/components/TopBar'
import { useSimulation } from '@/engine/store'

/**
 * Shell da aplicação. A superfície escura é o padrão do cockpit; telas de
 * documento aplicam `surface-paper` no próprio conteúdo.
 */
export function AppShell() {
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const ciclo = useSimulation((s) => s.ciclo)
  const ligarFlags = useSimulation((s) => s.ligarFlags)
  const { search } = useLocation()

  // Flag pedida na URL (`?flag=comercial`) fica ligada em memória a partir daí,
  // para não se perder ao navegar. `reset()` desliga.
  useEffect(() => {
    ligarFlags(flagsNaBusca(search))
  }, [search, ligarFlags])

  return (
    <Surface surface="ink" className="flex h-full flex-col">
      <TopBar playbookVersion={playbookVersion} ciclo={ciclo} />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </Surface>
  )
}
