import { Check, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { strings } from '@/copy/strings'
import { verificacoesFiori } from '@/data/fiori-checks'
import { gateById } from '@/data/gates'
import type { DefectOriginId } from '@/data/defect-taxonomy'
import {
  contagemPorSpe,
  contagemTotal,
  detalhePorOrigem,
  placarDeAceite,
  registroDeDefeitos,
  valorPorSpe,
  type LinhaContagem,
  type LinhaValor,
} from '@/engine/reconciliation'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.reconciliation

const brl = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

/** Cor da origem, na escala categórica do design system. */
const ORIGEM_TEXTO: Record<DefectOriginId, string> = {
  'source-extract': 'text-defect-source',
  transformation: 'text-defect-transformation',
  'target-config': 'text-defect-target-config',
  'load-execution': 'text-defect-load',
}
const ORIGEM_FUNDO: Record<DefectOriginId, string> = {
  'source-extract': 'bg-defect-source',
  transformation: 'bg-defect-transformation',
  'target-config': 'bg-defect-target-config',
  'load-execution': 'bg-defect-load',
}

function TabelaContagem({ linhas, total }: { readonly linhas: readonly LinhaContagem[]; readonly total: LinhaContagem }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-base">
        <thead className="bg-surface-sunken">
          <tr className="h-7">
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colChave}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colOrigem}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colDestino}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colDiferenca}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-accent">{t.colExplicacao}</th>
          </tr>
        </thead>
        <tbody>
          {[...linhas, total].map((linha) => (
            <tr key={linha.chave} className={`border-t align-top ${linha.chave === 'total' ? 'border-line-strong bg-surface-sunken' : 'border-line'}`}>
              <td className="px-2 py-1.5 text-fg">{linha.rotulo}</td>
              <td className="px-2 py-1.5 text-right tnum text-fg">{linha.origem}</td>
              <td className="px-2 py-1.5 text-right tnum text-fg">{linha.destino}</td>
              <td className={`px-2 py-1.5 text-right tnum ${linha.diferenca === 0 ? 'text-fg-subtle' : 'text-held'}`}>
                {linha.diferenca}
              </td>
              <td className="px-2 py-1.5">
                {linha.explicacao.length === 0 ? (
                  <span className="text-2xs text-fg-subtle">{t.semDiferenca}</span>
                ) : (
                  <ul>
                    {linha.explicacao.map((e) => (
                      <li key={e.causa} className="text-2xs text-fg-muted">
                        <span className="tnum text-fg">{e.quantidade}</span> {e.causa}
                      </li>
                    ))}
                  </ul>
                )}
                <span className={`mt-0.5 block text-2xs ${linha.fecha ? 'text-signed' : 'text-exception'}`}>
                  {linha.fecha ? t.fecha : t.naoFecha}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabelaValor({ linhas }: { readonly linhas: readonly LinhaValor[] }) {
  const totalOrigem = linhas.reduce((a, l) => a + l.origem, 0)
  const totalDestino = linhas.reduce((a, l) => a + l.destino, 0)
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-base">
        <thead className="bg-surface-sunken">
          <tr className="h-7">
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colChave}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colOrigem}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colDestino}</th>
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colDiferenca}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-accent">{t.colExplicacao}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.chave} className="border-t border-line align-top">
              <td className="px-2 py-1.5 text-fg">{linha.rotulo}</td>
              <td className="px-2 py-1.5 text-right tnum text-fg">{brl(linha.origem)}</td>
              <td className="px-2 py-1.5 text-right tnum text-fg">{brl(linha.destino)}</td>
              <td className={`px-2 py-1.5 text-right tnum ${linha.diferenca === 0 ? 'text-fg-subtle' : 'text-held'}`}>
                {brl(linha.diferenca)}
              </td>
              <td className="px-2 py-1.5">
                {linha.explicacao.length === 0 ? (
                  <span className="text-2xs text-fg-subtle">{t.semDiferenca}</span>
                ) : (
                  <ul>
                    {linha.explicacao.map((e) => (
                      <li key={e.causa} className="text-2xs text-fg-muted">
                        <span className="tnum text-fg">{brl(e.valor)}</span> {strings.simbolos.separador}
                        {e.causa}
                      </li>
                    ))}
                  </ul>
                )}
                <span className={`mt-0.5 block text-2xs ${linha.fecha ? 'text-signed' : 'text-exception'}`}>
                  {linha.fecha ? t.fecha : t.naoFecha}
                </span>
              </td>
            </tr>
          ))}
          <tr className="border-t border-line-strong bg-surface-sunken">
            <td className="px-2 py-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{t.colChave}</td>
            <td className="px-2 py-1.5 text-right tnum text-fg">{brl(totalOrigem)}</td>
            <td className="px-2 py-1.5 text-right tnum text-fg">{brl(totalDestino)}</td>
            <td className="px-2 py-1.5 text-right tnum text-held">{brl(totalDestino - totalOrigem)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function ReconciliationScreen() {
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const verificacoes = useSimulation((s) => s.verificacoesFiori)
  const registrar = useSimulation((s) => s.registrarVerificacaoFiori)

  const run = runDeTodasSpes(playbookVersion, approvals)
  const registro = registroDeDefeitos(run)
  const placar = placarDeAceite(run)
  const daMonoda = registro.find((r) => r.monodaResponsavel)
  const deTerceiros = registro.filter((r) => !r.monodaResponsavel)
  const totalTerceiros = deTerceiros.reduce((a, r) => a + r.total, 0)

  return (
    <Surface surface="ink" className="min-h-full">
      <div className="flex flex-col gap-5 px-5 py-4">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>
        </header>

        {/* ---------- placar ---------- */}
        <section>
          <h2 className="text-md font-medium text-fg">{t.placar.titulo}</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.placar.nota}</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
            {placar.map((r) => (
              <article
                key={r.criterio.id}
                className={`border bg-surface-raised p-3 ${!r.mensurável ? 'border-line' : r.atende ? 'border-signed' : 'border-exception'}`}
              >
                <p className="flex items-baseline gap-2">
                  <span className="rounded-sm border border-line-strong px-1.5 py-0.5 font-mono text-2xs text-accent">
                    {r.gate}
                  </span>
                  <span className="ml-auto text-2xs text-fg-subtle">{gateById[r.gate].nome}</span>
                </p>
                <h3 className="mt-1.5 text-sm font-medium text-fg">{r.criterio.nome}</h3>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className={`tnum text-xl font-medium ${!r.mensurável ? 'text-fg-subtle' : r.atende ? 'text-signed' : 'text-exception'}`}>
                    {r.medido}
                  </span>
                  <span className="text-2xs text-fg-subtle">
                    {t.placar.colAlvo}
                    {strings.simbolos.doisPontos}
                    {r.criterio.tipo === 'percentual-minimo' ? '≥' : '≤'} {r.alvo} {r.criterio.unidade}
                  </span>
                </p>
                <p className={`text-2xs font-medium ${!r.mensurável ? 'text-fg-subtle' : r.atende ? 'text-signed' : 'text-exception'}`}>
                  {!r.mensurável ? t.placar.naoMensuravel : r.atende ? t.placar.atende : t.placar.naoAtende}
                </p>
                <p className="mt-1.5 border-t border-line pt-1 text-2xs text-fg-subtle">
                  {r.mensurável ? r.comoMedido : t.placar.naoMensuravelNota}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- registro de defeitos ---------- */}
        <section>
          <h2 className="text-md font-medium text-fg">{t.registro.titulo}</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.registro.nota}</p>

          <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="border border-defect-transformation bg-surface-raised p-3">
              <p className="flex items-center gap-1.5">
                <span className={`size-2.5 shrink-0 rounded-[2px] ${ORIGEM_FUNDO.transformation}`} aria-hidden="true" />
                <span className="text-2xs uppercase tracking-wider text-defect-transformation">{t.registro.monoda}</span>
              </p>
              <p className="mt-1.5 tnum text-2xl font-medium text-fg">{daMonoda?.total ?? 0}</p>
              <p className="text-xs text-fg-muted">{daMonoda?.nome}</p>
              <dl className="mt-2 border-t border-line pt-1.5 text-2xs">
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">{t.registro.colCriticos}</dt>
                  <dd className={`tnum ${(daMonoda?.criticos ?? 0) > 0 ? 'text-exception' : 'text-signed'}`}>
                    {daMonoda?.criticos ?? 0}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">{t.registro.colNaoCriticos}</dt>
                  <dd className="tnum text-fg">{daMonoda?.naoCriticos ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">{t.registro.colPercentual}</dt>
                  <dd className="tnum text-fg">{daMonoda?.percentual ?? 0}{strings.simbolos.porcento}</dd>
                </div>
              </dl>
            </div>

            <div className="border border-line bg-surface-raised p-3">
              <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.registro.outros}</p>
              <p className="mt-1.5 tnum text-2xl font-medium text-fg">{totalTerceiros}</p>
              <ul className="mt-2 border-t border-line pt-1.5">
                {deTerceiros.map((r) => (
                  <li key={r.origin} className="flex items-baseline gap-2 border-t border-line py-1 first:border-t-0">
                    <span className={`size-2 shrink-0 rounded-[1px] ${ORIGEM_FUNDO[r.origin]}`} aria-hidden="true" />
                    <span className={`text-xs ${ORIGEM_TEXTO[r.origin]}`}>{r.nome}</span>
                    <span className="ml-auto tnum text-xs text-fg">{r.total}</span>
                    <span className="tnum w-10 text-right text-2xs text-held">{r.criticos}</span>
                    <span className="w-40 shrink-0 text-right text-2xs text-fg-subtle">{r.donoContratual}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto border border-line">
            <table className="w-full text-base">
              <thead className="bg-surface-sunken">
                <tr className="h-7">
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.registro.colOrigem}</th>
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.registro.detalhe}</th>
                  <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.registro.colTotal}</th>
                  <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.registro.colCriticos}</th>
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.registro.colDono}</th>
                </tr>
              </thead>
              <tbody>
                {registro.map((r) => {
                  const tipos = detalhePorOrigem(run, r.origin)
                  return (
                    <tr key={r.origin} className="border-t border-line align-top">
                      <td className="px-2 py-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`size-2 shrink-0 rounded-[1px] ${ORIGEM_FUNDO[r.origin]}`} aria-hidden="true" />
                          <span className={`text-xs ${ORIGEM_TEXTO[r.origin]}`}>{r.nome}</span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        {tipos.length === 0 ? (
                          <span className="text-2xs text-fg-subtle">{t.registro.semDefeito}</span>
                        ) : (
                          <ul>
                            {tipos.map((tipo) => (
                              <li key={tipo.defectTypeId} className="text-2xs text-fg-muted">
                                <span className="tnum text-fg">{tipo.quantidade}</span> {tipo.nome}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right tnum text-fg">{r.total}</td>
                      <td className={`px-2 py-1.5 text-right tnum ${r.criticos > 0 ? 'text-held' : 'text-fg-subtle'}`}>{r.criticos}</td>
                      <td className="px-2 py-1.5 text-2xs text-fg-muted">
                        {r.donoContratual}
                        {r.monodaResponsavel ? (
                          <span className="mt-0.5 block text-defect-transformation">{t.registro.monoda}</span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- contagem ---------- */}
        <section>
          <h2 className="text-md font-medium text-fg">{t.porContagem}</h2>
          <div className="mt-2">
            <TabelaContagem linhas={contagemPorSpe(run)} total={contagemTotal(run)} />
          </div>
        </section>

        {/* ---------- valor ---------- */}
        <section>
          <h2 className="text-md font-medium text-fg">{t.porValor}</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.valorNota}</p>
          <div className="mt-2">
            <TabelaValor linhas={valorPorSpe()} />
          </div>
        </section>

        {/* ---------- Fiori ---------- */}
        <section>
          <h2 className="text-md font-medium text-fg">{t.fiori.titulo}</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.fiori.nota}</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {verificacoesFiori.map((v) => {
              const assinatura = verificacoes[v.id] ?? null
              return (
                <article key={v.id} className={`border bg-surface-raised ${assinatura ? 'border-signed' : 'border-line'}`}>
                  <div className="flex flex-wrap items-baseline gap-2 border-b border-line px-3 py-2">
                    <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.fiori.app}</span>
                    <span className="text-xs font-medium text-fg">{v.app}</span>
                    <span className="font-mono text-2xs text-fg-subtle">{v.appId}</span>
                    <span className="ml-auto rounded-sm border border-line-strong px-1.5 py-0.5 font-mono text-2xs text-accent">
                      {t.fiori.gateLabel} {v.gate}
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.fiori.registroExemplo}</p>
                    <Link to={`${paths.recordBase}/${v.registroExemplo}`} className="font-mono text-xs text-accent">
                      {v.registroExemplo}
                    </Link>

                    <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.fiori.passos}</p>
                    <ol className="mt-0.5">
                      {v.passos.map((passo) => (
                        <li key={passo.ordem} className="flex gap-2 border-t border-line py-1 first:border-t-0">
                          <span className="tnum w-4 shrink-0 text-2xs text-fg-subtle">{passo.ordem}</span>
                          <span className="min-w-0">
                            <span className="block text-2xs text-fg-muted">{passo.instrucao}</span>
                            <span className="block font-mono text-2xs text-fg-subtle">{passo.campo}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex items-center gap-2 border-t border-line px-3 py-2">
                    {assinatura ? (
                      <>
                        <ShieldCheck size={ICON} className="shrink-0 text-signed" aria-hidden="true" />
                        <span className="text-xs text-signed">{t.fiori.verificado}</span>
                        <span className="text-2xs text-fg-subtle">
                          {t.fiori.verificadoPor}
                          {strings.simbolos.doisPontos}
                          {assinatura.by}
                        </span>
                      </>
                    ) : (
                      <>
                        <X size={ICON} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                        <span className="text-xs text-fg-subtle">{t.fiori.pendente}</span>
                      </>
                    )}
                    <Button
                      variant={assinatura ? 'secondary' : 'primary'}
                      className="ml-auto"
                      onClick={() => registrar(v.id)}
                      disabled={assinatura !== null}
                    >
                      <Check size={ICON} aria-hidden="true" />
                      {t.fiori.marcarVerificado}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
          <Link to={paths.playbook} className="mt-2 inline-block">
            <Button variant="ghost">
              <ExternalLink size={ICON} aria-hidden="true" />
              {strings.packages.manifest.verPlaybook}
            </Button>
          </Link>
        </section>
      </div>
    </Surface>
  )
}
