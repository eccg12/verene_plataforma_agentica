import { describe, expect, it } from 'vitest'

import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonMaterials } from '@/data/source/nasajon-materials'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { loadPackages, scopeObjects, scopeSummary, totalVolume } from '@/data/scope'
import { existingSuppliers } from '@/data/target/existing-base'
import { divergenciasDoPadraoSap, numberRanges, requiredFields } from '@/data/target/tenant-config'
import { speIds, type PlantedDefectKind } from '@/data/types'
import { isIbgeCodeConsistent, isValidCnpj, isValidCpf, onlyDigits } from '@/engine/br-documents'

/**
 * As fixtures são o alicerce da demo. Estes testes são o que impede um dado
 * genérico ou aritmeticamente errado de chegar na frente do cliente.
 */

const countKind = (kind: PlantedDefectKind): number =>
  nasajonSuppliers.filter((s) => s._plantedDefect.some((d) => d.kind === kind)).length

describe('fornecedores do Nasajon', () => {
  it('tem 42 registros distribuídos em 4 SPEs', () => {
    expect(nasajonSuppliers).toHaveLength(42)
    const porSpe = speIds.map((spe) => nasajonSuppliers.filter((s) => s.spe === spe).length)
    expect(porSpe).toEqual([11, 11, 10, 10])
    expect(porSpe.reduce((a, b) => a + b, 0)).toBe(42)
  })

  it('tem código único por registro', () => {
    const codigos = nasajonSuppliers.map((s) => s.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it('planta exatamente 3 CNPJ com dígito verificador inválido — e nenhum outro', () => {
    const pj = nasajonSuppliers.filter((s) => s.naturezaPessoa === 'J')
    const invalidos = pj.filter((s) => !isValidCnpj(s.cnpjCpf))
    expect(invalidos).toHaveLength(3)
    // todo CNPJ inválido está etiquetado, e todo etiquetado é de fato inválido
    for (const s of invalidos) {
      expect(s._plantedDefect.map((d) => d.kind)).toContain('cnpj-dv-invalido')
    }
    expect(countKind('cnpj-dv-invalido')).toBe(3)
  })

  it('todo CPF de pessoa física é válido', () => {
    const pf = nasajonSuppliers.filter((s) => s.naturezaPessoa === 'F')
    expect(pf.length).toBeGreaterThan(0)
    for (const s of pf) expect(isValidCpf(s.cnpjCpf), `${s.codigo} ${s.cnpjCpf}`).toBe(true)
  })

  it('tem 4 pares de duplicata em SPEs diferentes, mesmo CNPJ e grafia divergente', () => {
    const marcados = nasajonSuppliers.filter((s) =>
      s._plantedDefect.some((d) => d.kind === 'duplicata-grafia'),
    )
    expect(marcados).toHaveLength(8)

    const porCodigo = new Map(nasajonSuppliers.map((s) => [s.codigo, s]))
    const pares = new Set<string>()
    for (const s of marcados) {
      const defect = s._plantedDefect.find((d) => d.kind === 'duplicata-grafia')
      const parceiro = porCodigo.get(defect?.relatedCode ?? '')
      expect(parceiro, `par de ${s.codigo} não encontrado`).toBeDefined()
      if (!parceiro) continue
      // mesmo documento, SPEs diferentes, razão social escrita de outro jeito
      expect(onlyDigits(s.cnpjCpf)).toBe(onlyDigits(parceiro.cnpjCpf))
      expect(s.spe).not.toBe(parceiro.spe)
      expect(s.razaoSocial).not.toBe(parceiro.razaoSocial)
      pares.add([s.codigo, parceiro.codigo].sort().join('|'))
    }
    expect(pares.size).toBe(4)
  })

  it('tem 2 fornecedores que já existem na base da Verene, apontando para o BP certo', () => {
    const marcados = nasajonSuppliers.filter((s) =>
      s._plantedDefect.some((d) => d.kind === 'ja-existe-no-destino'),
    )
    expect(marcados).toHaveLength(2)
    for (const s of marcados) {
      const defect = s._plantedDefect.find((d) => d.kind === 'ja-existe-no-destino')
      const alvo = existingSuppliers.find((e) => e.businessPartner === defect?.relatedCode)
      expect(alvo, `BP ${defect?.relatedCode} não existe na base`).toBeDefined()
      expect(onlyDigits(alvo?.cnpjCpf ?? '')).toBe(onlyDigits(s.cnpjCpf))
      expect(alvo?.duplicadoDoNasajon).toBe(s.codigo)
    }
  })

  it('planta 5 CNAE ausentes, 6 municípios sem IBGE e 3 datas divergentes', () => {
    expect(countKind('cnae-ausente')).toBe(5)
    expect(nasajonSuppliers.filter((s) => s.cnae === null)).toHaveLength(5)

    expect(countKind('municipio-sem-ibge')).toBe(6)
    expect(nasajonSuppliers.filter((s) => s.codigoIbge === null)).toHaveLength(6)

    expect(countKind('data-formato-divergente')).toBe(3)
    const isoDate = /^\d{4}-\d{2}-\d{2}$/
    expect(nasajonSuppliers.filter((s) => isoDate.test(s.dataCadastro))).toHaveLength(3)
    // as outras 39 seguem DD/MM/AAAA
    const brDate = /^\d{2}\/\d{2}\/\d{4}$/
    expect(nasajonSuppliers.filter((s) => brDate.test(s.dataCadastro))).toHaveLength(39)
  })

  it('planta 2 PF com retenção divergente entre SPEs, e a divergência é real', () => {
    const marcados = nasajonSuppliers.filter((s) =>
      s._plantedDefect.some((d) => d.kind === 'retencao-pf-divergente'),
    )
    expect(marcados).toHaveLength(2)
    const porCodigo = new Map(nasajonSuppliers.map((s) => [s.codigo, s]))
    for (const s of marcados) {
      const defect = s._plantedDefect.find((d) => d.kind === 'retencao-pf-divergente')
      const contraparte = porCodigo.get(defect?.relatedCode ?? '')
      expect(contraparte).toBeDefined()
      if (!contraparte) continue
      expect(onlyDigits(s.cnpjCpf)).toBe(onlyDigits(contraparte.cnpjCpf))
      expect(s.spe).not.toBe(contraparte.spe)
      // o ponto todo: mesmo prestador, retenção diferente
      expect(s.retencoes).not.toEqual(contraparte.retencoes)
    }
  })

  it('todo código IBGE presente bate com a UF do registro', () => {
    for (const s of nasajonSuppliers) {
      if (s.codigoIbge === null) continue
      expect(isIbgeCodeConsistent(s.codigoIbge, s.uf), `${s.codigo} ${s.municipio}/${s.uf} ${s.codigoIbge}`).toBe(true)
    }
  })
})

describe('contratos do Nasajon', () => {
  it('tem 18 contratos, 2 deles com fase fiscal pendente', () => {
    expect(nasajonContracts).toHaveLength(18)
    expect(nasajonContracts.filter((c) => c.faseFiscal === 'pendente')).toHaveLength(2)
  })

  it('aponta para fornecedores que existem no extrato', () => {
    const codigos = new Set(nasajonSuppliers.map((s) => s.codigo))
    for (const c of nasajonContracts) {
      expect(codigos.has(c.fornecedorCodigo), `${c.numero} -> ${c.fornecedorCodigo}`).toBe(true)
    }
  })

  it('tem a mesma unidade de metro linear escrita de três jeitos diferentes', () => {
    const unidades = new Set(
      nasajonContracts.flatMap((c) => c.linhas.map((l) => l.unidadeMedida)).filter((u) => ['M', 'MT', 'METRO'].includes(u)),
    )
    expect(unidades).toEqual(new Set(['M', 'MT', 'METRO']))
    // e cada grafia divergente está etiquetada
    const divergentes = nasajonContracts.filter((c) =>
      c.linhas.some((l) => l.unidadeMedida === 'MT' || l.unidadeMedida === 'METRO'),
    )
    for (const c of divergentes) {
      expect(c._plantedDefect.map((d) => d.kind), c.numero).toContain('unidade-medida-divergente')
    }
  })

  it('tem saldo em aberto sempre menor que o valor original', () => {
    for (const c of nasajonContracts) {
      expect(c.saldoAberto, c.numero).toBeLessThanOrEqual(c.valorOriginal)
    }
  })

  it('fecha quantidade × preço em toda linha', () => {
    for (const c of nasajonContracts) {
      for (const l of c.linhas) {
        expect(l.quantidade * l.precoUnitario, `${c.numero} item ${l.item}`).toBeCloseTo(l.valorTotal, 2)
      }
    }
  })

  it('só não reconcilia com a soma das linhas nos 2 contratos onde isso foi plantado', () => {
    const naoFecha = nasajonContracts.filter((c) => {
      const soma = c.linhas.reduce((acc, l) => acc + l.valorTotal, 0)
      return Math.abs(soma - c.valorOriginal) > 0.01
    })
    expect(naoFecha).toHaveLength(2)
    for (const c of naoFecha) {
      expect(c._plantedDefect.map((d) => d.kind), c.numero).toContain('saldo-diverge-do-original')
    }
  })
})

describe('materiais do Nasajon', () => {
  it('tem 24 materiais, 4 sem NCM e 7 com descrição fora de padrão', () => {
    expect(nasajonMaterials).toHaveLength(24)
    expect(nasajonMaterials.filter((m) => m.ncm === null)).toHaveLength(4)
    expect(
      nasajonMaterials.filter((m) => m._plantedDefect.some((d) => d.kind === 'descricao-fora-de-padrao')),
    ).toHaveLength(7)
  })

  it('etiqueta todo material sem NCM', () => {
    for (const m of nasajonMaterials.filter((x) => x.ncm === null)) {
      expect(m._plantedDefect.map((d) => d.kind), m.codigo).toContain('ncm-ausente')
    }
  })

  it('usa NCM de 8 dígitos quando presente', () => {
    for (const m of nasajonMaterials) {
      if (m.ncm === null) continue
      expect(onlyDigits(m.ncm), m.codigo).toHaveLength(8)
    }
  })

  it('tem código único', () => {
    const codigos = nasajonMaterials.map((m) => m.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })
})

describe('base existente da Verene', () => {
  it('tem 30 fornecedores com CNPJ válido e BP único', () => {
    expect(existingSuppliers).toHaveLength(30)
    for (const e of existingSuppliers) {
      expect(isValidCnpj(e.cnpjCpf), `${e.businessPartner} ${e.razaoSocial}`).toBe(true)
    }
    const bps = existingSuppliers.map((e) => e.businessPartner)
    expect(new Set(bps).size).toBe(bps.length)
  })

  it('inclui os 2 duplicados do escopo e nenhum outro', () => {
    expect(existingSuppliers.filter((e) => e.duplicadoDoNasajon !== null)).toHaveLength(2)
  })

  it('mantém todo BP dentro da faixa externa declarada no tenant', () => {
    const faixa = numberRanges.filter((r) => r.objeto === 'business-partner')
    for (const e of existingSuppliers) {
      const dentro = faixa.some((r) => e.businessPartner >= r.de && e.businessPartner <= r.ate)
      expect(dentro, `${e.businessPartner} fora das faixas ZFOR/ZFPF/ZFOI`).toBe(true)
    }
  })

  it('tem código IBGE coerente com a UF', () => {
    for (const e of existingSuppliers) {
      expect(isIbgeCodeConsistent(e.codigoIbge, e.uf), `${e.razaoSocial} ${e.municipio}/${e.uf}`).toBe(true)
    }
  })
})

describe('configuração do tenant', () => {
  it('declara ao menos 3 divergências do padrão SAP', () => {
    expect(divergenciasDoPadraoSap.length).toBeGreaterThanOrEqual(3)
  })

  it('liga cada divergência a objetos de migração que têm campo obrigatório declarado', () => {
    const comCampos = new Set(requiredFields.map((f) => f.objeto))
    for (const d of divergenciasDoPadraoSap) {
      expect(d.objetos.length, d.id).toBeGreaterThan(0)
      expect(d.objetos.some((o) => comCampos.has(o)), d.id).toBe(true)
    }
  })

  it('marca como não-padrão todo campo obrigatório que o SAP não exige', () => {
    const custom = requiredFields.filter((f) => f.obrigatorio && !f.padraoSap)
    expect(custom.length).toBeGreaterThanOrEqual(3)
  })
})

describe('escopo', () => {
  it('declara 6 objetos, 4 SPEs e 2 ciclos', () => {
    expect(scopeObjects).toHaveLength(6)
    expect(scopeSummary.objetos).toBe(6)
    expect(scopeSummary.spes).toBe(4)
    expect(scopeSummary.ciclos).toBe(2)
  })

  it('deriva 48 pacotes de carga, todos únicos', () => {
    expect(loadPackages).toHaveLength(48)
    expect(6 * 4 * 2).toBe(48)
    const ids = loadPackages.map((p) => p.id)
    expect(new Set(ids).size).toBe(48)
  })

  it('soma 2.080 no volume de referência', () => {
    expect(totalVolume).toBe(2080)
    expect(scopeObjects.map((o) => o.volume)).toEqual([1120, 320, 200, 200, 120, 120])
  })
})
