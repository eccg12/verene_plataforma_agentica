/**
 * Taxonomia de defeito POR ORIGEM.
 *
 * Esta é a estrutura mais importante comercialmente. Numa migração com vários
 * fornecedores envolvidos, a discussão que consome o projeto não é "tem
 * defeito?" — é "de quem é este defeito?". Sem uma taxonomia acordada antes,
 * toda falha vira negociação, e a Monoda acaba respondendo por dado que chegou
 * errado da origem e por configuração que ela não fez.
 *
 * As quatro origens são mutuamente exclusivas e cobrem o ciclo inteiro. Cada uma
 * tem dono contratual declarado. `monodaResponsavel` marca, sem rodeio, o único
 * balde que é responsabilidade da Monoda por padrão: `transformation`. Nos
 * outros três a Monoda detecta, evidencia e roteia — não responde pelo defeito.
 *
 * A ligação com os dados é direta: todo `PlantedDefectKind` das fixtures mapeia
 * para um tipo daqui, e é assim que a esteira classifica exceção por origem sem
 * heurística nenhuma.
 */
import type { DefectToken } from '../../tailwind.config'
import type { PlantedDefectKind } from '@/data/types'

export const defectOriginIds = [
  'source-extract',
  'transformation',
  'target-config',
  'load-execution',
] as const
export type DefectOriginId = (typeof defectOriginIds)[number]

/**
 * `critical` bloqueia a carga: o registro não avança e o Gate não fecha.
 * `non-critical` é registrado, roteado e não impede o pacote de seguir.
 */
export type Severity = 'critical' | 'non-critical'

/**
 * Dimensão de qualidade de dado afetada. É por aqui que o mapa de defeitos do
 * VEGA corta o profiling: por dimensão, além de por objeto.
 */
export const qualityDimensions = [
  'completude',
  'validade',
  'unicidade',
  'consistencia',
  'conformidade',
  'precisao',
] as const
export type QualityDimension = (typeof qualityDimensions)[number]

/**
 * Para quem a exceção é roteada na fila do NOVA.
 *
 * `tecnica` é decisão de configuração ou de estrutura: vai para o SAP SME.
 * `negocio` é decisão sobre o significado do dado: vai para o data owner da
 * Verene. A separação existe porque as duas filas têm gente diferente e tempo
 * de resposta diferente — misturar as duas é o que trava projeto.
 */
export type ClasseExcecao = 'tecnica' | 'negocio'

export interface DefectType {
  readonly id: string
  readonly origin: DefectOriginId
  readonly nome: string
  readonly severidade: Severity
  readonly dimensao: QualityDimension
  readonly classe: ClasseExcecao
  /** Prazo de resposta em dias úteis, a contar da abertura. */
  readonly prazoDias: number
  readonly descricao: string
  /** Ação que a esteira toma ao encontrar. */
  readonly acao: string
  /** Para quem a exceção é roteada. */
  readonly roteadoPara: string
  /** Defeito plantado nas fixtures que cai neste tipo, quando houver. */
  readonly plantedKind: PlantedDefectKind | null
}

export interface DonoContratual {
  readonly parte: string
  readonly papel: string
  readonly descricao: string
}

export interface DefectOrigin {
  readonly id: DefectOriginId
  readonly nome: string
  readonly descricao: string
  /** Token da escala categórica do design system. */
  readonly designToken: DefectToken
  readonly donoContratual: DonoContratual
  /** O ponto comercial: só `transformation` é da Monoda por padrão. */
  readonly monodaResponsavel: boolean
  /** Como se decide que um defeito é desta origem, e não de outra. */
  readonly criterioDeAtribuicao: string
  /** O que a Monoda entrega nesta origem quando o defeito não é dela. */
  readonly entregaDaMonoda: string
}

export const defectOrigins: readonly DefectOrigin[] = [
  {
    id: 'source-extract',
    nome: 'Origem do extrato',
    designToken: 'defect-source',
    descricao:
      'O dado chegou errado do legado. Documento com dígito verificador inválido, campo obrigatório em branco, valor que não bate com o cabeçalho, cadastro duplicado entre SPEs.',
    donoContratual: {
      parte: 'Verene Energia',
      papel: 'Proprietária do dado, com apoio do fornecedor do Nasajon',
      descricao:
        'O dado é da Verene e foi produzido nos sistemas dela. A Monoda não corrige dado de origem sem autorização escrita — corrigir calado é assumir a autoria do número.',
    },
    monodaResponsavel: false,
    criterioDeAtribuicao:
      'O defeito é reproduzível lendo apenas o extrato, sem consultar o tenant nem executar regra de transformação.',
    entregaDaMonoda:
      'Detectar, quantificar, evidenciar registro a registro e rotear para o dono. A correção volta para a origem ou vira decisão registrada.',
  },
  {
    id: 'transformation',
    nome: 'Transformação',
    designToken: 'defect-transformation',
    descricao:
      'A regra do playbook foi aplicada errado, ou faltou regra para um caso que o dado apresenta. Conversão que perde informação, chave de deduplicação que agrupa o que não devia, derivação que produz valor errado.',
    donoContratual: {
      parte: 'Monoda Consulting Group',
      papel: 'Responsável pela regra e pela sua execução',
      descricao:
        'Este é o trabalho da Monoda. Defeito aqui é defeito da Monoda, sem discussão: corrige-se a regra, sobe-se a versão do playbook e reprocessa-se.',
    },
    monodaResponsavel: true,
    criterioDeAtribuicao:
      'O dado de origem estava correto e a configuração do destino aceitaria o valor certo, mas a saída da esteira está errada.',
    entregaDaMonoda:
      'Correção da regra, nova versão do playbook e reprocessamento, sem custo adicional para a Verene.',
  },
  {
    id: 'target-config',
    nome: 'Configuração do destino',
    designToken: 'defect-target-config',
    descricao:
      'O tenant S/4HANA exige, rejeita ou nomeia algo de um jeito que o escopo não previa. Campo obrigatório fora do padrão SAP, domínio de valor sem entrada correspondente, faixa de numeração incompatível.',
    donoContratual: {
      parte: 'Verene Energia e o integrador do S/4HANA',
      papel: 'Donos da configuração do tenant',
      descricao:
        'A configuração do tenant é decisão da Verene, tomada com o integrador, antes e fora deste projeto. A Monoda evidencia a divergência e propõe tratamento; mudar configuração não é escopo dela.',
    },
    monodaResponsavel: false,
    criterioDeAtribuicao:
      'O dado de origem está correto e a regra foi aplicada corretamente, mas o tenant recusa ou exige algo que o padrão SAP não exigiria.',
    entregaDaMonoda:
      'Leitura da configuração viva do tenant, relatório de divergência contra o padrão SAP e proposta de tratamento para decisão da Verene.',
  },
  {
    id: 'load-execution',
    nome: 'Execução da carga',
    designToken: 'defect-load',
    descricao:
      'A carga em si falhou. Lote rejeitado pelo Migration Cockpit, timeout, bloqueio de objeto, faixa de numeração esgotada, indisponibilidade do ambiente.',
    donoContratual: {
      parte: 'Compartilhado — Monoda e Verene',
      papel: 'Monoda pela mecânica do lote; Verene pelo ambiente',
      descricao:
        'Formato do lote, tamanho, ordem e conteúdo do manifest são da Monoda. Disponibilidade do ambiente, janela de carga, faixa de numeração e autorização são da Verene e do time Basis. O manifest com checksum é o que separa um do outro sem discussão.',
    },
    monodaResponsavel: false,
    criterioDeAtribuicao:
      'O pacote foi aprovado e estava íntegro no checksum, mas a execução no destino não completou.',
    entregaDaMonoda:
      'Pacote íntegro e reexecutável, com manifest e checksum que provam o que foi enviado, e reenvio após o ambiente normalizar.',
  },
]

export const defectTypes: readonly DefectType[] = [
  // ---------- source-extract ----------
  { id: 'DEF-SRC-01', origin: 'source-extract', nome: 'CNPJ com dígito verificador inválido', severidade: 'critical', dimensao: 'validade', classe: 'negocio', prazoDias: 3,
    descricao: 'O número não fecha na aritmética do dígito verificador. Não é erro de máscara — é número errado.',
    acao: 'Reter o registro. Não há correção automática possível.',
    roteadoPara: 'Verene · Suprimentos', plantedKind: 'cnpj-dv-invalido' },
  { id: 'DEF-SRC-02', origin: 'source-extract', nome: 'Cadastro duplicado entre SPEs', severidade: 'critical', dimensao: 'unicidade', classe: 'negocio', prazoDias: 5,
    descricao: 'Mesmo documento cadastrado em mais de uma SPE, com grafia divergente da razão social.',
    acao: 'Formar cluster e reter até confirmação humana, um cluster por vez.',
    roteadoPara: 'Verene · Suprimentos', plantedKind: 'duplicata-grafia' },
  { id: 'DEF-SRC-03', origin: 'source-extract', nome: 'CNAE ausente', severidade: 'critical', dimensao: 'completude', classe: 'negocio', prazoDias: 5,
    descricao: 'Campo em branco no extrato, exigido pelo tenant.',
    acao: 'Reter. A derivação de CNAE é regra candidata, não executa.',
    roteadoPara: 'Verene · Fiscal', plantedKind: 'cnae-ausente' },
  { id: 'DEF-SRC-04', origin: 'source-extract', nome: 'Contrato com fase fiscal pendente', severidade: 'critical', dimensao: 'validade', classe: 'negocio', prazoDias: 10,
    descricao: 'Contrato ainda não encerrou a fase fiscal no legado.',
    acao: 'Reter. Migrar criaria compromisso sem lastro fiscal.',
    roteadoPara: 'Verene · Fiscal', plantedKind: 'fase-fiscal-pendente' },
  { id: 'DEF-SRC-05', origin: 'source-extract', nome: 'Cabeçalho não reconcilia com as linhas', severidade: 'critical', dimensao: 'precisao', classe: 'negocio', prazoDias: 5,
    descricao: 'A soma das linhas difere do valor original do contrato.',
    acao: 'Reter até a origem explicar a diferença.',
    roteadoPara: 'Verene · Suprimentos', plantedKind: 'saldo-diverge-do-original' },
  { id: 'DEF-SRC-06', origin: 'source-extract', nome: 'NCM ausente', severidade: 'critical', dimensao: 'completude', classe: 'negocio', prazoDias: 5,
    descricao: 'Material sem classificação fiscal.',
    acao: 'Reter. Sem NCM não há cálculo de imposto no destino.',
    roteadoPara: 'Verene · Fiscal', plantedKind: 'ncm-ausente' },
  { id: 'DEF-SRC-07', origin: 'source-extract', nome: 'Descrição fora de padrão', severidade: 'non-critical', dimensao: 'conformidade', classe: 'negocio', prazoDias: 15,
    descricao: 'Recado de comprador, marcação de urgência ou status do item escritos na descrição.',
    acao: 'Registrar e seguir. A reescrita é regra candidata.',
    roteadoPara: 'Verene · Suprimentos', plantedKind: 'descricao-fora-de-padrao' },
  { id: 'DEF-SRC-08', origin: 'source-extract', nome: 'Município sem código IBGE', severidade: 'non-critical', dimensao: 'completude', classe: 'tecnica', prazoDias: 2,
    descricao: 'O extrato trouxe município e UF, mas não o código.',
    acao: 'Enriquecer pela tabela de referência do IBGE. Só retém se o município não existir na tabela.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: 'municipio-sem-ibge' },
  { id: 'DEF-SRC-09', origin: 'source-extract', nome: 'Data em formato divergente', severidade: 'non-critical', dimensao: 'conformidade', classe: 'tecnica', prazoDias: 2,
    descricao: 'Parte do extrato em DD/MM/AAAA, parte em AAAA-MM-DD.',
    acao: 'Normalizar por regra de conversão. Não retém.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: 'data-formato-divergente' },
  // ---------- transformation ----------
  { id: 'DEF-TRF-01', origin: 'transformation', nome: 'Unidade de medida divergente entre SPEs', severidade: 'critical', dimensao: 'consistencia', classe: 'tecnica', prazoDias: 2,
    descricao: 'O mesmo metro linear escrito como M, MT e METRO. Sem normalizar, o volume contratado muda de ordem de grandeza.',
    acao: 'Converter pelo domínio do tenant, mantendo a quantidade.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: 'unidade-medida-divergente' },
  { id: 'DEF-TRF-02', origin: 'transformation', nome: 'Razão social cortada no meio da palavra', severidade: 'critical', dimensao: 'conformidade', classe: 'tecnica', prazoDias: 2,
    descricao: 'NAME_ORG1 tem 40 caracteres; razão social maior precisa quebrar em NAME_ORG2 no espaço, não na letra. O nome é o que identifica o Business Partner no documento fiscal.',
    acao: 'Corrigir a REGRA de quebra e republicar o playbook. Aprovar o registro assim só carimba o corte errado — o defeito é da regra, não do dado.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  { id: 'DEF-TRF-03', origin: 'transformation', nome: 'Falta regra para um caso presente no dado', severidade: 'critical', dimensao: 'consistencia', classe: 'tecnica', prazoDias: 3,
    descricao: 'O dado apresenta uma situação que o playbook não cobre em nenhuma regra ativa.',
    acao: 'Reter e abrir regra candidata para promoção.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  // ---------- target-config ----------
  { id: 'DEF-TGT-01', origin: 'target-config', nome: 'Fornecedor já cadastrado no destino', severidade: 'critical', dimensao: 'unicidade', classe: 'negocio', prazoDias: 3,
    descricao: 'O documento já existe como Business Partner no tenant. Recriar gera duplicata que só aparece no fechamento fiscal.',
    acao: 'Reusar o Business Partner existente em vez de criar.',
    roteadoPara: 'Verene · Suprimentos', plantedKind: 'ja-existe-no-destino' },
  { id: 'DEF-TGT-02', origin: 'target-config', nome: 'Campo obrigatório fora do padrão SAP', severidade: 'critical', dimensao: 'completude', classe: 'tecnica', prazoDias: 3,
    descricao: 'O tenant exige um campo que o SAP de fábrica deixa opcional, e o legado não tem esse dado.',
    acao: 'Reter e evidenciar a divergência para decisão da Verene.',
    roteadoPara: 'Verene · Arquitetura S/4HANA', plantedKind: null },
  { id: 'DEF-TGT-03', origin: 'target-config', nome: 'Valor sem entrada no domínio do tenant', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 3,
    descricao: 'O valor do legado não tem correspondente no domínio configurado.',
    acao: 'Reter. Criar entrada de domínio é decisão de configuração, não de migração.',
    roteadoPara: 'Verene · Arquitetura S/4HANA', plantedKind: null },
  { id: 'DEF-TGT-04', origin: 'target-config', nome: 'Regra de negócio não escrita em lugar nenhum', severidade: 'critical', dimensao: 'consistencia', classe: 'negocio', prazoDias: 5,
    descricao: 'Duas SPEs tratam o mesmo caso de forma diferente e nenhuma configuração do tenant decide qual está certa.',
    acao: 'Reter os dois lados e escalar para o dono do processo. É decisão, não engenharia.',
    roteadoPara: 'Verene · Fiscal', plantedKind: 'retencao-pf-divergente' },
  // ---------- load-execution ----------
  { id: 'DEF-LOD-01', origin: 'load-execution', nome: 'Lote rejeitado pelo Migration Cockpit', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 1,
    descricao: 'O pacote foi recusado na execução, apesar de íntegro no checksum.',
    acao: 'Reenviar após tratar a causa apontada pelo destino.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  { id: 'DEF-LOD-02', origin: 'load-execution', nome: 'Faixa de numeração esgotada', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 1,
    descricao: 'A faixa externa do grupo de contas acabou durante a carga.',
    acao: 'Parar a carga. Estender a faixa é ação do time Basis da Verene.',
    roteadoPara: 'Verene · Basis', plantedKind: null },
  { id: 'DEF-LOD-03', origin: 'load-execution', nome: 'Ambiente indisponível na janela de carga', severidade: 'non-critical', dimensao: 'precisao', classe: 'tecnica', prazoDias: 1,
    descricao: 'O tenant não respondeu na janela acordada.',
    acao: 'Reagendar. O pacote continua válido — o checksum prova.',
    roteadoPara: 'Verene · Basis', plantedKind: null },
]

export const defectOriginById: Readonly<Record<DefectOriginId, DefectOrigin>> = Object.fromEntries(
  defectOrigins.map((o) => [o.id, o]),
) as Readonly<Record<DefectOriginId, DefectOrigin>>

export const defectTypeById: ReadonlyMap<string, DefectType> = new Map(
  defectTypes.map((t) => [t.id, t]),
)

/**
 * Mapa de defeito plantado nas fixtures para tipo da taxonomia. É por aqui que a
 * esteira classifica exceção por origem — sem heurística, sem adivinhação.
 */
export const defectTypeByPlantedKind: ReadonlyMap<PlantedDefectKind, DefectType> = new Map(
  defectTypes
    .filter((t): t is DefectType & { plantedKind: PlantedDefectKind } => t.plantedKind !== null)
    .map((t) => [t.plantedKind, t]),
)
