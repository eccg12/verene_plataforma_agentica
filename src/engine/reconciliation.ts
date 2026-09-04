/**
 * Reconciliação origem × destino — SIRIUS.
 *
 * Duas regras governam esta tela:
 *
 * 1. Toda diferença é EXPLICADA, nunca só numerada. Um delta sem causa nomeada
 *    é um registro perdido que ninguém procurou.
 * 2. O registro de defeitos é cortado pelas quatro origens, e a origem
 *    `transformation` é destacada porque é a única pela qual a Monoda responde.
 *    Os critérios de aceite de defeito medem SÓ ela.
 */
import { criteriosDeAceite, type CriterioAceite, type GateId } from '@/data/gates'
import {
  defectOrigins,
  defectTypeById,
  type DefectOriginId,
  type Severity,
} from '@/data/defect-taxonomy'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { speIds, type SpeId } from '@/data/types'
import type { PipelineRun, RecordOutcome } from '@/engine/pipeline'

// ============================================================ contagem

export interface LinhaContagem {
  readonly chave: string
  readonly rotulo: string
  readonly origem: number
  readonly destino: number
  readonly diferenca: number
  /** Composição da diferença. Sem isto, o delta é só um número. */
  readonly explicacao: readonly { readonly causa: string; readonly quantidade: number }[]
  readonly fecha: boolean
}

const contar = (run: PipelineRun, filtro: (spe: SpeId) => boolean, outcome: RecordOutcome): number =>
  run.records.filter((r) => filtro(r.spe) && r.outcome === outcome).length

function explicar(run: PipelineRun, filtro: (spe: SpeId) => boolean) {
  const merged = contar(run, filtro, 'merged')
  const reused = contar(run, filtro, 'reused')
  const held = contar(run, filtro, 'held')
  return [
    { causa: 'fundidos em outro cadastro (duplicata confirmada)', quantidade: merged },
    { causa: 'reusados de Business Partner já existente no tenant', quantidade: reused },
    { causa: 'retidos, com exceção aberta e dono definido', quantidade: held },
  ].filter((e) => e.quantidade > 0)
}

/** Reconciliação por contagem, quebrada por SPE. */
export function contagemPorSpe(run: PipelineRun): readonly LinhaContagem[] {
  return speIds.map((spe) => {
    const filtro = (s: SpeId) => s === spe
    const origem = run.records.filter((r) => filtro(r.spe)).length
    const destino = contar(run, filtro, 'migrated') + contar(run, filtro, 'reused')
    const explicacao = explicar(run, filtro)
    const somaExplicada = explicacao.reduce((acc, e) => acc + e.quantidade, 0)
    // `reused` está nos dois lados: entrou e saiu. Só merged e held reduzem o destino.
    const reduzem = explicacao.filter((e) => !e.causa.startsWith('reusados')).reduce((a, e) => a + e.quantidade, 0)
    return {
      chave: spe,
      rotulo: spe,
      origem,
      destino,
      diferenca: destino - origem,
      explicacao,
      fecha: origem - reduzem === destino && somaExplicada >= reduzem,
    }
  })
}

/** Reconciliação por contagem, total do objeto. */
export function contagemTotal(run: PipelineRun): LinhaContagem {
  const filtro = () => true
  const origem = run.records.length
  const destino = contar(run, filtro, 'migrated') + contar(run, filtro, 'reused')
  const explicacao = explicar(run, filtro)
  const reduzem = explicacao.filter((e) => !e.causa.startsWith('reusados')).reduce((a, e) => a + e.quantidade, 0)
  return {
    chave: 'total',
    rotulo: 'Fornecedores',
    origem,
    destino,
    diferenca: destino - origem,
    explicacao,
    fecha: origem - reduzem === destino,
  }
}

// ============================================================ valor

export interface LinhaValor {
  readonly chave: string
  readonly rotulo: string
  readonly origem: number
  readonly destino: number
  readonly diferenca: number
  readonly explicacao: readonly { readonly causa: string; readonly valor: number }[]
  readonly fecha: boolean
}

/**
 * Reconciliação por valor. Só faz sentido onde há valor: contratos. Fornecedor
 * é cadastro, não tem montante — e inventar um para preencher a tela seria
 * exatamente o tipo de número que não sobrevive a uma pergunta.
 */
export function valorPorSpe(): readonly LinhaValor[] {
  return speIds.map((spe) => {
    const daSpe = nasajonContracts.filter((c) => c.spe === spe)
    const origem = Number(daSpe.reduce((acc, c) => acc + c.valorOriginal, 0).toFixed(2))
    const bloqueados = daSpe.filter(
      (c) =>
        c.faseFiscal !== 'concluida' ||
        Math.abs(c.linhas.reduce((a, l) => a + l.valorTotal, 0) - c.valorOriginal) > 0.01,
    )
    const valorBloqueado = Number(bloqueados.reduce((acc, c) => acc + c.valorOriginal, 0).toFixed(2))
    const destino = Number((origem - valorBloqueado).toFixed(2))
    const explicacao = [
      {
        causa: `fase fiscal pendente em ${daSpe.filter((c) => c.faseFiscal !== 'concluida').length} contrato(s)`,
        valor: Number(
          daSpe.filter((c) => c.faseFiscal !== 'concluida').reduce((a, c) => a + c.valorOriginal, 0).toFixed(2),
        ),
      },
      {
        causa: `cabeçalho que não reconcilia com as linhas em ${daSpe.filter((c) => c.faseFiscal === 'concluida' && Math.abs(c.linhas.reduce((a, l) => a + l.valorTotal, 0) - c.valorOriginal) > 0.01).length} contrato(s)`,
        valor: Number(
          daSpe
            .filter((c) => c.faseFiscal === 'concluida' && Math.abs(c.linhas.reduce((a, l) => a + l.valorTotal, 0) - c.valorOriginal) > 0.01)
            .reduce((a, c) => a + c.valorOriginal, 0)
            .toFixed(2),
        ),
      },
    ].filter((e) => e.valor > 0)
    return {
      chave: spe,
      rotulo: spe,
      origem,
      destino,
      diferenca: Number((destino - origem).toFixed(2)),
      explicacao,
      fecha: Math.abs(origem - valorBloqueado - destino) <= 0.01,
    }
  })
}

// ============================================================ registro de defeitos

export interface RegistroPorOrigem {
  readonly origin: DefectOriginId
  readonly nome: string
  readonly designToken: string
  readonly monodaResponsavel: boolean
  readonly donoContratual: string
  readonly total: number
  readonly criticos: number
  readonly naoCriticos: number
  /** Percentual sobre os registros processados. */
  readonly percentual: number
}

export function registroDeDefeitos(run: PipelineRun): readonly RegistroPorOrigem[] {
  const base = run.records.length || 1
  return defectOrigins.map((origem) => {
    const doGrupo = run.exceptions.filter((e) => e.origin === origem.id)
    const criticos = doGrupo.filter((e) => e.severidade === 'critical').length
    return {
      origin: origem.id,
      nome: origem.nome,
      designToken: origem.designToken,
      monodaResponsavel: origem.monodaResponsavel,
      donoContratual: origem.donoContratual.parte,
      total: doGrupo.length,
      criticos,
      naoCriticos: doGrupo.length - criticos,
      percentual: Number(((doGrupo.length / base) * 100).toFixed(1)),
    }
  })
}

// ============================================================ placar dos critérios

export interface ResultadoCriterio {
  readonly criterio: CriterioAceite
  readonly gate: GateId
  readonly medido: number
  readonly alvo: number
  readonly atende: boolean
  /** Como o número foi obtido — a tela mostra isto ao lado do resultado. */
  readonly comoMedido: string
  readonly mensurável: boolean
}

const severidadeConta = (run: PipelineRun, origin: DefectOriginId, severidade: Severity): number =>
  run.exceptions.filter((e) => e.origin === origin && e.severidade === severidade).length

export function placarDeAceite(run: PipelineRun): readonly ResultadoCriterio[] {
  const total = run.records.length
  const passoConcluido = (id: string): boolean =>
    run.steps.find((s) => s.id === id)?.status === 'completed'

  const transformados = passoConcluido('transform') && passoConcluido('deduplicate')
    ? run.records.filter((r) => r.trail.some((t) => t.step === 'transform')).length
    : 0
  const validados = passoConcluido('validate')
    ? run.records.filter((r) => r.trail.some((t) => t.step === 'validate')).length
    : 0

  const criticosTransformacao = severidadeConta(run, 'transformation', 'critical')
  const naoCriticosTransformacao = severidadeConta(run, 'transformation', 'non-critical')
  const percentualNaoCritico = total === 0 ? 0 : Number(((naoCriticosTransformacao / total) * 100).toFixed(1))

  const medidas: Readonly<Record<string, { valor: number; como: string; mensurável: boolean }>> = {
    'CA-01': {
      valor: total === 0 ? 0 : Number(((transformados / total) * 100).toFixed(1)),
      como: `${transformados} de ${total} registros com passo TRANSFORM na trilha.`,
      mensurável: passoConcluido('transform'),
    },
    'CA-02': {
      valor: total === 0 ? 0 : Number(((validados / total) * 100).toFixed(1)),
      como: `${validados} de ${total} registros com passo VALIDATE na trilha.`,
      mensurável: passoConcluido('validate'),
    },
    'CA-03': {
      valor: criticosTransformacao,
      como: `Exceções de origem "transformation" com severidade crítica no run corrente.`,
      mensurável: passoConcluido('validate'),
    },
    'CA-04': {
      valor: percentualNaoCritico,
      como: `${naoCriticosTransformacao} defeito(s) não crítico(s) de transformação sobre ${total} registros.`,
      mensurável: passoConcluido('validate'),
    },
  }

  return criteriosDeAceite.map((criterio) => {
    const m = medidas[criterio.id] ?? { valor: 0, como: '', mensurável: false }
    const atende =
      criterio.tipo === 'percentual-minimo'
        ? m.valor >= criterio.alvo
        : m.valor <= criterio.alvo
    return {
      criterio,
      gate: criterio.gate,
      medido: m.valor,
      alvo: criterio.alvo,
      atende: m.mensurável && atende,
      comoMedido: m.como,
      mensurável: m.mensurável,
    }
  })
}

/** Tipos de defeito por origem, para a tabela do registro. */
export function detalhePorOrigem(run: PipelineRun, origin: DefectOriginId) {
  const porTipo = new Map<string, number>()
  for (const e of run.exceptions.filter((x) => x.origin === origin)) {
    porTipo.set(e.defectTypeId, (porTipo.get(e.defectTypeId) ?? 0) + 1)
  }
  return [...porTipo.entries()]
    .map(([id, quantidade]) => ({
      defectTypeId: id,
      nome: defectTypeById.get(id)?.nome ?? id,
      severidade: defectTypeById.get(id)?.severidade ?? ('non-critical' as Severity),
      roteadoPara: defectTypeById.get(id)?.roteadoPara ?? '',
      quantidade,
    }))
    .sort((a, b) => b.quantidade - a.quantidade || (a.defectTypeId < b.defectTypeId ? -1 : 1))
}
