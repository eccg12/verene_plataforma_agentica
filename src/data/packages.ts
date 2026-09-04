/**
 * Quadro dos 48 pacotes de carga: 6 objetos x 4 SPEs x 2 ciclos.
 *
 * O estado de cada pacote é DECLARADO aqui, não calculado pela esteira. Motivo:
 * a esteira só tem fixture de origem para fornecedores, materiais e contratos;
 * pedidos, requisições e posições de estoque ainda não têm extrato. Declarar o
 * quadro inteiro e marcar o que não começou é honesto; derivar estado de dado
 * que não existe não seria.
 *
 * Os volumes por SPE somam exatamente o volume de referência do objeto em
 * `scope.ts`, e há teste para isso — o quadro não pode contradizer o escopo.
 */
import { cycles, scopeObjects, speIds, type Cycle } from '@/data/scope'
import type { SpeId } from '@/data/types'

export const packageStates = [
  'nao-iniciado',
  'em-processamento',
  'retido',
  'aguardando-gate',
  'aprovado',
] as const
export type PackageState = (typeof packageStates)[number]

export interface LoadPackageBoard {
  readonly id: string
  readonly objetoId: string
  readonly spe: SpeId
  readonly ciclo: Cycle
  readonly estado: PackageState
  /** Registros previstos neste pacote. */
  readonly registros: number
}

/** Distribuição do volume de referência de cada objeto pelas quatro SPEs. */
const VOLUME_POR_SPE: Readonly<Record<string, readonly [number, number, number, number]>> = {
  fornecedores: [340, 300, 250, 230],
  'materiais-servicos': [95, 85, 75, 65],
  contratos: [62, 54, 46, 38],
  pedidos: [58, 52, 48, 42],
  requisicoes: [36, 32, 28, 24],
  'posicoes-estoque': [34, 32, 28, 26],
}

/**
 * Estado por objeto e ciclo, na ordem das SPEs 1 a 4.
 *
 * O ciclo de teste está em andamento; o cutover de produção ainda não começou
 * em nenhum objeto — é o que se espera de um projeto neste ponto.
 */
const ESTADOS: Readonly<Record<string, Readonly<Record<Cycle, readonly [PackageState, PackageState, PackageState, PackageState]>>>> = {
  fornecedores: {
    'ciclo-1': ['aprovado', 'aguardando-gate', 'retido', 'em-processamento'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  'materiais-servicos': {
    'ciclo-1': ['aguardando-gate', 'em-processamento', 'em-processamento', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  contratos: {
    'ciclo-1': ['em-processamento', 'retido', 'nao-iniciado', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  pedidos: {
    'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  requisicoes: {
    'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  'posicoes-estoque': {
    'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
}

/** Os 48 pacotes, derivados do escopo. Ordem estável: objeto, SPE, ciclo. */
export const loadPackageBoard: readonly LoadPackageBoard[] = scopeObjects.flatMap((objeto) =>
  speIds.flatMap((spe, indiceSpe) =>
    cycles.map((ciclo) => ({
      id: `${objeto.id}/${spe}/${ciclo}`,
      objetoId: objeto.id,
      spe,
      ciclo,
      estado: ESTADOS[objeto.id]?.[ciclo][indiceSpe] ?? 'nao-iniciado',
      registros: VOLUME_POR_SPE[objeto.id]?.[indiceSpe] ?? 0,
    })),
  ),
)

export const packageById: ReadonlyMap<string, LoadPackageBoard> = new Map(
  loadPackageBoard.map((p) => [p.id, p]),
)

/** Contagem de pacotes por estado, para o resumo da grade. */
export function contarPorEstado(pacotes: readonly LoadPackageBoard[]): Readonly<Record<PackageState, number>> {
  return Object.fromEntries(
    packageStates.map((estado) => [estado, pacotes.filter((p) => p.estado === estado).length]),
  ) as Readonly<Record<PackageState, number>>
}
