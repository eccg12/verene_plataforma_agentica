/**
 * Validação de documentos fiscais brasileiros.
 *
 * O protótipo precisa distinguir CNPJ/CPF realmente inválido de CNPJ apenas mal
 * formatado — é o que sustenta a tela de defeitos de origem. Puro e
 * determinístico: mesma entrada, mesma saída.
 */

/** Só os dígitos. O extrato legado vem com máscara inconsistente. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function allSameDigit(digits: string): boolean {
  return /^(\d)\1*$/.test(digits)
}

function checkDigit(digits: readonly number[], weights: readonly number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * (weights[index] ?? 0), 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const

/** Dígitos verificadores de um CNPJ, a partir dos 12 primeiros dígitos. */
export function cnpjCheckDigits(base: string): string {
  const digits = [...onlyDigits(base).slice(0, 12)].map(Number)
  const first = checkDigit(digits, CNPJ_W1)
  const second = checkDigit([...digits, first], CNPJ_W2)
  return `${first}${second}`
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== 14 || allSameDigit(digits)) return false
  return cnpjCheckDigits(digits) === digits.slice(12)
}

/** Dígitos verificadores de um CPF, a partir dos 9 primeiros dígitos. */
export function cpfCheckDigits(base: string): string {
  const digits = [...onlyDigits(base).slice(0, 9)].map(Number)
  const calc = (source: readonly number[], start: number): number => {
    const sum = source.reduce((acc, digit, index) => acc + digit * (start - index), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  const first = calc(digits, 10)
  const second = calc([...digits, first], 11)
  return `${first}${second}`
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== 11 || allSameDigit(digits)) return false
  return cpfCheckDigits(digits) === digits.slice(9)
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value)
  if (d.length !== 14) return value
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value)
  if (d.length !== 11) return value
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Código de UF do IBGE — os dois primeiros dígitos do código de município. */
export const UF_IBGE_PREFIX = {
  RO: '11', AC: '12', AM: '13', RR: '14', PA: '15', AP: '16', TO: '17',
  MA: '21', PI: '22', CE: '23', RN: '24', PB: '25', PE: '26', AL: '27', SE: '28', BA: '29',
  MG: '31', ES: '32', RJ: '33', SP: '35',
  PR: '41', SC: '42', RS: '43',
  MS: '50', MT: '51', GO: '52', DF: '53',
} as const

export type Uf = keyof typeof UF_IBGE_PREFIX

/** O código de município do IBGE tem 7 dígitos e começa pelo código da UF. */
export function isIbgeCodeConsistent(code: string, uf: Uf): boolean {
  const digits = onlyDigits(code)
  return digits.length === 7 && digits.startsWith(UF_IBGE_PREFIX[uf])
}
