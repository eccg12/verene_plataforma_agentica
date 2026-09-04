import { describe, expect, it } from 'vitest'

import { LIMITE_ARQUIVO_MB, LIMITE_REGISTROS_POR_PARTE, simulacoesCockpit } from '@/data/delivery'
import { verificacoesFiori } from '@/data/fiori-checks'
import { criteriosDeAceite, gateById, gateIds, gates } from '@/data/gates'
import { PLAYBOOK_VERSION, PROXIMA_VERSAO } from '@/data/playbook'
import { scopeObjects } from '@/data/scope'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { requiredFields } from '@/data/target/tenant-config'
import { checkpointIds, emptyApprovals, runPipeline, type Approvals, type Signature } from '@/engine/pipeline'
import { conferirConformidade, dividirPacote, gerarXml } from '@/engine/package-builder'
import {
  contagemPorSpe,
  contagemTotal,
  placarDeAceite,
  registroDeDefeitos,
  valorPorSpe,
} from '@/engine/reconciliation'

const sig: Signature = {
  by: 't', role: 't', decision: 'approved', at: '2026-01-12T09:00:00.000Z',
  playbookVersion: PLAYBOOK_VERSION, note: null,
}

function runCompleto(playbookVersion: string = PLAYBOOK_VERSION) {
  const s: Signature = { ...sig, playbookVersion }
  const base: Approvals = { ...emptyApprovals, mapeamentoSme: s, mapeamento: s }
  const p1 = runPipeline({ records: nasajonSuppliers, approvals: base, playbookVersion })
  const comClusters: Approvals = { ...base, clusters: Object.fromEntries(p1.clusters.map((c) => [c.id, s])) }
  const p2 = runPipeline({ records: nasajonSuppliers, approvals: comClusters, playbookVersion })
  const tudo: Approvals = {
    ...comClusters,
    excecoes: Object.fromEntries(p2.exceptions.map((e) => [e.id, s])),
    pacote: s,
    reconciliacao: s,
  }
  return runPipeline({ records: nasajonSuppliers, approvals: tudo, playbookVersion })
}

describe('gates e critérios de aceite', () => {
  it('declara oito gates, e os quatro checkpoints da esteira têm gate correspondente', () => {
    expect(gates).toHaveLength(8)
    expect(gates.map((g) => g.id)).toEqual([...gateIds])
    const comCheckpoint = gates.filter((g) => g.checkpoint !== null).map((g) => g.checkpoint)
    expect([...comCheckpoint].sort()).toEqual([...checkpointIds].sort())
  })

  it('mede os quatro critérios em G2, G3, G4 e G6', () => {
    expect(criteriosDeAceite).toHaveLength(4)
    expect(criteriosDeAceite.map((c) => c.gate)).toEqual(['G2', 'G3', 'G4', 'G6'])
    for (const c of criteriosDeAceite) expect(gateById[c.gate]).toBeDefined()
  })

  it('os dois critérios de defeito medem só a origem transformation', () => {
    const deDefeito = criteriosDeAceite.filter((c) => c.escopo === 'defeitos-de-transformacao')
    expect(deDefeito).toHaveLength(2)
    expect(deDefeito.map((c) => c.alvo)).toEqual([0, 5])
  })
})

describe('XML do Migration Cockpit', () => {
  it('sai dos registros de fato e carrega a versão e o checksum do playbook', () => {
    const run = runCompleto()
    const xml = gerarXml(run, 3)
    expect(xml.texto).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml.texto).toContain(`<PlaybookVersion>${run.playbookVersion}</PlaybookVersion>`)
    expect(xml.texto).toContain(`<PlaybookChecksum>${run.playbookChecksum}</PlaybookChecksum>`)
    // os valores vêm dos registros, não de exemplo
    const primeiro = run.records.find((r) => r.outcome === 'migrated' || r.outcome === 'reused')
    expect(primeiro).toBeDefined()
    expect(xml.texto).toContain(`sourceKey="${primeiro?.codigo}"`)
    expect(xml.texto).toContain(`<NAME_ORG1>${primeiro?.target?.nameOrg1}</NAME_ORG1>`)
    expect(xml.bytesPorRegistro).toBeGreaterThan(0)
  })

  it('é determinístico', () => {
    expect(gerarXml(runCompleto(), 3).texto).toBe(gerarXml(runCompleto(), 3).texto)
  })

  it('escapa caractere que quebraria o XML', () => {
    const run = runCompleto()
    const xml = gerarXml(run, 100)
    // nenhum & solto fora de entidade
    expect(/&(?!amp;|lt;|gt;|quot;)/.test(xml.texto)).toBe(false)
  })
})

describe('conformidade do pacote', () => {
  it('confere tamanho, formato, integridade e faixa de numeração', () => {
    const checagens = conferirConformidade(runCompleto())
    expect(checagens.map((c) => c.id)).toEqual(['CONF-01', 'CONF-02', 'CONF-03', 'CONF-04'])
    for (const c of checagens) {
      expect(['ok', 'falha', 'nao-verificado']).toContain(c.resultado)
      expect(c.descricao).not.toBe('')
    }
  })

  it('liberar a exceção não lava o dado: a conformidade ainda pega o campo vazio', () => {
    // Todas as exceções foram liberadas em runCompleto(), inclusive as de CNAE
    // ausente. Liberar desbloqueia o registro, mas não preenche o campo — e o
    // tenant exige INDUSTRY. ORION é a última linha de defesa e pega isso.
    const checagens = conferirConformidade(runCompleto())
    const integridade = checagens.find((c) => c.id === 'CONF-03')
    expect(integridade?.resultado).toBe('falha')

    const semCnae = nasajonSuppliers.filter((s) => s.cnae === null).map((s) => s.codigo)
    expect(semCnae).toHaveLength(5)
    for (const codigo of semCnae) {
      expect(integridade?.registrosAfetados, codigo).toContain(`${codigo}/INDUSTRY`)
    }

    // as outras três checagens passam
    for (const c of checagens.filter((x) => x.id !== 'CONF-03')) {
      expect(c.resultado, `${c.id}: ${c.registrosAfetados.join(', ')}`).toBe('ok')
    }
  })

  it('não verifica nada quando não há pacote', () => {
    const bloqueado = runPipeline({ records: nasajonSuppliers })
    for (const c of conferirConformidade(bloqueado)) expect(c.resultado).toBe('nao-verificado')
  })

  it('cobre os campos obrigatórios que o tenant declara', () => {
    const obrigatorios = requiredFields.filter((f) => f.objeto === 'business-partner' && f.obrigatorio)
    expect(obrigatorios.length).toBeGreaterThan(0)
    const integridade = conferirConformidade(runCompleto()).find((c) => c.id === 'CONF-03')
    expect(integridade?.descricao).toContain(String(obrigatorios.length))
  })
})

describe('divisão do pacote', () => {
  it('respeita os dois tetos e a soma das partes fecha com o total', () => {
    for (const objeto of scopeObjects) {
      const d = dividirPacote(objeto.id, objeto.volume, 420)
      expect(d.partes.reduce((a, p) => a + p.registros, 0), objeto.id).toBe(objeto.volume)
      for (const parte of d.partes) {
        expect(parte.registros, objeto.id).toBeLessThanOrEqual(LIMITE_REGISTROS_POR_PARTE)
        expect(parte.megabytes, objeto.id).toBeLessThanOrEqual(LIMITE_ARQUIVO_MB)
        expect(parte.checksum).toMatch(/^[0-9A-F]{8}$/)
      }
    }
  })

  it('nomeia o limitante certo', () => {
    // 1.120 registros pequenos: o teto de registros por lote é que divide
    expect(dividirPacote('fornecedores', 1120, 420).limitante).toBe('registros')
    // registro gigante: o teto de tamanho passa a valer primeiro
    expect(dividirPacote('fornecedores', 1120, 5 * 1024 * 1024).limitante).toBe('tamanho')
    // volume pequeno cabe em um arquivo
    expect(dividirPacote('requisicoes', 120, 420).limitante).toBe('nenhum')
    expect(dividirPacote('requisicoes', 120, 420).partes).toHaveLength(1)
  })

  it('dá nome de arquivo único a cada parte', () => {
    const d = dividirPacote('fornecedores', 1120, 420)
    const nomes = d.partes.map((p) => p.nomeArquivo)
    expect(new Set(nomes).size).toBe(nomes.length)
    expect(nomes[0]).toContain('01de')
  })
})

describe('simulação no cockpit', () => {
  it('só declara simulação para objeto que existe no escopo', () => {
    const ids = new Set(scopeObjects.map((o) => o.id))
    for (const s of simulacoesCockpit) expect(ids.has(s.objetoId), s.objetoId).toBe(true)
  })

  it('simulação não executada não tem data nem registros', () => {
    for (const s of simulacoesCockpit.filter((x) => x.estado === 'nao-executada')) {
      expect(s.executadaEm).toBeNull()
      expect(s.registrosSimulados).toBe(0)
    }
    for (const s of simulacoesCockpit.filter((x) => x.estado !== 'nao-executada')) {
      expect(s.executadaEm).not.toBeNull()
      expect(s.mensagens.length).toBeGreaterThan(0)
    }
  })
})

describe('reconciliação', () => {
  it('toda diferença de contagem vem explicada, nunca só numerada', () => {
    const run = runCompleto()
    for (const linha of [...contagemPorSpe(run), contagemTotal(run)]) {
      if (linha.diferenca === 0) continue
      expect(linha.explicacao.length, `${linha.chave} tem diferença sem explicação`).toBeGreaterThan(0)
      for (const e of linha.explicacao) {
        expect(e.causa).not.toBe('')
        expect(e.quantidade).toBeGreaterThan(0)
      }
    }
  })

  it('a contagem por SPE soma o total', () => {
    const run = runCompleto()
    const porSpe = contagemPorSpe(run)
    const total = contagemTotal(run)
    expect(porSpe.reduce((a, l) => a + l.origem, 0)).toBe(total.origem)
    expect(porSpe.reduce((a, l) => a + l.destino, 0)).toBe(total.destino)
  })

  it('fecha: origem menos fundidos e retidos é igual ao destino', () => {
    const total = contagemTotal(runCompleto())
    expect(total.fecha).toBe(true)
  })

  it('reconcilia valor só onde há valor, e explica cada diferença', () => {
    const linhas = valorPorSpe()
    expect(linhas.length).toBe(4)
    const origemTotal = linhas.reduce((a, l) => a + l.origem, 0)
    expect(origemTotal).toBeCloseTo(
      nasajonContracts.reduce((a, c) => a + c.valorOriginal, 0),
      2,
    )
    for (const linha of linhas) {
      if (Math.abs(linha.diferenca) < 0.01) continue
      expect(linha.explicacao.length, `${linha.chave} sem explicação`).toBeGreaterThan(0)
      const somaExplicada = linha.explicacao.reduce((a, e) => a + e.valor, 0)
      expect(somaExplicada, linha.chave).toBeCloseTo(Math.abs(linha.diferenca), 2)
    }
  })

  it('registra defeitos nas quatro origens, com só transformation na Monoda', () => {
    const registro = registroDeDefeitos(runCompleto())
    expect(registro).toHaveLength(4)
    for (const r of registro) {
      expect(r.monodaResponsavel).toBe(r.origin === 'transformation')
      expect(r.criticos + r.naoCriticos).toBe(r.total)
      expect(r.donoContratual).not.toBe('')
    }
    expect(registro.filter((r) => r.monodaResponsavel)).toHaveLength(1)
  })
})

describe('placar dos critérios de aceite', () => {
  it('não é mensurável enquanto a esteira não alcança o passo', () => {
    const bloqueado = runPipeline({ records: nasajonSuppliers })
    for (const r of placarDeAceite(bloqueado)) {
      expect(r.mensurável, r.criterio.id).toBe(false)
      expect(r.atende, r.criterio.id).toBe(false)
    }
  })

  it('com a esteira concluída, mede e diz como mediu', () => {
    const placar = placarDeAceite(runCompleto())
    for (const r of placar) {
      expect(r.mensurável, r.criterio.id).toBe(true)
      expect(r.comoMedido, r.criterio.id).not.toBe('')
    }
    expect(placar.find((r) => r.criterio.id === 'CA-01')?.medido).toBe(100)
    expect(placar.find((r) => r.criterio.id === 'CA-02')?.medido).toBe(100)
  })

  it('os critérios de defeito medem só transformation, e a correção da regra os zera', () => {
    // v1.0.0: a quebra do nome corta palavra ao meio. É defeito de transformação,
    // a única origem pela qual a Monoda responde — e CA-03 reprova por isso.
    const antes = runCompleto()
    const placarAntes = placarDeAceite(antes)
    const transformacaoAntes = registroDeDefeitos(antes).find((r) => r.origin === 'transformation')
    const ca03Antes = placarAntes.find((r) => r.criterio.id === 'CA-03')

    expect(transformacaoAntes?.criticos).toBeGreaterThan(0)
    expect(transformacaoAntes?.monodaResponsavel).toBe(true)
    expect(ca03Antes?.medido).toBe(transformacaoAntes?.criticos)
    expect(ca03Antes?.atende).toBe(false)

    // v1.4.0: a regra corrigida zera a origem transformation, e só ela.
    const depois = runCompleto(PROXIMA_VERSAO)
    const placarDepois = placarDeAceite(depois)
    const transformacaoDepois = registroDeDefeitos(depois).find((r) => r.origin === 'transformation')
    const ca03Depois = placarDepois.find((r) => r.criterio.id === 'CA-03')
    const ca04Depois = placarDepois.find((r) => r.criterio.id === 'CA-04')

    expect(transformacaoDepois?.total).toBe(0)
    expect(ca03Depois?.medido).toBe(0)
    expect(ca03Depois?.atende).toBe(true)
    expect(ca04Depois?.medido).toBe(0)
    expect(ca04Depois?.atende).toBe(true)

    // e continua havendo defeito das outras três origens: o placar da Monoda
    // ficar verde não é porque não existe defeito, é porque o dono é outro.
    const deTerceiros = registroDeDefeitos(depois)
      .filter((r) => !r.monodaResponsavel)
      .reduce((a, r) => a + r.total, 0)
    expect(deTerceiros).toBeGreaterThan(0)
  })
})

describe('verificação nos apps Fiori', () => {
  it('cobre os objetos com passos concretos e registro de exemplo', () => {
    expect(verificacoesFiori.length).toBeGreaterThan(0)
    for (const v of verificacoesFiori) {
      expect(v.app).not.toBe('')
      expect(v.registroExemplo).not.toBe('')
      expect(v.passos.length).toBeGreaterThan(0)
      expect(v.passos.map((p) => p.ordem)).toEqual(v.passos.map((_, i) => i + 1))
      for (const passo of v.passos) {
        expect(passo.instrucao).not.toBe('')
        expect(passo.campo).not.toBe('')
      }
      expect(gateById[v.gate]).toBeDefined()
    }
  })

  it('aponta para registro que existe de fato', () => {
    const codigos = new Set<string>([
      ...nasajonSuppliers.map((s) => s.codigo),
      ...nasajonContracts.map((c) => c.numero),
      ...nasajonContracts.flatMap((c) => c.linhas.map((l) => `${c.numero}~${l.item}`)),
      'MAT-1001',
    ])
    for (const v of verificacoesFiori) {
      expect(codigos.has(v.registroExemplo), `${v.id} aponta para ${v.registroExemplo}`).toBe(true)
    }
  })
})
