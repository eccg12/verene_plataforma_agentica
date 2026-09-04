import { AgentStrip } from '@/components/AgentStrip'
import { DefectMap } from '@/components/DefectMap'
import { IntakePanel } from '@/components/IntakePanel'
import { PackageGrid } from '@/components/PackageGrid'
import { WavePlan } from '@/components/WavePlan'
import { strings } from '@/copy/strings'
import { useSimulation } from '@/engine/store'

/**
 * Mission Control. Superfície escura — é tela de operação, não de documento.
 * Todo número desta tela sai das fixtures ou é derivado delas em
 * `src/engine/mission-control.ts`.
 */
export function MissionControlScreen() {
  const ciclo = useSimulation((s) => s.ciclo)
  const run = useSimulation((s) => s.run)
  const t = strings.missionControl

  return (
    <div className="flex flex-col gap-6 px-5 py-4">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
        <p className="text-sm text-fg-subtle">{t.subtitle}</p>
      </div>

      <PackageGrid cicloCorrente={ciclo} />
      <WavePlan />
      <DefectMap />
      <IntakePanel />
      <AgentStrip run={run} />
    </div>
  )
}
