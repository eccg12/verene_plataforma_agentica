import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Compass, FileText, Pause, Play, RotateCcw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/Button'
import { strings } from '@/copy/strings'
import { useEntry } from '@/entry/store'
import { AgentCard } from '@/narrative/AgentCard'
import { prepararNivel } from '@/narrative/prepare'
import { Spotlight } from '@/narrative/Spotlight'
import { useNarrative } from '@/narrative/store'
import { atos, cenaPorNumero, cenas, rotuloDoAto, TOTAL_DE_CENAS, type Cena } from '@/narrative/script'

const ICON = 14
/** Tempo entre um bullet e o seguinte na cascata. */
const CASCATA_MS = 260

/** Barra de progresso das quinze cenas, agrupada pelos cinco atos. */
function Progresso({ cena, irPara }: { readonly cena: number; readonly irPara: (n: number) => void }) {
  const t = strings.narrativa
  return (
    <nav aria-label={t.tituloDoModo} className="flex items-end gap-2">
      {atos.map((ato) => {
        const doAto = cenas.filter((c) => c.ato === ato)
        return (
          <div key={ato} className="min-w-0 flex-1">
            <p className="truncate text-2xs uppercase tracking-wider text-fg-subtle">{rotuloDoAto[ato]}</p>
            <div className="mt-1 flex gap-0.5">
              {doAto.map((c) => (
                <button
                  key={c.n}
                  type="button"
                  onClick={() => irPara(c.n)}
                  aria-label={`${t.cena} ${c.n}`}
                  aria-current={c.n === cena ? 'step' : undefined}
                  className={`h-1 min-w-0 flex-1 transition-colors ${
                    c.n === cena ? 'bg-accent' : c.n < cena ? 'bg-line-strong' : 'bg-line'
                  }`}
                />
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

/**
 * O corpo da cena: bullets em cascata, cartão do agente e a nota do apresentador.
 *
 * Vive num componente próprio e é remontado a cada cena pela `key`. É o que faz
 * a cascata recomeçar e a nota fechar sozinhas na virada, sem um efeito
 * escrevendo estado logo na entrada.
 */
function CorpoDaCena({ cena }: { readonly cena: Cena }) {
  const t = strings.narrativa
  // Quem pediu menos movimento ao sistema recebe os bullets de uma vez.
  const [visiveis, setVisiveis] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? cena.bullets.length : 0,
  )
  const [verNota, setVerNota] = useState(false)

  useEffect(() => {
    if (visiveis >= cena.bullets.length) return
    const relogios = cena.bullets.map((_, i) =>
      window.setTimeout(() => setVisiveis((v) => Math.max(v, i + 1)), (i + 1) * CASCATA_MS),
    )
    return () => relogios.forEach(window.clearTimeout)
    // Roda uma vez por cena: a `key` no ponto de uso garante a remontagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <h2 className="text-xl font-medium leading-tight tracking-tight text-fg">{cena.titulo}</h2>

      <ul className="mt-3 flex flex-col gap-2.5">
        {cena.bullets.map((b, i) => (
          <li
            key={b}
            className={`border-l-2 pl-3 text-base leading-relaxed text-fg transition-opacity duration-150 ${
              i < visiveis ? 'border-accent opacity-100' : 'border-line opacity-0'
            }`}
          >
            {b}
          </li>
        ))}
      </ul>

      {cena.agente !== undefined && cena.cartao !== undefined ? (
        <div
          className={`mt-4 transition-opacity duration-150 ${
            visiveis >= cena.bullets.length ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <AgentCard agente={cena.agente} cartao={cena.cartao} />
        </div>
      ) : null}

      <div className="mt-4 border-t border-line pt-3">
        <Button variant="ghost" onClick={() => setVerNota((v) => !v)} className="-ml-2.5">
          <FileText size={ICON} aria-hidden="true" />
          {t.notas}
        </Button>
        {verNota ? (
          <p className="mt-1 border-l-2 border-held pl-3 text-sm leading-relaxed text-fg-muted">
            {cena.notaDoApresentador}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A camada narrada por cima do protótipo.
 *
 * A tela real fica ao fundo, escurecida, com o elemento da cena em foco. O
 * painel lateral traz os bullets em cascata — um a um, para o olho ter tempo de
 * pousar em cada frase antes da seguinte.
 *
 * Não reconstrói nada: navega pelas rotas que já existem e lê o roteiro. A tela
 * de fundo continua sendo a tela de verdade, funcionando.
 */
export function NarrativeOverlay() {
  const t = strings.narrativa
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  const ativa = useNarrative((s) => s.ativa)
  const encerrada = useNarrative((s) => s.encerrada)
  const numero = useNarrative((s) => s.cena)
  const automatico = useNarrative((s) => s.automatico)
  const pausado = useNarrative((s) => s.pausado)
  const proxima = useNarrative((s) => s.proxima)
  const anterior = useNarrative((s) => s.anterior)
  const reiniciar = useNarrative((s) => s.reiniciar)
  const explorar = useNarrative((s) => s.explorar)

  const cena = useMemo(() => cenaPorNumero(numero), [numero])

  // A cena encontra a onda no estado que ela afirma, e a tela que ela descreve.
  useEffect(() => {
    if (!ativa || encerrada) return
    prepararNivel(cena.nivel)
    if (`${pathname}${search}` !== cena.path) navigate(cena.path)
  }, [ativa, encerrada, cena, navigate, pathname, search])

  // Modo automático: só avança depois de a cascata terminar de mostrar tudo.
  useEffect(() => {
    if (!ativa || encerrada || !automatico || pausado) return
    const relogio = window.setTimeout(proxima, cena.duracao * 1000)
    return () => window.clearTimeout(relogio)
  }, [ativa, encerrada, automatico, pausado, cena, proxima])

  // Seta, barra de espaço e clique avançam. Fora da narrativa, nada responde —
  // as teclas do modo de apresentação continuam sendo as dele.
  useEffect(() => {
    if (!ativa) return
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target
      if (alvo instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return
      // Antes de entrar, a cena 1 está montada mas coberta: tecla não a avança.
      if (!useEntry.getState().liberado) return
      if (evento.key === 'ArrowRight' || evento.key === ' ' || evento.key === 'Spacebar') {
        evento.preventDefault()
        proxima()
        return
      }
      if (evento.key === 'ArrowLeft') {
        evento.preventDefault()
        anterior()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [ativa, proxima, anterior])

  // Fora da narrativa não há pino flutuante: quem entra e sai é o botão único da
  // barra superior, sempre no mesmo lugar.
  if (!ativa) return null

  if (encerrada) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-6" role="dialog" aria-modal="true">
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(5, 5, 5, 0.82)' }} aria-hidden="true" />
        <div className="relative w-full max-w-lg border border-accent bg-surface-raised p-5">
          <h2 className="text-lg font-medium text-fg">{t.fim}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.fimNota}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={explorar}>
              <Compass size={ICON} aria-hidden="true" />
              {t.encerrar}
            </Button>
            <Button variant="secondary" onClick={reiniciar}>
              <RotateCcw size={ICON} aria-hidden="true" />
              {t.reiniciar}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* A área escurecida avança a cena ao clique; o painel não. */}
      <button
        type="button"
        aria-label={t.proxima}
        onClick={proxima}
        className="fixed inset-0 z-30 cursor-pointer"
      />
      <Spotlight seletor={cena.destaque} chave={cena.n} />
    </>
  )
}

/**
 * O painel da cena. Fica no FLUXO da linha de conteúdo, não sobreposto: assim a
 * barra superior continua inteira e clicável, e a versão do playbook e o ciclo
 * seguem visíveis o tempo todo, como em qualquer outra tela.
 */
export function NarrativePanel() {
  const t = strings.narrativa
  const ativa = useNarrative((s) => s.ativa)
  const encerrada = useNarrative((s) => s.encerrada)
  const numero = useNarrative((s) => s.cena)
  const automatico = useNarrative((s) => s.automatico)
  const pausado = useNarrative((s) => s.pausado)
  const irPara = useNarrative((s) => s.irPara)
  const proxima = useNarrative((s) => s.proxima)
  const anterior = useNarrative((s) => s.anterior)
  const alternarAutomatico = useNarrative((s) => s.alternarAutomatico)
  const alternarPausa = useNarrative((s) => s.alternarPausa)
  const cena = useMemo(() => cenaPorNumero(numero), [numero])

  if (!ativa || encerrada) return null

  return (
    <>
      <aside
        aria-label={t.tituloDoModo}
        className="surface-ink relative z-40 flex w-[26rem] max-w-[92vw] shrink-0 flex-col border-l border-line-strong bg-surface"
      >
        <header className="border-b border-line px-4 py-3">
          <p className="text-2xs uppercase tracking-wider text-fg-subtle">
            {t.cena} <span className="tnum text-fg">{cena.n}</span> {t.de}{' '}
            <span className="tnum">{TOTAL_DE_CENAS}</span>
          </p>
          <div className="mt-2">
            <Progresso cena={cena.n} irPara={irPara} />
          </div>
        </header>

        <CorpoDaCena key={cena.n} cena={cena} />

        <footer className="border-t border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={anterior} disabled={cena.n === 1}>
              <ChevronLeft size={ICON} aria-hidden="true" />
              {t.anterior}
            </Button>
            <Button variant="primary" onClick={proxima}>
              {t.proxima}
              <ChevronRight size={ICON} aria-hidden="true" />
            </Button>
            {automatico ? (
              <Button variant="ghost" onClick={alternarPausa} className="ml-auto">
                {pausado ? <Play size={ICON} aria-hidden="true" /> : <Pause size={ICON} aria-hidden="true" />}
                {pausado ? t.tocar : t.pausar}
              </Button>
            ) : (
              <Button variant="ghost" onClick={alternarAutomatico} className="ml-auto">
                <Play size={ICON} aria-hidden="true" />
                {t.automatico}
              </Button>
            )}
          </div>
          <p className="mt-2 text-2xs text-fg-subtle">{t.avancarDica}</p>
          <p className="text-2xs text-fg-subtle">{t.telaAoFundo}</p>
        </footer>
      </aside>
    </>
  )
}
