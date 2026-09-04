/**
 * A regra candidata que o agente evidencia e NÃO confirma.
 *
 * Este arquivo carrega duas coisas: o vínculo do caso (qual regra candidata,
 * qual tipo de defeito) e a **resposta de referência** — o texto pré-gravado que
 * entra quando a chamada ao vivo não completa.
 *
 * O fallback não é conforto: é requisito. A tela de contenção é a que mais
 * sustenta a confiança na demonstração, e ela nunca pode aparecer vazia porque a
 * rede caiu, a chave não estava presente ou o build foi servido como estático.
 */

/** A regra candidata do caso: "retenções do sobrevivente = ?" (ATLAS). */
export const REGRA_CANDIDATA = 'R-SUP-033'

/** O defeito que a esteira abre quando encontra a divergência. */
export const TIPO_DE_DEFEITO = 'DEF-TGT-04'

/** Rota do proxy. A ÚNICA chamada de rede do projeto sai daqui. */
export const ROTA_DA_HIPOTESE = '/api/regra-candidata'

/** Modelo consultado. Trocar aqui troca em todo lugar. */
export const MODELO = 'claude-sonnet-4-6'

export type OrigemDaHipotese = 'ao-vivo' | 'referencia'

export interface HipoteseDeRegra {
  /** A hipótese de regra, em uma ou duas frases. */
  readonly enunciado: string
  /** Os registros e observações que sustentam a hipótese. Cada item cita um código. */
  readonly evidencia: readonly string[]
  /** O que o modelo NÃO consegue confirmar. É a parte que não pode faltar. */
  readonly naoConfirmavel: string
  readonly origem: OrigemDaHipotese
}

/**
 * Resposta de referência.
 *
 * Foi escrita à mão, com o mesmo formato que a chamada ao vivo devolve, a partir
 * dos mesmos quatro registros. Não é a saída de nenhuma execução específica — é
 * o que a tela mostra quando não há execução.
 */
export const hipoteseDeReferencia: HipoteseDeRegra = {
  enunciado:
    'Os quatro cadastros sugerem que a retenção do mesmo prestador pessoa física está sendo decidida por SPE, e não pelo prestador: a SPE-1 e a SPE-2 retêm mais do que a SPE-3 e a SPE-4 sobre exatamente os mesmos CPF, atividade e condição de pagamento. A hipótese é que exista uma prática de retenção por empresa adquirida que nunca foi escrita.',
  evidencia: [
    'F1009 (SPE-1) e F3007 (SPE-3) têm o mesmo CPF 128.459.376-28, o mesmo CNAE 7119-7/01 e a mesma condição 15 DD; a SPE-1 retém INSS e a SPE-3 não.',
    'F2008 (SPE-2) e F4007 (SPE-4) têm o mesmo CPF 247.093.615-25 e o mesmo CNAE 4321-5/00; o ISS é retido a 5% na SPE-2 e a 2% na SPE-4.',
    'Nos dois pares a divergência acompanha a SPE, não o prestador: as SPEs de origem mais antiga retêm mais.',
    'Nenhum dos quatro cadastros registra município de prestação diferente, o que descartaria a hipótese mais óbvia de alíquota municipal distinta.',
  ],
  naoConfirmavel:
    'Não é possível determinar, a partir do dado, qual dos dois tratamentos é o correto. As duas leituras cabem: pode ser prática divergente de uma das adquiridas, a ser uniformizada, ou pode ser tratamento legítimo por município de prestação que o extrato não carrega. A escolha é fiscal e tem efeito retroativo — precisa vir da Verene.',
  origem: 'referencia',
}
