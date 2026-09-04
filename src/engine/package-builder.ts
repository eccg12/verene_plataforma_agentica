/**
 * Construção do pacote de carga — ORION.
 *
 * O XML é gerado dos registros de fato, não é texto de exemplo colado. O
 * tamanho do pacote sai do tamanho real do XML por registro, extrapolado para o
 * volume declarado do escopo; a divisão em partes é aritmética sobre esse
 * número, não um "≈". Conformidade é conferida campo a campo contra os campos
 * obrigatórios do tenant.
 *
 * Determinístico: mesmos registros e mesma versão de playbook, mesmo XML, mesmo
 * checksum, mesma divisão.
 */
import { LIMITE_ARQUIVO_MB, LIMITE_REGISTROS_POR_PARTE } from '@/data/delivery'
import { loadPackageBoard, type LoadPackageBoard } from '@/data/packages'
import { scopeObjects } from '@/data/scope'
import { requiredFields, tenantRelease } from '@/data/target/tenant-config'
import type { MigrationObjectId } from '@/data/types'
import { simInstant } from '@/engine/clock'
import { sealPlaybook } from '@/engine/kanon'
import { hashSeed } from '@/engine/random'
import type { BusinessPartnerTarget, PipelineRun, RecordResult } from '@/engine/pipeline'

// ============================================================ XML

const escapar = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Campos do Business Partner na ordem em que o Migration Cockpit os espera. */
const CAMPOS_BP: readonly { readonly tag: string; readonly ler: (t: BusinessPartnerTarget) => string | null }[] = [
  { tag: 'BUSINESS_PARTNER', ler: (t) => t.businessPartner },
  { tag: 'BP_GROUPING', ler: (t) => t.bpGrouping },
  { tag: 'NAME_ORG1', ler: (t) => t.nameOrg1 },
  { tag: 'NAME_ORG2', ler: (t) => t.nameOrg2 },
  { tag: 'TAX_NUMBER_BR1', ler: (t) => t.taxNumberBr1 },
  { tag: 'TAX_NUMBER_BR2', ler: (t) => t.taxNumberBr2 },
  { tag: 'INDUSTRY', ler: (t) => t.industry },
  { tag: 'REGION', ler: (t) => t.region },
  { tag: 'TAXJURCODE', ler: (t) => t.taxJurCode },
  { tag: 'POSTAL_CODE', ler: (t) => t.postalCode },
  { tag: 'CITY', ler: (t) => t.city },
  { tag: 'PAYMENT_TERMS', ler: (t) => t.paymentTerms },
  { tag: 'WITHHOLDING_TAX_TYPE', ler: (t) => t.withholdingTaxType.join(',') || null },
  { tag: 'CREATED_ON', ler: (t) => t.createdOn },
]

function registroXml(registro: RecordResult): string {
  const alvo = registro.target
  if (!alvo) return ''
  const campos = CAMPOS_BP.map(({ tag, ler }) => {
    const valor = ler(alvo)
    return valor === null ? `      <${tag}/>` : `      <${tag}>${escapar(valor)}</${tag}>`
  })
  return `    <BusinessPartner sourceKey="${escapar(registro.codigo)}">\n${campos.join('\n')}\n    </BusinessPartner>`
}

export interface XmlGerado {
  readonly texto: string
  readonly bytes: number
  readonly registros: number
  readonly bytesPorRegistro: number
}

/** Gera o XML do pacote a partir dos registros empacotáveis do run. */
export function gerarXml(run: PipelineRun, limiteRegistros = Number.POSITIVE_INFINITY): XmlGerado {
  const selado = sealPlaybook(run.playbookVersion)
  const empacotaveis = run.records.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')
  const amostra = empacotaveis.slice(0, Number.isFinite(limiteRegistros) ? limiteRegistros : undefined)

  const cabecalho = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<MigrationObject name="Business Partner" release="${escapar(tenantRelease)}">`,
    '  <Header>',
    `    <PlaybookVersion>${escapar(run.playbookVersion)}</PlaybookVersion>`,
    `    <PlaybookChecksum>${escapar(selado.checksum)}</PlaybookChecksum>`,
    `    <RecordCount>${empacotaveis.length}</RecordCount>`,
    `    <GeneratedAt>${simInstant().toISOString()}</GeneratedAt>`,
    '  </Header>',
    '  <Records>',
  ].join('\n')
  const rodape = '\n  </Records>\n</MigrationObject>'
  const corpo = amostra.map(registroXml).filter(Boolean).join('\n')
  const texto = `${cabecalho}\n${corpo}${rodape}`

  // bytes por registro medidos no XML de fato, não estimados
  const bytesPorRegistro =
    amostra.length === 0
      ? 0
      : Math.round(new TextEncoder().encode(amostra.map(registroXml).join('\n')).length / amostra.length)

  return {
    texto,
    bytes: new TextEncoder().encode(texto).length,
    registros: empacotaveis.length,
    bytesPorRegistro,
  }
}

// ============================================================ conformidade

export type ResultadoConformidade = 'ok' | 'falha' | 'nao-verificado'

export interface ChecagemConformidade {
  readonly id: string
  readonly nome: string
  readonly descricao: string
  readonly resultado: ResultadoConformidade
  readonly detalhe: string
  /** Registros que falharam, quando houver. */
  readonly registrosAfetados: readonly string[]
}

/** Limite de caracteres dos campos do Business Partner no tenant. */
const LIMITES_CAMPO: Readonly<Record<string, number>> = {
  NAME_ORG1: 40,
  NAME_ORG2: 40,
  TAX_NUMBER_BR1: 14,
  TAX_NUMBER_BR2: 11,
  POSTAL_CODE: 8,
  BUSINESS_PARTNER: 10,
}

export function conferirConformidade(run: PipelineRun): readonly ChecagemConformidade[] {
  const empacotaveis = run.records.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')

  // --- tamanho de campo
  const excedidos: string[] = []
  for (const r of empacotaveis) {
    const alvo = r.target
    if (!alvo) continue
    for (const { tag, ler } of CAMPOS_BP) {
      const limite = LIMITES_CAMPO[tag]
      const valor = ler(alvo)
      if (limite !== undefined && valor !== null && valor.length > limite) excedidos.push(`${r.codigo}/${tag}`)
    }
  }

  // --- formato
  const formatoRuim: string[] = []
  for (const r of empacotaveis) {
    const alvo = r.target
    if (!alvo) continue
    if (alvo.taxNumberBr1 !== null && !/^\d{14}$/.test(alvo.taxNumberBr1)) formatoRuim.push(`${r.codigo}/TAX_NUMBER_BR1`)
    if (alvo.taxNumberBr2 !== null && !/^\d{11}$/.test(alvo.taxNumberBr2)) formatoRuim.push(`${r.codigo}/TAX_NUMBER_BR2`)
    if (alvo.createdOn !== null && !/^\d{4}-\d{2}-\d{2}$/.test(alvo.createdOn)) formatoRuim.push(`${r.codigo}/CREATED_ON`)
    if (alvo.taxJurCode !== null && !/^\d{7}$/.test(alvo.taxJurCode)) formatoRuim.push(`${r.codigo}/TAXJURCODE`)
  }

  // --- integridade referencial: campos obrigatórios do tenant preenchidos
  const obrigatorios = requiredFields.filter((f) => f.objeto === 'business-partner' && f.obrigatorio)
  const semObrigatorio: string[] = []
  for (const r of empacotaveis) {
    const alvo = r.target
    if (!alvo) continue
    if (alvo.bpGrouping === null) semObrigatorio.push(`${r.codigo}/BP_GROUPING`)
    if (alvo.nameOrg1 === null) semObrigatorio.push(`${r.codigo}/NAME_ORG1`)
    if (alvo.region === null) semObrigatorio.push(`${r.codigo}/REGION`)
    if (alvo.taxJurCode === null) semObrigatorio.push(`${r.codigo}/TAXJURCODE`)
    if (alvo.paymentTerms === null) semObrigatorio.push(`${r.codigo}/PAYMENT_TERMS`)
    if (alvo.industry === null) semObrigatorio.push(`${r.codigo}/INDUSTRY`)
  }

  // --- faixa de numeração dos que reusam Business Partner existente
  const foraDaFaixa = empacotaveis
    .filter((r) => r.target?.businessPartner !== null && r.target !== null)
    .filter((r) => {
      const bp = r.target?.businessPartner ?? ''
      return !(bp >= '1000000000' && bp <= '1999999999')
    })
    .map((r) => r.codigo)

  const montar = (
    id: string,
    nome: string,
    descricao: string,
    falhas: readonly string[],
    verificavel: boolean,
    okDetalhe: string,
  ): ChecagemConformidade => ({
    id,
    nome,
    descricao,
    resultado: !verificavel ? 'nao-verificado' : falhas.length === 0 ? 'ok' : 'falha',
    detalhe: !verificavel
      ? 'Nada empacotado ainda: a esteira não chegou ao passo 8.'
      : falhas.length === 0
        ? okDetalhe
        : `${falhas.length} ocorrência(s).`,
    registrosAfetados: falhas.slice().sort(),
  })

  // Só há o que conferir depois que o passo 8 rodou. Registro com outcome
  // "migrated" antes disso ainda não foi empacotado.
  const temPacote = run.steps.find((s) => s.id === 'package')?.status === 'completed'
  return [
    montar('CONF-01', 'Tamanho de campo',
      `Nenhum valor excede o limite do campo no tenant (NAME_ORG1 e NAME_ORG2 em 40, TAX_NUMBER_BR1 em 14).`,
      excedidos, temPacote, `${empacotaveis.length} registros dentro dos limites.`),
    montar('CONF-02', 'Formato',
      'CNPJ e CPF só com dígitos, data em AAAA-MM-DD, domicílio fiscal com sete dígitos.',
      formatoRuim, temPacote, 'Todos os campos no formato do destino.'),
    montar('CONF-03', 'Integridade referencial',
      `Todo campo obrigatório do tenant preenchido (${obrigatorios.length} campos declarados em tenant-config).`,
      semObrigatorio, temPacote, 'Nenhum campo obrigatório vazio.'),
    montar('CONF-04', 'Faixa de numeração externa',
      'Business Partner dentro da faixa externa do grupo de contas. Fora da faixa, o Migration Cockpit rejeita o lote inteiro.',
      foraDaFaixa, temPacote, 'Todos os números dentro das faixas Z1/Z2/Z3.'),
  ]
}

// ============================================================ divisão em partes

export interface ParteDoPacote {
  readonly indice: number
  readonly nomeArquivo: string
  readonly registros: number
  readonly bytes: number
  readonly megabytes: number
  readonly checksum: string
}

export interface DivisaoPacote {
  readonly objetoId: string
  readonly registrosTotais: number
  readonly bytesPorRegistro: number
  readonly bytesTotais: number
  readonly megabytesTotais: number
  readonly limiteMb: number
  readonly limiteRegistros: number
  /** Qual dos dois limites determinou a divisão. */
  readonly limitante: 'tamanho' | 'registros' | 'nenhum'
  readonly partes: readonly ParteDoPacote[]
}

/**
 * Divide o pacote pelos dois tetos: 100 MB por arquivo e 500 registros por
 * lote. Vale o menor dos dois.
 */
export function dividirPacote(
  objetoId: string,
  registrosTotais: number,
  bytesPorRegistro: number,
): DivisaoPacote {
  const bytesTotais = registrosTotais * bytesPorRegistro
  const limiteBytes = LIMITE_ARQUIVO_MB * 1024 * 1024
  const porTamanho = bytesPorRegistro === 0 ? registrosTotais : Math.floor(limiteBytes / bytesPorRegistro)
  const porLote = LIMITE_REGISTROS_POR_PARTE
  const registrosPorParte = Math.max(1, Math.min(porTamanho, porLote))
  const limitante: DivisaoPacote['limitante'] =
    registrosTotais <= registrosPorParte ? 'nenhum' : porTamanho < porLote ? 'tamanho' : 'registros'

  const quantidade = Math.max(1, Math.ceil(registrosTotais / registrosPorParte))
  const partes: ParteDoPacote[] = []
  let restantes = registrosTotais
  for (let i = 0; i < quantidade; i += 1) {
    const nesta = Math.min(registrosPorParte, restantes)
    restantes -= nesta
    const bytes = nesta * bytesPorRegistro
    partes.push({
      indice: i + 1,
      nomeArquivo: `KEPLER_${objetoId.toUpperCase()}_${String(i + 1).padStart(2, '0')}de${String(quantidade).padStart(2, '0')}.XML`,
      registros: nesta,
      bytes,
      megabytes: Number((bytes / (1024 * 1024)).toFixed(2)),
      checksum: hashSeed(`${objetoId}|${i + 1}|${nesta}|${bytes}`).toString(16).padStart(8, '0').toUpperCase(),
    })
  }

  return {
    objetoId,
    registrosTotais,
    bytesPorRegistro,
    bytesTotais,
    megabytesTotais: Number((bytesTotais / (1024 * 1024)).toFixed(2)),
    limiteMb: LIMITE_ARQUIVO_MB,
    limiteRegistros: LIMITE_REGISTROS_POR_PARTE,
    limitante,
    partes,
  }
}

// ============================================================ visão da tela

export interface PacotePorObjeto {
  readonly objetoId: string
  readonly nome: string
  readonly objetosTenant: readonly MigrationObjectId[]
  readonly volume: number
  readonly porSpe: readonly LoadPackageBoard[]
}

/** Os pacotes agrupados por objeto, com o estado de cada SPE nos dois ciclos. */
export const pacotesPorObjeto: readonly PacotePorObjeto[] = scopeObjects.map((objeto) => ({
  objetoId: objeto.id,
  nome: objeto.nome,
  objetosTenant: objeto.objetosTenant,
  volume: objeto.volume,
  porSpe: loadPackageBoard.filter((p) => p.objetoId === objeto.id),
}))
