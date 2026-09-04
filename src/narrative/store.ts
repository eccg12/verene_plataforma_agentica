/**
 * Estado da camada narrada. Em memória, sem persistência — como todo o resto
 * (regra 6 do CLAUDE.md).
 *
 * É uma store à parte, de propósito. `src/engine/store.ts` guarda o que um
 * humano decidiu sobre a onda; esta guarda apenas onde a narração está. Misturar
 * as duas faria a camada de explicação virar parte do motor, que é exatamente o
 * que ela não deve ser.
 */
import { create } from 'zustand'

import { TOTAL_DE_CENAS } from '@/narrative/script'

export interface NarrativeState {
  /** A narrativa é o estado INICIAL: abre ligada. */
  readonly ativa: boolean
  readonly cena: number
  /** Modo automático: avança sozinho ao fim do tempo de leitura da cena. */
  readonly automatico: boolean
  readonly pausado: boolean
  /** Fica registrado ao sair, para o botão de retomar voltar onde parou. */
  readonly cenaAoSair: number
  /** `true` depois da última cena: o painel de encerramento. */
  readonly encerrada: boolean

  irPara: (n: number) => void
  proxima: () => void
  anterior: () => void
  reiniciar: () => void
  explorar: () => void
  retomar: () => void
  alternarAutomatico: () => void
  alternarPausa: () => void
}

const INICIAL = {
  ativa: true,
  cena: 1,
  automatico: false,
  pausado: false,
  cenaAoSair: 1,
  encerrada: false,
} as const

export const useNarrative = create<NarrativeState>((set, get) => ({
  ...INICIAL,

  irPara: (n) => {
    const alvo = Math.min(Math.max(n, 1), TOTAL_DE_CENAS)
    set({ cena: alvo, encerrada: false })
  },

  // Passar da última cena não volta ao começo nem sai à força: abre o painel de
  // encerramento, com a escolha de rever ou explorar.
  proxima: () => {
    const { cena } = get()
    if (cena >= TOTAL_DE_CENAS) {
      set({ encerrada: true, pausado: true })
      return
    }
    set({ cena: cena + 1 })
  },

  anterior: () => {
    const { cena, encerrada } = get()
    if (encerrada) {
      set({ encerrada: false })
      return
    }
    set({ cena: Math.max(cena - 1, 1) })
  },

  reiniciar: () => set({ cena: 1, encerrada: false, pausado: false }),

  // Sair guarda a cena: "Retomar apresentação" volta exatamente onde parou.
  explorar: () => set({ ativa: false, cenaAoSair: get().cena, automatico: false }),

  retomar: () => set({ ativa: true, cena: get().cenaAoSair, encerrada: false, pausado: false }),

  alternarAutomatico: () => set({ automatico: !get().automatico, pausado: false }),

  alternarPausa: () => set({ pausado: !get().pausado }),
}))
