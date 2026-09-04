import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { dataBr, dataHoraBr, horaBr, moedaBr, numeroBr } from '@/copy/format'
import { PRESERVED_TERMS } from '@/copy/glossary'
import { strings } from '@/copy/strings'

const raiz = join(process.cwd(), 'src')

const arquivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : arquivos(caminho)
    return /\.tsx?$/.test(nome) ? [caminho] : []
  })

/** Todos os textos que a UI mostra, achatados. */
function textosVisiveis(valor: unknown, saida: string[] = []): string[] {
  if (typeof valor === 'string') saida.push(valor)
  else if (valor && typeof valor === 'object') Object.values(valor).forEach((v) => textosVisiveis(v, saida))
  return saida
}

// ============================================================ formato brasileiro

describe('formato brasileiro', () => {
  it('data em DD/MM/AAAA, aceitando ISO curto ou completo', () => {
    expect(dataBr('2026-01-23')).toBe('23/01/2026')
    expect(dataBr('2026-01-12T09:00:00.000Z')).toBe('12/01/2026')
    expect(dataHoraBr('2026-01-12T09:00:00.000Z')).toBe('12/01/2026 09:00')
    expect(dataHoraBr('2026-01-23')).toBe('23/01/2026')
    expect(horaBr('2026-01-12T09:00:45.000Z')).toBe('09:00:45')
  })

  it('número com ponto de milhar e moeda com vírgula decimal', () => {
    expect(numeroBr(1120)).toBe('1.120')
    expect(numeroBr(2080)).toBe('2.080')
    expect(numeroBr(42)).toBe('42')
    // `Intl` separa o símbolo com espaço inquebrável — é o certo tipograficamente,
    // e é o que a tela mostra. O teste normaliza para não depender do caractere.
    const semNbsp = (v: string) => v.replace(/\u00a0/g, ' ')
    expect(semNbsp(moedaBr(741613.7))).toBe('R$ 741.613,70')
    expect(semNbsp(moedaBr(0))).toBe('R$ 0,00')
  })

  it('a formatação de data vive num lugar só', () => {
    // Recorte de string para montar data fora de `format.ts` é como texto solto
    // em JSX: funciona até uma tela divergir das outras. O que a tela de fato
    // renderiza é conferido no navegador, procurando AAAA-MM-DD no DOM.
    const artesanais: string[] = []
    for (const f of arquivos(raiz)) {
      if (f.endsWith(join('copy', 'format.ts'))) continue
      const conteudo = readFileSync(f, 'utf8')
      if (/slice\(8, ?10\)|slice\(5, ?7\)|toLocaleDateString/.test(conteudo)) {
        artesanais.push(f.replace(raiz, 'src'))
      }
    }
    expect(artesanais).toEqual([])
  })
})

// ============================================================ idioma

describe('idioma da interface', () => {
  const textos = textosVisiveis(strings)
  const permitidos = new Set(PRESERVED_TERMS.flatMap((t) => t.toLowerCase().split(/\s+/)))

  it('tem texto para mostrar', () => {
    expect(textos.length).toBeGreaterThan(500)
  })

  it('nenhum resto de inglês fora do glossário', () => {
    const suspeitas =
      /^(the|and|for|with|from|new|open|close|closed|start|stop|show|hide|view|edit|delete|remove|save|cancel|submit|search|filter|sort|next|previous|back|loading|error|warning|success|failed|pending|done|complete|completed|status|name|value|date|user|count|amount|item|items|row|column|table|list|details|summary|overview|settings|help|about|home|page|screen|dashboard|report|export|import|upload|download|refresh|reload|reset|apply|approve|approved|reject|rejected|review|sign|signed|draft|preview|record|records|field|fields|rule|rules|step|steps|owner|source|target|package|packages|version|check|note|notes|log|run)$/i

    const achados = new Set<string>()
    for (const texto of textos) {
      for (const token of texto.split(/[^A-Za-zÀ-ÿ0-9/]+/)) {
        if (token.length < 2) continue
        if (permitidos.has(token.toLowerCase())) continue
        if (suspeitas.test(token)) achados.add(token)
      }
    }
    expect([...achados]).toEqual([])
  })

  it('o glossário cobre os termos em inglês que a UI de fato usa', () => {
    const registrados = PRESERVED_TERMS.map((t) => t.toLowerCase())
    for (const termo of [
      'Business Partner', 'Migration Cockpit', 'Gate', 'Gates', 'data owner',
      'playbook', 'checksum', 'tenant', 'Value domain', 'PACKAGE',
    ]) {
      expect(registrados, termo).toContain(termo.toLowerCase())
    }
  })
})

// ============================================================ regra 2 e regra 3

describe('texto e dado no lugar certo', () => {
  it('nenhum mapa de rótulo visível declarado fora de strings.ts', () => {
    const suspeitos: string[] = []
    for (const f of arquivos(join(raiz, 'screens')).concat(arquivos(join(raiz, 'components')))) {
      const conteudo = readFileSync(f, 'utf8')
      for (const m of conteudo.matchAll(/^\s+'?[\w-]+'?:\s*'([A-ZÀ-Ú][^']{3,})',$/gm)) {
        const valor = m[1]!
        if (/^(text-|bg-|border-|flex|grid)/.test(valor)) continue
        suspeitos.push(`${f.replace(raiz, 'src')}: '${valor}'`)
      }
    }
    expect(suspeitos).toEqual([])
  })

  it('nem lorem, nem TODO, nem marcador de pendência em fonte de produção', () => {
    const achados: string[] = []
    for (const f of arquivos(raiz)) {
      // Sem a flag `i`: "todo" e "toda" são palavras do português e aparecem
      // em dezenas de comentários legítimos.
      const conteudo = readFileSync(f, 'utf8')
      if (/\bTODO\b|\bFIXME\b|\bXXX\b/.test(conteudo) || /lorem ipsum/i.test(conteudo)) {
        achados.push(f.replace(raiz, 'src'))
      }
    }
    expect(achados).toEqual([])
  })
})
