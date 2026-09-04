/**
 * A evidência da regra candidata — derivada, nunca digitada.
 *
 * O que o agente consegue fazer é isto: cruzar o dado, mostrar que o padrão
 * existe, medir a frequência e nomear a regra que o explicaria. O que ele não
 * consegue é dizer que a regra está certa — e é por isso que o resultado deste
 * módulo termina numa fila humana, não numa mutação.
 *
 * Tudo aqui sai das fixtures. O texto em linguagem natural que a tela mostra ao
 * lado disto vem do modelo (`src/net/rule-hypothesis.ts`) e é apresentação: não
 * entra na esteira nem em checksum nenhum.
 */
import { REGRA_CANDIDATA, TIPO_DE_DEFEITO } from '@/data/candidate-hypothesis'
import { defectTypeById } from '@/data/defect-taxonomy'
import { ownerDaArea, type Owner } from '@/data/owners'
import { ruleById, type PlaybookRule } from '@/data/playbook'
import { nasajonSuppliers, type NasajonSupplier } from '@/data/source/nasajon-suppliers'
import type { Retencoes } from '@/data/types'
import { onlyDigits } from '@/engine/br-documents'
import { DAY_MS, simInstant } from '@/engine/clock'

export interface CampoDivergente {
  readonly campo: string
  readonly rotulo: string
  /** Valor de cada lado, na ordem dos membros. */
  readonly valores: readonly { readonly codigo: string; readonly valor: string }[]
}

export interface DuplaDivergente {
  readonly id: string
  readonly documento: string
  readonly nome: string
  /** Sempre dois: o cadastro de cada SPE. */
  readonly membros: readonly NasajonSupplier[]
  readonly camposDivergentes: readonly CampoDivergente[]
  /** O que os dois lados têm igual. É o que torna a divergência estranha. */
  readonly coincidencias: readonly string[]
}

export interface FrequenciaDoPadrao {
  readonly pessoasFisicas: number
  /** PF com o mesmo CPF cadastrado em mais de uma SPE. */
  readonly comCadastroEmMaisDeUmaSpe: number
  /** Dessas, quantas divergem na retenção. */
  readonly divergentes: number
  readonly registrosEnvolvidos: number
  readonly spesEnvolvidas: number
  /** Percentual de divergência dentro do recorte que a regra alcança. */
  readonly percentual: number
}

export interface CasoDaRegraCandidata {
  readonly regra: PlaybookRule
  readonly duplas: readonly DuplaDivergente[]
  readonly frequencia: FrequenciaDoPadrao
  readonly dono: Owner | null
  readonly area: string
  readonly prazoDias: number
  /** Data limite, derivada do epoch fixo da simulação. */
  readonly prazo: string
  readonly severidade: string
}

const ROTULOS: Readonly<Record<keyof Retencoes, string>> = {
  iss: 'Retenção de ISS',
  irrf: 'Retenção de IRRF',
  inss: 'Retenção de INSS',
  pisCofinsCsll: 'Retenção de PIS/COFINS/CSLL',
  aliquotaIss: 'Alíquota de ISS',
}

const mostrar = (valor: boolean | number | null): string =>
  valor === null ? 'não se aplica' : typeof valor === 'boolean' ? (valor ? 'sim' : 'não') : `${valor}%`

/** Pessoas físicas com o mesmo CPF em mais de uma SPE, agrupadas por documento. */
function gruposDePf(): readonly (readonly NasajonSupplier[])[] {
  const porDocumento = new Map<string, NasajonSupplier[]>()
  for (const s of nasajonSuppliers) {
    if (s.naturezaPessoa !== 'F') continue
    const doc = onlyDigits(s.cnpjCpf)
    porDocumento.set(doc, [...(porDocumento.get(doc) ?? []), s])
  }
  return [...porDocumento.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, membros]) => membros.slice().sort((a, b) => (a.codigo < b.codigo ? -1 : 1)))
    .filter((membros) => new Set(membros.map((m) => m.spe)).size > 1)
}

function divergencia(membros: readonly NasajonSupplier[]): readonly CampoDivergente[] {
  const campos = Object.keys(ROTULOS) as (keyof Retencoes)[]
  return campos
    .filter((campo) => new Set(membros.map((m) => String(m.retencoes[campo]))).size > 1)
    .map((campo) => ({
      campo,
      rotulo: ROTULOS[campo],
      valores: membros.map((m) => ({ codigo: m.codigo, valor: mostrar(m.retencoes[campo]) })),
    }))
}

/** O que é idêntico nos dois lados — é isso que descarta as explicações fáceis. */
function coincidencias(membros: readonly NasajonSupplier[]): readonly string[] {
  const iguais: string[] = []
  const todosIguais = (ler: (s: NasajonSupplier) => string | null): boolean =>
    new Set(membros.map(ler)).size === 1
  if (todosIguais((s) => s.razaoSocial)) iguais.push(membros[0]!.razaoSocial)
  if (todosIguais((s) => s.cnae)) iguais.push(`CNAE ${membros[0]!.cnae ?? ''}`)
  if (todosIguais((s) => s.condicaoPagamento)) iguais.push(`condição ${membros[0]!.condicaoPagamento}`)
  if (todosIguais((s) => s.regimeTributario)) iguais.push(`regime ${membros[0]!.regimeTributario}`)
  if (todosIguais((s) => `${s.municipio}/${s.uf}`)) iguais.push(`${membros[0]!.municipio}/${membros[0]!.uf}`)
  return iguais
}

/** As duplas de PF cujo tratamento de retenção diverge entre SPEs. */
export function duplasDivergentes(): readonly DuplaDivergente[] {
  return gruposDePf()
    .map((membros) => ({ membros, campos: divergencia(membros) }))
    .filter(({ campos }) => campos.length > 0)
    .map(({ membros, campos }) => ({
      id: onlyDigits(membros[0]!.cnpjCpf),
      documento: membros[0]!.cnpjCpf,
      nome: membros[0]!.razaoSocial,
      membros,
      camposDivergentes: campos,
      coincidencias: coincidencias(membros),
    }))
}

export function frequenciaDoPadrao(duplas: readonly DuplaDivergente[]): FrequenciaDoPadrao {
  const grupos = gruposDePf()
  const envolvidos = duplas.flatMap((d) => d.membros)
  return {
    pessoasFisicas: nasajonSuppliers.filter((s) => s.naturezaPessoa === 'F').length,
    comCadastroEmMaisDeUmaSpe: grupos.length,
    divergentes: duplas.length,
    registrosEnvolvidos: envolvidos.length,
    spesEnvolvidas: new Set(envolvidos.map((m) => m.spe)).size,
    percentual: grupos.length === 0 ? 0 : Number(((duplas.length / grupos.length) * 100).toFixed(1)),
  }
}

/** O caso completo: evidência, frequência, regra candidata e o dono que decide. */
export function casoDaRegraCandidata(): CasoDaRegraCandidata {
  const regra = ruleById.get(REGRA_CANDIDATA)
  if (!regra) throw new Error(`Regra candidata ${REGRA_CANDIDATA} não existe no playbook.`)
  const tipo = defectTypeById.get(TIPO_DE_DEFEITO)
  if (!tipo) throw new Error(`Tipo de defeito ${TIPO_DE_DEFEITO} não existe na taxonomia.`)

  const duplas = duplasDivergentes()
  return {
    regra,
    duplas,
    frequencia: frequenciaDoPadrao(duplas),
    dono: ownerDaArea(tipo.roteadoPara),
    area: tipo.roteadoPara,
    prazoDias: tipo.prazoDias,
    prazo: simInstant(tipo.prazoDias * DAY_MS).toISOString().slice(0, 10),
    severidade: tipo.severidade,
  }
}

/** O recorte enviado ao modelo. Só o que a hipótese precisa — nada além. */
export function entradaParaOModelo(caso: CasoDaRegraCandidata) {
  return {
    regra: {
      id: caso.regra.id,
      expressao: caso.regra.expression,
      justificativa: caso.regra.rationale,
      campo: caso.regra.field,
    },
    registros: caso.duplas.flatMap((d) =>
      d.membros.map((m) => ({
        codigo: m.codigo,
        spe: m.spe,
        nome: m.razaoSocial,
        cpf: m.cnpjCpf,
        cnae: m.cnae,
        municipio: `${m.municipio}/${m.uf}`,
        condicaoPagamento: m.condicaoPagamento,
        regimeTributario: m.regimeTributario,
        retencoes: m.retencoes,
      })),
    ),
  }
}
