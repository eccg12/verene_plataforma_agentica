import { useState } from 'react'

import { Check, CircleSlash, FileCode2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { strings } from '@/copy/strings'
import {
  calendarioAcordado,
  destinatarioDaCarga,
  simulacaoPorObjeto,
  type EstadoSimulacao,
} from '@/data/delivery'
import { packageStates, type PackageState } from '@/data/packages'
import { cycleById, cycles, speIds } from '@/data/scope'
import {
  conferirConformidade,
  dividirPacote,
  gerarXml,
  pacotesPorObjeto,
  type ResultadoConformidade,
} from '@/engine/package-builder'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.packages
const PREVIEW = 3

const ESTADO_COR: Record<PackageState, string> = {
  'nao-iniciado': 'text-fg-subtle',
  'em-processamento': 'text-accent',
  retido: 'text-held',
  'aguardando-gate': 'text-pending-gate',
  aprovado: 'text-signed',
}

const SIM_COR: Record<EstadoSimulacao, string> = {
  aprovada: 'text-signed',
  reprovada: 'text-exception',
  'nao-executada': 'text-fg-subtle',
}

const CONF_COR: Record<ResultadoConformidade, string> = {
  ok: 'text-signed',
  falha: 'text-exception',
  'nao-verificado': 'text-fg-subtle',
}

export function PackagesScreen() {
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const [objetoId, setObjetoId] = useState('fornecedores')

  const run = runDeTodasSpes(playbookVersion, approvals)
  const objeto = pacotesPorObjeto.find((p) => p.objetoId === objetoId) ?? pacotesPorObjeto[0]
  const xml = gerarXml(run, PREVIEW)
  const conformidade = conferirConformidade(run)
  const divisao = dividirPacote(objetoId, objeto?.volume ?? 0, xml.bytesPorRegistro)
  const simulacao = simulacaoPorObjeto.get(objetoId)
  const manifest = run.loadPackage?.manifest
  const excecoes = run.exceptions

  return (
    <Surface surface="paper" className="min-h-full">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>
        </header>

        {/* ---------- lista por objeto e SPE ---------- */}
        <section>
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-base">
              <thead className="bg-surface-sunken">
                <tr className="h-7">
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colObjeto}</th>
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colSpe}</th>
                  <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colVolume}</th>
                  {cycles.map((c) => (
                    <th key={c} scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                      {cycleById[c].nome}
                    </th>
                  ))}
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colSimulacao}</th>
                </tr>
              </thead>
              <tbody>
                {pacotesPorObjeto.flatMap((p) =>
                  speIds.map((spe, i) => {
                    const sim = simulacaoPorObjeto.get(p.objetoId)
                    const pacote = (ciclo: string) => p.porSpe.find((x) => x.spe === spe && x.ciclo === ciclo)
                    return (
                      <tr
                        key={`${p.objetoId}-${spe}`}
                        className={`h-7 border-t border-line ${p.objetoId === objetoId ? 'bg-surface-sunken' : ''}`}
                      >
                        {i === 0 ? (
                          <td rowSpan={speIds.length} className="border-r border-line px-2 align-top">
                            <button
                              type="button"
                              onClick={() => setObjetoId(p.objetoId)}
                              className={p.objetoId === objetoId ? 'font-medium text-accent' : 'text-fg hover:text-accent'}
                            >
                              {p.nome}
                            </button>
                          </td>
                        ) : null}
                        <td className="px-2 text-fg-muted">{spe}</td>
                        <td className="px-2 text-right tnum text-fg">
                          {(pacote('ciclo-1')?.registros ?? 0).toLocaleString('pt-BR')}
                        </td>
                        {cycles.map((c) => {
                          const estado = pacote(c)?.estado ?? 'nao-iniciado'
                          return (
                            <td key={c} className={`px-2 text-xs ${ESTADO_COR[estado]}`}>
                              {strings.packageStates[estado]}
                            </td>
                          )
                        })}
                        {i === 0 ? (
                          <td rowSpan={speIds.length} className="border-l border-line px-2 align-top">
                            <span className={`text-xs ${SIM_COR[sim?.estado ?? 'nao-executada']}`}>
                              {t.simulacao[sim?.estado ?? 'nao-executada']}
                            </span>
                          </td>
                        ) : null}
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {packageStates.map((e) => (
              <span key={e} className={`text-2xs ${ESTADO_COR[e]}`}>
                {strings.packageStates[e]}
              </span>
            ))}
          </div>
        </section>

        <h2 className="text-md font-medium text-fg">
          {t.detalheLabel}
          {strings.simbolos.doisPontos}
          <span className="text-accent">{objeto?.nome}</span>
        </h2>

        {/* ---------- simulação ---------- */}
        {simulacao ? (
          <section className={`border ${simulacao.estado === 'aprovada' ? 'border-signed' : simulacao.estado === 'reprovada' ? 'border-exception' : 'border-line'} bg-surface-raised`}>
            <div className="flex flex-wrap items-baseline gap-3 border-b border-line px-3 py-2">
              <h3 className="text-base font-medium text-fg">{t.simulacao.titulo}</h3>
              <span className={`text-xs font-medium ${SIM_COR[simulacao.estado]}`}>
                {t.simulacao[simulacao.estado]}
              </span>
              {simulacao.executadaEm ? (
                <span className="tnum text-2xs text-fg-subtle">
                  {t.simulacao.executadaEm}
                  {strings.simbolos.doisPontos}
                  {simulacao.executadaEm}
                </span>
              ) : null}
              <span className="tnum text-2xs text-fg-subtle">
                {simulacao.registrosSimulados.toLocaleString('pt-BR')} {t.simulacao.registrosSimulados}
              </span>
              <span className={`ml-auto text-xs font-medium ${simulacao.estado === 'aprovada' ? 'text-signed' : 'text-exception'}`}>
                {simulacao.estado === 'aprovada' ? t.simulacao.liberado : t.simulacao.naoLiberado}
              </span>
            </div>
            <ul className="px-3 py-2">
              {simulacao.mensagens.map((m) => (
                <li key={m} className="text-sm text-fg-muted">
                  {m}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-2">
          {/* ---------- XML ---------- */}
          <section className="border border-line bg-surface-raised">
            <div className="flex flex-wrap items-baseline gap-2 border-b border-line px-3 py-2">
              <FileCode2 size={ICON} className="shrink-0 text-accent" aria-hidden="true" />
              <h3 className="text-base font-medium text-fg">{t.xml.titulo}</h3>
              <span className="tnum text-2xs text-fg-subtle">
                {PREVIEW} {t.xml.registrosNoPreview}
              </span>
              <span className="tnum text-2xs text-fg-subtle">
                {xml.bytesPorRegistro} {t.xml.bytesPorRegistro}
              </span>
            </div>
            <p className="border-b border-line px-3 py-1.5 text-sm text-fg-muted">{t.xml.nota}</p>
            <pre className="max-h-80 overflow-auto bg-surface-sunken px-3 py-2 font-mono text-2xs leading-relaxed text-fg">
              {xml.texto}
            </pre>
          </section>

          {/* ---------- conformidade ---------- */}
          <section className="border border-line bg-surface-raised">
            <div className="border-b border-line px-3 py-2">
              <h3 className="text-base font-medium text-fg">{t.conformidade.titulo}</h3>
              <p className="text-sm text-fg-muted">{t.conformidade.nota}</p>
            </div>
            <ul>
              {conformidade.map((c) => (
                <li key={c.id} className="border-b border-line px-3 py-2 last:border-b-0">
                  <p className="flex items-baseline gap-2">
                    {c.resultado === 'ok' ? (
                      <Check size={ICON} className="shrink-0 text-signed" aria-hidden="true" />
                    ) : c.resultado === 'falha' ? (
                      <TriangleAlert size={ICON} className="shrink-0 text-exception" aria-hidden="true" />
                    ) : (
                      <CircleSlash size={ICON} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium text-fg">{c.nome}</span>
                    <span className={`ml-auto text-2xs ${CONF_COR[c.resultado]}`}>
                      {c.resultado === 'ok'
                        ? t.conformidade.ok
                        : c.resultado === 'falha'
                          ? t.conformidade.falha
                          : t.conformidade.naoVerificado}
                    </span>
                  </p>
                  <p className="mt-0.5 text-2xs text-fg-subtle">{c.descricao}</p>
                  <p className="text-2xs text-fg-muted">{c.detalhe}</p>
                  {c.registrosAfetados.length > 0 ? (
                    <p className="mt-0.5 font-mono text-2xs text-exception">
                      {c.registrosAfetados.slice(0, 6).join(strings.simbolos.separador)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {/* ---------- divisão ---------- */}
          <section className="border border-line bg-surface-raised">
            <div className="border-b border-line px-3 py-2">
              <h3 className="text-base font-medium text-fg">{t.split.titulo}</h3>
              <p className="text-sm text-fg-muted">{t.split.nota}</p>
              <p className="mt-0.5 text-2xs text-accent">
                {divisao.limitante === 'tamanho'
                  ? t.split.limitanteTamanho
                  : divisao.limitante === 'registros'
                    ? t.split.limitanteRegistros
                    : t.split.limitanteNenhum}
              </p>
            </div>
            <table className="w-full text-base">
              <thead className="bg-surface-sunken">
                <tr className="h-6">
                  <th scope="col" className="px-3 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.split.colParte}</th>
                  <th scope="col" className="px-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.split.colRegistros}</th>
                  <th scope="col" className="px-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.split.colTamanho}</th>
                  <th scope="col" className="px-3 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.split.colChecksum}</th>
                </tr>
              </thead>
              <tbody>
                {divisao.partes.map((parte) => (
                  <tr key={parte.indice} className="h-7 border-t border-line">
                    <td className="px-3 font-mono text-2xs text-fg">{parte.nomeArquivo}</td>
                    <td className="px-3 text-right tnum text-fg-muted">{parte.registros}</td>
                    <td className="px-3 text-right tnum text-fg-muted">{parte.megabytes}</td>
                    <td className="px-3 font-mono text-2xs text-fg-subtle">{parte.checksum}</td>
                  </tr>
                ))}
                <tr className="h-7 border-t border-line-strong">
                  <td className="px-3 text-2xs uppercase tracking-wider text-fg-subtle">{t.split.totalLabel}</td>
                  <td className="px-3 text-right tnum text-fg">{divisao.registrosTotais.toLocaleString('pt-BR')}</td>
                  <td className="px-3 text-right tnum text-fg">{divisao.megabytesTotais}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </section>

          {/* ---------- manifest ---------- */}
          <section className="border border-accent bg-surface-raised">
            <div className="border-b border-line px-3 py-2">
              <h3 className="text-base font-medium text-fg">{t.manifest.titulo}</h3>
            </div>
            {manifest ? (
              <dl className="px-3 py-2">
                {[
                  { k: t.manifest.playbookVersion, v: manifest.playbookVersion, destaque: true },
                  { k: t.manifest.playbookChecksum, v: manifest.playbookChecksum, destaque: true },
                  { k: t.manifest.datasetChecksum, v: manifest.datasetChecksum, destaque: false },
                  { k: t.manifest.total, v: String(manifest.total), destaque: false },
                  { k: t.manifest.geradoEm, v: manifest.geradoEm, destaque: false },
                ].map((linha) => (
                  <div key={linha.k} className="flex gap-2 border-t border-line py-1 first:border-t-0">
                    <dt className="w-44 shrink-0 text-2xs uppercase tracking-wider text-fg-subtle">{linha.k}</dt>
                    <dd className={`font-mono text-xs ${linha.destaque ? 'text-accent' : 'text-fg'}`}>{linha.v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-3 py-2 text-sm text-fg-subtle">{t.conformidade.naoVerificado}</p>
            )}
            <div className="border-t border-line px-3 py-2">
              <p className="text-sm text-fg-muted">{t.manifest.laco}</p>
              <Link to={paths.playbook}>
                <Button variant="secondary" className="mt-1.5">
                  {t.manifest.verPlaybook}
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* ---------- entrega formal ---------- */}
        <section className="border border-line bg-surface-raised">
          <div className="border-b border-line px-3 py-2">
            <h3 className="text-base font-medium text-fg">{t.entrega.titulo}</h3>
            <p className="max-w-[80ch] text-sm text-fg-muted">{t.entrega.nota}</p>
          </div>
          <div className="grid gap-3 px-3 py-2 lg:grid-cols-2">
            <div>
              <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.entrega.destinatario}</p>
              <p className="text-xs text-fg">{destinatarioDaCarga.responsavel}</p>
              <p className="text-2xs text-fg-subtle">{destinatarioDaCarga.papel}</p>

              <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.entrega.escopo}</p>
              <p className="tnum text-xs text-fg">
                {(objeto?.volume ?? 0).toLocaleString('pt-BR')} {t.entrega.registros}
                {strings.simbolos.separador}
                {objeto?.objetosTenant.length ?? 0} {t.entrega.objetos}
              </p>
              <p className="text-2xs text-fg-subtle">
                {(objeto?.objetosTenant ?? []).map((o) => strings.migrationObjects[o]).join(strings.simbolos.separador)}
              </p>

              <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.entrega.versao}</p>
              <p className="font-mono text-xs text-accent">{playbookVersion}</p>
            </div>

            <div>
              <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.entrega.excecoes}</p>
              {excecoes.length === 0 ? (
                <p className="text-sm text-fg-subtle">{t.entrega.semExcecoes}</p>
              ) : (
                <ul className="mt-0.5 max-h-40 overflow-y-auto">
                  {[...new Set(excecoes.map((e) => `${e.defectTypeId}|${e.nome}|${e.roteadoPara}`))].map((chave) => {
                    const [id, nome, dono] = chave.split('|')
                    const quantidade = excecoes.filter((e) => e.defectTypeId === id).length
                    return (
                      <li key={chave} className="flex gap-2 border-t border-line py-0.5 first:border-t-0">
                        <span className="tnum w-6 shrink-0 text-right text-2xs text-held">{quantidade}</span>
                        <span className="min-w-0">
                          <span className="block text-2xs text-fg">{nome}</span>
                          <span className="block text-2xs text-fg-subtle">{dono}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}

              <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.entrega.calendario}</p>
              <ul className="mt-0.5">
                {calendarioAcordado.map((janela) => (
                  <li key={janela.ciclo} className="border-t border-line py-1 first:border-t-0">
                    <p className="flex items-baseline gap-2">
                      <span className="text-xs text-fg">{janela.nome}</span>
                      <span className="tnum ml-auto text-2xs text-fg-muted">
                        {janela.inicio}
                        {strings.simbolos.intervalo}
                        {janela.fim}
                      </span>
                    </p>
                    <p className="text-2xs text-fg-subtle">{janela.observacao}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </Surface>
  )
}
