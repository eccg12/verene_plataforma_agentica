/**
 * Flags de demonstração.
 *
 * Uma flag liga por parâmetro de URL (`?flag=comercial`) e vive em memória a
 * partir daí — nada de localStorage (regra 6 do CLAUDE.md). `reset()` na store
 * desliga tudo, então repetir a demonstração do zero volta ao estado discreto.
 *
 * Serve para o conteúdo que existe mas não deve estar na tela por padrão: o
 * painel que liga Gate a liberação de pagamento só aparece se for pedido.
 */

export const flagIds = ['comercial'] as const
export type FlagId = (typeof flagIds)[number]

/** Nome do parâmetro. Repetível: `?flag=comercial&flag=outra`. */
export const PARAM_FLAG = 'flag'

export const flagsDesligadas: Readonly<Record<FlagId, boolean>> = { comercial: false }

const conhecida = (valor: string): valor is FlagId => (flagIds as readonly string[]).includes(valor)

/** Flags pedidas na query string. Valor desconhecido é ignorado, não erra. */
export function flagsNaBusca(search: string): readonly FlagId[] {
  return new URLSearchParams(search).getAll(PARAM_FLAG).filter(conhecida)
}
