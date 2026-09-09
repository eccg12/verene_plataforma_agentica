/**
 * O portão da demonstração.
 *
 * O que estes testes travam é o que foi pedido de propósito e é fácil de
 * "melhorar" por reflexo depois: sem contador de tentativa, sem expiração, sem
 * distinção de qual campo errou.
 */
import { readFileSync } from 'node:fs'

import { describe, expect, it, beforeEach } from 'vitest'

import { strings } from '@/copy/strings'
import { CREDENCIAL, credencialConfere, TRANSICAO_MS, useEntry } from '@/entry/store'

const inicial = useEntry.getState()

beforeEach(() => {
  useEntry.setState({ liberado: false, saindo: false })
})

describe('credencial', () => {
  it('aceita a credencial da demonstração', () => {
    expect(credencialConfere(CREDENCIAL.usuario, CREDENCIAL.senha)).toBe(true)
  })

  it('o usuário vem preenchido com o que confere: a pessoa só digita a senha', () => {
    expect(CREDENCIAL.usuario).toBe('admin')
  })

  it('recusa senha errada, usuário errado e os dois errados', () => {
    expect(credencialConfere(CREDENCIAL.usuario, 'outra')).toBe(false)
    expect(credencialConfere('root', CREDENCIAL.senha)).toBe(false)
    expect(credencialConfere('root', 'outra')).toBe(false)
  })

  it('tolera espaço em volta do usuário, não da senha', () => {
    expect(credencialConfere(`  ${CREDENCIAL.usuario}  `, CREDENCIAL.senha)).toBe(true)
    expect(credencialConfere(CREDENCIAL.usuario, ` ${CREDENCIAL.senha}`)).toBe(false)
  })

  it('não afrouxa com caixa diferente', () => {
    expect(credencialConfere(CREDENCIAL.usuario.toUpperCase(), CREDENCIAL.senha)).toBe(false)
    expect(credencialConfere(CREDENCIAL.usuario, CREDENCIAL.senha.toUpperCase())).toBe(false)
  })

  it('errar não muda nada: não existe contador nem bloqueio de tentativa', () => {
    for (let i = 0; i < 20; i += 1) expect(credencialConfere(CREDENCIAL.usuario, 'errada')).toBe(false)
    // A vigésima primeira tentativa vale igual à primeira.
    expect(credencialConfere(CREDENCIAL.usuario, CREDENCIAL.senha)).toBe(true)
  })
})

describe('mensagem de erro', () => {
  it('é uma só, e não diz qual dos dois campos errou', () => {
    expect(strings.entrada.erro).toBe('Credencial inválida')
    expect(strings.entrada.erro).not.toMatch(/senha|usuário|tentativa|\d/i)
  })
})

describe('estado do portão', () => {
  it('abre fechado e sem transição em curso', () => {
    expect(useEntry.getState().liberado).toBe(false)
    expect(useEntry.getState().saindo).toBe(false)
  })

  it('liberar entra na transição; concluir libera', () => {
    inicial.liberar()
    expect(useEntry.getState()).toMatchObject({ saindo: true, liberado: false })
    inicial.concluir()
    expect(useEntry.getState()).toMatchObject({ saindo: false, liberado: true })
  })

  it('a transição é a de ~300ms pedida para revelar a cena 1', () => {
    expect(TRANSICAO_MS).toBe(300)
  })

  it('não há expiração de sessão: nada devolve o portão ao estado fechado', () => {
    inicial.liberar()
    inicial.concluir()
    const acoes = Object.entries(inicial).filter(([, v]) => typeof v === 'function')
    for (const [, acao] of acoes) (acao as () => void)()
    expect(useEntry.getState().liberado).toBe(true)
  })
})

describe('regra 6 — nada persiste', () => {
  it('o portão não guarda nada fora da memória', () => {
    for (const arquivo of ['store.ts', 'EntryScreen.tsx']) {
      const fonte = readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8')
      expect(fonte, arquivo).not.toMatch(/localStorage|sessionStorage|document\.cookie/)
    }
  })

  it('a tela de entrada não usa <form>: o mesmo código serve ao artifact', () => {
    const fonte = readFileSync(new URL('../EntryScreen.tsx', import.meta.url), 'utf8')
    expect(fonte).not.toMatch(/<form[\s>]/)
  })
})
