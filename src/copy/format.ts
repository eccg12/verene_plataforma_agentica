/**
 * Formatação brasileira de data, hora e número.
 *
 * Vive junto do texto porque é a mesma decisão: o que o usuário lê. Espalhar
 * `slice(8, 10)` pelas telas é como espalhar string pelo JSX — funciona até uma
 * tela divergir das outras, e aí o cliente vê 2026-01-23 numa e 23/01/2026 na
 * seguinte.
 *
 * Não usa `Date.now()`: recebe sempre o instante já derivado do epoch fixo da
 * simulação (regra 4).
 */

/** `2026-01-23` ou ISO completo → `23/01/2026`. */
export function dataBr(iso: string): string {
  if (iso.length < 10) return iso
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** ISO completo → `23/01/2026 09:00`. Sem o instante, cai para só a data. */
export function dataHoraBr(iso: string): string {
  const data = dataBr(iso)
  return iso.length >= 16 ? `${data} ${iso.slice(11, 16)}` : data
}

/** ISO completo → `09:00:45`. Usado na trilha, onde a data é sempre a mesma. */
export function horaBr(iso: string): string {
  return iso.length >= 19 ? iso.slice(11, 19) : iso
}

/** `1120` → `1.120`. */
export function numeroBr(n: number): string {
  return n.toLocaleString('pt-BR')
}

/**
 * `57.7` → `57,7`. Decimal com vírgula, como o resto do país escreve.
 *
 * O símbolo de porcento vem de `strings.simbolos`, não daqui: ele é texto.
 */
export function percentualBr(n: number, casas = 1): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

/** `741613.7` → `R$ 741.613,70`. */
export function moedaBr(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
