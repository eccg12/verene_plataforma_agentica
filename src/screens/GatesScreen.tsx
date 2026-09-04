import { Ban, Check, ExternalLink, FileSignature, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { GateStatusBadge } from '@/components/GateStatusBadge'
import { strings } from '@/copy/strings'
import type { GateId } from '@/data/gates'
import {
  estadoDosGates,
  type EstadoDeGate,
  type GateStatus,
  type ItemDeTrilha,
  type Pendencia,
} from '@/engine/gates'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.gates

/** Data e hora do instante determinístico da simulação. */
const quando = (iso: string): string =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} ${iso.slice(11, 16)}`

const ORDEM_RESUMO: readonly GateStatus[] = [
  'aprovado',
  'em-avaliacao',
  'evidencia-pendente',
  'entrada-recusada',
]

function Resumo({ estados }: { readonly estados: readonly EstadoDeGate[] }) {
  const contagem = ORDEM_RESUMO.map((status) => ({
    status,
    n: estados.filter((e) => e.status === status).length,
  })).filter((c) => c.n > 0)

  return (
    <p className="text-sm text-fg-muted">
      {contagem.map((c, i) => (
        <span key={c.status}>
          {i === 0 ? null : strings.simbolos.separador}
          <span className="tnum text-fg">{c.n}</span>{' '}
          {c.n === 1 ? t.resumo[c.status].um : t.resumo[c.status].varios}
        </span>
      ))}
    </p>
  )
}

/** Sequência dos oito Gates. É aqui que a recusa em cascata fica visível de uma vez. */
function Rail({
  estados,
  selecionado,
  onSelect,
}: {
  readonly estados: readonly EstadoDeGate[]
  readonly selecionado: GateId
  readonly onSelect: (id: GateId) => void
}) {
  return (
    <div aria-label={t.railLabel} className="flex gap-1 overflow-x-auto pb-1">
      {estados.map((e) => (
        <button
          key={e.gate.id}
          type="button"
          onClick={() => onSelect(e.gate.id)}
          className={`flex min-w-[9.5rem] shrink-0 flex-col gap-1 border px-2 py-1.5 text-left transition-colors ${
            e.gate.id === selecionado
              ? 'border-accent bg-surface-raised'
              : 'border-line bg-surface hover:border-line-strong'
          }`}
        >
          <span className="flex items-baseline gap-1.5">
            <span className="tnum text-xs font-semibold text-accent">{e.gate.id}</span>
            <span className="truncate text-xs text-fg">{e.gate.nome}</span>
          </span>
          <GateStatusBadge status={e.status} />
        </button>
      ))}
    </div>
  )
}

function Recusa({
  estado,
  onSelect,
}: {
  readonly estado: EstadoDeGate
  readonly onSelect: (id: GateId) => void
}) {
  if (estado.recusa === null) return null
  return (
    <div className="border border-exception bg-exception-bg px-3 py-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-exception">
        <Ban size={ICON} aria-hidden="true" />
        {t.recusa.titulo}
      </p>
      <p className="mt-1 text-sm text-fg">{t.recusa.frase}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 text-xs">
        <dt className="text-fg-subtle">{t.recusa.artefatoLabel}</dt>
        <dd className="text-fg">
          {estado.recusa.artefatoNome}
          {strings.simbolos.separador}
          <span className="tnum">{estado.recusa.artefato}</span>
        </dd>
        <dt className="text-fg-subtle">{t.recusa.assinadoNo}</dt>
        <dd>
          <button
            type="button"
            className="tnum text-accent hover:underline"
            onClick={() => onSelect(estado.recusa!.gate)}
          >
            {estado.recusa.gate}
          </button>
        </dd>
      </dl>
      <p className="mt-1.5 max-w-[75ch] text-xs text-fg-muted">{t.recusa.consequencia}</p>
    </div>
  )
}

function LinhaDaTrilha({ item }: { readonly item: ItemDeTrilha }) {
  const assinatura = item.assinatura
  return (
    <tr className="border-t border-line align-top">
      <td className="px-2 py-1.5 text-fg">
        {item.oQueAssina}
        {item.requeridas > 1 ? (
          <span className="mt-0.5 block text-2xs text-fg-subtle">
            <span className="tnum">{item.assinadas}</span> {t.trilha.deQuantas}{' '}
            <span className="tnum">{item.requeridas}</span> {t.trilha.assinaturas}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-1.5 text-fg">
        {item.responsavel === null ? (
          <span className="text-fg-subtle">{t.trilha.semResponsavel}</span>
        ) : (
          <>
            {item.responsavel.nome}
            <span className="mt-0.5 block text-2xs text-fg-subtle">{item.area}</span>
          </>
        )}
      </td>
      <td className="px-2 py-1.5">
        {assinatura === null ? (
          <span className="text-fg-subtle">{t.trilha.naoAssinado}</span>
        ) : (
          <span className={assinatura.decision === 'approved' ? 'text-signed' : 'text-exception'}>
            {t.trilha[assinatura.decision]}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 tnum text-fg-muted">{assinatura === null ? null : quando(assinatura.at)}</td>
      <td className="px-2 py-1.5 tnum text-fg-muted">{assinatura === null ? null : assinatura.playbookVersion}</td>
    </tr>
  )
}

function Trilha({ estado }: { readonly estado: EstadoDeGate }) {
  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.trilha.titulo}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.trilha.nota}</p>
      <div className="mt-2 overflow-x-auto border border-line">
        <table className="w-full text-base">
          <thead className="bg-surface-sunken">
            <tr className="h-7">
              {[t.trilha.colOQue, t.trilha.colResponsavel, t.trilha.colDecisao, t.trilha.colQuando].map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle"
                >
                  {c}
                </th>
              ))}
              <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-accent">
                {t.trilha.colVersao}
              </th>
            </tr>
          </thead>
          <tbody>
            {estado.trilha.map((item) => (
              <LinhaDaTrilha key={`${item.area}-${item.oQueAssina}`} item={item} />
            ))}
          </tbody>
        </table>
      </div>
      {estado.trilha
        .filter((i) => i.assinatura?.note != null)
        .map((i) => (
          <p key={i.oQueAssina} className="mt-1 text-2xs text-fg-muted">
            {i.assinatura?.note}
          </p>
        ))}
    </section>
  )
}

function Evidencias({ estado }: { readonly estado: EstadoDeGate }) {
  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.evidencia.titulo}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.evidencia.nota}</p>
      <ul className="mt-2 border border-line">
        {estado.evidencias.map((e) => (
          <li key={e.id} className="border-b border-line px-2 py-1.5 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm text-fg">
                  {e.disponivel ? (
                    <Check size={ICON} className="text-signed" aria-hidden="true" />
                  ) : (
                    <X size={ICON} className="text-held" aria-hidden="true" />
                  )}
                  {e.titulo}
                </p>
                <p className="mt-0.5 max-w-[85ch] text-2xs text-fg-muted">{e.descricao}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`text-2xs ${e.disponivel ? 'text-signed' : 'text-held'}`}>
                  {e.disponivel ? t.evidencia.disponivel : t.evidencia.indisponivel}
                </span>
                <Link
                  to={e.path}
                  className="flex items-center gap-1 text-2xs text-accent hover:underline"
                >
                  <ExternalLink size={11} aria-hidden="true" />
                  {t.evidencia.abrir}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Pendencias({ pendencias }: { readonly pendencias: readonly Pendencia[] }) {
  return (
    <section className="border border-line px-2 py-1.5">
      <h2 className="text-sm font-medium text-fg">{t.pendencias.titulo}</h2>
      {pendencias.length === 0 ? (
        <p className="mt-1 text-2xs text-signed">{t.pendencias.nenhuma}</p>
      ) : (
        <ul className="mt-1">
          {pendencias.map((p, i) => (
            <li key={`${p.tipo}-${p.detalhe}-${i}`} className="text-2xs text-fg-muted">
              <span className="tnum text-held">{p.quantidade}</span> {t.pendencias[p.tipo]}
              {strings.simbolos.separador}
              <span className="text-fg">{p.detalhe}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Acao({ estado }: { readonly estado: EstadoDeGate }) {
  const assinar = useSimulation((s) => s.assinarGate)
  const assinado = estado.artefatoAssinado
  const evidenciaCompleta = estado.evidencias.every((e) => e.disponivel)
  const podeAssinar = estado.entradaAdmitida && evidenciaCompleta && !assinado

  if (!estado.gate.assinaturaNoGate) {
    const destino = estado.evidencias[0]?.path ?? paths.missionControl
    return (
      <section className="border border-line px-2 py-1.5">
        {assinado ? (
          <p className="text-2xs text-fg-muted">
            {t.acao.assinadoPor}
            {strings.simbolos.doisPontos}
            <span className="text-fg">{estado.trilha.map((i) => i.responsavel?.nome ?? i.area).join(strings.simbolos.separador)}</span>
          </p>
        ) : (
          <p className="text-2xs text-fg-muted">{t.acao.noutraTela}</p>
        )}
        <Link
          to={destino}
          className="mt-1.5 flex w-fit items-center gap-1 text-2xs text-accent hover:underline"
        >
          <ExternalLink size={11} aria-hidden="true" />
          {t.acao.irAssinar}
        </Link>
      </section>
    )
  }

  return (
    <section className="border border-line px-2 py-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => assinar(estado.gate.id, 'approved')} disabled={!podeAssinar}>
          <FileSignature size={ICON} aria-hidden="true" />
          {t.acao.assinar}
        </Button>
        <Button variant="secondary" onClick={() => assinar(estado.gate.id, 'rejected')} disabled={!podeAssinar}>
          {t.acao.rejeitar}
        </Button>
      </div>
      {!estado.entradaAdmitida ? (
        <p className="mt-1.5 text-2xs text-exception">{t.acao.recusada}</p>
      ) : !evidenciaCompleta ? (
        <p className="mt-1.5 text-2xs text-held">{t.acao.evidenciaFalta}</p>
      ) : null}
    </section>
  )
}

function Detalhe({
  estado,
  onSelect,
}: {
  readonly estado: EstadoDeGate
  readonly onSelect: (id: GateId) => void
}) {
  const { gate } = estado
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="tnum text-md font-semibold text-accent">{gate.id}</span>
        <h2 className="text-lg font-medium text-fg">{gate.nome}</h2>
        <GateStatusBadge status={estado.status} />
      </div>
      <p className="mt-1 max-w-[85ch] text-sm text-fg-muted">{gate.descricao}</p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Recusa estado={estado} onSelect={onSelect} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-fg-subtle">{t.quandoOcorre}</dt>
            <dd className="text-fg">{gate.quandoOcorre}</dd>
            <dt className="text-fg-subtle">{t.oQueEAprovado}</dt>
            <dd className="text-fg">{gate.oQueEAprovado}</dd>
          </dl>
          <Trilha estado={estado} />
          <Evidencias estado={estado} />
        </div>

        <aside className="flex flex-col gap-3">
          <section className="border border-line px-2 py-1.5">
            <h2 className="text-sm font-medium text-fg">{t.artefatoLabel}</h2>
            <p className="mt-1 text-sm text-fg">
              <span className="tnum text-accent">{gate.artefato.id}</span>
              {strings.simbolos.separador}
              {gate.artefato.nome}
            </p>
            <p className="mt-1.5 text-2xs text-fg-subtle">
              {t.checkpointLabel}
              {strings.simbolos.doisPontos}
              <span className="text-fg-muted">
                {gate.checkpoint === null ? t.semCheckpoint : gate.checkpoint}
              </span>
            </p>
          </section>
          <Pendencias pendencias={estado.pendencias} />
          <Acao estado={estado} />
        </aside>
      </div>
    </div>
  )
}

/**
 * Gates como ponto de decisão. Três coisas fazem a tela não ser reunião de
 * status: a entrada recusada em cascata, a trilha com a versão do playbook, e o
 * fato de que nada aqui é escrito à mão — tudo sai do run e das assinaturas.
 */
export function GatesScreen() {
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const assinaturasDeGate = useSimulation((s) => s.assinaturasDeGate)
  const comercial = useSimulation((s) => s.flags.comercial)
  const reset = useSimulation((s) => s.reset)

  const run = runDeTodasSpes(playbookVersion, approvals)
  const estados = estadoDosGates({ run, approvals, playbookVersion, assinaturasDeGate })

  const [selecionado, setSelecionado] = useState<GateId>(
    () => estados.find((e) => !e.artefatoAssinado)?.gate.id ?? estados[0]!.gate.id,
  )
  const estado = estados.find((e) => e.gate.id === selecionado) ?? estados[0]!

  return (
    <div className="p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-fg">{t.title}</h1>
          <p className="mt-0.5 max-w-[85ch] text-sm text-fg-muted">{t.subtitle}</p>
          <div className="mt-1">
            <Resumo estados={estados} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {comercial ? (
            <Link to={paths.gatesPayment} className="text-2xs text-accent hover:underline">
              {t.paymentLink}
            </Link>
          ) : null}
          <Button variant="ghost" onClick={reset}>
            <RotateCcw size={ICON} aria-hidden="true" />
            {t.reset}
          </Button>
        </div>
      </header>

      <div className="mt-3">
        <Rail estados={estados} selecionado={selecionado} onSelect={setSelecionado} />
      </div>

      <Detalhe estado={estado} onSelect={setSelecionado} />
    </div>
  )
}
