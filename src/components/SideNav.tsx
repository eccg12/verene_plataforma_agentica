import { BookText, LayoutGrid, Palette, TableProperties } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { paths } from '@/app/paths'
import { strings } from '@/copy/strings'

const ICON = 14

const ITENS = [
  { to: paths.missionControl, rotulo: strings.nav.missionControl, Icone: LayoutGrid },
  { to: paths.playbook, rotulo: strings.nav.playbook, Icone: BookText },
  { to: paths.mapping, rotulo: strings.nav.mapping, Icone: TableProperties },
  { to: paths.styleguide, rotulo: strings.nav.styleguide, Icone: Palette },
] as const

/** Navegação lateral. Só lista tela que existe. */
export function SideNav() {
  return (
    <nav aria-label={strings.shell.navLabel} className="w-44 shrink-0 border-r border-line bg-surface py-2">
      <p className="px-3 pb-1.5 text-2xs uppercase tracking-wider text-fg-subtle">
        {strings.shell.navLabel}
      </p>
      <ul>
        {ITENS.map(({ to, rotulo, Icone }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex h-7 items-center gap-2 px-3 text-xs transition-colors ${
                  isActive
                    ? 'bg-surface-raised font-medium text-accent'
                    : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
                }`
              }
            >
              <Icone size={ICON} aria-hidden="true" />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
