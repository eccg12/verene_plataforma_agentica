/**
 * Dicionário de mapeamento, campo a campo, por objeto de migração.
 *
 * Cada linha aponta para três lugares e não repete nenhum deles:
 *   `ruleId`        → a regra do playbook que faz a conversão
 *   `valueDomainId` → o domínio de valor lido da configuração VIVA do tenant
 *   `divergenciaId` → onde essa configuração sai do padrão SAP
 *
 * É por isso que a tela do LYRA consegue mostrar o domínio real sem tabela
 * paralela: ela lê `tenant-config.ts`, que é a configuração ativa da Verene.
 */
import type { MigrationObjectId } from '@/data/types'

export interface FieldMapping {
  readonly id: string
  readonly objeto: MigrationObjectId
  /** Campo no extrato do Nasajon. `—` quando o destino exige algo que a origem não tem. */
  readonly campoOrigem: string
  readonly campoOrigemDescricao: string
  readonly campoAlvo: string
  readonly campoAlvoDescricao: string
  readonly regraConversao: string
  /** Regra do playbook que executa. `null` quando é atravessamento direto. */
  readonly ruleId: string | null
  readonly valorPadrao: string | null
  readonly dependencia: string | null
  readonly tratamentoExcecao: string
  /** Domínio de valor em `tenant-config.ts`, quando o campo é de domínio fechado. */
  readonly valueDomainId: string | null
  readonly obrigatorio: boolean
  /** Divergência do padrão SAP que afeta este campo. */
  readonly divergenciaId: string | null
}

export const mappingDictionary: readonly FieldMapping[] = [
  // ==================== Business Partner (role fornecedor) ====================
  {
    id: 'MAP-BP-01', objeto: 'business-partner',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do fornecedor no Nasajon',
    campoAlvo: 'BUSINESS_PARTNER', campoAlvoDescricao: 'Número do Business Partner',
    regraConversao: 'Número atribuído na carga, dentro da faixa externa do grupo de contas.',
    ruleId: 'R-PKG-003', valorPadrao: null,
    dependencia: 'Depende de BP_GROUPING, que define a faixa.',
    tratamentoExcecao: 'Fora da faixa, o Migration Cockpit rejeita o lote inteiro. Reter antes de empacotar.',
    valueDomainId: null, obrigatorio: true, divergenciaId: 'DIV-01',
  },
  {
    id: 'MAP-BP-02', objeto: 'business-partner',
    campoOrigem: 'NATUREZA_PESSOA', campoOrigemDescricao: 'J para jurídica, F para física',
    campoAlvo: 'BP_GROUPING', campoAlvoDescricao: 'Grupo de contas do Business Partner',
    regraConversao: 'J para ZFOR, F para ZFPF.',
    ruleId: 'R-SUP-011', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Natureza ausente retém o registro: sem grupo de contas não há faixa de numeração.',
    valueDomainId: 'BP_GROUPING', obrigatorio: true, divergenciaId: 'DIV-01',
  },
  {
    id: 'MAP-BP-03', objeto: 'business-partner',
    campoOrigem: 'RAZAO_SOCIAL', campoOrigemDescricao: 'Razão social como está no legado',
    campoAlvo: 'NAME_ORG1 + NAME_ORG2', campoAlvoDescricao: 'Nome da organização, duas linhas de 40',
    regraConversao: 'Quebra na última palavra inteira antes do caractere 40; o resto vai para NAME_ORG2.',
    ruleId: 'R-SUP-023', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Acima de 80 caracteres, o excedente é truncado e registrado na trilha.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-04', objeto: 'business-partner',
    campoOrigem: 'CNPJ', campoOrigemDescricao: 'CNPJ com ou sem máscara',
    campoAlvo: 'TAX_NUMBER_BR1', campoAlvoDescricao: 'CNPJ',
    regraConversao: 'Remove a máscara. O dígito verificador é conferido na validação.',
    ruleId: 'R-SUP-020', valorPadrao: null,
    dependencia: 'Só se aplica a BP_GROUPING = ZFOR ou ZFOI.',
    tratamentoExcecao: 'Dígito verificador inválido retém o registro e volta para a origem. Não há correção por regra.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-05', objeto: 'business-partner',
    campoOrigem: 'CPF', campoOrigemDescricao: 'CPF com ou sem máscara',
    campoAlvo: 'TAX_NUMBER_BR2', campoAlvoDescricao: 'CPF',
    regraConversao: 'Remove a máscara. Dígito verificador conferido na validação.',
    ruleId: 'R-SUP-020', valorPadrao: null,
    dependencia: 'Só se aplica a BP_GROUPING = ZFPF.',
    tratamentoExcecao: 'Dígito verificador inválido retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-06', objeto: 'business-partner',
    campoOrigem: 'COND_PAGAMENTO', campoOrigemDescricao: 'Texto livre: "30 DD", "28/56 DD", "A VISTA"',
    campoAlvo: 'PAYMENT_TERMS', campoAlvoDescricao: 'Condição de pagamento',
    regraConversao: 'De-para fechado contra o domínio do tenant.',
    ruleId: 'R-SUP-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Texto sem entrada no domínio retém o registro. Criar entrada é decisão de configuração, não de migração.',
    valueDomainId: 'PAYMENT_TERMS', obrigatorio: true, divergenciaId: 'DIV-02',
  },
  {
    id: 'MAP-BP-07', objeto: 'business-partner',
    campoOrigem: 'RETENCOES', campoOrigemDescricao: 'Quatro booleanos: ISS, IRRF, INSS, PIS/COFINS/CSLL',
    campoAlvo: 'WITHHOLDING_TAX_TYPE', campoAlvoDescricao: 'Tipo de retenção',
    regraConversao: 'Cada booleano vira um código: IRRF I1, INSS N1, ISS S1, PIS/COFINS/CSLL C1.',
    ruleId: 'R-SUP-013', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Mesmo CPF com retenção divergente entre SPEs retém os dois lados e escala para o fiscal da Verene.',
    valueDomainId: 'WITHHOLDING_TAX', obrigatorio: true, divergenciaId: 'DIV-05',
  },
  {
    id: 'MAP-BP-08', objeto: 'business-partner',
    campoOrigem: 'CNAE', campoOrigemDescricao: 'CNAE de sete dígitos',
    campoAlvo: 'INDUSTRY', campoAlvoDescricao: 'Setor industrial',
    regraConversao: 'Atravessa sem tradução: o tenant usa o próprio código da CNAE.',
    ruleId: 'R-SUP-014', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'CNAE em branco retém o registro. A derivação a partir do ramo é regra candidata e não executa.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-09', objeto: 'business-partner',
    campoOrigem: 'MUNICIPIO + UF', campoOrigemDescricao: 'Nome do município e a UF',
    campoAlvo: 'TAXJURCODE', campoAlvoDescricao: 'Domicílio fiscal (código IBGE)',
    regraConversao: 'Usa o código IBGE do extrato; se vier vazio, deriva por nome e UF na tabela do IBGE.',
    ruleId: 'R-SUP-040', valorPadrao: null,
    dependencia: 'Depende de REGION estar preenchida.',
    tratamentoExcecao: 'Município fora da tabela de referência retém o registro. A esteira não inventa código.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-10', objeto: 'business-partner',
    campoOrigem: 'UF', campoOrigemDescricao: 'Sigla da unidade federativa',
    campoAlvo: 'REGION', campoAlvoDescricao: 'Região',
    regraConversao: 'Atravessa direto; conferido contra a lista de UF do IBGE.',
    ruleId: 'R-SUP-012', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'UF inexistente retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-11', objeto: 'business-partner',
    campoOrigem: 'CEP', campoOrigemDescricao: 'CEP com ou sem hífen',
    campoAlvo: 'POSTAL_CODE', campoAlvoDescricao: 'CEP',
    regraConversao: 'Remove a pontuação.',
    ruleId: 'R-SUP-024', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fora de oito dígitos, registra achado na perfilagem e segue: não bloqueia a carga.',
    valueDomainId: null, obrigatorio: false, divergenciaId: null,
  },
  {
    id: 'MAP-BP-12', objeto: 'business-partner',
    campoOrigem: 'DT_CADASTRO', campoOrigemDescricao: 'Data em DD/MM/AAAA ou AAAA-MM-DD',
    campoAlvo: 'CREATED_ON', campoAlvoDescricao: 'Data de criação',
    regraConversao: 'Normaliza os dois formatos para AAAA-MM-DD.',
    ruleId: 'R-SUP-021', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Data ilegível assume a data da carga e registra o desvio na trilha.',
    valueDomainId: null, obrigatorio: false, divergenciaId: null,
  },
  {
    id: 'MAP-BP-13', objeto: 'business-partner',
    campoOrigem: 'BANCO / AGENCIA / CONTA', campoOrigemDescricao: 'Dados bancários em três campos',
    campoAlvo: 'BANK_KEY / BANK_ACCOUNT', campoAlvoDescricao: 'Conta bancária do parceiro',
    regraConversao: 'Banco vira BANK_KEY pelo código FEBRABAN; agência e conta concatenam em BANK_ACCOUNT.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Conta ausente retém o registro: o tenant exige conta bancária no cadastro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  // ==================== Product master ====================
  {
    id: 'MAP-PM-01', objeto: 'product-master',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do material no Nasajon',
    campoAlvo: 'MATERIAL', campoAlvoDescricao: 'Número do material',
    regraConversao: 'Numeração interna do tenant; o código legado vai para o texto de busca.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Faixa esgotada para a carga. Estender é ação do Basis da Verene.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-02', objeto: 'product-master',
    campoOrigem: 'GRUPO_MERCADORIA', campoOrigemDescricao: 'Grupo interno do Nasajon',
    campoAlvo: 'MATERIAL_TYPE', campoAlvoDescricao: 'Tipo de material',
    regraConversao: 'EPI para ZEPI; condutor, isolador, ferragem e estrutura para ZMAN; o resto para HIBE.',
    ruleId: 'R-MAT-010', valorPadrao: 'HIBE',
    dependencia: null,
    tratamentoExcecao: 'Grupo desconhecido cai no padrão HIBE e registra achado; o critério é proxy, não regra do cliente.',
    valueDomainId: 'MATERIAL_TYPE', obrigatorio: true, divergenciaId: 'DIV-03',
  },
  {
    id: 'MAP-PM-03', objeto: 'product-master',
    campoOrigem: 'DESCRICAO', campoOrigemDescricao: 'Descrição livre do legado',
    campoAlvo: 'MATERIAL_DESCRIPTION', campoAlvoDescricao: 'Descrição do material',
    regraConversao: 'Atravessa como está. A padronização em TIPO + ESPECIFICAÇÃO + NORMA é regra candidata.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Descrição fora de padrão é registrada como achado não crítico e segue.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-04', objeto: 'product-master',
    campoOrigem: 'NCM', campoOrigemDescricao: 'NCM de oito dígitos',
    campoAlvo: 'NCM_CODE', campoAlvoDescricao: 'Classificação fiscal',
    regraConversao: 'Remove a máscara e confere o comprimento.',
    ruleId: 'R-MAT-020', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'NCM ausente retém: sem classificação fiscal não há cálculo de imposto no destino.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-05', objeto: 'product-master',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade do legado',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida base',
    regraConversao: 'De-para contra o domínio de unidades do tenant.',
    ruleId: 'R-CTR-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Unidade sem correspondente retém o registro.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-06', objeto: 'product-master',
    campoOrigem: 'ORIGEM_MERCADORIA', campoOrigemDescricao: 'Origem no padrão SPED: 0, 1 ou 2',
    campoAlvo: 'ORIGIN_MATERIAL', campoAlvoDescricao: 'Origem da mercadoria',
    regraConversao: 'Atravessa direto: os dois lados usam a codificação do SPED.',
    ruleId: null, valorPadrao: '0', dependencia: null,
    tratamentoExcecao: 'Origem ausente assume 0 (nacional) e registra o desvio.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  // ==================== Service master ====================
  {
    id: 'MAP-SM-01', objeto: 'service-master',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do serviço no Nasajon',
    campoAlvo: 'SERVICE_NUMBER', campoAlvoDescricao: 'Número do serviço',
    regraConversao: 'Faixa externa alfanumérica SV: o número vai na carga.',
    ruleId: 'R-PKG-003', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fora da faixa, o lote é rejeitado.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-02', objeto: 'service-master',
    campoOrigem: 'DESCRICAO_SERVICO', campoOrigemDescricao: 'Descrição da linha de serviço do contrato',
    campoAlvo: 'SHORT_TEXT', campoAlvoDescricao: 'Texto breve do serviço',
    regraConversao: 'Atravessa truncado em 40 caracteres.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Descrição vazia retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-03', objeto: 'service-master',
    campoOrigem: 'CENTRO_CUSTO', campoOrigemDescricao: 'Centro de custo da linha',
    campoAlvo: 'SERVICE_GROUP', campoAlvoDescricao: 'Grupo de serviço',
    regraConversao: 'De-para do centro de custo para o grupo de serviço do tenant.',
    ruleId: null, valorPadrao: 'ZLT',
    dependencia: 'Depende do objeto do contrato para desambiguar linha de transmissão de subestação.',
    tratamentoExcecao: 'Centro de custo sem correspondente cai em ZLT e registra achado.',
    valueDomainId: 'SERVICE_GROUP', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-04', objeto: 'service-master',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade da linha de serviço',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida base',
    regraConversao: 'M, MT e METRO convergem para M; as demais pelo domínio do tenant.',
    ruleId: 'R-CTR-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Unidade sem correspondente retém o registro.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  // ==================== Outline agreement ====================
  {
    id: 'MAP-OA-01', objeto: 'outline-agreement',
    campoOrigem: 'FORNECEDOR_CODIGO', campoOrigemDescricao: 'Código do fornecedor no contrato',
    campoAlvo: 'VENDOR', campoAlvoDescricao: 'Fornecedor (Business Partner)',
    regraConversao: 'Resolve para o Business Partner criado ou reusado na onda 1.',
    ruleId: 'R-SUP-044', valorPadrao: null,
    dependencia: 'Depende da onda 1 concluída. Contrato não carrega antes do fornecedor.',
    tratamentoExcecao: 'Fornecedor retido na onda 1 retém o contrato junto.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-02', objeto: 'outline-agreement',
    campoOrigem: 'TIPO', campoOrigemDescricao: 'Serviço, fornecimento ou locação',
    campoAlvo: 'AGREEMENT_TYPE', campoAlvoDescricao: 'Tipo de contrato',
    regraConversao: 'Serviço e locação para ZK01; fornecimento para ZK02.',
    ruleId: null, valorPadrao: 'ZK01', dependencia: null,
    tratamentoExcecao: 'Tipo ausente cai em ZK01 e registra achado.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-03', objeto: 'outline-agreement',
    campoOrigem: 'DATA_INICIO / DATA_FIM', campoOrigemDescricao: 'Vigência do contrato',
    campoAlvo: 'VALIDITY_START / VALIDITY_END', campoAlvoDescricao: 'Início e fim da validade',
    regraConversao: 'Normaliza para AAAA-MM-DD.',
    ruleId: 'R-SUP-021', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fim anterior ao início retém o contrato.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-04', objeto: 'outline-agreement',
    campoOrigem: 'VALOR_ORIGINAL', campoOrigemDescricao: 'Valor do cabeçalho do contrato',
    campoAlvo: 'TARGET_VALUE', campoAlvoDescricao: 'Valor previsto',
    regraConversao: 'Atravessa em BRL, conferido contra a soma das linhas.',
    ruleId: 'R-CTR-031', valorPadrao: null,
    dependencia: 'Depende das linhas estarem completas.',
    tratamentoExcecao: 'Cabeçalho que não bate com as linhas retém o contrato até a origem explicar.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-05', objeto: 'outline-agreement',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade da linha: M, MT ou METRO',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida da linha',
    regraConversao: 'As três grafias significam metro e convergem para M, com a quantidade inalterada.',
    ruleId: 'R-CTR-020', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Converter a quantidade junto seria inventar volume. A conversão é só de código.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-06', objeto: 'outline-agreement',
    campoOrigem: '—', campoOrigemDescricao: 'Não existe no extrato do Nasajon',
    campoAlvo: 'INCOTERMS', campoAlvoDescricao: 'Incoterms',
    regraConversao: 'Sem regra ativa. O tenant exige o campo e o legado não tem o dado.',
    ruleId: 'R-CTR-011', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Retém todos os contratos de serviço até a Verene definir um valor padrão ou liberar o campo.',
    valueDomainId: 'INCOTERMS', obrigatorio: true, divergenciaId: 'DIV-04',
  },
  {
    id: 'MAP-OA-07', objeto: 'outline-agreement',
    campoOrigem: '—', campoOrigemDescricao: 'Não existe no extrato do Nasajon',
    campoAlvo: 'PURCHASING_GROUP', campoAlvoDescricao: 'Grupo de compradores',
    regraConversao: 'Valor padrão único acordado para toda a carga.',
    ruleId: null, valorPadrao: 'V01', dependencia: null,
    tratamentoExcecao: 'Padrão aplicado a todos; a redistribuição por comprador é ajuste pós-carga da Verene.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
]

export const mappingByObjeto = (objeto: MigrationObjectId): readonly FieldMapping[] =>
  mappingDictionary.filter((m) => m.objeto === objeto)

/** Objetos que o dicionário cobre, na ordem de exibição. */
export const mappedObjects: readonly MigrationObjectId[] = [
  'business-partner',
  'product-master',
  'service-master',
  'outline-agreement',
]
