/**
 * Propostas de enriquecimento do NOVA — cada uma com a evidência anexada.
 *
 * A regra da fila é dura: **sem evidência, sem proposta**. Quando não há fonte
 * de referência que sustente um valor, o campo fica sem proposta e a tela diz
 * por quê. Não existe "aplicar valor padrão" em lugar nenhum — defaultar para
 * o lote passar é exatamente o que produz base suja com aparência de limpa.
 */
import { buscarMunicipio } from '@/data/reference/municipios-ibge'
import { classificarLc116 } from '@/data/reference/lc116'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonMaterials } from '@/data/source/nasajon-materials'
import { nasajonSuppliers, type NasajonSupplier } from '@/data/source/nasajon-suppliers'
import { onlyDigits } from '@/engine/br-documents'

export interface Evidencia {
  /** De onde o valor veio. */
  readonly fonte: string
  /** O registro, item ou tabela exatos que sustentam o valor. */
  readonly referencia: string
  readonly detalhe: string
}

export interface PropostaEnriquecimento {
  readonly id: string
  readonly recordCode: string
  readonly campo: string
  readonly rotuloCampo: string
  readonly ruleId: string
  /** `null` quando não há evidência: nesse caso a proposta não existe. */
  readonly valorProposto: string | null
  readonly evidencia: Evidencia | null
  /** Por que não há proposta. Preenchido só quando `valorProposto` é `null`. */
  readonly motivoSemProposta: string | null
}

/** Código IBGE derivado da tabela de referência. */
function proporIbge(s: NasajonSupplier): PropostaEnriquecimento | null {
  if (s.codigoIbge !== null) return null
  const municipio = buscarMunicipio(s.municipio, s.uf)
  const base = {
    id: `${s.codigo}:codigoIbge`,
    recordCode: s.codigo,
    campo: 'codigoIbge',
    rotuloCampo: 'Código IBGE do município',
    ruleId: 'R-SUP-040',
  }
  if (!municipio) {
    return {
      ...base,
      valorProposto: null,
      evidencia: null,
      motivoSemProposta: `"${s.municipio}/${s.uf}" não está na tabela de municípios do IBGE carregada. Sem entrada na tabela, não há proposta.`,
    }
  }
  return {
    ...base,
    valorProposto: municipio.codigoIbge,
    evidencia: {
      fonte: 'Tabela de municípios do IBGE',
      referencia: `${municipio.nome} / ${municipio.uf}`,
      detalhe: `Busca por nome e UF, ignorando acento e caixa. O prefixo ${municipio.codigoIbge.slice(0, 2)} confere com a UF ${municipio.uf}.`,
    },
    motivoSemProposta: null,
  }
}

/**
 * CNAE. Não há fonte de referência que ligue razão social a CNAE, e a regra que
 * faria isso é candidata. Portanto: nenhuma proposta. É o caso que prova a
 * regra da fila.
 */
function proporCnae(s: NasajonSupplier): PropostaEnriquecimento | null {
  if (s.cnae !== null) return null
  return {
    id: `${s.codigo}:cnae`,
    recordCode: s.codigo,
    campo: 'cnae',
    rotuloCampo: 'CNAE',
    ruleId: 'R-SUP-046',
    valorProposto: null,
    evidencia: null,
    motivoSemProposta:
      'Não há fonte de referência que derive CNAE de razão social. A regra que proporia é candidata e não executa. Erro de CNAE tem efeito fiscal — o campo volta para a origem.',
  }
}

/** Dados bancários a partir do mesmo documento em outra SPE. */
function proporBanco(s: NasajonSupplier): PropostaEnriquecimento | null {
  if (s.conta !== '') return null
  const doc = onlyDigits(s.cnpjCpf)
  const gemeo = nasajonSuppliers.find((o) => o.codigo !== s.codigo && onlyDigits(o.cnpjCpf) === doc && o.conta !== '')
  const base = {
    id: `${s.codigo}:conta`,
    recordCode: s.codigo,
    campo: 'conta',
    rotuloCampo: 'Conta bancária',
    ruleId: 'R-SUP-044',
  }
  if (!gemeo) {
    return { ...base, valorProposto: null, evidencia: null, motivoSemProposta: 'Nenhum outro cadastro com o mesmo documento tem conta preenchida.' }
  }
  return {
    ...base,
    valorProposto: `${gemeo.banco} / ${gemeo.agencia} / ${gemeo.conta}`,
    evidencia: {
      fonte: 'Cadastro do mesmo documento em outra SPE',
      referencia: `${gemeo.codigo} (${gemeo.spe})`,
      detalhe: `Mesmo CNPJ ${doc}. A conta veio do cadastro gêmeo, não de fora do escopo.`,
    },
    motivoSemProposta: null,
  }
}

/** NCM a partir de material equivalente já classificado no mesmo grupo. */
export function proporNcm(codigoMaterial: string): PropostaEnriquecimento | null {
  const material = nasajonMaterials.find((m) => m.codigo === codigoMaterial)
  if (!material || material.ncm !== null) return null
  const base = {
    id: `${material.codigo}:ncm`,
    recordCode: material.codigo,
    campo: 'ncm',
    rotuloCampo: 'NCM',
    ruleId: 'R-MAT-020',
  }
  const equivalentes = nasajonMaterials.filter(
    (m) => m.ncm !== null && m.grupoMercadoria === material.grupoMercadoria,
  )
  const distintos = new Set(equivalentes.map((m) => m.ncm))

  // 1) equivalência por termos compartilhados na descrição. Os termos vão na
  //    evidência, para quem confere ver exatamente por que a proposta é essa.
  const termos = (v: string): string[] =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().split(/[^A-Z0-9]+/).filter((t) => t.length >= 3)
  const meus = new Set(termos(material.descricao))
  const porTermos = equivalentes
    .map((m) => ({ m, comuns: termos(m.descricao).filter((t) => meus.has(t)) }))
    .filter((x) => x.comuns.length >= 2)
    .sort((a, b) => b.comuns.length - a.comuns.length || (a.m.codigo < b.m.codigo ? -1 : 1))
  const melhor = porTermos[0]
  const empatado = porTermos.length > 1 && porTermos[1]?.comuns.length === melhor?.comuns.length
  if (melhor && !empatado && melhor.m.ncm !== null) {
    return {
      ...base,
      valorProposto: melhor.m.ncm,
      evidencia: {
        fonte: 'Material equivalente já classificado no escopo',
        referencia: `${melhor.m.codigo} — ${melhor.m.descricao}`,
        detalhe: `Descrições compartilham os termos ${melhor.comuns.join(', ')}. Mesmo grupo de mercadoria (${material.grupoMercadoria}).`,
      },
      motivoSemProposta: null,
    }
  }

  if (equivalentes.length === 0) {
    return { ...base, valorProposto: null, evidencia: null, motivoSemProposta: `Nenhum material do grupo ${material.grupoMercadoria} tem NCM classificado.` }
  }
  if (distintos.size > 1) {
    return {
      ...base,
      valorProposto: null,
      evidencia: null,
      motivoSemProposta: `O grupo ${material.grupoMercadoria} tem ${distintos.size} NCM diferentes entre os materiais já classificados, e a descrição não bate com nenhum deles. Não há valor único a propor — escolher um seria chutar.`,
    }
  }
  const fonte = equivalentes[0]
  if (!fonte || fonte.ncm === null) return null
  return {
    ...base,
    valorProposto: fonte.ncm,
    evidencia: {
      fonte: 'Material equivalente já classificado no escopo',
      referencia: `${fonte.codigo} — ${fonte.descricao}`,
      detalhe: `Único NCM em uso no grupo ${material.grupoMercadoria} entre os ${equivalentes.length} materiais já classificados.`,
    },
    motivoSemProposta: null,
  }
}

/** Enquadramento de ISS da linha de serviço, pela lista da LC 116. */
export function proporLc116(numeroContrato: string, item: number): PropostaEnriquecimento | null {
  const contrato = nasajonContracts.find((c) => c.numero === numeroContrato)
  const linha = contrato?.linhas.find((l) => l.item === item)
  if (!contrato || !linha) return null
  const base = {
    id: `${contrato.numero}~${linha.item}:lc116`,
    recordCode: `${contrato.numero}~${linha.item}`,
    campo: 'codigoLc116',
    rotuloCampo: 'Código de serviço LC 116',
    ruleId: 'R-CTR-041',
  }
  const resultado = classificarLc116(linha.descricao)
  if (resultado === null) {
    return {
      ...base,
      valorProposto: null,
      evidencia: null,
      motivoSemProposta: `"${linha.descricao}" não casa com nenhum item da lista de serviços carregada. Enquadramento fiscal não se adivinha.`,
    }
  }
  if (!resultado.incide) {
    return {
      ...base,
      valorProposto: null,
      evidencia: null,
      motivoSemProposta: `${resultado.descricao} ${resultado.fundamento}.`,
    }
  }
  return {
    ...base,
    valorProposto: resultado.item,
    evidencia: {
      fonte: 'Lista de serviços da LC 116/2003',
      referencia: `Item ${resultado.item}`,
      detalhe: resultado.descricao,
    },
    motivoSemProposta: null,
  }
}

/** Propostas de LC 116 para todas as linhas de serviço do escopo. */
export function propostasDeServico(): readonly PropostaEnriquecimento[] {
  return nasajonContracts
    .filter((c) => c.tipo === 'servico')
    .flatMap((c) => c.linhas.map((l) => proporLc116(c.numero, l.item)))
    .filter((p): p is PropostaEnriquecimento => p !== null)
}

/** Todas as propostas para um fornecedor. */
export function propostasParaFornecedor(codigo: string): readonly PropostaEnriquecimento[] {
  const s = nasajonSuppliers.find((x) => x.codigo === codigo)
  if (!s) return []
  return [proporIbge(s), proporCnae(s), proporBanco(s)].filter(
    (p): p is PropostaEnriquecimento => p !== null,
  )
}

/** Propostas para todos os materiais sem NCM. */
export function propostasDeMaterial(): readonly PropostaEnriquecimento[] {
  return nasajonMaterials
    .filter((m) => m.ncm === null)
    .map((m) => proporNcm(m.codigo))
    .filter((p): p is PropostaEnriquecimento => p !== null)
}

export const comEvidencia = (p: PropostaEnriquecimento): boolean => p.evidencia !== null
