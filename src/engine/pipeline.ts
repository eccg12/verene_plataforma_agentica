/**
 * A esteira de nove passos.
 *
 * Recebe (registros, versão do playbook) e devolve, POR REGISTRO, a trilha
 * completa: valor de origem, cada regra aplicada com id e versão do playbook, e
 * o valor final — ou o estado `held`, com a exceção e o dono a quem foi
 * roteada.
 *
 * DETERMINISMO. Nada aqui usa `Math.random` nem `Date.now`. Toda ordenação é
 * total (desempate por `codigo`, que é único), os conjuntos viram lista
 * ordenada antes de sair, e o instante de referência é o epoch fixo de
 * `clock.ts`. Mesma entrada e mesma versão de playbook produzem saída idêntica
 * byte a byte — há teste para isso.
 *
 * A TESE, LITERAL. Nenhum passo escreve em registro diretamente: toda mutação
 * passa por `apply`, que resolve a regra em KANON. Se a regra não existir
 * naquela versão, estiver como candidata, ou pertencer a outro agente, a
 * execução falha. O agente executa a regra publicada; não a interpreta.
 */
import type { AgentName } from '@/data/agents'
import {
  defectOriginIds,
  defectTypeById,
  defectTypeByPlantedKind,
  type DefectOriginId,
  type Severity,
} from '@/data/defect-taxonomy'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import { buscarMunicipio, normalizarNome } from '@/data/reference/municipios-ibge'
import { nasajonSuppliers, type NasajonSupplier } from '@/data/source/nasajon-suppliers'
import { existingSuppliers } from '@/data/target/existing-base'
import { requiredFields } from '@/data/target/tenant-config'
import type { PlantedDefectKind, SpeId } from '@/data/types'
import { isValidCnpj, isValidCpf, onlyDigits } from '@/engine/br-documents'
import { MINUTE_MS, simInstant } from '@/engine/clock'
import { parametroDaRegra, resolveRule, sealPlaybook } from '@/engine/kanon'
import { hashSeed } from '@/engine/random'

// ============================================================ passos

export const stepIds = [
  'receive',
  'profile',
  'map',
  'transform',
  'deduplicate',
  'enrich',
  'validate',
  'package',
  'reconcile',
] as const
export type StepId = (typeof stepIds)[number]

export interface StepSpec {
  readonly n: number
  readonly id: StepId
  readonly nome: string
  readonly agent: AgentName
}

export const pipelineSteps: readonly StepSpec[] = [
  { n: 1, id: 'receive', nome: 'RECEIVE', agent: 'VEGA' },
  { n: 2, id: 'profile', nome: 'PROFILE', agent: 'VEGA' },
  { n: 3, id: 'map', nome: 'MAP', agent: 'LYRA' },
  { n: 4, id: 'transform', nome: 'TRANSFORM', agent: 'ATLAS' },
  { n: 5, id: 'deduplicate', nome: 'DEDUPLICATE', agent: 'ATLAS' },
  { n: 6, id: 'enrich', nome: 'ENRICH', agent: 'NOVA' },
  { n: 7, id: 'validate', nome: 'VALIDATE', agent: 'NOVA' },
  { n: 8, id: 'package', nome: 'PACKAGE', agent: 'ORION' },
  { n: 9, id: 'reconcile', nome: 'RECONCILE', agent: 'SIRIUS' },
]

// ============================================================ assinaturas e checkpoints

export type Decision = 'approved' | 'rejected'

export interface Signature {
  readonly by: string
  readonly role: string
  readonly decision: Decision
  /** Instante determinístico, derivado do epoch da simulação. */
  readonly at: string
  /**
   * Versão do playbook sobre a qual a assinatura foi dada. Sem isto, "revisado
   * e assinado" não diz o que foi assinado: assinatura vale para uma versão de
   * regra, e mudar a regra não carrega a aprovação anterior junto.
   */
  readonly playbookVersion: string
  /**
   * Versão para a qual esta assinatura foi CARREGADA sem ser dada de novo.
   *
   * Só acontece quando o artefato que ela cobre não mudou na nova versão — a
   * correção de uma regra de ATLAS não mexe no de-para, então a aprovação do
   * de-para continua cobrindo o que cobria. Fica registrado em vez de silencioso:
   * a trilha mostra sobre qual versão foi assinada E em qual foi revalidada.
   */
  readonly revalidadaEm?: string
  readonly note: string | null
}

export const checkpointIds = ['mapeamento', 'duplicatas', 'excecoes', 'pacote-reconciliacao'] as const
export type CheckpointId = (typeof checkpointIds)[number]

export interface Approvals {
  /**
   * Checkpoint 1, após o passo 3. Duas assinaturas distintas: o SAP SME aprova
   * tecnicamente o de-para contra o tenant, e o data owner da Verene assina no
   * Gate 1. Uma não substitui a outra.
   */
  readonly mapeamentoSme: Signature | null
  readonly mapeamento: Signature | null
  /** Checkpoint 2, após o passo 5: um a um, cada cluster de duplicata. */
  readonly clusters: Readonly<Record<string, Signature>>
  /** Checkpoint 3, após o passo 7: uma decisão por exceção aberta. */
  readonly excecoes: Readonly<Record<string, Signature>>
  /** Checkpoint 4, após os passos 8 e 9: pacote e reconciliação. */
  readonly pacote: Signature | null
  readonly reconciliacao: Signature | null
}

export const emptyApprovals: Approvals = {
  mapeamentoSme: null,
  mapeamento: null,
  clusters: {},
  excecoes: {},
  pacote: null,
  reconciliacao: null,
}

export interface CheckpointState {
  readonly id: CheckpointId
  readonly titulo: string
  readonly apos: StepId
  readonly descricao: string
  /** Quantas assinaturas o checkpoint exige neste run. */
  readonly requeridas: number
  readonly assinadas: number
  /** Itens ainda sem decisão. */
  readonly pendentes: readonly string[]
  readonly liberado: boolean
}

// ============================================================ trilha e resultado

export interface TrailEntry {
  readonly seq: number
  /**
   * Instante da aplicação. Derivado do epoch fixo da simulação: cada passo
   * avança 15 minutos e cada aplicação dentro do passo, 3 segundos. Usar o
   * relógio da máquina quebraria a reprodutibilidade.
   */
  readonly at: string
  readonly step: StepId
  readonly agent: AgentName
  readonly ruleId: string
  readonly playbookVersion: string
  readonly field: string
  readonly before: string | null
  readonly after: string | null
  readonly note: string | null
}

export type RecordOutcome = 'migrated' | 'reused' | 'merged' | 'held'

export interface ExceptionRecord {
  readonly id: string
  readonly recordCode: string
  readonly defectTypeId: string
  readonly nome: string
  readonly origin: DefectOriginId
  readonly severidade: Severity
  readonly ruleId: string
  readonly playbookVersion: string
  readonly mensagem: string
  readonly roteadoPara: string
  readonly monodaResponsavel: boolean
}

/** O Business Partner sendo construído — o "valor final" da trilha. */
export interface BusinessPartnerTarget {
  readonly businessPartner: string | null
  readonly bpGrouping: string | null
  readonly nameOrg1: string | null
  readonly nameOrg2: string | null
  readonly taxNumberBr1: string | null
  readonly taxNumberBr2: string | null
  readonly industry: string | null
  readonly region: string | null
  readonly taxJurCode: string | null
  readonly postalCode: string | null
  readonly city: string | null
  readonly paymentTerms: string | null
  readonly withholdingTaxType: readonly string[]
  readonly createdOn: string | null
}

export interface RecordResult {
  readonly codigo: string
  readonly spe: SpeId
  /** Valor de origem, como veio do extrato. */
  readonly source: NasajonSupplier
  /** Cada regra aplicada, na ordem, com id da regra e versão do playbook. */
  readonly trail: readonly TrailEntry[]
  /** Valor final. `null` quando o registro ficou retido. */
  readonly target: BusinessPartnerTarget | null
  readonly outcome: RecordOutcome
  readonly exceptions: readonly ExceptionRecord[]
  readonly clusterId: string | null
  /** Preenchido quando o registro foi reusado ou fundido em outro. */
  readonly resolvidoPara: string | null
}

export interface DuplicateCluster {
  readonly id: string
  readonly documento: string
  readonly membros: readonly string[]
  readonly spes: readonly SpeId[]
  /** Proposta de ATLAS. Só vira decisão com assinatura. */
  readonly sobreviventePropostoCodigo: string
  readonly razaoSocialProposta: string
  readonly motivoDaProposta: string
  readonly confirmado: boolean
  readonly decisao: Decision | null
}

/**
 * Defeito da fixture classificado pela taxonomia. É a ligação entre o que está
 * errado no dado e de quem é a responsabilidade contratual — sem heurística: o
 * `kind` plantado tem tipo correspondente na taxonomia, e o tipo tem origem.
 */
export interface ClassifiedDefect {
  readonly recordCode: string
  readonly spe: SpeId
  readonly kind: PlantedDefectKind
  readonly defectTypeId: string
  readonly nome: string
  readonly origin: DefectOriginId
  readonly severidade: Severity
  readonly campo: string
  readonly nota: string
  readonly roteadoPara: string
  readonly monodaResponsavel: boolean
}

export interface OriginTally {
  readonly origin: DefectOriginId
  readonly total: number
  readonly critical: number
  readonly nonCritical: number
  readonly monodaResponsavel: boolean
}

export interface ProfileFinding {
  readonly campo: string
  readonly achado: string
  readonly quantidade: number
  readonly ruleId: string
}

export interface LoadPackageResult {
  readonly id: string
  readonly registros: readonly string[]
  readonly total: number
  readonly manifest: {
    readonly playbookVersion: string
    readonly playbookChecksum: string
    readonly datasetChecksum: string
    readonly total: number
    readonly geradoEm: string
  }
}

export interface ReconciliationReport {
  readonly recebidos: number
  readonly migrated: number
  readonly reused: number
  readonly merged: number
  readonly held: number
  readonly fecha: boolean
  readonly semTrilha: readonly string[]
  readonly retidosSemExcecao: readonly string[]
}

export type StepStatus = 'completed' | 'blocked' | 'not-reached'

export interface StepResult {
  readonly n: number
  readonly id: StepId
  readonly nome: string
  readonly agent: AgentName
  readonly status: StepStatus
  readonly registrosTocados: number
  readonly regrasAplicadas: readonly string[]
}

export interface PipelineRun {
  readonly playbookVersion: string
  readonly playbookChecksum: string
  readonly spe: SpeId | 'todas'
  readonly steps: readonly StepResult[]
  readonly records: readonly RecordResult[]
  readonly profile: readonly ProfileFinding[]
  /** Todo defeito plantado, classificado por origem da taxonomia. */
  readonly classifiedDefects: readonly ClassifiedDefect[]
  readonly defectsByOrigin: readonly OriginTally[]
  readonly clusters: readonly DuplicateCluster[]
  readonly exceptions: readonly ExceptionRecord[]
  readonly checkpoints: readonly CheckpointState[]
  /** Primeiro passo que não pôde executar por falta de assinatura. */
  readonly blockedAt: StepId | null
  readonly loadPackage: LoadPackageResult | null
  readonly reconciliation: ReconciliationReport | null
}

export interface PipelineInput {
  readonly records: readonly NasajonSupplier[]
  readonly playbookVersion?: string
  readonly approvals?: Approvals
  readonly spe?: SpeId | 'todas'
}

// ============================================================ estado interno

interface Working {
  readonly source: NasajonSupplier
  readonly trail: TrailEntry[]
  readonly exceptions: ExceptionRecord[]
  draft: BusinessPartnerTarget
  outcome: RecordOutcome
  clusterId: string | null
  /** Sobrevivente do cluster no qual este registro foi fundido. */
  mergedInto: string | null
  /** Business Partner já existente que este registro deve reusar. */
  reuseTarget: string | null
  /** Chave de comparação derivada no TRANSFORM. */
  chaveNormalizada: string
  /**
   * A razão social de fato quebrada em NAME_ORG1/NAME_ORG2. Num cluster o nome
   * do sobrevivente pode vir de outro membro, então guardar o que foi quebrado é
   * o que permite a NOVA validar a quebra sem adivinhar de onde ela veio.
   */
  nomeQuebrado: string
}

const EMPTY_TARGET: BusinessPartnerTarget = {
  businessPartner: null,
  bpGrouping: null,
  nameOrg1: null,
  nameOrg2: null,
  taxNumberBr1: null,
  taxNumberBr2: null,
  industry: null,
  region: null,
  taxJurCode: null,
  postalCode: null,
  city: null,
  paymentTerms: null,
  withholdingTaxType: [],
  createdOn: null,
}

const byCodigo = (a: { codigo: string }, b: { codigo: string }): number =>
  a.codigo < b.codigo ? -1 : a.codigo > b.codigo ? 1 : 0

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))

// ============================================================ o guarda

/**
 * Única porta de mutação da esteira. Resolve a regra em KANON — que recusa
 * regra fora da versão, candidata, ou de outro agente — aplica a mudança e
 * registra na trilha com id da regra e versão do playbook.
 */
function apply(
  rec: Working,
  step: StepSpec,
  ruleId: string,
  version: string,
  field: string,
  before: unknown,
  after: unknown,
  patch: Partial<BusinessPartnerTarget> | null,
  note: string | null = null,
): void {
  const rule = resolveRule(ruleId, step.agent, version)
  if (patch) rec.draft = { ...rec.draft, ...patch }
  const seq = rec.trail.length + 1
  rec.trail.push({
    seq,
    at: simInstant(step.n * 15 * MINUTE_MS + seq * 3_000).toISOString(),
    step: step.id,
    agent: rule.agent,
    ruleId: rule.id,
    playbookVersion: version,
    field,
    before: str(before),
    after: str(after),
    note,
  })
}

/** Abre exceção classificada pela taxonomia, com origem, severidade e dono. */
function raise(
  rec: Working,
  defectTypeId: string,
  ruleId: string,
  version: string,
  mensagem: string,
): void {
  const tipo = defectTypeById.get(defectTypeId)
  if (!tipo) throw new Error(`Tipo de defeito desconhecido: ${defectTypeId}`)
  rec.exceptions.push({
    id: `${rec.source.codigo}:${defectTypeId}`,
    recordCode: rec.source.codigo,
    defectTypeId: tipo.id,
    nome: tipo.nome,
    origin: tipo.origin,
    severidade: tipo.severidade,
    ruleId,
    playbookVersion: version,
    mensagem,
    roteadoPara: tipo.roteadoPara,
    monodaResponsavel: tipo.origin === 'transformation',
  })
}

/**
 * O estado final do registro é DERIVADO, nunca acumulado por mutação ao longo
 * dos passos. Acumular dava ordem-dependência: uma exceção crítica levantada
 * depois de marcar "reused" apagava o reuso, e o registro voltava como
 * "migrated" na liberação — recriando o Business Partner que a regra R-SUP-044
 * mandou reusar.
 */
function resolverOutcome(rec: Working, approvals: Approvals): RecordOutcome {
  if (rec.mergedInto !== null) return 'merged'
  const criticas = rec.exceptions.filter((e) => e.severidade === 'critical')
  const naoLiberada = criticas.some((e) => approvals.excecoes[e.id]?.decision !== 'approved')
  if (naoLiberada) return 'held'
  return rec.reuseTarget !== null ? 'reused' : 'migrated'
}

function resolverTodos(work: readonly Working[], approvals: Approvals): void {
  for (const rec of work) rec.outcome = resolverOutcome(rec, approvals)
}

// ============================================================ de-para de mapeamento

const PAYMENT_TERMS: Readonly<Record<string, string>> = {
  'A VISTA': 'ZAVI',
  '15 DD': 'Z015',
  '28 DD': 'Z028',
  '30 DD': 'Z030',
  '45 DD': 'Z045',
  '28/56 DD': 'Z2856',
  '30/60 DD': 'Z3060',
  '30/60/90 DD': 'Z306090',
}

const SUFIXOS = /\b(LTDA|ME|EPP|SA|S\/A|EIRELI)\b\.?/g

function chaveDedup(razaoSocial: string): string {
  return normalizarNome(razaoSocial).replace(SUFIXOS, '').replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

/** Onde o corte cai: no caractere do limite, ou no último espaço antes dele. */
export type ModoDeCorte = 'caractere' | 'palavra'

/**
 * Quebra a razão social no limite do NAME_ORG1.
 *
 * O MODO vem do parâmetro da regra R-SUP-023, lido em KANON — não é escolha do
 * agente. `caractere` corta no limite exato e pode partir palavra ao meio;
 * `palavra` recua até o último espaço. É a diferença entre as duas redações da
 * regra, e é o que a correção da v1.4.0 muda.
 */
export function splitNome(
  nome: string,
  limite = 40,
  modo: ModoDeCorte = 'palavra',
): readonly [string, string | null] {
  if (nome.length <= limite) return [nome, null]
  const espaco = nome.lastIndexOf(' ', limite)
  const at = modo === 'palavra' && espaco > 0 ? espaco : limite
  return [nome.slice(0, at).trim(), nome.slice(at).trim().slice(0, limite) || null]
}

/** `true` quando a quebra partiu uma palavra ao meio. É o que a R-SUP-048 procura. */
export function cortouPalavra(nome: string, org1: string): boolean {
  if (org1.length >= nome.length) return false
  return nome[org1.length] !== ' ' && org1.at(-1) !== ' '
}

/**
 * Contraparte com o mesmo documento em outra SPE e retenção diferente.
 *
 * Derivado do dado, não da etiqueta: `_plantedDefect` marca só um lado da dupla,
 * e a R-SUP-047 diz para reter os dois. Cruzar por documento é o que faz a
 * implementação dizer o mesmo que a regra publicada.
 */
export function divergenciaDeRetencao(s: NasajonSupplier): NasajonSupplier | null {
  const doc = onlyDigits(s.cnpjCpf)
  const mesmos = nasajonSuppliers.filter((o) => o.codigo !== s.codigo && onlyDigits(o.cnpjCpf) === doc)
  const divergente = mesmos
    .filter((o) => o.spe !== s.spe)
    .filter((o) => JSON.stringify(o.retencoes) !== JSON.stringify(s.retencoes))
    .sort((a, b) => (a.codigo < b.codigo ? -1 : 1))
  return divergente[0] ?? null
}

const camposPreenchidos = (s: NasajonSupplier): number =>
  [s.nomeFantasia, s.inscricaoEstadual, s.inscricaoMunicipal, s.cnae, s.codigoIbge, s.complemento].filter(
    (v) => v !== null && v !== '',
  ).length

// ============================================================ a esteira

export function runPipeline(input: PipelineInput): PipelineRun {
  const version = input.playbookVersion ?? PLAYBOOK_VERSION
  const sealed = sealPlaybook(version)
  const approvals = input.approvals ?? emptyApprovals
  const stepOf = (id: StepId): StepSpec => pipelineSteps.find((s) => s.id === id) as StepSpec

  const registros = input.records.slice().sort(byCodigo)
  const work: Working[] = registros.map((source) => ({
    source,
    trail: [],
    exceptions: [],
    draft: EMPTY_TARGET,
    outcome: 'migrated',
    clusterId: null,
    mergedInto: null,
    reuseTarget: null,
    chaveNormalizada: '',
    nomeQuebrado: '',
  }))

  const stepResults: StepResult[] = []
  const regrasDoPasso = new Map<StepId, Set<string>>()
  const marcar = (id: StepId, ruleId: string): void => {
    const set = regrasDoPasso.get(id) ?? new Set<string>()
    set.add(ruleId)
    regrasDoPasso.set(id, set)
  }
  const fechar = (id: StepId, tocados: number): void => {
    const spec = stepOf(id)
    stepResults.push({
      n: spec.n,
      id: spec.id,
      nome: spec.nome,
      agent: spec.agent,
      status: 'completed',
      registrosTocados: tocados,
      regrasAplicadas: [...(regrasDoPasso.get(id) ?? new Set<string>())].sort(),
    })
  }
  const naoAlcancados = (apartirDe: StepId, motivo: StepStatus): void => {
    const from = stepOf(apartirDe).n
    for (const spec of pipelineSteps.filter((s) => s.n >= from)) {
      stepResults.push({
        n: spec.n,
        id: spec.id,
        nome: spec.nome,
        agent: spec.agent,
        status: spec.n === from ? motivo : 'not-reached',
        registrosTocados: 0,
        regrasAplicadas: [],
      })
    }
  }

  // ---------- 1 RECEIVE (VEGA) ----------
  const s1 = stepOf('receive')
  for (const rec of work) {
    apply(rec, s1, 'R-SUP-001', version, 'codigo', null, rec.source.codigo, null, 'Registro recebido do extrato.')
    marcar('receive', 'R-SUP-001')
  }
  fechar('receive', work.length)

  // ---------- 2 PROFILE (VEGA) ----------
  const s2 = stepOf('profile')
  const profile: ProfileFinding[] = []
  const contarPerfil = (campo: string, achado: string, quantidade: number, ruleId: string): void => {
    if (quantidade > 0) profile.push({ campo, achado, quantidade, ruleId })
  }
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)
    const regraDoc = s.naturezaPessoa === 'J' ? 'R-SUP-002' : 'R-SUP-003'
    apply(rec, s2, regraDoc, version, 'cnpjCpf', s.cnpjCpf, `${digitos.length} dígitos`, null,
      s.cnpjCpf === digitos ? 'Veio sem máscara.' : 'Veio com máscara.')
    marcar('profile', regraDoc)

    const formato = /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro) ? 'AAAA-MM-DD' : 'DD/MM/AAAA'
    apply(rec, s2, 'R-SUP-004', version, 'dataCadastro', s.dataCadastro, formato, null, null)
    marcar('profile', 'R-SUP-004')

    apply(rec, s2, 'R-SUP-005', version, 'cep', s.cep, `${onlyDigits(s.cep).length} dígitos`, null, null)
    marcar('profile', 'R-SUP-005')

    apply(rec, s2, 'R-SUP-006', version, 'cnae', s.cnae, s.cnae === null ? 'ausente' : 'presente', null, null)
    marcar('profile', 'R-SUP-006')

    apply(rec, s2, 'R-SUP-007', version, 'codigoIbge', s.codigoIbge, s.codigoIbge === null ? 'ausente' : 'presente', null, null)
    marcar('profile', 'R-SUP-007')
  }
  // VEGA classifica todo defeito do extrato pela taxonomia, antes de qualquer correção.
  const classified: ClassifiedDefect[] = work
    .flatMap((rec) =>
      rec.source._plantedDefect.map((d) => {
        const tipo = defectTypeByPlantedKind.get(d.kind)
        if (!tipo) {
          throw new Error(`Defeito "${d.kind}" sem tipo correspondente na taxonomia de origem.`)
        }
        return {
          recordCode: rec.source.codigo,
          spe: rec.source.spe,
          kind: d.kind,
          defectTypeId: tipo.id,
          nome: tipo.nome,
          origin: tipo.origin,
          severidade: tipo.severidade,
          campo: d.field,
          nota: d.note,
          roteadoPara: tipo.roteadoPara,
          monodaResponsavel: tipo.origin === 'transformation',
        }
      }),
    )
    .sort((a, b) => (a.recordCode + a.defectTypeId < b.recordCode + b.defectTypeId ? -1 : 1))

  contarPerfil('cnae', 'ausente no extrato', registros.filter((s) => s.cnae === null).length, 'R-SUP-006')
  contarPerfil('codigoIbge', 'ausente no extrato', registros.filter((s) => s.codigoIbge === null).length, 'R-SUP-007')
  contarPerfil('dataCadastro', 'em AAAA-MM-DD, divergente do restante', registros.filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro)).length, 'R-SUP-004')
  contarPerfil('cnpjCpf', 'veio com máscara', registros.filter((s) => s.cnpjCpf !== onlyDigits(s.cnpjCpf)).length, 'R-SUP-002')
  fechar('profile', work.length)

  // ---------- 3 MAP (LYRA) ----------
  const s3 = stepOf('map')
  for (const rec of work) {
    const s = rec.source
    const grouping = s.naturezaPessoa === 'J' ? 'ZFOR' : 'ZFPF'
    apply(rec, s3, 'R-SUP-011', version, 'bpGrouping', s.naturezaPessoa, grouping, { bpGrouping: grouping })
    marcar('map', 'R-SUP-011')

    const termo = PAYMENT_TERMS[s.condicaoPagamento] ?? null
    apply(rec, s3, 'R-SUP-010', version, 'paymentTerms', s.condicaoPagamento, termo, { paymentTerms: termo })
    marcar('map', 'R-SUP-010')
    if (termo === null) {
      raise(rec, 'DEF-TGT-03', 'R-SUP-010', version,
        `Condição de pagamento "${s.condicaoPagamento}" não tem entrada no domínio PAYMENT_TERMS do tenant.`)
    }

    apply(rec, s3, 'R-SUP-012', version, 'region', s.uf, s.uf, { region: s.uf })
    marcar('map', 'R-SUP-012')

    const ret = s.retencoes
    const codigos = [ret.irrf ? 'I1' : null, ret.inss ? 'N1' : null, ret.iss ? 'S1' : null, ret.pisCofinsCsll ? 'C1' : null]
      .filter((c): c is string => c !== null)
    apply(rec, s3, 'R-SUP-013', version, 'withholdingTaxType', null, codigos.join('+') || 'nenhuma',
      { withholdingTaxType: codigos })
    marcar('map', 'R-SUP-013')

    apply(rec, s3, 'R-SUP-014', version, 'industry', s.cnae, s.cnae, { industry: s.cnae })
    marcar('map', 'R-SUP-014')
  }
  fechar('map', work.length)

  // ===== CHECKPOINT 1 — mapeamento aprovado =====
  const pendentesMapeamento = [
    approvals.mapeamentoSme ? null : 'sme',
    approvals.mapeamento ? null : 'data-owner',
  ].filter((v): v is string => v !== null)
  const cp1: CheckpointState = {
    id: 'mapeamento',
    titulo: 'Mapeamento aprovado',
    apos: 'map',
    descricao:
      'O de-para contra o tenant precisa da aprovação técnica do SAP SME e da assinatura do data owner da Verene no Gate 1. Nenhuma transformação roda sobre mapeamento não aprovado.',
    requeridas: 2,
    assinadas: 2 - pendentesMapeamento.length,
    pendentes: pendentesMapeamento,
    liberado:
      approvals.mapeamentoSme?.decision === 'approved' && approvals.mapeamento?.decision === 'approved',
  }
  if (!cp1.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('transform', 'blocked')
    return montar(work, [cp1], 'transform', null, null, [], profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  // ---------- 4 TRANSFORM (ATLAS) ----------
  const s4 = stepOf('transform')
  // Os parâmetros da quebra do nome vêm da regra publicada, resolvida em KANON.
  // O agente não os escolhe, não os adivinha e não os traz do próprio código.
  const limiteNome = Number(parametroDaRegra('R-SUP-023', 'ATLAS', version, 'limite'))
  const modoDeCorte = String(parametroDaRegra('R-SUP-023', 'ATLAS', version, 'corte')) as ModoDeCorte
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)
    const isPj = s.naturezaPessoa === 'J'
    apply(rec, s4, 'R-SUP-020', version, isPj ? 'taxNumberBr1' : 'taxNumberBr2', s.cnpjCpf, digitos,
      isPj ? { taxNumberBr1: digitos } : { taxNumberBr2: digitos })
    marcar('transform', 'R-SUP-020')

    const iso = /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro)
      ? s.dataCadastro
      : (() => {
          const [d, m, a] = s.dataCadastro.split('/')
          return `${a}-${m}-${d}`
        })()
    apply(rec, s4, 'R-SUP-021', version, 'createdOn', s.dataCadastro, iso, { createdOn: iso })
    marcar('transform', 'R-SUP-021')

    rec.chaveNormalizada = chaveDedup(s.razaoSocial)
    apply(rec, s4, 'R-SUP-022', version, 'chaveNormalizada', s.razaoSocial, rec.chaveNormalizada, null,
      'Chave de comparação; não vai para o destino.')
    marcar('transform', 'R-SUP-022')

    rec.nomeQuebrado = s.razaoSocial
    const [org1, org2] = splitNome(s.razaoSocial, limiteNome, modoDeCorte)
    apply(rec, s4, 'R-SUP-023', version, 'nameOrg1', s.razaoSocial, org1, { nameOrg1: org1, nameOrg2: org2 },
      org2 === null ? null : `Excedeu ${limiteNome} caracteres; quebrado em NAME_ORG2: "${org2}".`)
    marcar('transform', 'R-SUP-023')

    const cep = onlyDigits(s.cep)
    apply(rec, s4, 'R-SUP-024', version, 'postalCode', s.cep, cep, { postalCode: cep, city: s.municipio })
    marcar('transform', 'R-SUP-024')
  }
  fechar('transform', work.length)

  // ---------- 5 DEDUPLICATE (ATLAS) ----------
  const s5 = stepOf('deduplicate')
  const porDocumento = new Map<string, Working[]>()
  for (const rec of work) {
    const doc = onlyDigits(rec.source.cnpjCpf)
    porDocumento.set(doc, [...(porDocumento.get(doc) ?? []), rec])
  }
  const clusters: DuplicateCluster[] = []
  for (const doc of [...porDocumento.keys()].sort()) {
    const membros = (porDocumento.get(doc) ?? []).slice().sort((a, b) => byCodigo(a.source, b.source))
    if (membros.length < 2) continue
    const clusterId = `CL-${doc}`
    const sobrevivente = membros
      .slice()
      .sort((a, b) => {
        const d = camposPreenchidos(b.source) - camposPreenchidos(a.source)
        if (d !== 0) return d
        if (a.source.spe !== b.source.spe) return a.source.spe < b.source.spe ? -1 : 1
        return byCodigo(a.source, b.source)
      })[0] as Working
    const razaoProposta = membros
      .map((m) => m.source.razaoSocial)
      .slice()
      .sort((a, b) => b.length - a.length || (a < b ? -1 : 1))[0] as string

    for (const m of membros) {
      m.clusterId = clusterId
      apply(m, s5, 'R-SUP-030', version, 'clusterId', null, clusterId, null,
        `Cluster por documento ${doc}, ${membros.length} membros.`)
      marcar('deduplicate', 'R-SUP-030')
      const plantado = m.source._plantedDefect.find((d) => d.kind === 'duplicata-grafia')
      const grafiasDivergem = new Set(membros.map((x) => x.source.razaoSocial)).size > 1
      raise(m, 'DEF-SRC-02', 'R-SUP-030', version,
        plantado?.note ??
          (grafiasDivergem
            ? `Mesmo documento em ${membros.length} SPEs, com grafia divergente da razão social.`
            : `Mesmo documento cadastrado em ${membros.length} SPEs, com a mesma grafia.`))
    }
    apply(sobrevivente, s5, 'R-SUP-031', version, 'sobrevivente', null, sobrevivente.source.codigo, null,
      'Mais campos preenchidos no cluster; desempate por SPE e código.')
    marcar('deduplicate', 'R-SUP-031')
    apply(sobrevivente, s5, 'R-SUP-032', version, 'nameOrg1', sobrevivente.source.razaoSocial, razaoProposta,
      null, 'Razão social mais longa do cluster.')
    marcar('deduplicate', 'R-SUP-032')

    const assinatura = approvals.clusters[clusterId]
    clusters.push({
      id: clusterId,
      documento: doc,
      membros: membros.map((m) => m.source.codigo),
      spes: [...new Set(membros.map((m) => m.source.spe))].sort(),
      sobreviventePropostoCodigo: sobrevivente.source.codigo,
      razaoSocialProposta: razaoProposta,
      motivoDaProposta: 'Registro com mais campos preenchidos; razão social por extenso.',
      confirmado: assinatura !== undefined,
      decisao: assinatura?.decision ?? null,
    })
  }

  // registro de PF com retenção divergente entre SPEs
  for (const rec of work) {
    const divergencia = rec.source._plantedDefect.find((d) => d.kind === 'retencao-pf-divergente')
    if (!divergencia) continue
    apply(rec, s5, 'R-SUP-030', version, 'retencoes', null, 'divergência entre SPEs', null, divergencia.note)
    marcar('deduplicate', 'R-SUP-030')
  }
  fechar('deduplicate', work.filter((r) => r.clusterId !== null).length)

  // ===== CHECKPOINT 2 — cada cluster confirmado um a um =====
  const pendentesCluster = clusters.filter((c) => !c.confirmado).map((c) => c.id)
  const cp2: CheckpointState = {
    id: 'duplicatas',
    titulo: 'Duplicatas confirmadas',
    apos: 'deduplicate',
    descricao: 'Cada cluster de duplicata é confirmado individualmente. Não há aprovação em lote.',
    requeridas: clusters.length,
    assinadas: clusters.length - pendentesCluster.length,
    pendentes: pendentesCluster,
    liberado: pendentesCluster.length === 0,
  }
  if (!cp2.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('enrich', 'blocked')
    return montar(work, [cp1, cp2], 'enrich', null, null, clusters, profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  // aplica a decisão de cada cluster
  for (const cluster of clusters) {
    const decisao = approvals.clusters[cluster.id]?.decision
    if (decisao !== 'approved') continue
    for (const rec of work.filter((r) => r.clusterId === cluster.id)) {
      if (rec.source.codigo === cluster.sobreviventePropostoCodigo) {
        rec.nomeQuebrado = cluster.razaoSocialProposta
        rec.draft = { ...rec.draft, nameOrg1: splitNome(cluster.razaoSocialProposta, limiteNome, modoDeCorte)[0] }
      } else {
        rec.mergedInto = cluster.sobreviventePropostoCodigo
      }
    }
  }

  // ---------- 6 ENRICH (NOVA) ----------
  const s6 = stepOf('enrich')
  let enriquecidos = 0
  for (const rec of work) {
    const s = rec.source
    let ibge = s.codigoIbge
    if (ibge === null) {
      const encontrado = buscarMunicipio(s.municipio, s.uf)
      ibge = encontrado?.codigoIbge ?? null
      apply(rec, s6, 'R-SUP-040', version, 'codigoIbge', null, ibge, null,
        ibge === null
          ? `Município "${s.municipio}/${s.uf}" não está na tabela de referência.`
          : `Derivado de ${s.municipio}/${s.uf} pela tabela do IBGE.`)
      marcar('enrich', 'R-SUP-040')
      enriquecidos += 1
      if (ibge === null) {
        raise(rec, 'DEF-SRC-08', 'R-SUP-040', version,
          `Município "${s.municipio}/${s.uf}" sem código IBGE e ausente da tabela de referência.`)
      }
    }
    apply(rec, s6, 'R-SUP-041', version, 'taxJurCode', rec.draft.taxJurCode, ibge, { taxJurCode: ibge })
    marcar('enrich', 'R-SUP-041')
  }
  fechar('enrich', enriquecidos)

  // ---------- 7 VALIDATE (NOVA) ----------
  const s7 = stepOf('validate')
  const obrigatorios = requiredFields.filter((f) => f.objeto === 'business-partner' && f.obrigatorio)
  const baseExistente = new Map(existingSuppliers.map((e) => [onlyDigits(e.cnpjCpf), e]))
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)

    if (s.naturezaPessoa === 'J') {
      const ok = isValidCnpj(s.cnpjCpf)
      apply(rec, s7, 'R-SUP-042', version, 'taxNumberBr1', digitos, ok ? 'válido' : 'inválido', null, null)
      marcar('validate', 'R-SUP-042')
      if (!ok) raise(rec, 'DEF-SRC-01', 'R-SUP-042', version, `CNPJ ${digitos} não fecha o dígito verificador.`)
    } else {
      const ok = isValidCpf(s.cnpjCpf)
      apply(rec, s7, 'R-SUP-043', version, 'taxNumberBr2', digitos, ok ? 'válido' : 'inválido', null, null)
      marcar('validate', 'R-SUP-043')
      if (!ok) raise(rec, 'DEF-SRC-01', 'R-SUP-043', version, `CPF ${digitos} não fecha o dígito verificador.`)
    }

    const existente = baseExistente.get(digitos)
    apply(rec, s7, 'R-SUP-044', version, 'businessPartner', null, existente?.businessPartner ?? 'novo',
      existente ? { businessPartner: existente.businessPartner } : null,
      existente ? `Já cadastrado como Business Partner ${existente.businessPartner}.` : null)
    marcar('validate', 'R-SUP-044')
    if (existente) {
      rec.reuseTarget = existente.businessPartner
      raise(rec, 'DEF-TGT-01', 'R-SUP-044', version,
        `CNPJ já existe no tenant como ${existente.businessPartner}. Reusar, não recriar.`)
    }

    if (s.cnae === null) {
      apply(rec, s7, 'R-SUP-045', version, 'industry', null, 'ausente', null, 'CNAE é obrigatório neste tenant.')
      marcar('validate', 'R-SUP-045')
      raise(rec, 'DEF-SRC-03', 'R-SUP-045', version,
        'CNAE em branco e obrigatório no tenant. A derivação de CNAE é regra candidata e não executa.')
    } else {
      const faltando = obrigatorios
        .map((f) => f.campo)
        .filter((campo) => {
          if (campo === 'TAX_NUMBER_BR1') return s.naturezaPessoa === 'J' && rec.draft.taxNumberBr1 === null
          if (campo === 'TAX_NUMBER_BR2') return s.naturezaPessoa === 'F' && rec.draft.taxNumberBr2 === null
          if (campo === 'INDUSTRY') return rec.draft.industry === null
          if (campo === 'TAXJURCODE') return rec.draft.taxJurCode === null
          if (campo === 'PAYMENT_TERMS') return rec.draft.paymentTerms === null
          if (campo === 'WITHHOLDING_TAX_TYPE') return rec.draft.withholdingTaxType.length === 0
          if (campo === 'REGION') return rec.draft.region === null
          if (campo === 'BP_GROUPING') return rec.draft.bpGrouping === null
          if (campo === 'NAME_ORG1') return rec.draft.nameOrg1 === null
          return false
        })
      apply(rec, s7, 'R-SUP-045', version, 'campos obrigatórios', null,
        faltando.length === 0 ? 'completos' : faltando.join(', '), null, null)
      marcar('validate', 'R-SUP-045')
      if (faltando.length > 0) {
        raise(rec, 'DEF-TGT-02', 'R-SUP-045', version,
          `Campos obrigatórios do tenant sem valor: ${faltando.join(', ')}.`)
      }
    }

    // A regra diz "RETER AMBOS": a retenção não pode depender de qual lado da
    // dupla foi marcado no extrato. Deriva-se do cruzamento por documento —
    // divergiu com o mesmo CPF em outra SPE, os dois ficam retidos.
    const contraparte = divergenciaDeRetencao(rec.source)
    if (contraparte) {
      const nota =
        rec.source._plantedDefect.find((d) => d.kind === 'retencao-pf-divergente')?.note ??
        `Mesmo CPF de ${contraparte.codigo} (${contraparte.spe}), com retenção diferente. Nenhuma configuração do tenant decide qual está certa.`
      apply(rec, s7, 'R-SUP-047', version, 'retencoes', null, 'divergente', null, nota)
      marcar('validate', 'R-SUP-047')
      raise(rec, 'DEF-TGT-04', 'R-SUP-047', version, nota)
    }

    // R-SUP-048 — a validação da quebra do nome. É de NOVA, não de ATLAS: se a
    // validação viesse do mesmo raciocínio que quebrou, o defeito passaria pelas
    // duas. Na v1.0.0 ela acha oito; na v1.4.0, nenhum.
    const org1 = rec.draft.nameOrg1
    if (org1 !== null && cortouPalavra(rec.nomeQuebrado, org1)) {
      const org2 = rec.draft.nameOrg2 ?? ''
      const nota = `"${rec.nomeQuebrado}" quebrou em "${org1}" + "${org2}": o corte caiu no meio da palavra.`
      apply(rec, s7, 'R-SUP-048', version, 'nameOrg1', rec.nomeQuebrado, org1, null, nota)
      marcar('validate', 'R-SUP-048')
      raise(rec, 'DEF-TRF-02', 'R-SUP-048', version, nota)
    }
  }
  fechar('validate', work.length)

  const excecoesAbertas = work.flatMap((r) => r.exceptions).slice().sort((a, b) => (a.id < b.id ? -1 : 1))

  // ===== CHECKPOINT 3 — cada exceção decidida =====
  const pendentesExcecao = excecoesAbertas.filter((e) => approvals.excecoes[e.id] === undefined).map((e) => e.id)
  const cp3: CheckpointState = {
    id: 'excecoes',
    titulo: 'Exceções liberadas',
    apos: 'validate',
    descricao: 'Toda exceção aberta precisa de uma decisão humana: liberar ou manter retido.',
    requeridas: excecoesAbertas.length,
    assinadas: excecoesAbertas.length - pendentesExcecao.length,
    pendentes: pendentesExcecao,
    liberado: pendentesExcecao.length === 0,
  }
  if (!cp3.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('package', 'blocked')
    return montar(work, [cp1, cp2, cp3], 'package', null, null, clusters, profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  // resolve o estado final de cada registro a partir das decisões assinadas
  resolverTodos(work, approvals)

  // ---------- 8 PACKAGE (ORION) ----------
  const s8 = stepOf('package')
  const empacotaveis = work.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused').sort((a, b) => byCodigo(a.source, b.source))
  for (const rec of empacotaveis) {
    apply(rec, s8, 'R-PKG-001', version, 'pacote', null, 'incluído', null, `Outcome ${rec.outcome}.`)
    marcar('package', 'R-PKG-001')
    apply(rec, s8, 'R-PKG-003', version, 'businessPartner', rec.draft.businessPartner,
      rec.draft.businessPartner ?? 'a atribuir na faixa externa', null, null)
    marcar('package', 'R-PKG-003')
  }
  const datasetChecksum = hashSeed(
    empacotaveis.map((r) => `${r.source.codigo}${r.draft.taxNumberBr1 ?? r.draft.taxNumberBr2 ?? ''}${r.draft.nameOrg1 ?? ''}`).join('|'),
  ).toString(16).padStart(8, '0')
  const loadPackage: LoadPackageResult = {
    id: `PKG-${input.spe ?? 'todas'}-${version}`,
    registros: empacotaveis.map((r) => r.source.codigo),
    total: empacotaveis.length,
    manifest: {
      playbookVersion: version,
      playbookChecksum: sealed.checksum,
      datasetChecksum,
      total: empacotaveis.length,
      geradoEm: simInstant().toISOString(),
    },
  }
  marcar('package', 'R-PKG-002')
  marcar('package', 'R-PKG-004')
  fechar('package', empacotaveis.length)

  // ---------- 9 RECONCILE (SIRIUS) ----------
  const conta = (o: RecordOutcome): number => work.filter((r) => r.outcome === o).length
  const reconciliation: ReconciliationReport = {
    recebidos: work.length,
    migrated: conta('migrated'),
    reused: conta('reused'),
    merged: conta('merged'),
    held: conta('held'),
    fecha: conta('migrated') + conta('reused') + conta('merged') + conta('held') === work.length,
    semTrilha: work.filter((r) => r.trail.length === 0).map((r) => r.source.codigo).sort(),
    retidosSemExcecao: work.filter((r) => r.outcome === 'held' && r.exceptions.length === 0).map((r) => r.source.codigo).sort(),
  }
  marcar('reconcile', 'R-REC-001')
  marcar('reconcile', 'R-REC-002')
  marcar('reconcile', 'R-REC-003')
  fechar('reconcile', work.length)

  // ===== CHECKPOINT 4 — pacote e reconciliação assinados pelo data owner =====
  const pendentes4 = [
    approvals.pacote ? null : 'pacote',
    approvals.reconciliacao ? null : 'reconciliacao',
  ].filter((v): v is string => v !== null)
  const cp4: CheckpointState = {
    id: 'pacote-reconciliacao',
    titulo: 'Pacote e reconciliação aprovados',
    apos: 'reconcile',
    descricao: 'O data owner assina o pacote e a reconciliação. Sem as duas assinaturas, nada é liberado para carga.',
    requeridas: 2,
    assinadas: 2 - pendentes4.length,
    pendentes: pendentes4,
    liberado:
      approvals.pacote?.decision === 'approved' && approvals.reconciliacao?.decision === 'approved',
  }

  return montar(work, [cp1, cp2, cp3, cp4], null, loadPackage, reconciliation, clusters, profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
}

function tallyByOrigin(defeitos: readonly ClassifiedDefect[]): readonly OriginTally[] {
  return defectOriginIds.map((origin) => {
    const doGrupo = defeitos.filter((d) => d.origin === origin)
    return {
      origin,
      total: doGrupo.length,
      critical: doGrupo.filter((d) => d.severidade === 'critical').length,
      nonCritical: doGrupo.filter((d) => d.severidade === 'non-critical').length,
      monodaResponsavel: origin === 'transformation',
    }
  })
}

function montar(
  work: readonly Working[],
  checkpoints: readonly CheckpointState[],
  blockedAt: StepId | null,
  loadPackage: LoadPackageResult | null,
  reconciliation: ReconciliationReport | null,
  clusters: readonly DuplicateCluster[],
  profile: readonly ProfileFinding[],
  classified: readonly ClassifiedDefect[],
  sealed: { readonly checksum: string },
  version: string,
  spe: SpeId | 'todas',
  steps: readonly StepResult[],
): PipelineRun {
  const records: RecordResult[] = work
    .map((r) => ({
      codigo: r.source.codigo,
      spe: r.source.spe,
      source: r.source,
      trail: r.trail,
      target: r.outcome === 'held' ? null : r.draft,
      outcome: r.outcome,
      exceptions: r.exceptions.slice().sort((a, b) => (a.id < b.id ? -1 : 1)),
      clusterId: r.clusterId,
      resolvidoPara: r.mergedInto ?? r.reuseTarget,
    }))
    .sort(byCodigo)

  return {
    playbookVersion: version,
    playbookChecksum: sealed.checksum,
    spe,
    steps: steps.slice().sort((a, b) => a.n - b.n),
    records,
    profile,
    classifiedDefects: classified,
    defectsByOrigin: tallyByOrigin(classified),
    clusters,
    exceptions: records.flatMap((r) => r.exceptions),
    checkpoints,
    blockedAt,
    loadPackage,
    reconciliation,
  }
}
