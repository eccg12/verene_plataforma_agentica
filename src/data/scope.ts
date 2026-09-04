/**
 * Escopo declarado da migração.
 *
 * Seis objetos × quatro SPEs × dois ciclos = 48 pacotes de carga. Os volumes de
 * referência são os do escopo comercial, não a contagem das fixtures — as
 * fixtures são uma amostra navegável desse universo.
 *
 * A aritmética (48 pacotes, total de 2.080) é conferida por teste.
 */
import { speIds, type MigrationObjectId, type SpeId } from '@/data/types'

export { speIds }
export type { SpeId }

/** Os dois ciclos de carga previstos. */
export const cycles = ['ciclo-1', 'ciclo-2'] as const
export type Cycle = (typeof cycles)[number]

export interface CycleSpec {
  readonly id: Cycle
  readonly nome: string
  readonly descricao: string
}

/** O segundo ciclo é o cutover — termo preservado, não traduzido. */
export const cycleSpecs: readonly CycleSpec[] = [
  { id: 'ciclo-1', nome: 'Ciclo de teste', descricao: 'Carga de ensaio, com reconciliação completa e sem efeito em produção.' },
  { id: 'ciclo-2', nome: 'Cutover de produção', descricao: 'Carga definitiva, na janela acordada, com o mesmo playbook aprovado no ciclo de teste.' },
]

export const cycleById: Readonly<Record<Cycle, CycleSpec>> = Object.fromEntries(
  cycleSpecs.map((c) => [c.id, c]),
) as Readonly<Record<Cycle, CycleSpec>>

export interface ScopeObject {
  readonly id: string
  readonly nome: string
  /** Objetos do tenant que este pacote carrega. */
  readonly objetosTenant: readonly MigrationObjectId[]
  /** Volume de referência do escopo comercial. */
  readonly volume: number
}

/**
 * Os seis objetos em escopo. `materiais-servicos` é um pacote só no escopo
 * comercial, mas carrega dois objetos distintos no tenant.
 */
export const scopeObjects: readonly ScopeObject[] = [
  { id: 'fornecedores', nome: 'Fornecedores', objetosTenant: ['business-partner'], volume: 1120 },
  { id: 'materiais-servicos', nome: 'Materiais e serviços', objetosTenant: ['product-master', 'service-master'], volume: 320 },
  { id: 'contratos', nome: 'Contratos', objetosTenant: ['outline-agreement'], volume: 200 },
  { id: 'pedidos', nome: 'Pedidos', objetosTenant: ['purchase-order'], volume: 200 },
  { id: 'requisicoes', nome: 'Requisições', objetosTenant: ['purchase-requisition'], volume: 120 },
  { id: 'posicoes-estoque', nome: 'Posições de estoque', objetosTenant: ['stock'], volume: 120 },
]

export interface LoadPackage {
  readonly id: string
  readonly objetoId: string
  readonly spe: SpeId
  readonly ciclo: Cycle
}

/**
 * Os 48 pacotes de carga, derivados do escopo — não digitados à mão. A ordem é
 * estável (objeto, depois SPE, depois ciclo), o que mantém a simulação
 * reprodutível.
 */
export const loadPackages: readonly LoadPackage[] = scopeObjects.flatMap((objeto) =>
  speIds.flatMap((spe) =>
    cycles.map((ciclo) => ({
      id: `${objeto.id}/${spe}/${ciclo}`,
      objetoId: objeto.id,
      spe,
      ciclo,
    })),
  ),
)

/** Volume total de referência do escopo. */
export const totalVolume: number = scopeObjects.reduce((acc, objeto) => acc + objeto.volume, 0)

/** Resumo do escopo, para a tela não recalcular. */
export const scopeSummary = {
  objetos: scopeObjects.length,
  spes: speIds.length,
  ciclos: cycles.length,
  pacotes: loadPackages.length,
  volumeTotal: totalVolume,
} as const
