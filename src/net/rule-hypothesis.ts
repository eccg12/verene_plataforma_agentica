/**
 * A ÚNICA porta de rede do KEPLER.
 *
 * Todo o resto do protótipo é fixture e simulação determinística. Este arquivo é
 * a exceção autorizada da regra 1 do CLAUDE.md, e vive em diretório próprio
 * justamente para que ela seja estrutural e não uma linha perdida no motor: se
 * `src/net/` tem um arquivo só, é fácil auditar que a exceção é uma só.
 *
 * NUNCA LANÇA. A tela de regra candidata é a que mais sustenta a confiança da
 * demonstração; ela não pode aparecer vazia porque a chamada falhou. Sem chave,
 * fora do servidor de desenvolvimento, com a rede caída, com 429, com JSON
 * malformado ou com o build servido como estático, a resposta é a mesma: o texto
 * de referência de `src/data/candidate-hypothesis.ts`, sem erro na tela.
 *
 * O que volta daqui é APRESENTAÇÃO. Não entra na esteira, não entra em checksum,
 * não entra em pacote. O determinismo da simulação (regra 4) continua intacto
 * porque a saída do modelo não alimenta nada que seja derivado.
 */
import {
  hipoteseDeReferencia,
  ROTA_DA_HIPOTESE,
  type HipoteseDeRegra,
} from '@/data/candidate-hypothesis'

const TIMEOUT_MS = 18_000

export interface EntradaDaHipotese {
  /** Os registros divergentes, como o motor os derivou das fixtures. */
  readonly registros: unknown
  /** A regra candidata em aberto no playbook. */
  readonly regra: unknown
}

interface RespostaDaRota {
  /** `false` quando o servidor não tinha como gerar — sem chave, sem rede, formato ruim. */
  readonly disponivel?: unknown
  readonly enunciado?: unknown
  readonly evidencia?: unknown
  readonly naoConfirmavel?: unknown
}

/**
 * Pede a hipótese ao modelo. Devolve a resposta ao vivo quando ela chega íntegra,
 * e a de referência em qualquer outro caso.
 *
 * `fetch` é injetável só para o teste poder simular falha sem tocar a rede.
 */
export async function pedirHipotese(
  entrada: EntradaDaHipotese,
  buscar: typeof fetch = fetch,
): Promise<HipoteseDeRegra> {
  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS)
  try {
    const resposta = await buscar(ROTA_DA_HIPOTESE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entrada),
      signal: controle.signal,
    })
    // A rota responde 200 mesmo quando não tem hipótese: ausência não é erro, e
    // um 5xx só pintaria o console de vermelho na frente do cliente. `!ok` fica
    // por segurança, para o caso de o endpoint nem existir (dist estático).
    if (!resposta.ok) return hipoteseDeReferencia

    const corpo = (await resposta.json()) as RespostaDaRota
    if (corpo.disponivel === false) return hipoteseDeReferencia
    const evidencia = Array.isArray(corpo.evidencia)
      ? corpo.evidencia.filter((e): e is string => typeof e === 'string' && e.trim() !== '')
      : []
    if (
      typeof corpo.enunciado !== 'string' ||
      corpo.enunciado.trim() === '' ||
      typeof corpo.naoConfirmavel !== 'string' ||
      corpo.naoConfirmavel.trim() === '' ||
      evidencia.length === 0
    ) {
      return hipoteseDeReferencia
    }

    return {
      enunciado: corpo.enunciado,
      evidencia,
      naoConfirmavel: corpo.naoConfirmavel,
      origem: 'ao-vivo',
    }
  } catch {
    return hipoteseDeReferencia
  } finally {
    clearTimeout(relogio)
  }
}
