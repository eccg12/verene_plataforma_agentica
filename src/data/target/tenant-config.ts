/**
 * Configuração do tenant S/4HANA vivo da Verene, como o LYRA a lê.
 *
 * Este arquivo é o argumento da tela do LYRA: a migração não é contra o SAP
 * padrão, é contra ESTE tenant. Onde a Verene divergiu do padrão, o de-para
 * deixa de ser mecânico e vira decisão — e decisão que ninguém escreveu.
 *
 * As divergências estão em `divergenciasDoPadraoSap`, cada uma ligada aos
 * objetos de migração que ela afeta.
 */
import type { MigrationObjectId } from '@/data/types'

export interface ValueDomainEntry {
  readonly codigo: string
  readonly texto: string
}

export interface ValueDomain {
  readonly id: string
  readonly nome: string
  readonly entradas: readonly ValueDomainEntry[]
  readonly divergeDoPadraoSap: boolean
}

export interface NumberRange {
  readonly objeto: MigrationObjectId
  /** Grupo de contas / tipo ao qual a faixa se aplica. */
  readonly grupo: string
  readonly intervalo: string
  readonly de: string
  readonly ate: string
  readonly tipo: 'interno' | 'externo'
  readonly divergeDoPadraoSap: boolean
}

export interface RequiredField {
  readonly objeto: MigrationObjectId
  readonly campo: string
  readonly descricao: string
  readonly obrigatorio: boolean
  /** `false` = a obrigatoriedade é customização da Verene, não do SAP padrão. */
  readonly padraoSap: boolean
}

export interface DivergenciaPadrao {
  readonly id: string
  readonly titulo: string
  readonly descricao: string
  readonly padraoSap: string
  readonly configuracaoVerene: string
  readonly objetos: readonly MigrationObjectId[]
  readonly impacto: string
}

export const tenantId = 'VRN-S4-PRD'
export const tenantRelease = 'S/4HANA 2023 FPS02'

export const valueDomains: readonly ValueDomain[] = [
  {
    id: 'BP_GROUPING', nome: 'Grupo de contas de Business Partner', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZFOR', texto: 'Fornecedor nacional pessoa jurídica' },
      { codigo: 'ZFPF', texto: 'Fornecedor nacional pessoa física' },
      { codigo: 'ZFOI', texto: 'Fornecedor internacional' },
    ],
  },
  {
    id: 'PAYMENT_TERMS', nome: 'Condições de pagamento', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZAVI', texto: 'À vista' },
      { codigo: 'Z015', texto: '15 dias da data' },
      { codigo: 'Z028', texto: '28 dias da data' },
      { codigo: 'Z030', texto: '30 dias da data' },
      { codigo: 'Z045', texto: '45 dias da data' },
      { codigo: 'Z2856', texto: '28/56 dias da data' },
      { codigo: 'Z3060', texto: '30/60 dias da data' },
      { codigo: 'Z306090', texto: '30/60/90 dias da data' },
    ],
  },
  {
    id: 'UOM', nome: 'Unidades de medida', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'M', texto: 'Metro' },
      { codigo: 'KM', texto: 'Quilômetro' },
      { codigo: 'KG', texto: 'Quilograma' },
      { codigo: 'L', texto: 'Litro' },
      { codigo: 'ST', texto: 'Unidade' },
      { codigo: 'PAA', texto: 'Par' },
      { codigo: 'H', texto: 'Hora' },
      { codigo: 'DAY', texto: 'Dia' },
      { codigo: 'MON', texto: 'Mês' },
      { codigo: 'LE', texto: 'Verba' },
    ],
  },
  {
    id: 'MATERIAL_TYPE', nome: 'Tipo de material', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZMAN', texto: 'Material de manutenção de linha' },
      { codigo: 'ERSA', texto: 'Peça de reposição' },
      { codigo: 'HIBE', texto: 'Material auxiliar de consumo' },
      { codigo: 'ZEPI', texto: 'Equipamento de proteção individual' },
    ],
  },
  {
    id: 'SERVICE_GROUP', nome: 'Grupo de serviço', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZLT', texto: 'Serviço em linha de transmissão' },
      { codigo: 'ZSE', texto: 'Serviço em subestação' },
      { codigo: 'ZENG', texto: 'Engenharia e projeto' },
      { codigo: 'ZAMB', texto: 'Serviço ambiental e de faixa' },
      { codigo: 'ZLOC', texto: 'Locação de equipamento' },
    ],
  },
  {
    id: 'WITHHOLDING_TAX', nome: 'Tipos de retenção', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'I1', texto: 'IRRF sobre serviço' },
      { codigo: 'N1', texto: 'INSS sobre cessão de mão de obra' },
      { codigo: 'S1', texto: 'ISS retido na fonte' },
      { codigo: 'C1', texto: 'CSLL/PIS/COFINS' },
    ],
  },
  {
    id: 'INCOTERMS', nome: 'Incoterms', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'EXW', texto: 'Ex Works' },
      { codigo: 'FCA', texto: 'Free Carrier' },
      { codigo: 'CIF', texto: 'Cost, Insurance and Freight' },
      { codigo: 'DAP', texto: 'Delivered at Place' },
    ],
  },
]

export const numberRanges: readonly NumberRange[] = [
  { objeto: 'business-partner', grupo: 'ZFOR', intervalo: 'Z1', de: '1000000000', ate: '1499999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'business-partner', grupo: 'ZFPF', intervalo: 'Z2', de: '1500000000', ate: '1799999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'business-partner', grupo: 'ZFOI', intervalo: 'Z3', de: '1800000000', ate: '1999999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'product-master', grupo: 'ZMAN', intervalo: '01', de: '100000', ate: '199999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'product-master', grupo: 'ZEPI', intervalo: '02', de: '200000', ate: '249999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'service-master', grupo: 'ZLT', intervalo: 'SV', de: 'SV00000001', ate: 'SV00099999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'outline-agreement', grupo: 'ZK01', intervalo: '46', de: '4600000000', ate: '4699999999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'purchase-order', grupo: 'ZNB', intervalo: '45', de: '4500000000', ate: '4599999999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'purchase-requisition', grupo: 'ZNB', intervalo: '10', de: '1000000000', ate: '1099999999', tipo: 'interno', divergeDoPadraoSap: false },
]

export const requiredFields: readonly RequiredField[] = [
  // Business Partner — role fornecedor
  { objeto: 'business-partner', campo: 'BP_GROUPING', descricao: 'Grupo de contas', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'NAME_ORG1', descricao: 'Razão social', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAX_NUMBER_BR1', descricao: 'CNPJ', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAX_NUMBER_BR2', descricao: 'CPF', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'REGION', descricao: 'UF', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAXJURCODE', descricao: 'Código de município (domicílio fiscal)', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'INDUSTRY', descricao: 'CNAE', obrigatorio: true, padraoSap: false },
  { objeto: 'business-partner', campo: 'WITHHOLDING_TAX_TYPE', descricao: 'Tipo de retenção', obrigatorio: true, padraoSap: false },
  { objeto: 'business-partner', campo: 'PAYMENT_TERMS', descricao: 'Condição de pagamento', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'BANK_ACCOUNT', descricao: 'Conta bancária', obrigatorio: true, padraoSap: false },
  // Product master
  { objeto: 'product-master', campo: 'MATERIAL_TYPE', descricao: 'Tipo de material', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'MATERIAL_DESCRIPTION', descricao: 'Descrição', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'BASE_UOM', descricao: 'Unidade de medida base', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'NCM_CODE', descricao: 'NCM', obrigatorio: true, padraoSap: false },
  { objeto: 'product-master', campo: 'ORIGIN_MATERIAL', descricao: 'Origem da mercadoria', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'MATERIAL_GROUP', descricao: 'Grupo de mercadoria', obrigatorio: true, padraoSap: true },
  // Service master
  { objeto: 'service-master', campo: 'SERVICE_NUMBER', descricao: 'Número do serviço', obrigatorio: true, padraoSap: true },
  { objeto: 'service-master', campo: 'SERVICE_GROUP', descricao: 'Grupo de serviço', obrigatorio: true, padraoSap: false },
  { objeto: 'service-master', campo: 'BASE_UOM', descricao: 'Unidade de medida base', obrigatorio: true, padraoSap: true },
  { objeto: 'service-master', campo: 'SHORT_TEXT', descricao: 'Texto breve', obrigatorio: true, padraoSap: true },
  // Outline agreement
  { objeto: 'outline-agreement', campo: 'VENDOR', descricao: 'Fornecedor (Business Partner)', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'AGREEMENT_TYPE', descricao: 'Tipo de contrato', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'VALIDITY_START', descricao: 'Início da validade', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'VALIDITY_END', descricao: 'Fim da validade', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'TARGET_VALUE', descricao: 'Valor previsto', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'INCOTERMS', descricao: 'Incoterms', obrigatorio: true, padraoSap: false },
  { objeto: 'outline-agreement', campo: 'PURCHASING_GROUP', descricao: 'Grupo de compradores', obrigatorio: true, padraoSap: true },
]

/**
 * Onde este tenant sai do padrão SAP. É o que transforma de-para em decisão.
 */
export const divergenciasDoPadraoSap: readonly DivergenciaPadrao[] = [
  {
    id: 'DIV-01',
    titulo: 'Business Partner de fornecedor com numeração externa',
    descricao:
      'Os três grupos de contas de fornecedor (ZFOR, ZFPF, ZFOI) usam faixa externa. O número do Business Partner tem que ser fornecido na carga, não é gerado pelo sistema.',
    padraoSap: 'Grupo de contas de fornecedor com numeração interna, gerada no momento da criação.',
    configuracaoVerene: 'Faixas Z1/Z2/Z3 externas, de 1000000000 a 1999999999.',
    objetos: ['business-partner'],
    impacto:
      'A carga precisa decidir e carregar o número de cada Business Partner. Errar aqui não dá erro na hora — dá fornecedor duplicado depois.',
  },
  {
    id: 'DIV-02',
    titulo: 'Condições de pagamento inteiramente customizadas',
    descricao:
      'Nenhuma condição de pagamento padrão do SAP está ativa. Todas são Z-customizadas, e o Nasajon guarda a condição como texto livre ("28/56 DD", "A VISTA", "30 DD").',
    padraoSap: 'Condições padrão (NT30, NT60 e afins) disponíveis de fábrica.',
    configuracaoVerene: 'Oito condições Z, de ZAVI a Z306090.',
    objetos: ['business-partner', 'outline-agreement', 'purchase-order'],
    impacto:
      'O de-para de condição de pagamento é texto livre para código. Toda variação de grafia no legado precisa de regra — e o legado tem mais variação do que o domínio tem código.',
  },
  {
    id: 'DIV-03',
    titulo: 'Tipo de material ZMAN sem regra de decisão escrita',
    descricao:
      'A Verene criou ZMAN para material de manutenção de linha, além de ZEPI para equipamento de proteção. O legado não tem campo que diga qual material é qual.',
    padraoSap: 'Tipos padrão ERSA (peça de reposição) e HIBE (material auxiliar) cobrem o caso.',
    configuracaoVerene: 'ZMAN e ZEPI convivendo com ERSA e HIBE, sem critério documentado.',
    objetos: ['product-master'],
    impacto:
      'A classificação depende de conhecimento que só existe na cabeça do time de suprimentos. É candidata a virar regra explícita.',
  },
  {
    id: 'DIV-04',
    titulo: 'Incoterms obrigatório no Outline agreement',
    descricao:
      'O tenant exige Incoterms em todo contrato, inclusive em contrato de serviço. Contrato de serviço do Nasajon não tem esse dado.',
    padraoSap: 'Incoterms é opcional em contrato de serviço.',
    configuracaoVerene: 'Campo marcado como obrigatório para todos os tipos de contrato.',
    objetos: ['outline-agreement'],
    impacto:
      'Todos os 18 contratos de serviço do escopo entram sem Incoterms. Ou se define um valor padrão, ou a carga para.',
  },
  {
    id: 'DIV-05',
    titulo: 'Tipo de retenção obrigatório no Business Partner',
    descricao:
      'O cadastro de fornecedor exige tipo e código de retenção preenchidos. No Nasajon a retenção está espalhada em quatro campos booleanos por SPE, e as SPEs divergem entre si para o mesmo prestador.',
    padraoSap: 'Retenção é opcional no Business Partner; pode ser resolvida no lançamento.',
    configuracaoVerene: 'WITHHOLDING_TAX_TYPE obrigatório em ZFOR e ZFPF.',
    objetos: ['business-partner'],
    impacto:
      'Sem uma regra única de retenção não há carga de fornecedor. É a divergência que obriga a decisão a subir para o cliente.',
  },
]

/** Padrão de descrição que o tenant espera no Product master. */
export const padraoDescricaoMaterial = {
  formato: 'TIPO + ESPECIFICAÇÃO + NORMA/CLASSE',
  exemplo: 'CABO CAA 336,4 MCM LINNET',
  proibido: [
    'texto em caixa baixa',
    'recado de comprador ou nome de pessoa',
    'marcação de urgência ou de estoque',
    'status do item (use o campo de bloqueio)',
    'pendência documental',
  ],
} as const
