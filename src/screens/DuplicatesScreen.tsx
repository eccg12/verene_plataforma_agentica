import { Check, Scissors, ShieldAlert, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { strings } from '@/copy/strings'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import { existingSuppliers } from '@/data/target/existing-base'
import { formatCnpj, onlyDigits } from '@/engine/br-documents'
import { analisarCluster } from '@/engine/matching'
import type { DuplicateCluster } from '@/engine/pipeline'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.duplicates

function CardCluster({ cluster }: { readonly cluster: DuplicateCluster }) {
  const confirmar = useSimulation((s) => s.confirmCluster)
  const dividir = useSimulation((s) => s.splitCluster)
  const approvals = useSimulation((s) => s.approvals)
  const analise = analisarCluster(cluster, nasajonSuppliers)
  const assinatura = approvals.clusters[cluster.id] ?? null
  const sobrevivente = cluster.sobreviventePropostoCodigo
  const aposentados = cluster.membros.filter((m) => m !== sobrevivente)
  const fundido = assinatura?.decision === 'approved'

  return (
    <article className="border border-line bg-surface-raised">
      <div className="flex flex-wrap items-baseline gap-3 border-b border-line px-3 py-2">
        <span className="font-mono text-xs text-accent">{cluster.id}</span>
        <span className="text-xs text-fg-muted">{cluster.spes.join(strings.simbolos.separador)}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.scoreLabel}</span>
          <span className="tnum text-md font-medium text-fg">{analise.score}</span>
        </span>
        <span className="ml-auto text-2xs">
          {assinatura ? (
            <span className="text-signed">{t.decidido}</span>
          ) : (
            <span className="text-held">{t.pendente}</span>
          )}
        </span>
      </div>

      <div className="grid gap-3 px-3 py-2 lg:grid-cols-2">
        <div>
          <h4 className="text-2xs uppercase tracking-wider text-fg-subtle">{t.racional}</h4>
          <ul className="mt-1">
            {analise.sinais.map((sinal) => (
              <li key={sinal.id} className="flex gap-2 border-t border-line py-1 first:border-t-0">
                <span className={`mt-0.5 size-2 shrink-0 rounded-full ${sinal.bate ? 'bg-signed' : 'bg-line-strong'}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-xs text-fg">{sinal.rotulo}</span>
                    <span className="tnum text-2xs text-fg-subtle">
                      {t.peso} {sinal.peso}
                    </span>
                    <span className={`text-2xs ${sinal.bate ? 'text-signed' : 'text-fg-subtle'}`}>
                      {sinal.bate ? t.bate : t.naoBate}
                    </span>
                  </span>
                  <span className="block text-2xs text-fg-subtle">{sinal.detalhe}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-2xs uppercase tracking-wider text-fg-subtle">{t.divergentes}</h4>
          <table className="mt-1 w-full">
            <thead>
              <tr>
                <th scope="col" className="w-32 text-left text-2xs font-normal text-fg-subtle" />
                {cluster.membros.map((m) => (
                  <th key={m} scope="col" className="text-left text-2xs font-medium">
                    <span className={m === sobrevivente ? 'text-signed' : 'text-fg-subtle'}>{m}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analise.divergentes.map((d) => (
                <tr key={d.campo} className="border-t border-line align-top">
                  <td className="py-0.5 pr-2 text-2xs text-fg-subtle">{d.rotulo}</td>
                  {d.valores.map((v) => (
                    <td
                      key={v.codigo}
                      className={`py-0.5 pr-2 font-mono text-2xs ${v.codigo === sobrevivente ? 'text-fg' : 'text-fg-muted'}`}
                    >
                      {v.valor || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-2xs text-fg-subtle">
            {t.iguais}
            {strings.simbolos.doisPontos}
            {analise.iguais.length}
          </p>
        </div>
      </div>

      <div className="border-t border-line px-3 py-2">
        <h4 className="text-2xs uppercase tracking-wider text-fg-subtle">{t.survivorship}</h4>
        <p className="mt-0.5 text-sm text-fg-muted">{cluster.motivoDaProposta}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-signed bg-signed-bg px-2 py-0.5">
            <span className="text-2xs uppercase tracking-wider text-signed">{t.sobrevivente}</span>
            <Link to={`${paths.recordBase}/${sobrevivente}`} className="font-mono text-xs text-signed">
              {sobrevivente}
            </Link>
          </span>
          {aposentados.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-0.5">
              <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.aposentado}</span>
              <Link to={`${paths.recordBase}/${a}`} className="font-mono text-xs text-fg-muted">
                {a}
              </Link>
            </span>
          ))}
          <span className="text-xs text-fg">{cluster.razaoSocialProposta}</span>
        </div>

        {fundido ? (
          <p className="mt-2 border-l-2 border-accent bg-surface-sunken px-2 py-1.5">
            <span className="text-xs font-medium text-accent">{t.crossRef}</span>
            <span className="block text-sm text-fg-muted">{t.crossRefNota}</span>
            {aposentados.map((a) => (
              <span key={a} className="mt-0.5 block font-mono text-2xs text-fg-muted">
                {a} <span className="text-fg-subtle">{strings.simbolos.separador}</span> {sobrevivente}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.acoes}</span>
        <Button variant="primary" onClick={() => confirmar(cluster.id, 'approved')} disabled={assinatura !== null}>
          <Check size={ICON} aria-hidden="true" />
          {t.confirmar}
        </Button>
        <Button variant="secondary" onClick={() => confirmar(cluster.id, 'rejected')} disabled={assinatura !== null}>
          <X size={ICON} aria-hidden="true" />
          {t.rejeitar}
        </Button>
        <Button variant="secondary" onClick={() => dividir(cluster.id)} disabled={assinatura !== null}>
          <Scissors size={ICON} aria-hidden="true" />
          {t.dividir}
        </Button>
        {assinatura ? (
          <span className="ml-auto text-2xs text-fg-subtle">
            {assinatura.by}
            {strings.simbolos.separador}
            {assinatura.note}
          </span>
        ) : null}
      </div>
    </article>
  )
}

/**
 * Cadastros do escopo que já existem no tenant.
 *
 * Derivado do cruzamento de documento entre o extrato e a base da Verene, não
 * do resultado da esteira: o casamento é fato do dado e não depende de a
 * validação já ter rodado. Se dependesse, a seção sumiria enquanto o
 * checkpoint estivesse segurando — e é justamente antes de decidir que se
 * precisa ver isto.
 */
function JaCadastrados() {
  const reusos = nasajonSuppliers
    .map((fonte) => ({
      fonte,
      existente: existingSuppliers.find((e) => onlyDigits(e.cnpjCpf) === onlyDigits(fonte.cnpjCpf)),
    }))
    .filter((x): x is { fonte: typeof x.fonte; existente: NonNullable<typeof x.existente> } => x.existente !== undefined)
    .sort((a, b) => (a.fonte.codigo < b.fonte.codigo ? -1 : 1))
  if (reusos.length === 0) return null
  const r = t.reuso

  return (
    <section>
      <h2 className="text-md font-medium text-fg">{r.titulo}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{r.nota}</p>
      <ul className="mt-2 grid gap-2 lg:grid-cols-2">
        {reusos.map(({ fonte, existente }) => {
          return (
            <li key={fonte.codigo} className="border border-held bg-surface-raised">
              <p className="flex items-center gap-2 border-b border-line bg-held-bg px-3 py-1.5">
                <ShieldAlert size={ICON} className="shrink-0 text-held" aria-hidden="true" />
                <span className="text-xs font-medium text-held">{r.alerta}</span>
              </p>
              <div className="px-3 py-2">
                <p className="flex items-baseline gap-2">
                  <Link to={`${paths.recordBase}/${fonte.codigo}`} className="font-mono text-xs text-accent">
                    {fonte.codigo}
                  </Link>
                  <span className="text-xs text-fg">{fonte.razaoSocial}</span>
                  <span className="ml-auto text-2xs text-fg-subtle">{fonte.spe}</span>
                </p>
                <p className="mt-0.5 font-mono text-2xs text-fg-muted">{formatCnpj(fonte.cnpjCpf)}</p>
                {existente ? (
                  <dl className="mt-1.5 border-t border-line pt-1.5">
                    <div className="flex gap-2">
                      <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{r.businessPartner}</dt>
                      <dd className="font-mono text-2xs text-signed">{existente.businessPartner}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{r.criadoEm}</dt>
                      <dd className="tnum text-2xs text-fg-muted">{existente.criadoEm}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function DuplicatesScreen() {
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const reset = useSimulation((s) => s.reset)
  // A fila é cross-SPE por natureza: duplicata só existe entre SPEs.
  const run = runDeTodasSpes(playbookVersion, approvals)
  const bloqueado = run.blockedAt === 'transform'

  return (
    <Surface surface="ink" className="min-h-full">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>
          <p className="text-sm text-fg-subtle">{t.escopoNota}</p>

          <div className="mt-2 flex items-start gap-2 border-l-2 border-accent bg-surface-raised px-3 py-2">
            <p>
              <span className="text-sm font-medium text-accent">{t.nuncaAutomatico}</span>
              <span className="block max-w-[80ch] text-sm text-fg-muted">{t.nuncaAutomaticoNota}</span>
            </p>
            <Button variant="ghost" onClick={reset} className="ml-auto shrink-0">
              {t.reverter}
            </Button>
          </div>
        </header>

        {bloqueado ? (
          <div className="border border-held bg-surface-raised px-3 py-3">
            <p className="text-sm font-medium text-held">{t.bloqueadoTitulo}</p>
            <p className="mt-0.5 max-w-[80ch] text-sm text-fg-muted">{t.bloqueadoNota}</p>
            <Link to={paths.mapping}>
              <Button variant="primary" className="mt-2">
                {t.irParaMapeamento}
              </Button>
            </Link>
          </div>
        ) : run.clusters.length === 0 ? (
          <p className="border border-line bg-surface-raised px-3 py-3 text-sm text-fg-subtle">{t.semClusters}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {run.clusters.map((c) => (
              <CardCluster key={c.id} cluster={c} />
            ))}
          </div>
        )}

        <JaCadastrados />
      </div>
    </Surface>
  )
}
