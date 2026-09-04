/**
 * Derivações do Mission Control.
 *
 * Nenhum número da tela é digitado no componente: tudo é calculado aqui, a
 * partir das fixtures. Puro e determinístico — sem `Math.random`, sem
 * `Date.now`, sem I/O.
 */
import { agents, type AgentName, type AgentSpec } from '@/data/agents'
import {
  defectTypeByPlantedKind,
  qualityDimensions,
  type QualityDimension,
} from '@/data/defect-taxonomy'
import { arquivosRecebidos, type ArquivoRecebido } from '@/data/intake'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonMaterials } from '@/data/source/nasajon-materials'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import type { PlantedDefect, SpeId } from '@/data/types'
import { hashSeed } from '@/engine/random'
import { pipelineSteps, type PipelineRun, type StepStatus } from '@/engine/pipeline'

// ============================================================ recebimento

/**
 * Fingerprint do conteúdo entregue. Não é criptográfico — serve para provar que
 * dois recebimentos do mesmo arquivo têm o mesmo conteúdo, não para resistir a
 * adversário. Duas passadas em sentidos opostos, 16 caracteres hexadecimais.
 */
export function fingerprint(conteudo: readonly string[]): string {
  const direto = conteudo.join('')
  const inverso = [...conteudo].reverse().join('')
  return (
    hashSeed(direto).toString(16).padStart(8, '0') + hashSeed(inverso).toString(16).padStart(8, '0')
  ).toUpperCase()
}

/** Linhas de conteúdo de um arquivo, extraídas da fixture correspondente. */
function conteudoDoArquivo(arquivo: ArquivoRecebido): readonly string[] {
  if (arquivo.objetoId === 'fornecedores') {
    return nasajonSuppliers
      .filter((s) => s.spe === arquivo.spe)
      .map((s) => `${s.codigo}|${s.razaoSocial}|${s.cnpjCpf}|${s.municipio}|${s.dataCadastro}`)
  }
  if (arquivo.objetoId === 'materiais-servicos') {
    return nasajonMaterials
      .filter((m) => m.spe === arquivo.spe)
      .map((m) => `${m.codigo}|${m.descricao}|${m.ncm ?? ''}|${m.unidadeMedida}|${m.precoMedio}`)
  }
  if (arquivo.objetoId === 'contratos') {
    return nasajonContracts
      .filter((c) => c.spe === arquivo.spe)
      .map((c) => `${c.numero}|${c.fornecedorCodigo}|${c.valorOriginal}|${c.linhas.length}`)
  }
  return []
}

export interface RecebimentoConferido {
  readonly arquivo: ArquivoRecebido
  readonly registrosLidos: number
  readonly contagemConfere: boolean
  readonly diferenca: number
  readonly layoutValidado: boolean
  readonly fingerprint: string
}

/** Confere cada arquivo recebido contra o conteúdo de fato lido. */
export const recebimentos: readonly RecebimentoConferido[] = arquivosRecebidos.map((arquivo) => {
  const conteudo = conteudoDoArquivo(arquivo)
  const registrosLidos = conteudo.length
  return {
    arquivo,
    registrosLidos,
    contagemConfere: registrosLidos === arquivo.registrosDeclarados,
    diferenca: registrosLidos - arquivo.registrosDeclarados,
    layoutValidado: arquivo.divergenciasLayout.length === 0,
    fingerprint: fingerprint(conteudo),
  }
})

export const resumoRecebimento = {
  arquivos: recebimentos.length,
  layoutValidado: recebimentos.filter((r) => r.layoutValidado).length,
  contagemDivergente: recebimentos.filter((r) => !r.contagemConfere).length,
  recibosComRessalva: recebimentos.filter((r) => !r.arquivo.recibo.aceito).length,
  registrosLidos: recebimentos.reduce((acc, r) => acc + r.registrosLidos, 0),
} as const

// ============================================================ mapa de defeitos do VEGA

export interface TaxaDefeito {
  readonly chave: string
  readonly rotulo: string
  readonly registros: number
  readonly defeitos: number
  /** Defeitos por 100 registros. */
  readonly taxa: number
  readonly criticos: number
}

interface FonteObjeto {
  readonly id: string
  readonly rotulo: string
  readonly registros: number
  readonly defeitos: readonly { readonly spe: SpeId; readonly defeito: PlantedDefect }[]
}

const FONTES: readonly FonteObjeto[] = [
  {
    id: 'fornecedores',
    rotulo: 'Fornecedores',
    registros: nasajonSuppliers.length,
    defeitos: nasajonSuppliers.flatMap((s) => s._plantedDefect.map((d) => ({ spe: s.spe, defeito: d }))),
  },
  {
    id: 'materiais-servicos',
    rotulo: 'Materiais e serviços',
    registros: nasajonMaterials.length,
    defeitos: nasajonMaterials.flatMap((m) => m._plantedDefect.map((d) => ({ spe: m.spe, defeito: d }))),
  },
  {
    id: 'contratos',
    rotulo: 'Contratos',
    registros: nasajonContracts.length,
    defeitos: nasajonContracts.flatMap((c) => c._plantedDefect.map((d) => ({ spe: c.spe, defeito: d }))),
  },
]

const tipoDe = (defeito: PlantedDefect) => defectTypeByPlantedKind.get(defeito.kind)

const taxa = (defeitos: number, registros: number): number =>
  registros === 0 ? 0 : Number(((defeitos / registros) * 100).toFixed(1))

/** Taxa de defeito por objeto de escopo. */
export const taxaPorObjeto: readonly TaxaDefeito[] = FONTES.map((fonte) => ({
  chave: fonte.id,
  rotulo: fonte.rotulo,
  registros: fonte.registros,
  defeitos: fonte.defeitos.length,
  taxa: taxa(fonte.defeitos.length, fonte.registros),
  criticos: fonte.defeitos.filter((d) => tipoDe(d.defeito)?.severidade === 'critical').length,
}))

/** Taxa de defeito por dimensão de qualidade, somando todos os objetos perfilados. */
export const taxaPorDimensao: readonly TaxaDefeito[] = qualityDimensions
  .map((dimensao) => {
    const registros = FONTES.reduce((acc, f) => acc + f.registros, 0)
    const daDimensao = FONTES.flatMap((f) => f.defeitos).filter(
      (d) => tipoDe(d.defeito)?.dimensao === dimensao,
    )
    return {
      chave: dimensao,
      rotulo: dimensao,
      registros,
      defeitos: daDimensao.length,
      taxa: taxa(daDimensao.length, registros),
      criticos: daDimensao.filter((d) => tipoDe(d.defeito)?.severidade === 'critical').length,
    }
  })
  .filter((t) => t.defeitos > 0)

/** Cruzamento objeto x dimensão, para a matriz do mapa. */
export interface CelulaMapa {
  readonly objetoId: string
  readonly dimensao: QualityDimension
  readonly defeitos: number
}

export const matrizObjetoDimensao: readonly CelulaMapa[] = FONTES.flatMap((fonte) =>
  qualityDimensions.map((dimensao) => ({
    objetoId: fonte.id,
    dimensao,
    defeitos: fonte.defeitos.filter((d) => tipoDe(d.defeito)?.dimensao === dimensao).length,
  })),
)

export const resumoDefeitos = {
  registrosPerfilados: FONTES.reduce((acc, f) => acc + f.registros, 0),
  defeitos: FONTES.reduce((acc, f) => acc + f.defeitos.length, 0),
  criticos: taxaPorObjeto.reduce((acc, t) => acc + t.criticos, 0),
  taxaGeral: taxa(
    FONTES.reduce((acc, f) => acc + f.defeitos.length, 0),
    FONTES.reduce((acc, f) => acc + f.registros, 0),
  ),
} as const

// ============================================================ faixa de agentes

export type AtividadeAgente = 'concluido' | 'em-execucao' | 'bloqueado' | 'aguardando' | 'continuo'

export interface EstadoAgente {
  readonly agent: AgentSpec
  readonly atividade: AtividadeAgente
  /** Passos da esteira sob responsabilidade deste agente. */
  readonly passos: readonly { readonly nome: string; readonly status: StepStatus }[]
  readonly regrasAplicadas: number
}

/**
 * Estado de atividade de cada agente, derivado do run corrente. KANON não tem
 * passo: seu estado é `continuo`, porque ele versiona o playbook o tempo todo.
 */
export function estadoDosAgentes(run: PipelineRun): readonly EstadoAgente[] {
  return agents.map((agent) => {
    if (agent.transversal) {
      return { agent, atividade: 'continuo' as const, passos: [], regrasAplicadas: 0 }
    }
    const meus = pipelineSteps.filter((s) => s.agent === agent.name)
    const resultados = meus.map((spec) => {
      const resultado = run.steps.find((s) => s.id === spec.id)
      return { nome: spec.nome, status: resultado?.status ?? ('not-reached' as StepStatus) }
    })
    const regras = meus.reduce(
      (acc, spec) => acc + (run.steps.find((s) => s.id === spec.id)?.regrasAplicadas.length ?? 0),
      0,
    )
    const atividade: AtividadeAgente = resultados.some((r) => r.status === 'blocked')
      ? 'bloqueado'
      : resultados.every((r) => r.status === 'completed')
        ? 'concluido'
        : resultados.some((r) => r.status === 'completed')
          ? 'em-execucao'
          : 'aguardando'
    return { agent, atividade, passos: resultados, regrasAplicadas: regras }
  })
}

export const agentNamesInOrder: readonly AgentName[] = agents.map((a) => a.name)
