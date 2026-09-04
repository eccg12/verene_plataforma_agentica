/**
 * Aleatoriedade determinística.
 *
 * `Math.random` é proibido em runtime (regra 4 do CLAUDE.md). Toda variação
 * aparente na simulação sai daqui, derivada de uma seed estável — tipicamente
 * `id do cenário + versão do playbook`. Mesma seed, mesma sequência, sempre.
 */

/** Hash de string estável de 32 bits (FNV-1a). Determinístico entre execuções. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Gerador pseudoaleatório: retorna valores em [0, 1). */
export type Rng = () => number

/** Cria um gerador determinístico (mulberry32) a partir de uma seed. */
export function createRng(seed: number | string): Rng {
  let state = (typeof seed === 'string' ? hashSeed(seed) : seed >>> 0) || 1
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Inteiro determinístico no intervalo fechado [min, max]. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Elemento determinístico de uma lista não vazia. */
export function pick<T>(rng: Rng, items: readonly [T, ...T[]]): T {
  return items[Math.floor(rng() * items.length)] ?? items[0]
}
