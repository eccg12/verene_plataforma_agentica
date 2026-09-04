/**
 * Estado dos Gates, derivado.
 *
 * O que faz um Gate ser ponto de decisão e não reunião de status:
 *
 * - **A entrada é recusada.** Um Gate só abre se o ARTEFATO do Gate anterior
 *   estiver assinado. Não "abre com ressalva", não "abre em paralelo": não abre.
 *   `entrada-recusada` nomeia o artefato que falta e o Gate que o assina.
 * - **A trilha carrega a versão.** Toda assinatura registra quem, quando e sobre
 *   qual versão de playbook. Assinatura dada sobre outra versão não vale para a
 *   corrente — a regra mudou, a aprovação anterior não cobre a nova.
 * - **Nada aqui é escrito à mão.** Estado, pendência e disponibilidade de
 *   evidência saem do run e das assinaturas. Gate verde por decreto é o oposto
 *   do que a tela precisa provar.
 */
import {
  assinaturaDeBaseline,
  gateDoArtefato,
  gates,
  type ArtefatoId,
  type Assinante,
  type EvidenciaDeGate,
  type Gate,
  type GateId,
} from '@/data/gates'
import { ownerDaArea, type Owner } from '@/data/owners'
import type { Approvals, PipelineRun, Signature } from '@/engine/pipeline'

export type GateStatus = 'aprovado' | 'em-avaliacao' | 'evidencia-pendente' | 'entrada-recusada'

/** O que falta para o Gate poder decidir. Rótulo fica na tela; aqui só o dado. */
export type TipoPendencia = 'assinatura' | 'clusters' | 'excecoes' | 'evidencia' | 'versao'

export interface Pendencia {
  readonly tipo: TipoPendencia
  /** O que exatamente falta: a área que assina, os ids em aberto, o título da evidência. */
  readonly detalhe: string
  readonly quantidade: number
}

/** Uma linha da trilha de assinatura do artefato. */
export interface ItemDeTrilha {
  readonly oQueAssina: string
  readonly area: string
  readonly responsavel: Owner | null
  readonly assinatura: Signature | null
  /** Gates assinados item a item (clusters, exceções) exigem mais de uma. */
  readonly requeridas: number
  readonly assinadas: number
}

export interface EvidenciaAvaliada extends EvidenciaDeGate {
  readonly disponivel: boolean
}

export interface RecusaDeEntrada {
  readonly artefato: ArtefatoId
  readonly artefatoNome: string
  /** O Gate que assina o artefato em falta. */
  readonly gate: GateId
}

export interface EstadoDeGate {
  readonly gate: Gate
  readonly status: GateStatus
  readonly entradaAdmitida: boolean
  readonly recusa: RecusaDeEntrada | null
  readonly artefatoAssinado: boolean
  readonly trilha: readonly ItemDeTrilha[]
  readonly pendencias: readonly Pendencia[]
  readonly evidencias: readonly EvidenciaAvaliada[]
}

export interface EntradaDeGates {
  readonly run: PipelineRun
  readonly approvals: Approvals
  /** Versão corrente. Assinatura sobre outra versão não conta. */
  readonly playbookVersion: string
  /** Assinaturas dadas na própria tela de Gates: os Gates fora da esteira. */
  readonly assinaturasDeGate: Readonly<Partial<Record<GateId, Signature>>>
}

/**
 * Assinatura válida: aprovada e sobre a versão corrente do playbook. Rejeitada
 * é decisão registrada, não artefato assinado — o Gate não passa com ela.
 */
function vale(assinatura: Signature | null | undefined, versao: string): boolean {
  return assinatura?.decision === 'approved' && assinatura.playbookVersion === versao
}

function comResponsavel(assinante: Assinante, assinatura: Signature | null): ItemDeTrilha {
  return {
    oQueAssina: assinante.oQueAssina,
    area: assinante.area,
    responsavel: ownerDaArea(assinante.area),
    assinatura,
    requeridas: 1,
    assinadas: assinatura === null ? 0 : 1,
  }
}

/**
 * Trilha de um Gate assinado item a item. As assinaturas de cluster e de exceção
 * são dadas pela mesma pessoa no mesmo instante da simulação, então qualquer uma
 * representa a trilha — o que varia é quantas de quantas já existem.
 */
function trilhaEmLote(
  assinante: Assinante,
  itens: readonly string[],
  registro: Readonly<Record<string, Signature>>,
  versao: string,
): ItemDeTrilha {
  const dadas = itens.map((id) => registro[id]).filter((s): s is Signature => s !== undefined)
  const representativa = dadas.length === itens.length && dadas.length > 0 ? (dadas[dadas.length - 1] ?? null) : null
  return {
    oQueAssina: assinante.oQueAssina,
    area: assinante.area,
    responsavel: ownerDaArea(assinante.area),
    assinatura: representativa !== null && representativa.playbookVersion === versao ? representativa : null,
    requeridas: itens.length,
    assinadas: dadas.length,
  }
}

/** Assinaturas e pendências de cada Gate, sem olhar para a entrada ainda. */
function trilhaDoGate(gate: Gate, entrada: EntradaDeGates): readonly ItemDeTrilha[] {
  const { approvals, playbookVersion: versao, run, assinaturasDeGate } = entrada
  const [primeiro, segundo] = gate.assinantes

  switch (gate.id) {
    case 'G0':
      return gate.assinantes.map((a, i) => comResponsavel(a, assinaturaDeBaseline[i] ?? null))
    case 'G1':
      return [
        comResponsavel(primeiro!, approvals.mapeamentoSme),
        comResponsavel(segundo!, approvals.mapeamento),
      ]
    case 'G2':
      return [trilhaEmLote(primeiro!, run.clusters.map((c) => c.id), approvals.clusters, versao)]
    case 'G3':
      return [trilhaEmLote(primeiro!, run.exceptions.map((e) => e.id), approvals.excecoes, versao)]
    case 'G4':
      return [comResponsavel(primeiro!, approvals.pacote)]
    case 'G6':
      return [comResponsavel(primeiro!, approvals.reconciliacao)]
    default:
      // G5 e G7: assinados na própria tela de Gates.
      return gate.assinantes.map((a) => comResponsavel(a, assinaturasDeGate[gate.id] ?? null))
  }
}

/** O artefato do Gate está assinado? Item a item, exige todos os itens decididos. */
function artefatoAssinado(trilha: readonly ItemDeTrilha[], versao: string): boolean {
  if (trilha.length === 0) return false
  return trilha.every((item) => {
    if (item.requeridas === 0) return false
    if (item.requeridas > 1 && item.assinadas < item.requeridas) return false
    return vale(item.assinatura, versao)
  })
}

function pendenciasDoGate(
  gate: Gate,
  trilha: readonly ItemDeTrilha[],
  evidencias: readonly EvidenciaAvaliada[],
  entrada: EntradaDeGates,
): readonly Pendencia[] {
  const pendencias: Pendencia[] = []

  for (const evidencia of evidencias) {
    if (!evidencia.disponivel) {
      pendencias.push({ tipo: 'evidencia', detalhe: evidencia.titulo, quantidade: 1 })
    }
  }

  for (const item of trilha) {
    if (item.requeridas > 1 && item.assinadas < item.requeridas) {
      pendencias.push({
        tipo: gate.id === 'G3' ? 'excecoes' : 'clusters',
        detalhe: item.area,
        quantidade: item.requeridas - item.assinadas,
      })
      continue
    }
    if (item.assinatura === null) {
      pendencias.push({ tipo: 'assinatura', detalhe: item.area, quantidade: 1 })
      continue
    }
    if (item.assinatura.playbookVersion !== entrada.playbookVersion) {
      pendencias.push({ tipo: 'versao', detalhe: item.assinatura.playbookVersion, quantidade: 1 })
    }
  }

  return pendencias
}

function avaliarEvidencias(gate: Gate, run: PipelineRun): readonly EvidenciaAvaliada[] {
  return gate.evidencias.map((e) => ({
    ...e,
    // Evidência fora da esteira já existe; a que a esteira produz só existe
    // depois do passo rodar. Passo bloqueado não entrega evidência nenhuma.
    disponivel:
      e.produzidaPor === null || run.steps.find((s) => s.id === e.produzidaPor)?.status === 'completed',
  }))
}

/**
 * Estado dos oito Gates, em ordem. A recusa de entrada propaga: basta o artefato
 * de um Gate não estar assinado para todos os seguintes ficarem sem entrada.
 */
export function estadoDosGates(entrada: EntradaDeGates): readonly EstadoDeGate[] {
  const assinados = new Map<ArtefatoId, boolean>()
  const resultado: EstadoDeGate[] = []

  for (const gate of gates) {
    const evidencias = avaliarEvidencias(gate, entrada.run)
    const trilha = trilhaDoGate(gate, entrada)

    const exigido = gate.exigeArtefato
    const entradaAdmitida = exigido === null || assinados.get(exigido) === true

    // Assinatura dada num Gate que não abriu não assina artefato nenhum. Sem
    // isto, bastaria assinar fora de ordem para a cascata de recusa evaporar.
    const assinado = entradaAdmitida && artefatoAssinado(trilha, entrada.playbookVersion)
    assinados.set(gate.artefato.id, assinado)
    const recusa: RecusaDeEntrada | null =
      entradaAdmitida || exigido === null
        ? null
        : {
            artefato: exigido,
            artefatoNome: gates.find((g) => g.artefato.id === exigido)?.artefato.nome ?? exigido,
            gate: gateDoArtefato[exigido],
          }

    const pendencias = pendenciasDoGate(gate, trilha, evidencias, entrada)
    const status: GateStatus = !entradaAdmitida
      ? 'entrada-recusada'
      : assinado
        ? 'aprovado'
        : evidencias.some((e) => !e.disponivel)
          ? 'evidencia-pendente'
          : 'em-avaliacao'

    resultado.push({
      gate,
      status,
      entradaAdmitida,
      recusa,
      artefatoAssinado: assinado,
      trilha,
      pendencias,
      evidencias,
    })
  }

  return resultado
}

export function gateAprovado(estados: readonly EstadoDeGate[], id: GateId): boolean {
  return estados.find((e) => e.gate.id === id)?.artefatoAssinado === true
}
