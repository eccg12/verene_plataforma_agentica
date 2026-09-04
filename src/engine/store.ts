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

import { flagsDesligadas, type FlagId } from '@/app/flags'
import type { GateId } from '@/data/gates'
import { mapeamentoSobrevive, regrasAlteradasEntre } from '@/engine/regeneration'
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

/**
 * O que o dono pode fazer com uma regra candidata.
 *
 * Nenhuma das três executa a regra: KANON recusa candidata, e promoção exige uma
 * nova versão selada (R-GOV-004). Confirmar registra que o dono do processo
 * reconheceu a regra — o que entra na próxima versão, não nesta.
 */
export type DecisaoDeCandidata = 'confirmada' | 'rejeitada' | 'reformular'

export interface RegistroDeCandidata {
  readonly decisao: DecisaoDeCandidata
  readonly assinatura: Signature
  readonly nota: string | null
}

/**
 * Run sobre as quatro SPEs, com as assinaturas correntes.
 *
 * As filas de revisão são cross-SPE por natureza: duplicata só existe entre
 * SPEs, e a fila de exceção precisa ver o escopo inteiro. Derivar aqui evita
 * que abrir a fila mexa no recorte das outras telas — e as assinaturas são as
 * mesmas, então decidir na fila vale para todo o resto.
 */
export function runDeTodasSpes(playbookVersion: string, approvals: Approvals): PipelineRun {
  return runPipeline({ records: nasajonSuppliers, playbookVersion, approvals, spe: 'todas' })
}

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
  /**
   * Adota uma versão do playbook já selada por KANON — o que a tela chama de
   * "corrigir e publicar".
   *
   * Diferente de `setPlaybookVersion`, que zera tudo: aqui as assinaturas cujo
   * artefato NÃO mudou são carregadas para a nova versão, marcadas como
   * revalidadas. Pacote e reconciliação caem sempre — o artefato mudou de
   * checksum, e assinatura dada sobre outro conteúdo não vale.
   */
  publicarVersao: (version: string) => void
  /** De onde para onde a última publicação foi. `null` antes de qualquer uma. */
  readonly regeneracao: { readonly de: string; readonly para: string } | null
  /** Aprovação técnica do SAP SME sobre o de-para. */
  approveMappingSme: (decision: Decision, note?: string) => void
  /** Assinatura do data owner da Verene no Gate 1. */
  approveMapping: (decision: Decision, note?: string) => void
  confirmCluster: (clusterId: string, decision: Decision, note?: string) => void
  /**
   * Dividir o cluster: os cadastros não são a mesma entidade e seguem
   * separados. Decisão distinta de "rejeitar" no que fica registrado, ainda que
   * o efeito em cluster de dois membros seja o mesmo — nenhum merge acontece.
   */
  splitCluster: (clusterId: string, note?: string) => void
  decideException: (exceptionId: string, decision: Decision, note?: string) => void
  approvePackage: (decision: Decision, note?: string) => void
  approveReconciliation: (decision: Decision, note?: string) => void
  /** Assina todos os clusters de uma vez. Atalho de demonstração, não de produto. */
  confirmAllClusters: (decision: Decision) => void
  /** Idem para exceções. */
  decideAllExceptions: (decision: Decision) => void
  /**
   * Verificação no app Fiori, registrada como evidência de Gate. Não entra na
   * esteira: é conferência humana no destino, depois da carga.
   */
  readonly verificacoesFiori: Readonly<Record<string, Signature>>
  registrarVerificacaoFiori: (id: string, note?: string) => void
  /**
   * Assinaturas dos Gates que não são checkpoint da esteira: a execução da carga
   * (G5) e o aceite da onda (G7). Os checkpoints continuam sendo assinados onde
   * a evidência é revisada — o Gate mostra a trilha e leva até lá.
   */
  readonly assinaturasDeGate: Readonly<Partial<Record<GateId, Signature>>>
  /**
   * Assina o Gate. G4 e G6 caem nas assinaturas da esteira, que são as mesmas
   * usadas pelo motor; G5 e G7 ficam fora dela. Gate assinado em outra tela é
   * no-op aqui — a decisão pertence a quem revisa a evidência.
   */
  assinarGate: (gate: GateId, decision: Decision, note?: string) => void
  /** Decisões sobre regras candidatas, por id de regra. */
  readonly candidatas: Readonly<Record<string, RegistroDeCandidata>>
  decidirRegraCandidata: (ruleId: string, decisao: DecisaoDeCandidata, nota?: string) => void
  /** Flags de demonstração, ligadas por parâmetro de URL. Não persistem. */
  readonly flags: Readonly<Record<FlagId, boolean>>
  ligarFlags: (ids: readonly FlagId[]) => void
  reset: () => void
}

/** Papéis que assinam. O checkpoint diz quem pode assinar o quê. */
export const signatories = {
  mapeamentoSme: { by: 'Rafael Queiroz', role: 'Monoda · SAP SME' },
  mapeamento: { by: 'Helena Duarte', role: 'Verene · Data owner' },
  duplicatas: { by: 'Ana Ribeiro', role: 'Verene · Suprimentos' },
  excecoes: { by: 'Carlos Menezes', role: 'Verene · Fiscal' },
  pacote: { by: 'Helena Duarte', role: 'Verene · Data owner' },
  /** Gates fora da esteira: a carga é executada pela Verene, não pela Monoda. */
  carga: { by: 'Tiago Fontes', role: 'Verene · Basis' },
  aceite: { by: 'Helena Duarte', role: 'Verene · Data owner' },
} as const

/**
 * Assinatura com instante determinístico. Usar `Date.now()` aqui quebraria a
 * reprodutibilidade da simulação.
 */
function sign(
  quem: { readonly by: string; readonly role: string },
  playbookVersion: string,
  decision: Decision,
  note?: string,
): Signature {
  return {
    by: quem.by,
    role: quem.role,
    decision,
    at: simInstant().toISOString(),
    playbookVersion,
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
  candidatas: {} as Readonly<Record<string, RegistroDeCandidata>>,
  regeneracao: null as { readonly de: string; readonly para: string } | null,
  verificacoesFiori: {} as Readonly<Record<string, Signature>>,
  assinaturasDeGate: {} as Readonly<Partial<Record<GateId, Signature>>>,
  flags: flagsDesligadas,
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

    publicarVersao: (versao) => {
      const { playbookVersion: de, approvals } = get()
      if (versao === de) return

      const depois = runDeTodasSpes(versao, approvals)
      const alteradas = regrasAlteradasEntre(de, versao)

      // Assinatura carregada, não recriada: quem assinou e quando continuam os
      // originais; o que se acrescenta é a versão em que ela foi revalidada.
      const revalidar = (a: Signature): Signature => ({ ...a, revalidadaEm: versao })

      const idsDeCluster = new Set(depois.clusters.map((c) => c.id))
      const clusters = Object.fromEntries(
        Object.entries(approvals.clusters)
          .filter(([id]) => idsDeCluster.has(id))
          .map(([id, a]) => [id, revalidar(a)]),
      )

      const idsDeExcecao = new Set(depois.exceptions.map((e) => e.id))
      const excecoes = Object.fromEntries(
        Object.entries(approvals.excecoes)
          .filter(([id]) => idsDeExcecao.has(id))
          .map(([id, a]) => [id, revalidar(a)]),
      )

      const mapeamentoVale = mapeamentoSobrevive(alteradas)
      const novas: Approvals = {
        mapeamentoSme: mapeamentoVale && approvals.mapeamentoSme ? revalidar(approvals.mapeamentoSme) : null,
        mapeamento: mapeamentoVale && approvals.mapeamento ? revalidar(approvals.mapeamento) : null,
        clusters,
        excecoes,
        // O pacote e a reconciliação são o artefato que mudou. Sempre caem.
        pacote: null,
        reconciliacao: null,
      }

      set({ regeneracao: { de, para: versao } })
      recomputar({ playbookVersion: versao, approvals: novas })
    },

    approveMappingSme: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, mapeamentoSme: sign(signatories.mapeamentoSme, get().playbookVersion, decision, note) },
      }),

    approveMapping: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, mapeamento: sign(signatories.mapeamento, get().playbookVersion, decision, note) },
      }),

    confirmCluster: (clusterId, decision, note) =>
      recomputar({
        approvals: {
          ...get().approvals,
          clusters: {
            ...get().approvals.clusters,
            [clusterId]: sign(signatories.duplicatas, get().playbookVersion, decision, note),
          },
        },
      }),

    splitCluster: (clusterId, note) =>
      recomputar({
        approvals: {
          ...get().approvals,
          clusters: {
            ...get().approvals.clusters,
            [clusterId]: sign(
              signatories.duplicatas,
              get().playbookVersion,
              'rejected',
              note ?? 'Cluster dividido: os cadastros seguem separados.',
            ),
          },
        },
      }),

    decideException: (exceptionId, decision, note) =>
      recomputar({
        approvals: {
          ...get().approvals,
          excecoes: {
            ...get().approvals.excecoes,
            [exceptionId]: sign(signatories.excecoes, get().playbookVersion, decision, note),
          },
        },
      }),

    approvePackage: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, pacote: sign(signatories.pacote, get().playbookVersion, decision, note) },
      }),

    approveReconciliation: (decision, note) =>
      recomputar({
        approvals: { ...get().approvals, reconciliacao: sign(signatories.pacote, get().playbookVersion, decision, note) },
      }),

    confirmAllClusters: (decision) => {
      const assinatura = sign(signatories.duplicatas, get().playbookVersion, decision)
      const clusters = Object.fromEntries(get().run.clusters.map((c) => [c.id, assinatura]))
      recomputar({ approvals: { ...get().approvals, clusters } })
    },

    decideAllExceptions: (decision) => {
      const assinatura = sign(signatories.excecoes, get().playbookVersion, decision)
      const excecoes = Object.fromEntries(get().run.exceptions.map((e) => [e.id, assinatura]))
      recomputar({ approvals: { ...get().approvals, excecoes } })
    },

    assinarGate: (gate, decision, note) => {
      if (gate === 'G4') {
        recomputar({
          approvals: { ...get().approvals, pacote: sign(signatories.pacote, get().playbookVersion, decision, note) },
        })
        return
      }
      if (gate === 'G6') {
        recomputar({
          approvals: {
            ...get().approvals,
            reconciliacao: sign(signatories.pacote, get().playbookVersion, decision, note),
          },
        })
        return
      }
      if (gate !== 'G5' && gate !== 'G7') return
      const quem = gate === 'G5' ? signatories.carga : signatories.aceite
      set({
        assinaturasDeGate: {
          ...get().assinaturasDeGate,
          [gate]: sign(quem, get().playbookVersion, decision, note),
        },
      })
    },

    decidirRegraCandidata: (ruleId, decisao, nota) =>
      set({
        candidatas: {
          ...get().candidatas,
          [ruleId]: {
            decisao,
            // Quem decide é o dono do processo, não a engenharia. A assinatura
            // registra a decisão; ela não promove a regra — promover é ato de
            // KANON, numa nova versão selada.
            assinatura: sign(signatories.excecoes, get().playbookVersion, decisao === 'rejeitada' ? 'rejected' : 'approved', nota),
            nota: nota ?? null,
          },
        },
      }),

    ligarFlags: (ids) => {
      if (ids.length === 0) return
      const atuais = get().flags
      if (ids.every((id) => atuais[id])) return
      set({ flags: { ...atuais, ...Object.fromEntries(ids.map((id) => [id, true])) } })
    },

    registrarVerificacaoFiori: (id, note) =>
      set({
        verificacoesFiori: {
          ...get().verificacoesFiori,
          [id]: sign(signatories.pacote, get().playbookVersion, 'approved', note),
        },
      }),

    reset: () =>
      set({
        ...ESTADO_INICIAL,
        run: derivar(ESTADO_INICIAL.spe, ESTADO_INICIAL.playbookVersion, ESTADO_INICIAL.approvals),
      }),
  }
})
