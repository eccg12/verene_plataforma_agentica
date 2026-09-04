/**
 * A MESMA esteira, aplicada a linha de serviço de contrato.
 *
 * Os nove passos, os mesmos agentes, a mesma trilha e — o que importa — o mesmo
 * guarda: toda mutação passa por `resolveRule` em KANON, que recusa regra fora
 * da versão, candidata ou de outro agente. Nada aqui é um caminho paralelo com
 * regras próprias.
 *
 * Linha de contrato é o objeto de maior densidade de regra do escopo: unidade
 * divergente entre SPEs, reconciliação com o cabeçalho, fase fiscal, grupo de
 * serviço derivado e enquadramento de ISS. Se a esteira atende este, atende os
 * fáceis.
 */
import type { AgentName } from '@/data/agents'
import { defectTypeById } from '@/data/defect-taxonomy'
import { PLAYBOOK_VERSION } from '@/data/playbook'
import { classificarLc116 } from '@/data/reference/lc116'
import type { NasajonContract, NasajonContractLine } from '@/data/source/nasajon-contracts'
import { valueDomains } from '@/data/target/tenant-config'
import { MINUTE_MS, simInstant } from '@/engine/clock'
import { resolveRule, sealPlaybook } from '@/engine/kanon'
import {
  pipelineSteps,
  type ExceptionRecord,
  type RecordOutcome,
  type StepId,
  type StepSpec,
  type TrailEntry,
} from '@/engine/pipeline'
import { splitNome } from '@/engine/pipeline'

export interface ContractLineTarget {
  readonly agreementItem: string | null
  readonly shortText: string | null
  readonly baseUom: string | null
  readonly quantity: number | null
  readonly netPrice: number | null
  readonly netValue: number | null
  readonly serviceGroup: string | null
  readonly codigoLc116: string | null
  readonly incoterms: string | null
  readonly costCenter: string | null
}

export interface ContractLineResult {
  /** `CTR-2023-404~10` — contrato e item. */
  readonly id: string
  readonly contrato: NasajonContract
  readonly linha: NasajonContractLine
  readonly trail: readonly TrailEntry[]
  readonly target: ContractLineTarget | null
  readonly outcome: RecordOutcome
  readonly exceptions: readonly ExceptionRecord[]
}

const EMPTY: ContractLineTarget = {
  agreementItem: null,
  shortText: null,
  baseUom: null,
  quantity: null,
  netPrice: null,
  netValue: null,
  serviceGroup: null,
  codigoLc116: null,
  incoterms: null,
  costCenter: null,
}

const UOM_TENANT: Readonly<Record<string, string>> = {
  M: 'M', MT: 'M', METRO: 'M', KM: 'KM', UN: 'ST', H: 'H', DIA: 'DAY', MES: 'MON', VB: 'LE',
}

const SERVICE_GROUP: readonly { readonly prefixo: string; readonly grupo: string }[] = [
  { prefixo: 'CC-LT', grupo: 'ZLT' },
  { prefixo: 'CC-SE', grupo: 'ZSE' },
  { prefixo: 'CC-ENG', grupo: 'ZENG' },
  { prefixo: 'CC-AMB', grupo: 'ZAMB' },
  { prefixo: 'CC-OBRA', grupo: 'ZLOC' },
  { prefixo: 'CC-LOG', grupo: 'ZLOC' },
  { prefixo: 'CC-SEG', grupo: 'ZSE' },
  { prefixo: 'CC-SUP', grupo: 'ZLOC' },
]

interface Working {
  readonly trail: TrailEntry[]
  readonly exceptions: ExceptionRecord[]
  draft: ContractLineTarget
}

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))
const stepOf = (id: StepId): StepSpec => pipelineSteps.find((s) => s.id === id) as StepSpec

/** Mesma porta de mutação da esteira de fornecedores: resolve em KANON antes de aplicar. */
function apply(
  rec: Working,
  step: StepSpec,
  ruleId: string,
  version: string,
  field: string,
  before: unknown,
  after: unknown,
  patch: Partial<ContractLineTarget> | null,
  note: string | null = null,
): void {
  const rule = resolveRule(ruleId, step.agent, version)
  if (patch) rec.draft = { ...rec.draft, ...patch }
  const seq = rec.trail.length + 1
  rec.trail.push({
    seq,
    at: simInstant(step.n * 15 * MINUTE_MS + seq * 3_000).toISOString(),
    step: step.id,
    agent: rule.agent as AgentName,
    ruleId: rule.id,
    playbookVersion: version,
    field,
    before: str(before),
    after: str(after),
    note,
  })
}

function raise(
  rec: Working,
  id: string,
  defectTypeId: string,
  ruleId: string,
  version: string,
  mensagem: string,
): void {
  const tipo = defectTypeById.get(defectTypeId)
  if (!tipo) throw new Error(`Tipo de defeito desconhecido: ${defectTypeId}`)
  rec.exceptions.push({
    id: `${id}:${defectTypeId}`,
    recordCode: id,
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

export function runContractLine(
  contrato: NasajonContract,
  linha: NasajonContractLine,
  playbookVersion: string = PLAYBOOK_VERSION,
): ContractLineResult {
  const version = playbookVersion
  sealPlaybook(version)
  // '#' viraria fragmento de URL e sumiria do path; '~' atravessa a rota inteiro.
  const id = `${contrato.numero}~${linha.item}`
  const rec: Working = { trail: [], exceptions: [], draft: EMPTY }

  // ---------- 1 RECEIVE (VEGA) ----------
  const calculado = Number((linha.quantidade * linha.precoUnitario).toFixed(2))
  const fecha = Math.abs(calculado - linha.valorTotal) <= 0.01
  apply(rec, stepOf('receive'), 'R-CTR-001', version, 'linhas[].valorTotal', linha.valorTotal, calculado, null,
    fecha ? 'Quantidade x preço fecha com o total da linha.' : 'Quantidade x preço NÃO fecha com o total da linha.')

  // ---------- 2 PROFILE (VEGA) ----------
  const reconhecida = linha.unidadeMedida in UOM_TENANT
  apply(rec, stepOf('profile'), 'R-CTR-002', version, 'linhas[].unidadeMedida', linha.unidadeMedida,
    reconhecida ? 'reconhecida' : 'desconhecida', null,
    ['MT', 'METRO'].includes(linha.unidadeMedida)
      ? `Grafia divergente: esta SPE escreve metro como "${linha.unidadeMedida}".`
      : null)

  // ---------- 3 MAP (LYRA) ----------
  const uom = UOM_TENANT[linha.unidadeMedida] ?? null
  apply(rec, stepOf('map'), 'R-CTR-010', version, 'baseUom', linha.unidadeMedida, uom, { baseUom: uom },
    uom !== null && uom !== linha.unidadeMedida ? `Normalizada para o domínio UOM do tenant.` : null)
  if (uom === null) {
    raise(rec, id, 'DEF-TGT-03', 'R-CTR-010', version,
      `Unidade "${linha.unidadeMedida}" não tem correspondente no domínio UOM do tenant.`)
  }
  // Incoterms: regra candidata. Não executa — abre exceção.
  if (contrato.tipo === 'servico') {
    raise(rec, id, 'DEF-TGT-02', 'R-CTR-011', version,
      'O tenant exige Incoterms em contrato de serviço e o extrato não traz o dado. A regra que preencheria é candidata e não executa.')
  }

  // ---------- 4 TRANSFORM (ATLAS) ----------
  const [shortText] = splitNome(linha.descricao, 40)
  apply(rec, stepOf('transform'), 'R-CTR-021', version, 'shortText', linha.descricao, shortText,
    { shortText, agreementItem: String(linha.item).padStart(5, '0'), costCenter: linha.centroCusto },
    linha.descricao.length > 40 ? 'Excedeu 40 caracteres; quebrado na última palavra inteira.' : null)
  apply(rec, stepOf('transform'), 'R-CTR-020', version, 'quantity', linha.quantidade, linha.quantidade,
    { quantity: linha.quantidade, netPrice: linha.precoUnitario, netValue: linha.valorTotal },
    'Só o código da unidade muda; a quantidade permanece.')

  // ---------- 5 DEDUPLICATE (ATLAS) ----------
  // Linha de contrato não deduplica: a chave é o par contrato + item, único por construção.
  // O passo roda sem aplicar regra, e a trilha registra isso pela ausência.

  // ---------- 6 ENRICH (NOVA) ----------
  const grupo = SERVICE_GROUP.find((g) => linha.centroCusto.startsWith(g.prefixo))?.grupo ?? null
  apply(rec, stepOf('enrich'), 'R-CTR-040', version, 'serviceGroup', linha.centroCusto, grupo,
    { serviceGroup: grupo },
    grupo === null ? 'Centro de custo sem prefixo conhecido.' : `Derivado do prefixo do centro de custo.`)

  const lc = classificarLc116(linha.descricao)
  apply(rec, stepOf('enrich'), 'R-CTR-041', version, 'codigoLc116', null, lc?.item ?? null,
    { codigoLc116: lc?.item ?? null },
    lc === null
      ? 'Sem correspondência na tabela da LC 116. Nenhuma proposta é feita.'
      : lc.incide
        ? `${lc.fundamento}.`
        : `${lc.descricao} ${lc.fundamento}.`)

  // ---------- 7 VALIDATE (NOVA) ----------
  apply(rec, stepOf('validate'), 'R-CTR-030', version, 'faseFiscal', contrato.faseFiscal,
    contrato.faseFiscal === 'concluida' ? 'aprovada' : 'reprovada', null, null)
  if (contrato.faseFiscal !== 'concluida') {
    raise(rec, id, 'DEF-SRC-04', 'R-CTR-030', version,
      'Contrato com fase fiscal aberta no Nasajon. Não pode virar Outline agreement.')
  }

  const somaLinhas = contrato.linhas.reduce((acc, l) => acc + l.valorTotal, 0)
  const reconcilia = Math.abs(somaLinhas - contrato.valorOriginal) <= 0.01
  apply(rec, stepOf('validate'), 'R-CTR-031', version, 'valorOriginal', contrato.valorOriginal,
    Number(somaLinhas.toFixed(2)), null,
    reconcilia ? 'Soma das linhas bate com o cabeçalho.' : 'Soma das linhas NÃO bate com o cabeçalho do contrato.')
  if (!reconcilia) {
    raise(rec, id, 'DEF-SRC-05', 'R-CTR-031', version,
      `A soma das linhas dá ${somaLinhas.toFixed(2)} e o cabeçalho diz ${contrato.valorOriginal.toFixed(2)}.`)
  }

  const criticas = rec.exceptions.filter((e) => e.severidade === 'critical')
  const outcome: RecordOutcome = criticas.length > 0 ? 'held' : 'migrated'

  // ---------- 8 PACKAGE (ORION) ----------
  if (outcome !== 'held') {
    apply(rec, stepOf('package'), 'R-PKG-001', version, 'pacote', null, 'incluído', null, null)
  }

  // ---------- 9 RECONCILE (SIRIUS) ----------
  apply(rec, stepOf('reconcile'), 'R-REC-002', version, 'trilha', null, `${rec.trail.length + 1} entradas`, null,
    'Toda linha atravessa a esteira com trilha não vazia.')

  return {
    id,
    contrato,
    linha,
    trail: rec.trail,
    target: outcome === 'held' ? null : rec.draft,
    outcome,
    exceptions: rec.exceptions.slice().sort((a, b) => (a.id < b.id ? -1 : 1)),
  }
}

/** Domínio UOM do tenant, para a tela mostrar contra o que a conversão foi feita. */
export const dominioUom = valueDomains.find((d) => d.id === 'UOM')
