/**
 * Matemática de cor determinística, usada pelo design system para exibir e
 * conferir contraste. Sem I/O, sem aleatoriedade — mesma entrada, mesma saída.
 */

export type Rgb = readonly [number, number, number]

/** Aceita `#rgb`, `#rrggbb` e `rgb(r, g, b)` — o que `getComputedStyle` devolve. */
export function parseColor(input: string): Rgb | null {
  const value = input.trim()
  const rgbMatch = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch
    return [Number(r), Number(g), Number(b)]
  }
  const hex = value.replace('#', '')
  if (hex.length === 3 && /^[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = [...hex].map((c) => parseInt(c + c, 16))
    return [r as number, g as number, b as number]
  }
  if (hex.length === 6 && /^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb
  }
  return null
}

export function toHex(rgb: Rgb): string {
  return '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function channelLuminance(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(channelLuminance) as unknown as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG 2.1 entre duas cores. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

export type WcagGrade = 'AAA' | 'AA' | 'AA-large' | 'reprovado'

export function wcagGrade(ratio: number): WcagGrade {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA-large'
  return 'reprovado'
}
