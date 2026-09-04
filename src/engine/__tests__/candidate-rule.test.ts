import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  hipoteseDeReferencia,
  MODELO,
  REGRA_CANDIDATA,
  ROTA_DA_HIPOTESE,
  TIPO_DE_DEFEITO,
} from '@/data/candidate-hypothesis'
import { defectTypeById } from '@/data/defect-taxonomy'
import { PLAYBOOK_VERSION, ruleById } from '@/data/playbook'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import {
  casoDaRegraCandidata,
  duplasDivergentes,
  entradaParaOModelo,
  frequenciaDoPadrao,
} from '@/engine/candidate-rule'
import { PlaybookViolation, resolveRule } from '@/engine/kanon'
import { pedirHipotese } from '@/net/rule-hypothesis'

// ============================================================ a evidência

describe('a evidência da regra candidata', () => {
  const duplas = duplasDivergentes()

  it('encontra exatamente as duas duplas de PF, com quatro registros', () => {
    expect(duplas).toHaveLength(2)
    const codigos = duplas.flatMap((d) => d.membros.map((m) => m.codigo)).sort()
    expect(codigos).toEqual(['F1009', 'F2008', 'F3007', 'F4007'])
  })

  it('cada dupla tem o mesmo documento em SPEs diferentes', () => {
    for (const d of duplas) {
      expect(d.membros).toHaveLength(2)
      expect(new Set(d.membros.map((m) => m.spe)).size).toBe(2)
      expect(new Set(d.membros.map((m) => m.cnpjCpf.replace(/\D/g, ''))).size).toBe(1)
    }
  })

  it('nomeia o campo que diverge em cada dupla, e só ele', () => {
    const porCampo = duplas.map((d) => d.camposDivergentes.map((c) => c.campo).sort())
    expect(porCampo).toEqual([['inss'], ['aliquotaIss']])
  })

  it('lista o que é idêntico nos dois lados — é o que descarta a explicação fácil', () => {
    for (const d of duplas) {
      expect(d.coincidencias.length).toBeGreaterThanOrEqual(3)
      // mesmo município: a hipótese de alíquota municipal distinta não se sustenta
      expect(d.coincidencias.some((c) => c.includes('/'))).toBe(true)
    }
  })

  it('a evidência é derivada, não etiquetada: os dois lados aparecem, não só o marcado', () => {
    const marcados = nasajonSuppliers
      .filter((s) => s._plantedDefect.some((p) => p.kind === 'retencao-pf-divergente'))
      .map((s) => s.codigo)
    const naEvidencia = duplas.flatMap((d) => d.membros.map((m) => m.codigo))
    expect(marcados).toHaveLength(2)
    expect(naEvidencia).toHaveLength(4)
    for (const c of marcados) expect(naEvidencia).toContain(c)
  })
})

describe('a frequência', () => {
  const f = frequenciaDoPadrao(duplasDivergentes())

  it('mede o padrão dentro do recorte que a regra alcança', () => {
    expect(f.pessoasFisicas).toBe(nasajonSuppliers.filter((s) => s.naturezaPessoa === 'F').length)
    expect(f.comCadastroEmMaisDeUmaSpe).toBe(2)
    expect(f.divergentes).toBe(2)
    expect(f.registrosEnvolvidos).toBe(4)
    expect(f.spesEnvolvidas).toBe(4)
    expect(f.percentual).toBe(100)
  })

  it('o percentual é sobre quem a regra alcança, não sobre o escopo inteiro', () => {
    expect(f.divergentes / f.comCadastroEmMaisDeUmaSpe).toBe(f.percentual / 100)
    expect(f.comCadastroEmMaisDeUmaSpe).toBeLessThan(f.pessoasFisicas)
  })
})

describe('o caso completo', () => {
  const caso = casoDaRegraCandidata()

  it('aponta para a regra candidata do playbook, que não executa', () => {
    expect(caso.regra.id).toBe(REGRA_CANDIDATA)
    expect(caso.regra.status).toBe('candidate')
    expect(caso.regra.nature).toBe('generative')
    expect(() => resolveRule(REGRA_CANDIDATA, 'ATLAS', PLAYBOOK_VERSION)).toThrow(PlaybookViolation)
  })

  it('roteia para uma pessoa nomeada, com prazo derivado do epoch', () => {
    const tipo = defectTypeById.get(TIPO_DE_DEFEITO)!
    expect(caso.area).toBe(tipo.roteadoPara)
    expect(caso.dono).not.toBeNull()
    expect(caso.dono!.nome.length).toBeGreaterThan(3)
    expect(caso.prazo).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(caso.severidade).toBe('critical')
  })

  it('o recorte enviado ao modelo tem só os registros da evidência e nenhum campo inventado', () => {
    const entrada = entradaParaOModelo(caso)
    expect(entrada.registros).toHaveLength(4)
    for (const r of entrada.registros) {
      const fonte = nasajonSuppliers.find((s) => s.codigo === r.codigo)!
      expect(r.cpf).toBe(fonte.cnpjCpf)
      expect(r.retencoes).toEqual(fonte.retencoes)
      expect(r.cnae).toBe(fonte.cnae)
    }
    expect(entrada.regra.id).toBe(REGRA_CANDIDATA)
  })
})

// ============================================================ a chamada de rede

describe('a hipótese: nunca lança, nunca deixa a tela vazia', () => {
  const entrada = { registros: [], regra: {} }
  const resposta = (corpo: unknown, ok = true, status = 200): typeof fetch =>
    (async () =>
      ({ ok, status, json: async () => corpo }) as unknown as Response) as unknown as typeof fetch

  it('usa a resposta ao vivo quando ela chega íntegra', async () => {
    const h = await pedirHipotese(
      entrada,
      resposta({ enunciado: 'a', evidencia: ['F1009 diverge'], naoConfirmavel: 'b' }),
    )
    expect(h.origem).toBe('ao-vivo')
    expect(h.enunciado).toBe('a')
    expect(h.evidencia).toEqual(['F1009 diverge'])
  })

  it('cai na referência quando a rede falha', async () => {
    const quebrado = (async () => {
      throw new Error('sem rede')
    }) as unknown as typeof fetch
    await expect(pedirHipotese(entrada, quebrado)).resolves.toEqual(hipoteseDeReferencia)
  })

  it('cai na referência quando o servidor diz que não tem hipótese', async () => {
    // A rota responde 200 com `disponivel: false` — sem chave, sem rede, ou
    // formato ruim. Nada de 5xx: ausência não é erro, e erro pinta o console.
    for (const motivo of ['sem-chave', 'chamada', 'formato']) {
      const h = await pedirHipotese(entrada, resposta({ disponivel: false, motivo }))
      expect(h, motivo).toEqual(hipoteseDeReferencia)
    }
  })

  it('cai na referência quando a rota nem existe (dist servido estático)', async () => {
    const h = await pedirHipotese(entrada, resposta('<!doctype html>', false, 404))
    expect(h).toEqual(hipoteseDeReferencia)
  })

  it('cai na referência quando o JSON não tem a forma esperada', async () => {
    for (const corpo of [
      {},
      { enunciado: 'a' },
      { enunciado: 'a', evidencia: [], naoConfirmavel: 'b' },
      { enunciado: '   ', evidencia: ['x'], naoConfirmavel: 'b' },
      { enunciado: 'a', evidencia: ['x'], naoConfirmavel: '' },
      null,
    ]) {
      await expect(pedirHipotese(entrada, resposta(corpo))).resolves.toEqual(hipoteseDeReferencia)
    }
  })

  it('cai na referência quando o corpo nem é JSON', async () => {
    const invalido = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('não é JSON')
        },
      }) as unknown as Response) as unknown as typeof fetch
    await expect(pedirHipotese(entrada, invalido)).resolves.toEqual(hipoteseDeReferencia)
  })

  it('a resposta de referência é completa por si só', () => {
    expect(hipoteseDeReferencia.origem).toBe('referencia')
    expect(hipoteseDeReferencia.enunciado.length).toBeGreaterThan(80)
    expect(hipoteseDeReferencia.evidencia.length).toBeGreaterThanOrEqual(3)
    expect(hipoteseDeReferencia.naoConfirmavel.length).toBeGreaterThan(80)
    // cita os registros de fato: nada de evidência genérica
    const texto = hipoteseDeReferencia.evidencia.join(' ')
    for (const codigo of ['F1009', 'F3007', 'F2008', 'F4007']) expect(texto).toContain(codigo)
  })
})

// ============================================================ contenção do não-determinismo

describe('a rede não contamina o determinismo', () => {
  const raiz = join(process.cwd(), 'src')
  /** Fontes de produção: teste não conta, e é o de produção que a regra 1 governa. */
  const arquivos = (dir: string): string[] =>
    readdirSync(dir).flatMap((nome) => {
      const caminho = join(dir, nome)
      if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : arquivos(caminho)
      return /\.tsx?$/.test(nome) ? [caminho] : []
    })

  it('existe exatamente um arquivo com acesso a fetch, e ele está em src/net/', () => {
    const comFetch = arquivos(raiz).filter((f) => /\bfetch\b/.test(readFileSync(f, 'utf8')))
    expect(comFetch.map((f) => f.replace(raiz, 'src'))).toEqual(['src/net/rule-hypothesis.ts'])
  })

  it('nem o motor nem as fixtures importam a porta de rede', () => {
    const nucleo = arquivos(join(raiz, 'engine')).concat(arquivos(join(raiz, 'data')))
    expect(nucleo.length).toBeGreaterThan(20)
    for (const f of nucleo) {
      expect(readFileSync(f, 'utf8'), f).not.toContain('@/net/')
    }
  })

  it('nenhuma fonte de produção fala com a API direto: só a rota da mesma origem', () => {
    for (const f of arquivos(raiz)) {
      expect(readFileSync(f, 'utf8'), f).not.toContain('api.anthropic.com')
    }
  })

  it('a rota é da mesma origem e o modelo está declarado num lugar só', () => {
    expect(ROTA_DA_HIPOTESE.startsWith('/')).toBe(true)
    expect(ROTA_DA_HIPOTESE).not.toContain('://')
    expect(MODELO).toBe('claude-sonnet-4-6')
  })

  it('a regra candidata continua sem tocar a esteira', () => {
    expect(ruleById.get(REGRA_CANDIDATA)?.status).toBe('candidate')
  })
})
