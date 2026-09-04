/**
 * Componentes próprios do KEPLER (sem UI kit externo).
 *
 * Componentes não carregam texto nem dado próprio: texto vem de
 * `src/copy/strings.ts`, dado vem de `src/data/`. Cor vem sempre de token
 * semântico — nunca da paleta base direto, porque só o token resolve por
 * superfície.
 */

export { BrandLogo } from './BrandLogo'
export { Button } from './Button'
export { Table, Tbody, Td, Th, Thead, Tr } from './DataTable'
export { DefectOrigin } from './DefectOrigin'
export { Section } from './Section'
export { StateBadge } from './StateBadge'
export { Surface } from './Surface'
export { TokenSwatch } from './TokenSwatch'
