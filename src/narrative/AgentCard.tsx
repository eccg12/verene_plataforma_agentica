import { agentByName } from '@/data/agents'
import { strings } from '@/copy/strings'
import type { CartaoDeAgente } from '@/narrative/script'
import type { AgentName } from '@/data/agents'

/**
 * O cartão do agente — o ponto que o protótipo não tinha.
 *
 * Nas telas o agente aparece como rótulo em tabela e nunca é apresentado. Aqui
 * ele responde as quatro perguntas de quem está vendo pela primeira vez: o que
 * faz, o que recebe, o que entrega e quem responde por ele.
 *
 * O revisor NÃO é repetido no roteiro: sai de `src/data/agents.ts`, para não
 * existirem duas verdades sobre quem assina. E ele é a última linha do cartão de
 * propósito — nenhum agente é accountable; quem responde é a pessoa.
 */
interface AgentCardProps {
  readonly agente: AgentName
  readonly cartao: CartaoDeAgente
}

export function AgentCard({ agente, cartao }: AgentCardProps) {
  const t = strings.narrativa.agente
  const spec = agentByName[agente]

  const linhas: readonly { readonly rotulo: string; readonly valor: string }[] = [
    { rotulo: t.oQueFaz, valor: cartao.oQueFaz },
    { rotulo: t.recebe, valor: cartao.recebe },
    { rotulo: t.entrega, valor: cartao.entrega },
  ]

  return (
    <article className="border border-accent bg-surface-sunken">
      <header className="border-b border-line px-3 py-2">
        <p className="flex items-baseline gap-2">
          <span className="text-lg font-medium tracking-wide text-accent">{spec.name}</span>
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.especialidade}</span>
        </p>
        <p className="mt-0.5 text-sm text-fg">{cartao.especialidade}</p>
      </header>

      <dl className="px-3 py-2">
        {linhas.map(({ rotulo, valor }) => (
          <div key={rotulo} className="border-b border-line py-1.5 first:pt-0 last:border-b-0 last:pb-0">
            <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{rotulo}</dt>
            <dd className="mt-0.5 text-sm leading-snug text-fg-muted">{valor}</dd>
          </div>
        ))}
      </dl>

      <footer className="border-t border-line bg-surface-raised px-3 py-2">
        <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.assina}</p>
        <p className="mt-0.5 text-sm text-fg">{spec.revisor.nome}</p>
        <p className="text-2xs text-fg-subtle">{spec.revisor.papel}</p>
      </footer>
    </article>
  )
}
