import { NotebookPen, RotateCcw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { TECLAS } from '@/app/shortcuts'
import { strings } from '@/copy/strings'
import {
  DURACAO_DO_ROTEIRO,
  decorridoAte,
  passoPorNumero,
  passosDoRoteiro,
  TOTAL_DE_PASSOS,
} from '@/data/presentation'
import { useSimulation } from '@/engine/store'

const ICON = 12
const t = strings.apresentacao

/** m:ss a partir de segundos. Tempo previsto do roteiro, não relógio de parede. */
export const mmss = (segundos: number): string =>
  `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

/**
 * Barra do roteiro. Aparece só no modo de apresentação.
 *
 * Mostra onde o roteiro está e quanto tempo ele prevê para ali — previsão, não
 * cronômetro: o instante da simulação vem do epoch fixo (regra 4), e um relógio
 * de parede aqui seria a única coisa não determinística da interface.
 */
export function PresenterBar() {
  const navigate = useNavigate()
  const { passo, notas } = useSimulation((s) => s.apresentacao)
  const irParaPasso = useSimulation((s) => s.irParaPasso)
  const alternarNotas = useSimulation((s) => s.alternarNotas)
  const sair = useSimulation((s) => s.sairDaApresentacao)
  const reset = useSimulation((s) => s.reset)

  const atual = passoPorNumero(passo)
  const ir = (n: number) => {
    const alvo = Math.min(Math.max(n, 1), TOTAL_DE_PASSOS)
    irParaPasso(alvo)
    navigate(passoPorNumero(alvo).path)
  }

  const atalhos = [
    { teclas: '← →', rotulo: t.atalhos.passos },
    { teclas: TECLAS.notas.toUpperCase(), rotulo: t.atalhos.notas },
    { teclas: TECLAS.reset.toUpperCase(), rotulo: t.atalhos.reset },
    { teclas: 'ESC', rotulo: t.atalhos.sair },
  ]

  return (
    <footer className="flex shrink-0 flex-col border-t border-accent bg-surface-sunken">
      {/* trilha do roteiro: um segmento por passo, clicável */}
      <div className="flex gap-px" role="list" aria-label={t.roteiro}>
        {passosDoRoteiro.map((p) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            title={`${p.n}. ${p.nome}`}
            onClick={() => ir(p.n)}
            style={{ flexGrow: p.duracao }}
            className={`h-1 transition-colors ${
              p.n === passo ? 'bg-accent' : p.n < passo ? 'bg-accent/40' : 'bg-line'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5">
        <span className="flex items-baseline gap-1.5">
          <span className="tnum text-xs font-semibold text-accent">{passo}</span>
          <span className="text-2xs text-fg-subtle">{t.passoDe}</span>
          <span className="tnum text-2xs text-fg-subtle">{TOTAL_DE_PASSOS}</span>
        </span>

        <span className="text-sm font-medium text-fg">{atual.nome}</span>

        <span className="flex items-baseline gap-1.5">
          <span className="tnum text-2xs text-fg-muted">
            {mmss(decorridoAte(passo))}
            {strings.simbolos.intervalo}
            {mmss(decorridoAte(passo) + atual.duracao)}
          </span>
          <span className="text-2xs text-fg-subtle">{t.previsto}</span>
          <span className="tnum text-2xs text-fg-subtle">{mmss(DURACAO_DO_ROTEIRO)}</span>
          <span className="text-2xs text-fg-subtle">{t.total}</span>
        </span>

        <ul className="ml-auto flex flex-wrap items-center gap-x-3">
          {atalhos.map((a) => (
            <li key={a.teclas} className="flex items-baseline gap-1">
              <kbd className="rounded-sm border border-line-strong px-1 text-2xs text-fg-muted">{a.teclas}</kbd>
              <span className="text-2xs text-fg-subtle">{a.rotulo}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={alternarNotas}
            className={`flex h-6 items-center gap-1 rounded-sm px-1.5 text-2xs ${
              notas ? 'bg-accent-fill text-on-accent-fill' : 'text-fg-muted hover:text-fg'
            }`}
          >
            <NotebookPen size={ICON} aria-hidden="true" />
            {notas ? t.fecharNotas : t.abrirNotas}
          </button>
          <button
            type="button"
            onClick={() => {
              reset()
              ir(1)
            }}
            className="flex h-6 items-center gap-1 rounded-sm px-1.5 text-2xs text-fg-muted hover:text-fg"
          >
            <RotateCcw size={ICON} aria-hidden="true" />
            {strings.gates.reset}
          </button>
          <button
            type="button"
            onClick={sair}
            aria-label={t.atalhos.sair}
            className="flex h-6 items-center rounded-sm px-1.5 text-fg-subtle hover:text-fg"
          >
            <X size={ICON} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
