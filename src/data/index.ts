/**
 * Fixtures do protótipo.
 *
 * Todo dado exibido pela UI vive neste diretório (regra 3 do CLAUDE.md).
 * Componentes e telas nunca declaram dado inline — importam daqui.
 *
 *   source/  extrato do Nasajon, o ERP legado das SPEs. Sujo de propósito:
 *            os defeitos estão plantados e etiquetados em `_plantedDefect`.
 *   target/  o tenant S/4HANA vivo da Verene e a base já cadastrada nele.
 *   scope.ts o escopo declarado: 6 objetos × 4 SPEs × 2 ciclos.
 *
 * As fixtures são estáticas e versionadas: junto com a versão do playbook, são o
 * que garante que a simulação seja reprodutível (regra 4).
 */

/** Versão do conjunto de fixtures. Entra na seed da simulação. */
export const DATASET_VERSION = '0.2.0'

export * from './types'
export * from './scope'
export { nasajonSuppliers, type NasajonSupplier } from './source/nasajon-suppliers'
export { nasajonContracts, type NasajonContract, type NasajonContractLine } from './source/nasajon-contracts'
export { nasajonMaterials, type NasajonMaterial } from './source/nasajon-materials'
export { existingSuppliers, type ExistingSupplier } from './target/existing-base'
export {
  divergenciasDoPadraoSap,
  numberRanges,
  padraoDescricaoMaterial,
  requiredFields,
  tenantId,
  tenantRelease,
  valueDomains,
} from './target/tenant-config'
