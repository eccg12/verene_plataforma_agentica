/**
 * GALAXY data playbook v1 — as regras como ESTRUTURA DE DADOS.
 *
 * Esta é a tese da plataforma, em forma executável: a regra vive num lugar só,
 * versionada, e os agentes a executam. Nenhum agente decide o que fazer — cada
 * um resolve, no playbook, as regras do seu passo, e aplica. O que o agente faz
 * com uma regra está em `src/engine/rules.ts`, indexado pelo `id` da regra; o
 * que a regra DIZ está aqui.
 *
 * Consequência prática: mudar comportamento sem mexer no playbook é impossível,
 * porque a esteira recusa executar regra que não esteja publicada nesta versão
 * (ver `resolveRules` em `src/engine/kanon.ts`).
 *
 * NATUREZA. `deterministic` é regra que vira código: a saída é função da
 * entrada, sempre a mesma. `generative` é PROPOSTA de regra — o agente
 * identificou um padrão e sugere uma regra candidata, mas ela não executa
 * enquanto um humano não promover. Toda regra generativa aqui aponta para uma
 * lacuna real dos dados ou uma divergência do tenant.
 */
import type { AgentName } from '@/data/agents'

/** Os oito tipos de regra do playbook. */
export const ruleTypes = [
  'format',
  'domain',
  'length',
  'referential',
  'conversion',
  'derivation',
  'business',
  'survivorship',
] as const
export type RuleType = (typeof ruleTypes)[number]

/**
 * `deterministic` executa. `generative` é candidata: aparece na tela como
 * proposta, com o achado que a motivou, e só executa depois de promovida.
 */
export type RuleNature = 'deterministic' | 'generative'

/** `active` executa nesta versão. `candidate` aguarda promoção. `deprecated` fica no histórico. */
export type RuleStatus = 'active' | 'candidate' | 'deprecated'

export interface PlaybookRule {
  /** Identificador estável. Aparece na trilha de todo registro que a regra tocou. */
  readonly id: string
  readonly agent: AgentName
  /** Objeto de escopo ao qual a regra se aplica. */
  readonly object: 'fornecedores' | 'materiais-servicos' | 'contratos' | 'transversal'
  /** Campo alvo, no nome do legado ou do destino. `*` quando vale para o registro inteiro. */
  readonly field: string
  readonly type: RuleType
  /** Expressão legível. Notação do playbook, para ser lida por quem assina, não pelo compilador. */
  readonly expression: string
  /** Por que a regra existe. É o que vai para a documentação gerada por KANON. */
  readonly rationale: string
  /** Quem responde pela regra. Parte · área. */
  readonly owner: string
  /** Versão do playbook em que esta regra está publicada. */
  readonly playbookVersion: string
  /** Versão em que a regra ENTROU. Pode ser anterior à publicada. */
  readonly introducedIn: string
  readonly createdAt: string
  readonly status: RuleStatus
  readonly nature: RuleNature
}

export const PLAYBOOK_VERSION = 'v1.0.0'
const V1 = PLAYBOOK_VERSION
const D = '2026-01-08'

export const playbookRules: readonly PlaybookRule[] = [
  // ============ VEGA — recepção e perfilagem ============
  { id: 'R-SUP-001', agent: 'VEGA', object: 'fornecedores', field: 'codigo', type: 'format',
    expression: 'codigo ≠ vazio ∧ único dentro da SPE',
    rationale: 'Sem chave estável no legado não há como rastrear o registro da origem até a carga.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-002', agent: 'VEGA', object: 'fornecedores', field: 'cnpjCpf', type: 'format',
    expression: 'naturezaPessoa = "J" → length(digitos(cnpjCpf)) = 14',
    rationale: 'O extrato traz CNPJ com e sem máscara. A perfilagem mede o comprimento em dígitos, não o texto.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-003', agent: 'VEGA', object: 'fornecedores', field: 'cnpjCpf', type: 'format',
    expression: 'naturezaPessoa = "F" → length(digitos(cnpjCpf)) = 11',
    rationale: 'Mesma medida para pessoa física.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-004', agent: 'VEGA', object: 'fornecedores', field: 'dataCadastro', type: 'format',
    expression: 'dataCadastro ∈ {DD/MM/AAAA, AAAA-MM-DD}',
    rationale: 'As SPEs foram cadastradas em épocas diferentes e o extrato mistura os dois formatos. Perfilar antes de converter evita parser único quebrando no meio da carga.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-005', agent: 'VEGA', object: 'fornecedores', field: 'cep', type: 'format',
    expression: 'length(digitos(cep)) = 8',
    rationale: 'CEP fora de oito dígitos não resolve domicílio fiscal no destino.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-006', agent: 'VEGA', object: 'fornecedores', field: 'cnae', type: 'format',
    expression: 'cnae ≠ vazio',
    rationale: 'CNAE é obrigatório neste tenant (customização da Verene). A perfilagem conta quantos vieram em branco antes de qualquer tentativa de correção.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-007', agent: 'VEGA', object: 'fornecedores', field: 'codigoIbge', type: 'format',
    expression: 'codigoIbge ≠ vazio ∧ length(codigoIbge) = 7',
    rationale: 'Município sem código IBGE não fecha domicílio fiscal. Medir aqui separa "faltou" de "veio errado".',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-001', agent: 'VEGA', object: 'materiais-servicos', field: 'ncm', type: 'format',
    expression: 'length(digitos(ncm)) = 8',
    rationale: 'NCM é a classificação fiscal do material. Oito dígitos ou nada.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-002', agent: 'VEGA', object: 'contratos', field: 'linhas[].unidadeMedida', type: 'format',
    expression: 'unidadeMedida ≠ vazio ∧ reconhecida no conjunto do legado',
    rationale: 'Perfilar a unidade antes de converter: é o campo em que as SPEs mais divergem e o que muda ordem de grandeza quando passa batido.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-001', agent: 'VEGA', object: 'contratos', field: 'linhas', type: 'format',
    expression: 'para toda linha: quantidade × precoUnitario = valorTotal (± 0,01)',
    rationale: 'Linha que não fecha na origem não vai fechar no destino. Detectar na recepção é mais barato que descobrir na reconciliação.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },

  // ============ LYRA — mapeamento contra o tenant ============
  { id: 'R-SUP-010', agent: 'LYRA', object: 'fornecedores', field: 'condicaoPagamento', type: 'domain',
    expression: 'condicaoPagamento → PAYMENT_TERMS(tenant); "30 DD"→Z030, "28 DD"→Z028, "28/56 DD"→Z2856, "45 DD"→Z045, "30/60 DD"→Z3060, "30/60/90 DD"→Z306090, "15 DD"→Z015, "A VISTA"→ZAVI',
    rationale: 'O tenant não tem nenhuma condição de pagamento padrão do SAP ativa — só Z-customizadas. O legado guarda a condição como texto livre, então o de-para é explícito e fechado.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-011', agent: 'LYRA', object: 'fornecedores', field: 'bpGrouping', type: 'domain',
    expression: 'naturezaPessoa = "J" → ZFOR ; naturezaPessoa = "F" → ZFPF',
    rationale: 'Grupo de contas define a faixa de numeração externa. Errar aqui gera Business Partner na faixa errada, e a faixa não se corrige depois.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-012', agent: 'LYRA', object: 'fornecedores', field: 'uf', type: 'referential',
    expression: 'uf ∈ UF do IBGE',
    rationale: 'Região do Business Partner tem que existir antes de resolver domicílio fiscal.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-013', agent: 'LYRA', object: 'fornecedores', field: 'withholdingTaxType', type: 'domain',
    expression: 'retencoes.irrf → I1 ; retencoes.inss → N1 ; retencoes.iss → S1 ; retencoes.pisCofinsCsll → C1',
    rationale: 'O tenant exige tipo de retenção preenchido no cadastro (customização). No legado a retenção está em quatro booleanos por SPE.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-014', agent: 'LYRA', object: 'fornecedores', field: 'industry', type: 'domain',
    expression: 'cnae → INDUSTRY(tenant), preservando o código de sete dígitos',
    rationale: 'CNAE atravessa sem tradução: o tenant usa o próprio código da CNAE como setor industrial.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-010', agent: 'LYRA', object: 'materiais-servicos', field: 'materialType', type: 'domain',
    expression: 'grupoMercadoria = "EPI" → ZEPI ; grupoMercadoria ∈ {CONDUTOR, ISOLADOR, FERRAGEM, ESTRUTURA} → ZMAN ; demais → HIBE',
    rationale: 'A Verene criou ZMAN e ZEPI além dos tipos padrão. O legado não tem campo que diga qual é qual — o grupo de mercadoria é o melhor proxy disponível.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-010', agent: 'LYRA', object: 'contratos', field: 'unidadeMedida', type: 'domain',
    expression: 'unidadeMedida ∈ {M, MT, METRO} → "M" ; UN → ST ; H → H ; DIA → DAY ; MES → MON ; VB → LE ; KM → KM',
    rationale: 'O mesmo metro linear aparece de três jeitos conforme a SPE. Nenhum dos três é o código do tenant. Sem normalizar, o volume contratado muda de ordem de grandeza.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-011', agent: 'LYRA', object: 'contratos', field: 'incoterms', type: 'domain',
    expression: 'tipo = "servico" → Incoterms = ?',
    rationale: 'O tenant tornou Incoterms obrigatório em todo contrato, inclusive de serviço, onde o padrão SAP deixa opcional. Nenhum contrato de serviço do legado tem esse dado. Precisa de decisão, não de regra automática.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },

  // ============ ATLAS — transformação e deduplicação ============
  { id: 'R-SUP-020', agent: 'ATLAS', object: 'fornecedores', field: 'cnpjCpf', type: 'conversion',
    expression: 'cnpjCpf → digitos(cnpjCpf)',
    rationale: 'O destino guarda o documento sem máscara. Remover pontuação é conversão, não correção: o número não muda.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-021', agent: 'ATLAS', object: 'fornecedores', field: 'dataCadastro', type: 'conversion',
    expression: 'DD/MM/AAAA → AAAA-MM-DD ; AAAA-MM-DD → inalterado',
    rationale: 'Normaliza os dois formatos que a perfilagem encontrou para a forma única do destino.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-022', agent: 'ATLAS', object: 'fornecedores', field: 'chaveNormalizada', type: 'derivation',
    expression: 'chaveNormalizada = maiúsculas(semAcento(razaoSocial)) sem pontuação e sem sufixo societário',
    rationale: 'Chave de comparação para deduplicação. Não vai para o destino — existe só para o cluster.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-023', agent: 'ATLAS', object: 'fornecedores', field: 'razaoSocial', type: 'length',
    expression: 'nameOrg1 = primeiros 40 de razaoSocial ; nameOrg2 = resto (até 40)',
    rationale: 'NAME_ORG1 do Business Partner tem 40 caracteres. Razão social maior que isso quebra em duas linhas, no lugar certo — cortar no meio de uma palavra é o defeito clássico desta carga.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-024', agent: 'ATLAS', object: 'fornecedores', field: 'cep', type: 'conversion',
    expression: 'cep → digitos(cep)',
    rationale: 'O destino guarda o CEP sem hífen.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-030', agent: 'ATLAS', object: 'fornecedores', field: '*', type: 'business',
    expression: 'cluster de duplicata = registros com o mesmo digitos(cnpjCpf)',
    rationale: 'Documento é a única chave confiável entre SPEs: a razão social diverge em grafia, a razão fantasia diverge mais ainda.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-031', agent: 'ATLAS', object: 'fornecedores', field: '*', type: 'survivorship',
    expression: 'sobrevivente = registro do cluster com mais campos preenchidos ; empate → menor SPE ; empate → menor codigo',
    rationale: 'Critério de sobrevivência precisa ser total e estável, senão a mesma entrada gera saída diferente entre execuções. O desempate por SPE e código garante isso.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-032', agent: 'ATLAS', object: 'fornecedores', field: 'razaoSocial', type: 'survivorship',
    expression: 'razão social do sobrevivente = a mais longa do cluster',
    rationale: 'Entre "PROTEGE EPI COM DE EQUIP LTDA" e "Protege EPI Comércio de Equipamentos Ltda", a forma por extenso é a que o cadastro do destino deve guardar.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-033', agent: 'ATLAS', object: 'fornecedores', field: 'retencoes', type: 'survivorship',
    expression: 'retenções do sobrevivente = ?',
    rationale: 'Quando as SPEs do cluster divergem na retenção do mesmo prestador, não existe critério no dado que diga qual está certa. É decisão fiscal, não de engenharia.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-CTR-021', agent: 'ATLAS', object: 'contratos', field: 'linhas[].descricao', type: 'length',
    expression: 'shortText = primeiros 40 de descricao, quebrando na última palavra inteira',
    rationale: 'O texto breve do Service master tem 40 caracteres. Mesma regra de quebra da razão social — cortar no meio da palavra é o defeito clássico.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-020', agent: 'ATLAS', object: 'contratos', field: 'quantidade', type: 'conversion',
    expression: 'unidadeMedida ∈ {M, MT, METRO} → quantidade inalterada (fator 1)',
    rationale: 'As três grafias significam metro. A conversão é só de código de unidade; mexer na quantidade seria inventar volume.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },

  // ============ NOVA — enriquecimento e validação ============
  { id: 'R-SUP-040', agent: 'NOVA', object: 'fornecedores', field: 'codigoIbge', type: 'derivation',
    expression: 'codigoIbge vazio → busca(municipio, uf) na tabela de municípios do IBGE',
    rationale: 'Município e UF vieram no extrato; o código não. Derivar de fonte de referência é determinístico e auditável — diferente de adivinhar.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-041', agent: 'NOVA', object: 'fornecedores', field: 'taxJurCode', type: 'derivation',
    expression: 'taxJurCode = codigoIbge',
    rationale: 'O domicílio fiscal do Business Partner no Brasil é o código de município do IBGE.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-042', agent: 'NOVA', object: 'fornecedores', field: 'cnpjCpf', type: 'business',
    expression: 'naturezaPessoa = "J" → digito verificador de CNPJ confere ; senão RETER',
    rationale: 'CNPJ com dígito verificador inválido é dado errado na origem, não problema de formato. Não se corrige por regra: volta para quem cadastrou.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-043', agent: 'NOVA', object: 'fornecedores', field: 'cpf', type: 'business',
    expression: 'naturezaPessoa = "F" → digito verificador de CPF confere ; senão RETER',
    rationale: 'Mesma verificação para pessoa física.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-044', agent: 'NOVA', object: 'fornecedores', field: 'businessPartner', type: 'referential',
    expression: 'digitos(cnpjCpf) ∈ base existente → REUSAR o Business Partner, não criar',
    rationale: 'Criar de novo gera Business Partner duplicado com o mesmo CNPJ. Não dá erro na carga — aparece meses depois, no fechamento fiscal.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-045', agent: 'NOVA', object: 'fornecedores', field: '*', type: 'business',
    expression: 'todo campo obrigatório do tenant preenchido ; senão RETER',
    rationale: 'Os campos obrigatórios saem de tenant-config.ts, incluindo os que a Verene tornou obrigatórios fora do padrão SAP. Validar contra o tenant vivo, não contra o SAP de fábrica.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-046', agent: 'NOVA', object: 'fornecedores', field: 'cnae', type: 'derivation',
    expression: 'cnae vazio → derivar de razaoSocial + objeto contratado?',
    rationale: 'Cinco fornecedores vieram sem CNAE e o tenant exige. Dá para propor um CNAE a partir do ramo do nome e do que a empresa fornece — mas é proposta, não derivação: erro de CNAE tem efeito fiscal.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-SUP-047', agent: 'NOVA', object: 'fornecedores', field: 'retencoes', type: 'business',
    expression: 'mesmo CPF em SPEs diferentes com retenção diferente → RETER ambos e escalar',
    rationale: 'Duas SPEs tratam o mesmo prestador de forma diferente e a regra correta não está escrita em lugar nenhum. É o caso que obriga a decisão a subir para o cliente em vez de ser resolvida no código.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-020', agent: 'NOVA', object: 'materiais-servicos', field: 'ncm', type: 'business',
    expression: 'ncm vazio → RETER',
    rationale: 'Sem NCM não há cálculo de imposto no destino. Não é campo que se preenche por padrão.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-021', agent: 'NOVA', object: 'materiais-servicos', field: 'descricao', type: 'derivation',
    expression: 'descricao → TIPO + ESPECIFICAÇÃO + NORMA/CLASSE, removendo recado e status',
    rationale: 'Sete descrições trazem recado de comprador, marcação de urgência ou status do item. Reescrever é proposta: quem confere é quem compra.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-CTR-040', agent: 'NOVA', object: 'contratos', field: 'serviceGroup', type: 'derivation',
    expression: 'centroCusto → SERVICE_GROUP(tenant) pelo prefixo do centro de custo',
    rationale: 'O centro de custo do legado carrega o tipo de ativo (LT, SE, OBRA, AMB) e é a única evidência disponível para o grupo de serviço.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-041', agent: 'NOVA', object: 'contratos', field: 'codigoLc116', type: 'derivation',
    expression: 'descricao da linha → item da lista de serviços da LC 116/2003',
    rationale: 'O código da LC 116 define a incidência de ISS. Deriva de tabela de referência, com o item citado junto ao valor — sem a citação, não há proposta.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-030', agent: 'NOVA', object: 'contratos', field: 'faseFiscal', type: 'business',
    expression: 'faseFiscal ≠ "concluida" → RETER',
    rationale: 'Contrato com fase fiscal aberta não pode virar Outline agreement: migrar agora cria compromisso sem lastro fiscal.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-031', agent: 'NOVA', object: 'contratos', field: 'valorOriginal', type: 'business',
    expression: '|Σ linhas.valorTotal − valorOriginal| ≤ 0,01 ; senão RETER',
    rationale: 'Cabeçalho que não bate com as linhas é aditivo lançado pela metade. Migrar o cabeçalho errado propaga o erro para o compromisso.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },

  // ============ ORION — empacotamento ============
  { id: 'R-PKG-001', agent: 'ORION', object: 'transversal', field: '*', type: 'business',
    expression: 'empacota apenas registro com outcome ∈ {migrated, reused} e checkpoint assinado',
    rationale: 'Registro retido ou pendente de assinatura não entra no pacote. É o que faz o Gate valer alguma coisa.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-002', agent: 'ORION', object: 'transversal', field: 'manifest', type: 'format',
    expression: 'manifest carrega { versão do playbook, checksum do playbook, contagem, checksum do conteúdo }',
    rationale: 'O manifest é o que permite provar, depois da carga, qual regra gerou qual registro. Sem ele a trilha morre no empacotamento.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-003', agent: 'ORION', object: 'transversal', field: 'businessPartner', type: 'referential',
    expression: 'businessPartner ∈ faixa externa do grupo de contas do tenant',
    rationale: 'As faixas de fornecedor são externas neste tenant: o número vai na carga. Fora da faixa, o Migration Cockpit rejeita o lote inteiro.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-004', agent: 'ORION', object: 'transversal', field: '*', type: 'length',
    expression: 'tamanho do pacote ≤ 500 registros',
    rationale: 'Lote grande demais no Migration Cockpit falha por timeout e não diz qual registro quebrou.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },

  // ============ SIRIUS — reconciliação ============
  { id: 'R-REC-001', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'recebidos = migrated + reused + merged + held',
    rationale: 'A conta tem que fechar por construção. Registro que some entre a recepção e o pacote é o defeito mais caro de achar depois.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-REC-002', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'todo registro tem trilha não vazia',
    rationale: 'Registro que atravessou a esteira sem nenhuma regra aplicada não foi processado — passou batido.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-REC-003', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'todo registro retido tem exceção com origem, severidade e dono',
    rationale: 'Retenção sem dono não é exceção, é registro perdido. A taxonomia de origem é o que roteia.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },

  // ============ KANON — governança do playbook (transversal) ============
  { id: 'R-GOV-001', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'toda regra tem owner, rationale e createdAt preenchidos',
    rationale: 'Regra sem dono e sem justificativa não é regra, é comportamento escondido no código.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-002', agent: 'KANON', object: 'transversal', field: '*', type: 'referential',
    expression: 'agente só executa regra publicada na versão do playbook em uso',
    rationale: 'É o que torna a tese literal: o agente não interpreta, ele resolve no playbook e aplica. Regra fora da versão não executa.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-003', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'versão selada é imutável ; mudança de regra → nova versão',
    rationale: 'Mesma versão de playbook tem que dar a mesma saída, sempre. Sem imutabilidade não há reprodutibilidade nem auditoria.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-004', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'regra generativa não executa antes de promovida a active por humano',
    rationale: 'Proposta de regra é proposta. A distinção entre o que a máquina decide e o que ela sugere é o que se está comprando.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
]

/** Índice por id, para a esteira resolver regra sem varrer a lista. */
export const ruleById: ReadonlyMap<string, PlaybookRule> = new Map(
  playbookRules.map((rule) => [rule.id, rule]),
)

export const deterministicRules = playbookRules.filter((r) => r.nature === 'deterministic')
/** Propostas de regra: aparecem como candidatas, não executam. */
export const generativeRules = playbookRules.filter((r) => r.nature === 'generative')
