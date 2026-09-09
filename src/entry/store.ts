/**
 * O portão da demonstração.
 *
 * É **sinalização, não segurança**. A credencial vive no código e qualquer um
 * que abra o inspetor a lê — inclusive no artifact de arquivo único, que é
 * texto. O que o portão faz é dar uma porta ao link enviado ao cliente, em vez
 * de cair direto na tela, e marcar o início da sala.
 *
 * Por isso não há bloqueio por tentativa, captcha nem expiração de sessão: nada
 * disso protegeria nada aqui e só atrapalharia quem recebeu o link
 * legitimamente. O estado vive em memória (regra 6 do CLAUDE.md), então
 * recarregar pede a senha de novo — não existe sessão para expirar.
 *
 * Store à parte, pelo mesmo motivo da narrativa: `src/engine/store.ts` guarda o
 * que um humano decidiu sobre a onda. Quem entrou na sala não é decisão de
 * migração.
 */
import { create } from 'zustand'

/**
 * A credencial da demonstração. **Muda aqui e em nenhum outro lugar** — a tela
 * lê o usuário daqui para pré-preencher o campo.
 */
export const CREDENCIAL = { usuario: 'admin', senha: 'verene2026' } as const

/** Duração da transição para a cena 1 da narrativa. */
export const TRANSICAO_MS = 300

export function credencialConfere(usuario: string, senha: string): boolean {
  return usuario.trim() === CREDENCIAL.usuario && senha === CREDENCIAL.senha
}

export interface EntryState {
  /** `true` quando a tela de entrada já saiu de cena. */
  readonly liberado: boolean
  /** `true` durante a transição: a tela some, o app já está atrás dela. */
  readonly saindo: boolean

  liberar: () => void
  concluir: () => void
}

export const useEntry = create<EntryState>((set) => ({
  liberado: false,
  saindo: false,

  liberar: () => set({ saindo: true }),
  concluir: () => set({ liberado: true, saindo: false }),
}))
