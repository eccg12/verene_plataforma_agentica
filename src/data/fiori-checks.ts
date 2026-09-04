/**
 * Verificação guiada nos apps Fiori, por objeto.
 *
 * Reconciliação por contagem prova que o número de registros fecha. Não prova
 * que o registro está certo. A verificação nos apps é o que fecha essa lacuna:
 * um humano abre o app, procura o registro nomeado e confere os campos
 * listados. O resultado vira evidência do Gate.
 */
import type { GateId } from '@/data/gates'
import type { MigrationObjectId } from '@/data/types'

export interface PassoVerificacao {
  readonly ordem: number
  readonly instrucao: string
  /** Campo do destino a conferir. */
  readonly campo: string
}

export interface VerificacaoFiori {
  readonly id: string
  readonly objeto: MigrationObjectId
  /** Nome do app Fiori no tenant. */
  readonly app: string
  readonly appId: string
  readonly gate: GateId
  /** Registro concreto a abrir, para a verificação não ser genérica. */
  readonly registroExemplo: string
  readonly passos: readonly PassoVerificacao[]
}

export const verificacoesFiori: readonly VerificacaoFiori[] = [
  {
    id: 'VF-BP', objeto: 'business-partner', app: 'Manage Business Partner Master Data',
    appId: 'F0850A', gate: 'G6', registroExemplo: 'F1001',
    passos: [
      { ordem: 1, instrucao: 'Abrir o Business Partner pelo CNPJ e conferir que existe um só cadastro para o documento.', campo: 'TAX_NUMBER_BR1' },
      { ordem: 2, instrucao: 'Conferir a razão social nas duas linhas de nome, sem palavra cortada ao meio.', campo: 'NAME_ORG1 / NAME_ORG2' },
      { ordem: 3, instrucao: 'Conferir grupo de contas e faixa de numeração externa.', campo: 'BP_GROUPING' },
      { ordem: 4, instrucao: 'Conferir domicílio fiscal contra o município do extrato.', campo: 'TAXJURCODE' },
      { ordem: 5, instrucao: 'Conferir o tipo de retenção configurado.', campo: 'WITHHOLDING_TAX_TYPE' },
    ],
  },
  {
    id: 'VF-PM', objeto: 'product-master', app: 'Manage Product Master Data',
    appId: 'F1602', gate: 'G6', registroExemplo: 'MAT-1001',
    passos: [
      { ordem: 1, instrucao: 'Abrir o material e conferir o tipo de material atribuído.', campo: 'MATERIAL_TYPE' },
      { ordem: 2, instrucao: 'Conferir a classificação fiscal e a origem da mercadoria.', campo: 'NCM_CODE' },
      { ordem: 3, instrucao: 'Conferir a unidade de medida base contra a do extrato.', campo: 'BASE_UOM' },
    ],
  },
  {
    id: 'VF-SM', objeto: 'service-master', app: 'Manage Service Master',
    appId: 'F4072', gate: 'G6', registroExemplo: 'CTR-2023-404~10',
    passos: [
      { ordem: 1, instrucao: 'Abrir o serviço e conferir o grupo de serviço derivado do centro de custo.', campo: 'SERVICE_GROUP' },
      { ordem: 2, instrucao: 'Conferir o texto breve, truncado em 40 sem cortar palavra.', campo: 'SHORT_TEXT' },
    ],
  },
  {
    id: 'VF-OA', objeto: 'outline-agreement', app: 'Manage Purchase Contracts',
    appId: 'F1600', gate: 'G6', registroExemplo: 'CTR-2023-101',
    passos: [
      { ordem: 1, instrucao: 'Abrir o contrato e conferir o fornecedor contra o Business Partner da onda 1.', campo: 'VENDOR' },
      { ordem: 2, instrucao: 'Conferir o valor previsto contra a soma das linhas.', campo: 'TARGET_VALUE' },
      { ordem: 3, instrucao: 'Conferir a unidade de medida da linha, normalizada para M.', campo: 'BASE_UOM' },
      { ordem: 4, instrucao: 'Conferir a vigência.', campo: 'VALIDITY_START / VALIDITY_END' },
    ],
  },
]
