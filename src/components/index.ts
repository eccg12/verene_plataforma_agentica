/**
 * Componentes próprios do KEPLER (sem UI kit externo).
 *
 * Componentes não carregam texto nem dado próprio: texto vem de
 * `src/copy/strings.ts`, dado vem de `src/data/`. Cor vem sempre de token
 * semântico — nunca da paleta base direto, porque só o token resolve por
 * superfície.
 */

export { AgentStrip } from './AgentStrip'
export { AppShell } from './AppShell'
export { BrandLogo } from './BrandLogo'
export { Button } from './Button'
export { Table, Tbody, Td, Th, Thead, Tr } from './DataTable'
export { DefectMap } from './DefectMap'
export { DefectOrigin } from './DefectOrigin'
export { DemoBadge } from './DemoBadge'
export { GateStatusBadge } from './GateStatusBadge'
export { IntakePanel } from './IntakePanel'
export { PackageGrid } from './PackageGrid'
export { PresenterBar } from './PresenterBar'
export { PresenterNotes } from './PresenterNotes'
export { PropagationTrail } from './PropagationTrail'
export { Section } from './Section'
export { SideNav } from './SideNav'
export { StateBadge } from './StateBadge'
export { Surface } from './Surface'
export { TokenSwatch } from './TokenSwatch'
export { TopBar } from './TopBar'
export { WavePlan } from './WavePlan'
