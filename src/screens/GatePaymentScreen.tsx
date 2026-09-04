import { ArrowLeft } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { paths } from '@/app/paths'
import { GateStatusBadge } from '@/components/GateStatusBadge'
import { strings } from '@/copy/strings'
import { estadoDosGates } from '@/engine/gates'
import { liberacaoDePagamento } from '@/engine/payment'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.gatesPayment

/**
 * Painel comercial: parcela por Gate.
 *
 * Fica atrás da flag `comercial` (`?flag=comercial`) e fora da navegação: existe
 * para quando for pedido na sala, não para ficar na tela. Sem a flag, a rota
 * volta para os Gates — nada de meia-tela nem de aviso que denuncia o painel.
 */
export function GatePaymentScreen() {
  const comercial = useSimulation((s) => s.flags.comercial)
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const assinaturasDeGate = useSimulation((s) => s.assinaturasDeGate)

  const run = runDeTodasSpes(playbookVersion, approvals)
  const estados = estadoDosGates({ run, approvals, playbookVersion, assinaturasDeGate })
  const liberacao = liberacaoDePagamento(estados)
  const semParcela = estados.filter((e) => !liberacao.parcelas.some((p) => p.parcela.gate === e.gate.id))

  if (!comercial) return <Navigate to={paths.gates} replace />

  return (
    <div className="p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-fg">{t.title}</h1>
          <p className="mt-0.5 text-sm text-fg-muted">{t.subtitle}</p>
        </div>
        <Link to={paths.gates} className="flex items-center gap-1 text-2xs text-accent hover:underline">
          <ArrowLeft size={ICON} aria-hidden="true" />
          {t.voltar}
        </Link>
      </header>

      <p className="mt-2 max-w-[80ch] text-sm text-fg-subtle">{t.nota}</p>

      <div className="mt-3 overflow-x-auto border border-line">
        <table className="w-full text-base">
          <thead className="bg-surface-sunken">
            <tr className="h-7">
              <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colGate}
              </th>
              <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colParcela}
              </th>
              <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colEstado}
              </th>
              <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colOQueLibera}
              </th>
            </tr>
          </thead>
          <tbody>
            {liberacao.parcelas.map((p) => (
              <tr key={p.parcela.gate} className="border-t border-line align-top">
                <td className="px-2 py-1.5 text-fg">
                  <span className="tnum text-accent">{p.parcela.gate}</span>
                  {strings.simbolos.separador}
                  {p.gateNome}
                </td>
                <td className="px-2 py-1.5 text-right tnum text-fg">
                  {p.parcela.percentual}
                  {strings.simbolos.porcento}
                </td>
                <td className="px-2 py-1.5">
                  <span className={`text-sm ${p.liberada ? 'text-signed' : 'text-held'}`}>
                    {p.liberada ? t.liberada : t.retida}
                  </span>
                  <span className="mt-0.5 block">
                    <GateStatusBadge status={p.status} />
                  </span>
                  {p.recusa === null ? null : (
                    <span className="mt-0.5 block text-2xs text-exception">
                      {t.bloqueioPor}
                      {strings.simbolos.doisPontos}
                      <span className="tnum">{p.recusa.gate}</span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-2xs text-fg-muted">{p.parcela.oQueLibera}</td>
              </tr>
            ))}
            <tr className="border-t border-line-strong bg-surface-sunken">
              <td className="px-2 py-1.5 text-fg">{t.totalLiberado}</td>
              <td className={`px-2 py-1.5 text-right tnum ${liberacao.liberado > 0 ? 'text-signed' : 'text-fg-subtle'}`}>
                {liberacao.liberado}
                {strings.simbolos.porcento}
              </td>
              <td className="px-2 py-1.5 text-fg-subtle">{t.totalRetido}</td>
              <td className={`px-2 py-1.5 tnum ${liberacao.retido > 0 ? 'text-held' : 'text-fg-subtle'}`}>
                {liberacao.retido}
                {strings.simbolos.porcento}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mt-3 border border-line px-2 py-1.5">
        <h2 className="text-sm font-medium text-fg">{t.semParcela}</h2>
        <p className="mt-1 text-2xs text-fg-muted">
          {semParcela.map((e, i) => (
            <span key={e.gate.id}>
              {i === 0 ? null : strings.simbolos.separador}
              <span className="tnum text-fg">{e.gate.id}</span> {e.gate.nome}
            </span>
          ))}
        </p>
        <p className="mt-1 max-w-[80ch] text-2xs text-fg-subtle">{t.semParcelaNota}</p>
      </section>
    </div>
  )
}
