import { strings } from '@/copy/strings'
import { estadoDosAgentes, type AtividadeAgente } from '@/engine/mission-control'
import type { PipelineRun } from '@/engine/pipeline'

const PONTO: Record<AtividadeAgente, string> = {
  concluido: 'bg-signed',
  'em-execucao': 'bg-accent',
  bloqueado: 'bg-held',
  aguardando: 'bg-pending-gate',
  continuo: 'bg-accent',
}

const TEXTO: Record<AtividadeAgente, string> = {
  concluido: 'text-signed',
  'em-execucao': 'text-accent',
  bloqueado: 'text-held',
  aguardando: 'text-pending-gate',
  continuo: 'text-accent',
}

/**
 * Faixa dos sete agentes. O revisor nomeado ao lado de cada um é parte da
 * mensagem: nenhum agente é accountable — quem responde é a pessoa.
 */
export function AgentStrip({ run }: { readonly run: PipelineRun }) {
  const t = strings.missionControl.agents
  const estados = estadoDosAgentes(run)

  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.title}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.note}</p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {estados.map(({ agent, atividade, passos, regrasAplicadas }) => (
          <li key={agent.name} className="border border-line bg-surface-raised p-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 shrink-0 rounded-full ${PONTO[atividade]}`} aria-hidden="true" />
              <span className="text-base font-medium tracking-wide text-fg">{agent.name}</span>
              <span className={`ml-auto text-2xs ${TEXTO[atividade]}`}>
                {strings.agentActivity[atividade]}
              </span>
            </div>

            <p className="mt-1 text-2xs text-fg-subtle">{agent.papel}</p>

            <div className="mt-2 border-t border-line pt-1.5">
              <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.revisorLabel}</p>
              <p className="text-xs text-fg">{agent.revisor.nome}</p>
              <p className="text-2xs text-fg-subtle">{agent.revisor.papel}</p>
            </div>

            <p className="mt-2 text-2xs text-fg-subtle">
              {agent.transversal ? (
                t.transversalLabel
              ) : (
                <>
                  <span className="tnum">{regrasAplicadas}</span> {t.regrasLabel}
                  <span className="mt-0.5 block">{passos.map((p) => p.nome).join(' · ')}</span>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
