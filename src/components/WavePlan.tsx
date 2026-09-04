import { numeroBr } from '@/copy/format'
import { strings } from '@/copy/strings'
import { scopeObjects } from '@/data/scope'
import { waves } from '@/data/waves'

/** Plano de ondas. O volume de cada onda soma os objetos que ela carrega. */
export function WavePlan() {
  const t = strings.missionControl.waves
  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.title}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.note}</p>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {waves.map((wave) => {
          const objetos = scopeObjects.filter((o) => wave.objetos.includes(o.id))
          const volume = objetos.reduce((acc, o) => acc + o.volume, 0)
          return (
            <article key={wave.id} className="border border-line bg-surface-raised p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xs uppercase tracking-wider text-accent">
                  {t.waveLabel} {wave.numero}
                </span>
                <span className="ml-auto tnum text-xs text-fg-muted">
                  {numeroBr(volume)}
                </span>
                <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.volumeLabel}</span>
              </div>
              <h3 className="mt-1 text-base font-medium text-fg">{wave.nome}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{wave.descricao}</p>

              <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.objetosLabel}</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {objetos.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-sm border border-line px-1.5 py-0.5 text-2xs text-fg-muted"
                  >
                    {o.nome}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">
                {t.dependenciaLabel}
              </p>
              <p className="mt-1 text-sm text-fg-subtle">{wave.dependencia}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
