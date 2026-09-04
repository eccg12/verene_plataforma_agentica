/**
 * Tempo determinístico.
 *
 * `Date.now()` quebraria a reprodutibilidade da simulação (regra 4 do CLAUDE.md):
 * a mesma execução renderizaria timestamps diferentes a cada carregamento. Todo
 * instante exibido na UI é derivado deste epoch fixo.
 */

/** Instante de referência da demonstração (UTC). */
export const SIM_EPOCH_MS = Date.UTC(2026, 0, 12, 9, 0, 0)

/** Retorna o instante da simulação deslocado em `offsetMs` a partir do epoch. */
export function simInstant(offsetMs = 0): Date {
  return new Date(SIM_EPOCH_MS + offsetMs)
}

export const MINUTE_MS = 60_000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS
