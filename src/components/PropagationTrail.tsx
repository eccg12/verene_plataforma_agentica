import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import { strings } from '@/copy/strings'

const ICON = 12
const t = strings.propagacao

export interface NoDePropagacao {
  readonly id: string
  readonly titulo: string
  /** Linhas de detalhe, com o número já derivado. */
  readonly detalhes: readonly string[]
  readonly path: string
}

interface PropagationTrailProps {
  readonly nos: readonly NoDePropagacao[]
  /** Muda a cada publicação: reinicia a animação. */
  readonly chave: string
}

/**
 * A propagação de uma correção de regra pela cadeia inteira.
 *
 * ESTA É A ÚNICA ANIMAÇÃO DO PROJETO, e existe porque é a única que ganha
 * argumento: ver a correção atravessar regra → playbook → onda → pacote →
 * manifest é o que torna "o ganho é por ciclo" visível em vez de afirmado. Todo
 * o resto da interface é sóbrio de propósito.
 *
 * O escalonamento não simula trabalho: a recomputação é instantânea, e a nota da
 * seção diz isso. O que a sequência mostra é o CAMINHO, não a duração.
 *
 * `prefers-reduced-motion` é respeitado por `useReducedMotion` — o reset de CSS
 * em `globals.css` não alcança transform aplicado por JS.
 */
export function PropagationTrail({ nos, chave }: PropagationTrailProps) {
  const semMovimento = useReducedMotion()
  const passo = semMovimento ? 0 : 0.2

  return (
    <ol className="flex flex-wrap items-stretch gap-1">
      {nos.map((no, i) => (
        <motion.li
          key={`${chave}:${no.id}`}
          initial={semMovimento ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * passo, duration: semMovimento ? 0 : 0.28, ease: 'easeOut' }}
          className="flex min-w-[11rem] flex-1 items-stretch gap-1"
        >
          <div className="flex min-w-0 flex-1 flex-col border border-line bg-surface-raised px-2 py-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <motion.span
                initial={semMovimento ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * passo + (semMovimento ? 0 : 0.12), duration: semMovimento ? 0 : 0.2 }}
                className="text-signed"
              >
                <Check size={ICON} aria-hidden="true" />
              </motion.span>
              {no.titulo}
            </p>
            {no.detalhes.map((d) => (
              <p key={d} className="mt-0.5 truncate text-2xs text-fg-muted">
                {d}
              </p>
            ))}
            <Link to={no.path} className="mt-auto pt-1 text-2xs text-accent hover:underline">
              {t.abrir}
            </Link>
          </div>
          {i === nos.length - 1 ? null : (
            <motion.span
              initial={semMovimento ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * passo + (semMovimento ? 0 : 0.18) }}
              className="flex items-center text-fg-subtle"
              aria-hidden="true"
            >
              <ArrowRight size={ICON} />
            </motion.span>
          )}
        </motion.li>
      ))}
    </ol>
  )
}
