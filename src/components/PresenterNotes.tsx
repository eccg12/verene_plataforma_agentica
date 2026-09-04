import { EyeOff, Quote, X } from 'lucide-react'

import { mmss } from '@/components/PresenterBar'
import { strings } from '@/copy/strings'
import { passoPorNumero, TOTAL_DE_PASSOS } from '@/data/presentation'
import { useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.apresentacao

/**
 * Notas do apresentador.
 *
 * Fechadas por padrão e abertas por tecla — em nenhum momento o cliente vê isto
 * sem que o apresentador tenha decidido abrir. O aviso no topo existe porque a
 * proteção real depende do arranjo de telas: espelhado no projetor, o painel
 * aparece junto. Melhor dizer isso do que fingir que a tecla resolve.
 *
 * Cada passo traz a frase-chave — o que dizer, não o que a tela mostra —, o que
 * fazer na tela, e o que sustentar se perguntarem.
 */
export function PresenterNotes() {
  const { passo, notas } = useSimulation((s) => s.apresentacao)
  const alternarNotas = useSimulation((s) => s.alternarNotas)
  if (!notas) return null

  const atual = passoPorNumero(passo)
  const proximo = passo < TOTAL_DE_PASSOS ? passoPorNumero(passo + 1) : null

  return (
    <aside
      aria-label={t.titulo}
      className="absolute inset-y-0 right-0 z-20 flex w-[26rem] max-w-full flex-col border-l border-accent bg-surface shadow-2xl"
    >
      <header className="flex items-start gap-2 border-b border-line px-3 py-2">
        <div className="min-w-0">
          <p className="flex items-baseline gap-1.5">
            <span className="tnum text-xs font-semibold text-accent">{atual.n}</span>
            <span className="text-2xs text-fg-subtle">{t.passoDe}</span>
            <span className="tnum text-2xs text-fg-subtle">{TOTAL_DE_PASSOS}</span>
            <span className="ml-1.5 tnum text-2xs text-fg-muted">{mmss(atual.duracao)}</span>
          </p>
          <h2 className="mt-0.5 text-md font-medium text-fg">{atual.nome}</h2>
        </div>
        <button
          type="button"
          onClick={alternarNotas}
          aria-label={t.fecharNotas}
          className="ml-auto shrink-0 text-fg-subtle hover:text-fg"
        >
          <X size={ICON} aria-hidden="true" />
        </button>
      </header>

      <p className="flex items-start gap-1.5 border-b border-line bg-held-bg px-3 py-1.5 text-2xs text-held">
        <EyeOff size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
        {t.somenteApresentador}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <p className="text-2xs uppercase tracking-wider text-accent">{t.fraseChave}</p>
        <p className="mt-1 flex gap-1.5 text-sm leading-snug text-fg">
          <Quote size={12} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
          <span>{atual.fraseChave}</span>
        </p>

        <p className="mt-3 text-2xs uppercase tracking-wider text-fg-subtle">{t.acoes}</p>
        <ol className="mt-1">
          {atual.acoes.map((a, i) => (
            <li key={a} className="flex gap-1.5 py-0.5 text-xs text-fg">
              <span className="tnum shrink-0 text-fg-subtle">{i + 1}</span>
              <span>{a}</span>
            </li>
          ))}
        </ol>

        <p className="mt-3 text-2xs uppercase tracking-wider text-fg-subtle">{t.notas}</p>
        <ul className="mt-1">
          {atual.notas.map((n) => (
            <li key={n} className="border-l border-line py-0.5 pl-2 text-xs text-fg-muted">
              {n}
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-line px-3 py-1.5">
        <p className="text-2xs uppercase tracking-wider text-fg-subtle">
          {proximo === null ? t.ultimo : t.proximo}
        </p>
        {proximo === null ? null : <p className="text-xs text-fg-muted">{proximo.nome}</p>}
      </footer>
    </aside>
  )
}
