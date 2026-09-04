/**
 * Racional e score do match de duplicata.
 *
 * O score não é opinião do modelo: é a soma de sinais verificáveis, cada um com
 * peso declarado, e a tela mostra sinal por sinal. Um score sem os sinais que o
 * compõem é número para impressionar, não para decidir.
 *
 * Determinístico: mesmos registros, mesmo score, sempre.
 */
import type { NasajonSupplier } from '@/data/source/nasajon-suppliers'
import { onlyDigits } from '@/engine/br-documents'
import type { DuplicateCluster } from '@/engine/pipeline'

export interface SinalMatch {
  readonly id: string
  readonly rotulo: string
  readonly peso: number
  readonly bate: boolean
  readonly detalhe: string
}

export interface CampoDivergente {
  readonly campo: string
  readonly rotulo: string
  readonly valores: readonly { readonly codigo: string; readonly valor: string }[]
}

export interface MatchAnalise {
  readonly clusterId: string
  readonly score: number
  readonly sinais: readonly SinalMatch[]
  readonly divergentes: readonly CampoDivergente[]
  readonly iguais: readonly string[]
}

const norm = (v: string): string =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

/** Similaridade por tokens compartilhados (Jaccard). Simples e explicável. */
function similaridade(a: string, b: string): number {
  const ta = new Set(norm(a).split(' ').filter(Boolean))
  const tb = new Set(norm(b).split(' ').filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0
  const comuns = [...ta].filter((t) => tb.has(t)).length
  return comuns / new Set([...ta, ...tb]).size
}

const CAMPOS: readonly { readonly campo: keyof NasajonSupplier; readonly rotulo: string }[] = [
  { campo: 'razaoSocial', rotulo: 'Razão social' },
  { campo: 'nomeFantasia', rotulo: 'Nome fantasia' },
  { campo: 'cnpjCpf', rotulo: 'Documento' },
  { campo: 'inscricaoEstadual', rotulo: 'Inscrição estadual' },
  { campo: 'inscricaoMunicipal', rotulo: 'Inscrição municipal' },
  { campo: 'cnae', rotulo: 'CNAE' },
  { campo: 'logradouro', rotulo: 'Logradouro' },
  { campo: 'numero', rotulo: 'Número' },
  { campo: 'municipio', rotulo: 'Município' },
  { campo: 'uf', rotulo: 'UF' },
  { campo: 'cep', rotulo: 'CEP' },
  { campo: 'banco', rotulo: 'Banco' },
  { campo: 'agencia', rotulo: 'Agência' },
  { campo: 'conta', rotulo: 'Conta' },
  { campo: 'condicaoPagamento', rotulo: 'Condição de pagamento' },
  { campo: 'regimeTributario', rotulo: 'Regime tributário' },
  { campo: 'dataCadastro', rotulo: 'Data de cadastro' },
]

const valorDe = (s: NasajonSupplier, campo: keyof NasajonSupplier): string => {
  const v = s[campo]
  return v === null || v === undefined ? '' : String(v)
}

export function analisarCluster(
  cluster: DuplicateCluster,
  registros: readonly NasajonSupplier[],
): MatchAnalise {
  const membros = cluster.membros
    .map((c) => registros.find((r) => r.codigo === c))
    .filter((r): r is NasajonSupplier => r !== undefined)

  const [a, b] = membros
  const sinais: SinalMatch[] = []

  if (a && b) {
    const docIgual = onlyDigits(a.cnpjCpf) === onlyDigits(b.cnpjCpf)
    sinais.push({
      id: 'documento', rotulo: 'Mesmo CNPJ/CPF', peso: 60, bate: docIgual,
      detalhe: docIgual
        ? `Documento idêntico nos dois cadastros: ${onlyDigits(a.cnpjCpf)}.`
        : 'Documentos diferentes.',
    })

    const sim = similaridade(a.razaoSocial, b.razaoSocial)
    sinais.push({
      id: 'razao', rotulo: 'Razão social semelhante', peso: 15, bate: sim >= 0.5,
      detalhe: `Sobreposição de ${(sim * 100).toFixed(0)}% dos termos, ignorando acento, caixa e sufixo societário.`,
    })

    const mesmoEndereco = norm(a.logradouro) === norm(b.logradouro) && a.numero === b.numero
    sinais.push({
      id: 'endereco', rotulo: 'Mesmo endereço', peso: 10, bate: mesmoEndereco,
      detalhe: mesmoEndereco
        ? `${a.logradouro}, ${a.numero} nos dois cadastros.`
        : 'Endereços diferentes entre as SPEs.',
    })

    const mesmaConta = a.banco === b.banco && a.agencia === b.agencia && a.conta === b.conta
    sinais.push({
      id: 'banco', rotulo: 'Mesma conta bancária', peso: 10, bate: mesmaConta,
      detalhe: mesmaConta ? `Banco ${a.banco}, agência ${a.agencia}, conta ${a.conta}.` : 'Contas diferentes.',
    })

    const ieIgual = a.inscricaoEstadual !== null && a.inscricaoEstadual === b.inscricaoEstadual
    sinais.push({
      id: 'ie', rotulo: 'Mesma inscrição estadual', peso: 5, bate: ieIgual,
      detalhe: ieIgual ? `Inscrição ${a.inscricaoEstadual}.` : 'Inscrição estadual diferente ou ausente.',
    })
  }

  const score = sinais.filter((s) => s.bate).reduce((acc, s) => acc + s.peso, 0)

  const divergentes: CampoDivergente[] = []
  const iguais: string[] = []
  for (const { campo, rotulo } of CAMPOS) {
    const valores = membros.map((m) => ({ codigo: m.codigo, valor: valorDe(m, campo) }))
    const distintos = new Set(valores.map((v) => v.valor))
    if (distintos.size > 1) divergentes.push({ campo: String(campo), rotulo, valores })
    else iguais.push(rotulo)
  }

  return { clusterId: cluster.id, score, sinais, divergentes, iguais }
}
