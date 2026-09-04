import { strings } from '@/copy/strings'

/**
 * Selo permanente de ambiente de demonstração.
 *
 * Fica em toda tela, sempre, sem tecla para esconder. Um protótipo bem feito
 * parece um sistema — e é exatamente por parecer que ele precisa dizer que não
 * é. Discreto para não roubar a tela, legível para não deixar dúvida.
 */
export function DemoBadge() {
  const t = strings.shell
  return (
    <span
      className="flex items-center gap-1.5 rounded-sm border border-held/50 px-1.5 py-0.5"
      title={`${t.demo} — ${t.demoDetalhe}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-held" aria-hidden="true" />
      <span className="text-2xs uppercase tracking-wider text-held">{t.demo}</span>
      <span className="text-2xs text-fg-subtle">{t.demoDetalhe}</span>
    </span>
  )
}
