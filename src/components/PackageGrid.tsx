import { strings } from '@/copy/strings'
import { contarPorEstado, loadPackageBoard, packageStates, type PackageState } from '@/data/packages'
import { cycleById, cycles, scopeObjects, speIds, type Cycle } from '@/data/scope'

/**
 * Grade dos 48 pacotes. É a imagem que fixa o escopo: seis objetos, quatro
 * SPEs, dois ciclos. Nenhuma célula é decorativa — cada uma carrega o volume
 * previsto do pacote e o estado dele.
 */
const CELULA: Record<PackageState, string> = {
  'nao-iniciado': 'bg-surface-sunken text-fg-subtle',
  'em-processamento': 'bg-accent-fill/25 text-accent',
  retido: 'bg-held-bg text-held',
  'aguardando-gate': 'bg-pending-gate-bg text-pending-gate',
  aprovado: 'bg-signed-bg text-signed',
}

const PONTO: Record<PackageState, string> = {
  'nao-iniciado': 'bg-line-strong',
  'em-processamento': 'bg-accent',
  retido: 'bg-held',
  'aguardando-gate': 'bg-pending-gate',
  aprovado: 'bg-signed',
}

interface PackageGridProps {
  readonly cicloCorrente: Cycle
}

export function PackageGrid({ cicloCorrente }: PackageGridProps) {
  const t = strings.missionControl.grid
  const resumo = contarPorEstado(loadPackageBoard)
  const totalRegistros = loadPackageBoard
    .filter((p) => p.ciclo === cicloCorrente)
    .reduce((acc, p) => acc + p.registros, 0)

  return (
    <section>
      <div className="flex items-baseline gap-3">
        <h2 className="text-md font-medium text-fg">{t.title}</h2>
        <span className="tnum text-xs text-fg-subtle">
          {loadPackageBoard.length} {t.resumoPacotes}
        </span>
        <span className="tnum text-xs text-fg-subtle">
          {totalRegistros.toLocaleString('pt-BR')} {t.resumoRegistros}
        </span>
      </div>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.note}</p>

      <div className="mt-3 overflow-x-auto border border-line">
        <table className="w-full text-base">
          <thead className="bg-surface-sunken">
            <tr className="h-7">
              <th scope="col" rowSpan={2} className="px-2 text-left align-bottom text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colObjeto}
              </th>
              {cycles.map((ciclo) => (
                <th
                  key={ciclo}
                  scope="colgroup"
                  colSpan={speIds.length}
                  className={`border-l border-line px-2 text-center text-2xs font-semibold uppercase tracking-wider ${
                    ciclo === cicloCorrente ? 'text-accent' : 'text-fg-subtle'
                  }`}
                >
                  {cycleById[ciclo].nome}
                </th>
              ))}
              <th scope="col" rowSpan={2} className="border-l border-line px-2 text-right align-bottom text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colTotal}
              </th>
            </tr>
            <tr className="h-6">
              {cycles.flatMap((ciclo) =>
                speIds.map((spe, i) => (
                  <th
                    key={`${ciclo}-${spe}`}
                    scope="col"
                    className={`px-2 text-center text-2xs font-medium text-fg-subtle ${i === 0 ? 'border-l border-line' : ''}`}
                  >
                    {spe}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {scopeObjects.map((objeto) => (
              <tr key={objeto.id} className="h-7 border-t border-line">
                <td className="px-2 text-fg">{objeto.nome}</td>
                {cycles.flatMap((ciclo) =>
                  speIds.map((spe, i) => {
                    const pacote = loadPackageBoard.find(
                      (p) => p.objetoId === objeto.id && p.spe === spe && p.ciclo === ciclo,
                    )
                    const estado = pacote?.estado ?? 'nao-iniciado'
                    return (
                      <td
                        key={`${objeto.id}-${ciclo}-${spe}`}
                        className={`px-1 py-0.5 ${i === 0 ? 'border-l border-line' : ''}`}
                      >
                        <span
                          title={`${objeto.nome} · ${spe} · ${cycleById[ciclo].nome} — ${strings.packageStates[estado]}`}
                          className={`flex h-5 items-center justify-center rounded-sm text-2xs tnum ${CELULA[estado]}`}
                        >
                          {pacote?.registros ?? 0}
                        </span>
                      </td>
                    )
                  }),
                )}
                <td className="border-l border-line px-2 text-right tnum text-fg">
                  {objeto.volume.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.legenda}</span>
        {packageStates.map((estado) => (
          <span key={estado} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className={`size-2 shrink-0 rounded-[1px] ${PONTO[estado]}`} aria-hidden="true" />
            {strings.packageStates[estado]}
            <span className="tnum text-fg-subtle">{resumo[estado]}</span>
          </span>
        ))}
      </div>
    </section>
  )
}
