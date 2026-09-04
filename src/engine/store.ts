/**
 * Estado da simulação, em memória.
 *
 * Sem persistência de nenhum tipo: nada de localStorage nem sessionStorage
 * (regra 6 do CLAUDE.md). Recarregar a página volta ao estado inicial, e
 * `reset()` faz o mesmo sem recarregar — é o que permite repetir a demonstração
 * do zero na frente do cliente.
 *
 * O estado guardado é só o que um humano decidiu: o recorte (SPE, versão do
 * playbook) e as assinaturas. O resultado da esteira NÃO é estado — é derivado,
 * recalculado por `runPipeline` a cada mudança. Como a esteira é determinística,
 * derivar sempre dá o mesmo resultado que guardar, sem o risco de o guardado
 * divergir do que as regras produziriam.
 */
import { create } from 'zustand'

import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import type { Cycle } from '@/data/scope'
import type { SpeId } from '@/data/types'
import { simInstant } from '@/engine/clock'
import {
  emptyApprovals,
  runPipeline,
  type Approvals,
  type Decision,
  type PipelineRun,
  type Signature,
} from '@/engine/pipeline'

export type SpeFilter = SpeId | 'todas'

export interface SimulationState {
  readonly spe: SpeFilter
  /** Ciclo corrente, exibido na barra superior e usado para recortar a grade. */
  readonly ciclo: Cycle
  readonly playbookVersion: string
  readonly approvals: Approvals
  /** Derivado das três chaves acima. Nunca é escrito à mão. */
  readonly run: PipelineRun

  setSpe: (spe: SpeFilter) => void
  setCiclo: (ciclo: Cycle) => void
  setPlaybookVersion: (version: string) => void
  approveMapping: (decision: Decision, note?: string) => void
  confirmCluster: (clusterId: string, decision: Decision, note?: string) => void
  decideException: (exceptionId: string, decision: Decision, note?: string) => void
  approvePackage: (decision: Decision, note?: string) => void
  approveReconciliation: (decision: Decision, note?: string) => void
  /** Assina todos os clusters de uma vez. Atalho de demonstração, não de produto. */
  confirmAllClusters: (decision: Decision) => void
  /** Idem para exceções. */
  decideAllExceptions: (decision: Decision) => void
  reset: () => void
}

/** Papéis que assinam. O checkpoint diz quem pode assinar o quê. */
export const signatories = {
  mapeamento: { by: 'Ana Ribeiro', role: 'Verene · Suprimentos' },
  duplicatas: { by: 'Ana Ribeiro', role: 'Verene · Suprimentos' },
  excecoes: { by: 'Carlos Menezes', role: 'Verene · Fiscal' },
  pacote: { by: 'Helena Duarte', role: 'Verene · Data owner' },
} as const

/**
 * Assinatura com instante determinístico. Usar `Date.now()` aqui quebraria a
 * reprodutibilidade da simulação.
 */
function sign(
  quem: { readonly by: string; readonly role: string },
  decision: Decision,
  note?: string,
): Signature {
  return {
    by: quem.by,
    role: quem.role,
    decision,
    at: simInstant().toISOString(),
    note: note ?? null,
  }
}

function selecionar(spe: SpeFilter) {
  return spe === 'todas' ? nasajonSuppliers : nasajonSuppliers.filter((s) => s.spe === spe)
}

function derivar(spe: SpeFilter, playbookVersion: string, approvals: Approvals): PipelineRun {
  return runPipeline({ records: selecionar(spe), playbookVersion, approvals, spe })
}

const ESTADO_INICIAL = {
  spe: 'SPE-1' as SpeFilter,
  ciclo: 'ciclo-1' as Cycle,
  playbookVersion: PLAYBOOK_VERSION,
  approvals: emptyApprovals,
}

export const useSimulation = create<SimulationState>((set, get) => {
  /** Recalcula a esteira a partir do estado que um humano controla. */
  const recomputar = (
    parcial: Partial<Pick<SimulationState, 'spe' | 'playbookVersion' | 'approvals'>>,
  ): void => {
    const atual = get()
    const spe = parcial.spe ?? atual.spe
    const playbookVersion = parcial.playbookVersion ?? atual.playbookVersion
    const approvals = parcial.approvals ?? atual.approvals
    set({ spe, playbookVersion, approvals, run: derivar(spe, playbookVersion, approvals) })
  }

  return {
    ...ESTADO_INICIAL,
    run: derivar(ESTADO_INICIAL.spe, ESTADO_INICIAL.playbookVersion, ESTADO_INICIAL.approvals),

    // Trocar de SPE ou de versão de playbook zera as assinaturas: assinatura
    // vale para um recorte e uma versão, não atravessa nenhum dos dois.
    setSpe: (spe) => recomputar({ spe, approvals: emptyApprovals }),
    // trocar de ciclo não invalida assinatura: o ciclo é recorte de leitura da
    // grade, não entra na esteira.
    setCiclo: (ciclo) => set({ ciclo }),
    setPlaybookVersion: (playbookVersion) => recomputar({ playbookVersion, approvals: emptyApprovals }),

    approveMapping: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, mapeamento: sign(signatories.mapeamento, decision, note) },
      }),

    confirmCluster: (clusterId, decision, note) =>
      recomputar({
        approvals: {
          ...get().approvals,
          clusters: {
            ...get().approvals.clusters,
            [clusterId]: sign(signatories.duplicatas, decision, note),
          },
        },
      }),

    decideException: (exceptionId, decision, note) =>
      recomputar({
        approvals: {
          ...get().approvals,
          excecoes: {
            ...get().approvals.excecoes,
            [exceptionId]: sign(signatories.excecoes, decision, note),
          },
        },
      }),

    approvePackage: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, pacote: sign(signatories.pacote, decision, note) },
      }),

    approveReconciliation: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, reconciliacao: sign(signatories.pacote, decision, note) },
      }),

    confirmAllClusters: (decision) => {
      const assinatura = sign(signatories.duplicatas, decision)
      const clusters = Object.fromEntries(get().run.clusters.map((c) => [c.id, assinatura]))
      recomputar({ approvals: { ...get().approvals, clusters } })
    },

    decideAllExceptions: (decision) => {
      const assinatura = sign(signatories.excecoes, decision)
      const excecoes = Object.fromEntries(get().run.exceptions.map((e) => [e.id, assinatura]))
      recomputar({ approvals: { ...get().approvals, excecoes } })
    },

    reset: () =>
      set({
        ...ESTADO_INICIAL,
        run: derivar(ESTADO_INICIAL.spe, ESTADO_INICIAL.playbookVersion, ESTADO_INICIAL.approvals),
      }),
  }
})
