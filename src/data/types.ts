/**
 * Tipos compartilhados pelas fixtures.
 *
 * Os dados de origem imitam um extrato Excel do Nasajon (ERP legado das SPEs):
 * campos em texto, máscara inconsistente, sem integridade referencial. Isso é
 * proposital — é o material que o KEPLER tem que tratar.
 */
import type { DefectToken } from '../../tailwind.config'
import type { Uf } from '@/engine/br-documents'

export type { Uf }

/** As quatro SPEs em escopo. */
export const speIds = ['SPE-1', 'SPE-2', 'SPE-3', 'SPE-4'] as const
export type SpeId = (typeof speIds)[number]

/**
 * Defeitos PLANTADOS de propósito na fixture.
 *
 * Cada registro defeituoso carrega em `_plantedDefect` o que há de errado, para
 * a demo poder mostrar o achado sem que nenhuma tela precise redescobri-lo por
 * heurística. `origin` liga o defeito à escala de cor do design system.
 */
export type PlantedDefectKind =
  | 'cnpj-dv-invalido'
  | 'duplicata-grafia'
  | 'ja-existe-no-destino'
  | 'cnae-ausente'
  | 'municipio-sem-ibge'
  | 'data-formato-divergente'
  | 'retencao-pf-divergente'
  | 'unidade-medida-divergente'
  | 'fase-fiscal-pendente'
  | 'saldo-diverge-do-original'
  | 'ncm-ausente'
  | 'descricao-fora-de-padrao'

export interface PlantedDefect {
  readonly kind: PlantedDefectKind
  /** Origem do defeito, na escala do design system. */
  readonly origin: DefectToken
  /** Campo afetado, no nome do extrato legado. */
  readonly field: string
  /** O que a tela deve dizer sobre o achado. */
  readonly note: string
  /** Código do registro relacionado (par de duplicata, cadastro já existente). */
  readonly relatedCode?: string
}

/** Retenções tributárias aplicadas ao fornecedor. */
export interface Retencoes {
  readonly iss: boolean
  readonly irrf: boolean
  readonly inss: boolean
  readonly pisCofinsCsll: boolean
  /** Alíquota de ISS em pontos percentuais; `null` quando não retém. */
  readonly aliquotaIss: number | null
}

export type NaturezaPessoa = 'J' | 'F'

export type RegimeTributario = 'simples-nacional' | 'lucro-presumido' | 'lucro-real' | 'pessoa-fisica'

/**
 * Objetos de migração no tenant. Granularidade do S/4HANA — o escopo comercial
 * agrupa `product-master` e `service-master` num único pacote ("materiais e
 * serviços"), por isso são sete aqui e seis em `scope.ts`.
 */
export const migrationObjectIds = [
  'business-partner',
  'product-master',
  'service-master',
  'outline-agreement',
  'purchase-order',
  'purchase-requisition',
  'stock',
] as const

export type MigrationObjectId = (typeof migrationObjectIds)[number]
