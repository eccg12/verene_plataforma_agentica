/**
 * Plano de ondas.
 *
 * A ordem não é arbitrária: cada onda depende do que a anterior deixou pronto.
 * Contrato aponta para fornecedor; pedido aponta para contrato e para material.
 * Migrar fora de ordem é criar referência para cadastro que ainda não existe.
 */
import type { Cycle } from '@/data/scope'

export const waveIds = ['wave-1', 'wave-2', 'wave-3'] as const
export type WaveId = (typeof waveIds)[number]

export interface Wave {
  readonly id: WaveId
  readonly numero: number
  readonly nome: string
  /** Ids de `scopeObjects` que esta onda carrega. */
  readonly objetos: readonly string[]
  readonly descricao: string
  /** Por que esta onda vem nesta posição. */
  readonly dependencia: string
  readonly ciclos: readonly Cycle[]
}

export const waves: readonly Wave[] = [
  {
    id: 'wave-1',
    numero: 1,
    nome: 'Fornecedores PJ e PF',
    objetos: ['fornecedores'],
    descricao:
      'Business Partner com role de fornecedor, pessoa jurídica e pessoa física. Inclui a deduplicação entre as quatro SPEs e o reuso do que já existe no tenant.',
    dependencia:
      'Primeira onda: nada depende dela para começar, e tudo depende dela para seguir. Contrato, pedido e requisição apontam para fornecedor.',
    ciclos: ['ciclo-1', 'ciclo-2'],
  },
  {
    id: 'wave-2',
    numero: 2,
    nome: 'Materiais e serviços',
    objetos: ['materiais-servicos'],
    descricao:
      'Product master e Service master, com classificação fiscal e enquadramento no tipo de material do tenant.',
    dependencia:
      'Depende da onda 1 só para o cadastro de fornecedor de referência. Precede a onda 3 porque linha de contrato e de pedido apontam para material ou serviço.',
    ciclos: ['ciclo-1', 'ciclo-2'],
  },
  {
    id: 'wave-3',
    numero: 3,
    nome: 'Contratos, serviços, requisições, pedidos e estoque',
    objetos: ['contratos', 'pedidos', 'requisicoes', 'posicoes-estoque'],
    descricao:
      'Outline agreement, Purchase requisition, Purchase order e posições de estoque. É a onda transacional: cada objeto aqui referencia pelo menos um cadastro das ondas anteriores.',
    dependencia:
      'Depende das duas anteriores. Sem fornecedor e sem material carregados, o documento transacional não tem para onde apontar.',
    ciclos: ['ciclo-1', 'ciclo-2'],
  },
]

export const waveByObjeto: ReadonlyMap<string, Wave> = new Map(
  waves.flatMap((w) => w.objetos.map((o) => [o, w] as const)),
)
