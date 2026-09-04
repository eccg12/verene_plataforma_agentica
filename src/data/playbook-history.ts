/**
 * Histórico de versões do playbook.
 *
 * Regra selada não muda: mudança de regra sobe versão (R-GOV-003). Este arquivo
 * é a prova disso — cada alteração tem versão, data, autor e motivo, e é daqui
 * que sai o histórico exibido no detalhe de cada regra.
 */

export type TipoAlteracao = 'criada' | 'alterada' | 'promovida' | 'aposentada'

export interface VersaoPlaybook {
  readonly versao: string
  readonly data: string
  readonly autor: string
  readonly resumo: string
  /** Selada = imutável. A versão corrente pode estar aberta a promoção de candidata. */
  readonly selada: boolean
}

export interface AlteracaoRegra {
  readonly ruleId: string
  readonly versao: string
  readonly data: string
  readonly tipo: TipoAlteracao
  readonly autor: string
  readonly nota: string
}

export const versoesPlaybook: readonly VersaoPlaybook[] = [
  {
    versao: 'v0.8.0',
    data: '2025-11-14',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Primeira publicação. Recepção e perfilagem (VEGA) e o de-para contra o tenant (LYRA), depois da leitura da configuração viva.',
    selada: true,
  },
  {
    versao: 'v0.9.0',
    data: '2025-12-09',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Transformação, deduplicação, enriquecimento e validação (ATLAS e NOVA). Entra o critério de sobrevivência e a validação contra os campos obrigatórios do tenant.',
    selada: true,
  },
  {
    versao: 'v1.0.0',
    data: '2026-01-08',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Empacotamento, reconciliação e governança (ORION, SIRIUS, KANON). Quatro regras entram como candidatas: são os casos em que o dado não decide sozinho.',
    selada: true,
  },
  {
    versao: 'v1.4.0',
    data: '2026-01-23',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Correção da quebra de NAME_ORG1: o corte passa a cair no último espaço antes do limite, e não no caractere 40. As versões v1.1.0 a v1.3.0 correram em outras ondas do programa e não tocam o escopo desta.',
    selada: true,
  },
]

/**
 * Ordem das versões. É a relação de ordem do playbook — KANON usa este índice
 * para saber que redação de uma regra está vigente numa versão.
 */
export const ordemDasVersoes: readonly string[] = versoesPlaybook.map((v) => v.versao)

/** Posição da versão na ordem. `-1` quando a versão não foi declarada. */
export function ordemDaVersao(versao: string): number {
  return ordemDasVersoes.indexOf(versao)
}

/** Versão em vigor na abertura desta onda. A onda pode adotar outra depois. */
export const versaoCorrente = 'v1.0.0'

export const alteracoesRegra: readonly AlteracaoRegra[] = [
  // --- v0.8.0
  { ruleId: 'R-SUP-002', versao: 'v0.8.0', data: '2025-11-14', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Medida em dígitos, não em texto: o extrato mistura CNPJ com e sem máscara.' },
  { ruleId: 'R-SUP-004', versao: 'v0.8.0', data: '2025-11-14', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Perfilar os dois formatos de data antes de converter, em vez de assumir um.' },
  { ruleId: 'R-SUP-010', versao: 'v0.8.0', data: '2025-11-18', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'De-para fechado contra PAYMENT_TERMS do tenant. Nenhuma condição padrão do SAP está ativa.' },
  { ruleId: 'R-SUP-011', versao: 'v0.8.0', data: '2025-11-18', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Grupo de contas define a faixa externa; errar aqui não se corrige depois.' },
  // --- v0.9.0
  { ruleId: 'R-SUP-010', versao: 'v0.9.0', data: '2025-12-02', tipo: 'alterada', autor: 'Rafael Queiroz',
    nota: 'Incluídas as variações "30/60 DD" e "30/60/90 DD", encontradas na perfilagem da SPE-1.' },
  { ruleId: 'R-SUP-023', versao: 'v0.9.0', data: '2025-12-04', tipo: 'criada', autor: 'Bruno Salgado',
    nota: 'NAME_ORG1 tem 40 caracteres. O que passa disso vai para NAME_ORG2.' },
  { ruleId: 'R-SUP-031', versao: 'v0.9.0', data: '2025-12-05', tipo: 'criada', autor: 'Ana Ribeiro',
    nota: 'Critério de sobrevivência por completude, com desempate por SPE e código.' },
  { ruleId: 'R-SUP-031', versao: 'v0.9.0', data: '2025-12-06', tipo: 'alterada', autor: 'Bruno Salgado',
    nota: 'Desempate acrescentado depois de a mesma entrada gerar sobrevivente diferente entre execuções.' },
  { ruleId: 'R-SUP-044', versao: 'v0.9.0', data: '2025-12-08', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Reuso de Business Partner existente. Recriar gera duplicata que só aparece no fechamento fiscal.' },
  // --- v1.0.0
  { ruleId: 'R-SUP-007', versao: 'v1.0.0', data: '2026-01-05', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Separar "município sem código" de "código errado" na perfilagem.' },
  { ruleId: 'R-SUP-047', versao: 'v1.0.0', data: '2026-01-06', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Retenção divergente do mesmo CPF entre SPEs passa a reter os dois lados e escalar.' },
  { ruleId: 'R-CTR-011', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Entra como candidata: o tenant exige Incoterms em contrato de serviço e o legado não tem o dado.' },
  { ruleId: 'R-SUP-033', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Candidata. Qual retenção sobrevive no cluster é decisão fiscal, não critério de dado.' },
  { ruleId: 'R-SUP-046', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Candidata. Derivar CNAE do ramo é proposta; erro de CNAE tem efeito fiscal.' },
  { ruleId: 'R-MAT-021', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Ana Ribeiro',
    nota: 'Candidata. Reescrever descrição é proposta: quem confere é quem compra.' },
  { ruleId: 'R-SUP-048', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Validação do nome quebrado, independente da regra que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.' },
  { ruleId: 'R-GOV-002', versao: 'v1.0.0', data: '2026-01-08', tipo: 'criada', autor: 'Patrícia Lemos',
    nota: 'Agente só executa regra publicada na versão em uso. É o que torna a tese verificável.' },
  { ruleId: 'R-PKG-002', versao: 'v1.0.0', data: '2026-01-08', tipo: 'criada', autor: 'Bruno Salgado',
    nota: 'O manifest passa a carregar versão e checksum do playbook, para a trilha sobreviver ao empacotamento.' },
  // --- v1.4.0
  { ruleId: 'R-SUP-023', versao: 'v1.4.0', data: '2026-01-23', tipo: 'alterada', autor: 'Rafael Queiroz',
    nota: 'O corte passa do caractere 40 para o último espaço antes dele. Oito razões sociais quebravam no meio da palavra, achadas pela R-SUP-048 na onda 1.' },
]

export function historicoDaRegra(ruleId: string): readonly AlteracaoRegra[] {
  return alteracoesRegra
    .filter((a) => a.ruleId === ruleId)
    .slice()
    .sort((a, b) => (a.versao + a.data < b.versao + b.data ? -1 : 1))
}
