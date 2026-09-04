/**
 * Fila de exceções do NOVA.
 *
 * Cada exceção sai daqui com classe, dono nomeado, prazo e estado. Não há
 * caminho que aplique valor padrão: a fila só oferece liberar com decisão
 * registrada ou manter retido. Defaultar para o lote passar é o que produz base
 * suja com aparência de limpa.
 */
import { defectTypeById, type ClasseExcecao } from '@/data/defect-taxonomy'
import { ownerDaArea, type Owner } from '@/data/owners'
import { DAY_MS, simInstant } from '@/engine/clock'
import type { ExceptionRecord, PipelineRun, Signature } from '@/engine/pipeline'

export type EstadoExcecao = 'aberta' | 'liberada' | 'mantida-retida'

export interface ExcecaoNaFila {
  readonly excecao: ExceptionRecord
  readonly classe: ClasseExcecao
  /** Para quem vai: SAP SME nas técnicas, data owner da Verene nas de negócio. */
  readonly encaminhadaA: string
  readonly dono: Owner | null
  readonly prazoDias: number
  /** Data limite, derivada do epoch fixo da simulação. */
  readonly prazo: string
  readonly estado: EstadoExcecao
  readonly decisao: Signature | null
  readonly dimensao: string
}

const ENCAMINHAMENTO: Readonly<Record<ClasseExcecao, string>> = {
  tecnica: 'Verene · Arquitetura S/4HANA',
  negocio: 'Verene · Data owner',
}

export function filaDeExcecoes(run: PipelineRun, decisoes: Readonly<Record<string, Signature>>): readonly ExcecaoNaFila[] {
  return run.exceptions
    .map((excecao) => {
      const tipo = defectTypeById.get(excecao.defectTypeId)
      const classe: ClasseExcecao = tipo?.classe ?? 'tecnica'
      const prazoDias = tipo?.prazoDias ?? 5
      const decisao = decisoes[excecao.id] ?? null
      const estado: EstadoExcecao =
        decisao === null ? 'aberta' : decisao.decision === 'approved' ? 'liberada' : 'mantida-retida'
      return {
        excecao,
        classe,
        encaminhadaA: ENCAMINHAMENTO[classe],
        dono: ownerDaArea(excecao.roteadoPara),
        prazoDias,
        prazo: simInstant(prazoDias * DAY_MS).toISOString().slice(0, 10),
        estado,
        decisao,
        dimensao: tipo?.dimensao ?? '',
      }
    })
    .slice()
    .sort((a, b) => {
      // críticas primeiro, depois por prazo, depois por id — ordenação total
      if (a.excecao.severidade !== b.excecao.severidade) return a.excecao.severidade === 'critical' ? -1 : 1
      if (a.prazoDias !== b.prazoDias) return a.prazoDias - b.prazoDias
      return a.excecao.id < b.excecao.id ? -1 : 1
    })
}

export interface ResumoFila {
  readonly total: number
  readonly abertas: number
  readonly tecnicas: number
  readonly negocio: number
  readonly criticas: number
}

export function resumoDaFila(fila: readonly ExcecaoNaFila[]): ResumoFila {
  return {
    total: fila.length,
    abertas: fila.filter((e) => e.estado === 'aberta').length,
    tecnicas: fila.filter((e) => e.classe === 'tecnica').length,
    negocio: fila.filter((e) => e.classe === 'negocio').length,
    criticas: fila.filter((e) => e.excecao.severidade === 'critical').length,
  }
}
