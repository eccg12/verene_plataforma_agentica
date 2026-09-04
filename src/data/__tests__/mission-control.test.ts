import { describe, expect, it } from 'vitest'

import { agents } from '@/data/agents'
import { arquivosRecebidos } from '@/data/intake'
import { contarPorEstado, loadPackageBoard, packageStates } from '@/data/packages'
import { cycles, scopeObjects, speIds, totalVolume } from '@/data/scope'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonMaterials } from '@/data/source/nasajon-materials'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { waves } from '@/data/waves'
import {
  fingerprint,
  recebimentos,
  resumoDefeitos,
  taxaPorDimensao,
  taxaPorObjeto,
} from '@/engine/mission-control'

describe('grade dos 48 pacotes', () => {
  it('cobre exatamente 6 objetos x 4 SPEs x 2 ciclos, sem id repetido', () => {
    expect(loadPackageBoard).toHaveLength(48)
    expect(scopeObjects.length * speIds.length * cycles.length).toBe(48)
    const ids = loadPackageBoard.map((p) => p.id)
    expect(new Set(ids).size).toBe(48)
    for (const objeto of scopeObjects) {
      expect(loadPackageBoard.filter((p) => p.objetoId === objeto.id)).toHaveLength(8)
    }
  })

  it('não contradiz o escopo: o volume por SPE soma o volume do objeto', () => {
    for (const objeto of scopeObjects) {
      const doCiclo = loadPackageBoard.filter((p) => p.objetoId === objeto.id && p.ciclo === 'ciclo-1')
      const soma = doCiclo.reduce((acc, p) => acc + p.registros, 0)
      expect(soma, objeto.id).toBe(objeto.volume)
    }
    const somaCiclo1 = loadPackageBoard
      .filter((p) => p.ciclo === 'ciclo-1')
      .reduce((acc, p) => acc + p.registros, 0)
    expect(somaCiclo1).toBe(totalVolume)
  })

  it('usa só estados declarados e mantém o cutover inteiro por começar', () => {
    for (const p of loadPackageBoard) expect(packageStates).toContain(p.estado)
    const ciclo2 = loadPackageBoard.filter((p) => p.ciclo === 'ciclo-2')
    expect(ciclo2).toHaveLength(24)
    expect(ciclo2.every((p) => p.estado === 'nao-iniciado')).toBe(true)
  })

  it('a contagem por estado fecha em 48', () => {
    const resumo = contarPorEstado(loadPackageBoard)
    expect(Object.values(resumo).reduce((a, b) => a + b, 0)).toBe(48)
  })
})

describe('plano de ondas', () => {
  it('cobre todos os 6 objetos do escopo, sem sobreposição', () => {
    const cobertos = waves.flatMap((w) => w.objetos)
    expect(new Set(cobertos).size).toBe(cobertos.length)
    expect([...cobertos].sort()).toEqual(scopeObjects.map((o) => o.id).sort())
  })

  it('tem três ondas numeradas em ordem', () => {
    expect(waves).toHaveLength(3)
    expect(waves.map((w) => w.numero)).toEqual([1, 2, 3])
  })
})

describe('recebimento', () => {
  it('confere a contagem lendo o conteúdo, não repetindo o declarado', () => {
    // ARQ-003: o vendor declarou 11, a SPE-3 tem 10 fornecedores
    const divergentes = recebimentos.filter((r) => !r.contagemConfere)
    expect(divergentes).toHaveLength(1)
    expect(divergentes[0]?.arquivo.id).toBe('ARQ-003')
    expect(divergentes[0]?.registrosLidos).toBe(10)
    expect(divergentes[0]?.arquivo.registrosDeclarados).toBe(11)
    expect(divergentes[0]?.arquivo.recibo.aceito).toBe(false)
  })

  it('conta os registros de cada arquivo a partir da fixture correspondente', () => {
    for (const r of recebimentos) {
      const esperado =
        r.arquivo.objetoId === 'fornecedores'
          ? nasajonSuppliers.filter((s) => s.spe === r.arquivo.spe).length
          : r.arquivo.objetoId === 'materiais-servicos'
            ? nasajonMaterials.filter((m) => m.spe === r.arquivo.spe).length
            : nasajonContracts.filter((c) => c.spe === r.arquivo.spe).length
      expect(r.registrosLidos, r.arquivo.id).toBe(esperado)
    }
  })

  it('emite fingerprint estável de 16 hexadecimais, distinto por arquivo', () => {
    for (const r of recebimentos) expect(r.fingerprint, r.arquivo.id).toMatch(/^[0-9A-F]{16}$/)
    const todos = recebimentos.map((r) => r.fingerprint)
    expect(new Set(todos).size).toBe(todos.length)
    // determinístico
    expect(fingerprint(['a', 'b'])).toBe(fingerprint(['a', 'b']))
    // sensível ao conteúdo e à ordem
    expect(fingerprint(['a', 'b'])).not.toBe(fingerprint(['a', 'c']))
    expect(fingerprint(['a', 'b'])).not.toBe(fingerprint(['b', 'a']))
  })

  it('só há arquivo recebido para pacote que saiu de "não iniciado"', () => {
    for (const arquivo of arquivosRecebidos) {
      const pacote = loadPackageBoard.find(
        (p) => p.objetoId === arquivo.objetoId && p.spe === arquivo.spe && p.ciclo === arquivo.ciclo,
      )
      expect(pacote, `${arquivo.id} sem pacote correspondente`).toBeDefined()
      expect(pacote?.estado, `${arquivo.id} tem arquivo mas o pacote não começou`).not.toBe('nao-iniciado')
    }
  })

  it('todo recibo com ressalva tem observação explicando o motivo', () => {
    for (const a of arquivosRecebidos) {
      if (a.recibo.aceito) continue
      expect(a.recibo.observacao, a.id).not.toBeNull()
    }
  })
})

describe('mapa de defeitos do VEGA', () => {
  it('conta os defeitos plantados de cada objeto perfilado', () => {
    const esperado = {
      fornecedores: nasajonSuppliers.reduce((a, s) => a + s._plantedDefect.length, 0),
      'materiais-servicos': nasajonMaterials.reduce((a, m) => a + m._plantedDefect.length, 0),
      contratos: nasajonContracts.reduce((a, c) => a + c._plantedDefect.length, 0),
    }
    for (const linha of taxaPorObjeto) {
      expect(linha.defeitos, linha.chave).toBe(esperado[linha.chave as keyof typeof esperado])
    }
    expect(resumoDefeitos.defeitos).toBe(Object.values(esperado).reduce((a, b) => a + b, 0))
  })

  it('a soma por dimensão bate com a soma por objeto', () => {
    const porDimensao = taxaPorDimensao.reduce((a, t) => a + t.defeitos, 0)
    const porObjeto = taxaPorObjeto.reduce((a, t) => a + t.defeitos, 0)
    expect(porDimensao).toBe(porObjeto)
  })

  it('calcula taxa como defeitos por cem registros', () => {
    for (const linha of [...taxaPorObjeto, ...taxaPorDimensao]) {
      const esperado = Number(((linha.defeitos / linha.registros) * 100).toFixed(1))
      expect(linha.taxa, linha.chave).toBe(esperado)
    }
  })
})

describe('agentes', () => {
  it('são sete, cada um com revisor humano nomeado', () => {
    expect(agents).toHaveLength(7)
    for (const a of agents) {
      expect(a.revisor.nome, a.name).not.toBe('')
      expect(a.revisor.papel, a.name).not.toBe('')
    }
  })

  it('só KANON é transversal', () => {
    expect(agents.filter((a) => a.transversal).map((a) => a.name)).toEqual(['KANON'])
  })
})
