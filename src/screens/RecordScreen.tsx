import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { paths } from '@/app/paths'
import { horaBr } from '@/copy/format'
import { strings } from '@/copy/strings'
import { nasajonContracts } from '@/data/source/nasajon-contracts'
import { runContractLine, type ContractLineResult } from '@/engine/contract-pipeline'
import { pipelineSteps, type ExceptionRecord, type StepId, type TrailEntry } from '@/engine/pipeline'
import { CASO_FORNECEDOR, CASO_LINHA_CONTRATO } from '@/data/record-cases'
import { useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.record

export { CASO_FORNECEDOR, CASO_LINHA_CONTRATO } from '@/data/record-cases'



function Timeline({
  trail,
  bloqueados,
}: {
  readonly trail: readonly TrailEntry[]
  readonly bloqueados: ReadonlySet<StepId>
}) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {pipelineSteps.map((passo) => {
        const doPasso = trail.filter((e) => e.step === passo.id)
        const bloqueado = bloqueados.has(passo.id)
        const cor = bloqueado
          ? 'border-held text-held'
          : doPasso.length > 0
            ? 'border-signed text-signed'
            : 'border-line text-fg-subtle'
        return (
          <li key={passo.id} className={`min-w-28 flex-1 border-t-2 pt-1.5 ${cor}`}>
            <p className="flex items-baseline gap-1.5">
              <span className="tnum text-2xs text-fg-subtle">{passo.n}</span>
              <span className="text-xs font-medium text-fg">{passo.nome}</span>
            </p>
            <p className="text-2xs text-fg-subtle">{passo.agent}</p>
            <p className="tnum text-2xs">
              {doPasso.length > 0 ? (
                <span className="text-fg-muted">
                  {doPasso.length} {t.aplicacoes}
                </span>
              ) : (
                <span className="text-fg-subtle">{doPasso.length}</span>
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function TrilhaCampoACampo({ trail }: { readonly trail: readonly TrailEntry[] }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-base">
        <thead className="bg-surface-sunken">
          <tr className="h-7">
            <th scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colSeq}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colPasso}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colAgente}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colCampo}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colAntes}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colDepois}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-accent">{t.colRegra}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colVersao}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colInstante}</th>
            <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{t.colNota}</th>
          </tr>
        </thead>
        <tbody>
          {trail.map((e) => (
            <tr key={e.seq} className="border-t border-line align-top hover:bg-surface-raised">
              <td className="px-2 py-1 text-right tnum text-2xs text-fg-subtle">{e.seq}</td>
              <td className="px-2 py-1 text-2xs text-fg-muted">{strings.stepNames[e.step]}</td>
              <td className="px-2 py-1 text-2xs text-fg-muted">{e.agent}</td>
              <td className="px-2 py-1 font-mono text-2xs text-fg">{e.field}</td>
              <td className="px-2 py-1 font-mono text-2xs text-fg-subtle">
                {e.before === null ? <span className="italic">{t.vazio}</span> : e.before}
              </td>
              <td className="px-2 py-1 font-mono text-2xs text-fg">
                <span className="inline-flex items-center gap-1">
                  <ArrowRight size={10} className="shrink-0 text-fg-subtle" aria-hidden="true" />
                  {e.after === null ? <span className="italic text-fg-subtle">{t.vazio}</span> : e.after}
                </span>
              </td>
              <td className="px-2 py-1">
                <Link
                  to={paths.playbook}
                  title={t.verNoPlaybook}
                  className="font-mono text-2xs text-accent hover:text-accent-hover"
                >
                  {e.ruleId}
                </Link>
              </td>
              <td className="px-2 py-1 tnum text-2xs text-fg-subtle">{e.playbookVersion}</td>
              <td className="px-2 py-1 tnum text-2xs text-fg-subtle">{horaBr(e.at)}</td>
              <td className="px-2 py-1 text-2xs text-fg-subtle">{e.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Excecoes({ excecoes }: { readonly excecoes: readonly ExceptionRecord[] }) {
  if (excecoes.length === 0) return null
  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.excecoes}</h2>
      <ul className="mt-2 grid gap-2 lg:grid-cols-2">
        {excecoes.map((e) => (
          <li key={e.id} className="border-l-2 border-held bg-held-bg px-3 py-2">
            <p className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-held">{e.nome}</span>
              <span className="ml-auto font-mono text-2xs text-fg-subtle">{e.ruleId}</span>
            </p>
            <p className="mt-0.5 text-sm text-fg-muted">{e.mensagem}</p>
            <p className="mt-1 text-2xs text-fg-subtle">{e.roteadoPara}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ParDeValores({
  rotulo,
  itens,
}: {
  readonly rotulo: string
  readonly itens: readonly { readonly chave: string; readonly valor: string }[]
}) {
  return (
    <div className="min-w-0 flex-1 border border-line bg-surface-raised p-3">
      <h3 className="text-2xs uppercase tracking-wider text-fg-subtle">{rotulo}</h3>
      <dl className="mt-1.5">
        {itens.map((i) => (
          <div key={i.chave} className="flex gap-2 border-t border-line py-0.5 first:border-t-0">
            <dt className="w-40 shrink-0 font-mono text-2xs text-fg-subtle">{i.chave}</dt>
            <dd className="min-w-0 break-words font-mono text-2xs text-fg">{i.valor || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function CasoLinhaContrato({ resultado }: { readonly resultado: ContractLineResult }) {
  const { contrato, linha, trail, target } = resultado
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <ParDeValores
          rotulo={t.origem}
          itens={[
            { chave: 'contrato', valor: contrato.numero },
            { chave: 'spe', valor: contrato.spe },
            { chave: 'item', valor: String(linha.item) },
            { chave: 'descricao', valor: linha.descricao },
            { chave: 'unidadeMedida', valor: linha.unidadeMedida },
            { chave: 'quantidade', valor: String(linha.quantidade) },
            { chave: 'precoUnitario', valor: String(linha.precoUnitario) },
            { chave: 'valorTotal', valor: String(linha.valorTotal) },
            { chave: 'centroCusto', valor: linha.centroCusto },
            { chave: 'faseFiscal', valor: contrato.faseFiscal },
          ]}
        />
        {target ? (
          <ParDeValores
            rotulo={t.destino}
            itens={Object.entries(target).map(([chave, valor]) => ({
              chave,
              valor: valor === null ? '' : String(valor),
            }))}
          />
        ) : (
          <div className="min-w-0 flex-1 border border-held bg-held-bg p-3">
            <h3 className="text-2xs uppercase tracking-wider text-held">{t.destino}</h3>
            <p className="mt-1 text-sm text-held">{t.semDestino}</p>
          </div>
        )}
      </div>
      <Excecoes excecoes={resultado.exceptions} />
      <section>
        <h2 className="text-md font-medium text-fg">{t.timeline}</h2>
        <div className="mt-2">
          <Timeline trail={trail} bloqueados={new Set()} />
        </div>
      </section>
      <section data-cena="trilha">
        <div className="flex items-baseline gap-3">
          <h2 className="text-md font-medium text-fg">{t.trilha}</h2>
          <span className="tnum text-xs text-fg-subtle">
            {trail.length} {t.aplicacoes}
          </span>
          <span className="tnum text-xs text-fg-subtle">
            {new Set(trail.map((e) => e.field)).size} {t.camposTocados}
          </span>
        </div>
        <div className="mt-2">
          <TrilhaCampoACampo trail={trail} />
        </div>
      </section>
    </>
  )
}

export function RecordScreen() {
  const { id } = useParams()
  const run = useSimulation((s) => s.run)
  const codigo = id ?? CASO_FORNECEDOR

  const contrato = nasajonContracts.find((c) => c.numero === codigo.split('~')[0])
  const itemNumero = Number(codigo.split('~')[1] ?? '0')
  const linha = contrato?.linhas.find((l) => l.item === itemNumero)
  const resultadoContrato = contrato && linha ? runContractLine(contrato, linha) : null

  const registro = run.records.find((r) => r.codigo === codigo)
  const bloqueados = new Set(
    run.steps.filter((s) => s.status !== 'completed').map((s) => s.id),
  )

  return (
    <Surface surface="ink" className="min-h-full">
      <div className="flex flex-col gap-5 px-5 py-4">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.casosLabel}</span>
            <Link to={`${paths.recordBase}/${CASO_FORNECEDOR}`}>
              <Button variant={codigo === CASO_FORNECEDOR ? 'primary' : 'secondary'}>
                {t.casoFornecedor}
              </Button>
            </Link>
            <Link to={`${paths.recordBase}/${CASO_LINHA_CONTRATO}`}>
              <Button variant={codigo === CASO_LINHA_CONTRATO ? 'primary' : 'secondary'}>
                {t.casoLinhaContrato}
              </Button>
            </Link>
            <span className="ml-2 font-mono text-xs text-accent">{codigo}</span>
          </div>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.casoNota}</p>
        </header>

        {resultadoContrato ? (
          <CasoLinhaContrato resultado={resultadoContrato} />
        ) : registro ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm border border-line-strong px-2 py-0.5 text-xs text-fg">
                {strings.outcomes[registro.outcome]}
              </span>
              {registro.clusterId ? (
                <span className="text-xs text-fg-subtle">
                  {t.clusterLabel}
                  {strings.simbolos.doisPontos}
                  <span className="font-mono text-accent">{registro.clusterId}</span>
                </span>
              ) : null}
              {registro.resolvidoPara ? (
                <span className="text-xs text-fg-subtle">
                  {t.resolvidoPara}
                  {strings.simbolos.doisPontos}
                  <span className="font-mono text-accent">{registro.resolvidoPara}</span>
                </span>
              ) : null}
              <Link to={paths.playbook} className="ml-auto">
                <Button variant="ghost">
                  <ExternalLink size={ICON} aria-hidden="true" />
                  {t.verNoPlaybook}
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              <ParDeValores
                rotulo={t.origem}
                itens={[
                  { chave: 'codigo', valor: registro.source.codigo },
                  { chave: 'spe', valor: registro.source.spe },
                  { chave: 'razaoSocial', valor: registro.source.razaoSocial },
                  { chave: 'cnpjCpf', valor: registro.source.cnpjCpf },
                  { chave: 'cnae', valor: registro.source.cnae ?? '' },
                  { chave: 'municipio', valor: `${registro.source.municipio} / ${registro.source.uf}` },
                  { chave: 'codigoIbge', valor: registro.source.codigoIbge ?? '' },
                  { chave: 'cep', valor: registro.source.cep },
                  { chave: 'condicaoPagamento', valor: registro.source.condicaoPagamento },
                  { chave: 'dataCadastro', valor: registro.source.dataCadastro },
                ]}
              />
              {registro.target ? (
                <ParDeValores
                  rotulo={t.destino}
                  itens={Object.entries(registro.target).map(([chave, valor]) => ({
                    chave,
                    valor: valor === null ? '' : String(valor),
                  }))}
                />
              ) : (
                <div className="min-w-0 flex-1 border border-held bg-held-bg p-3">
                  <h3 className="text-2xs uppercase tracking-wider text-held">{t.destino}</h3>
                  <p className="mt-1 text-sm text-held">{t.semDestino}</p>
                </div>
              )}
            </div>

            <Excecoes excecoes={registro.exceptions} />

            <section>
              <h2 className="text-md font-medium text-fg">{t.timeline}</h2>
              <div className="mt-2">
                <Timeline trail={registro.trail} bloqueados={bloqueados} />
              </div>
            </section>

            <section data-cena="trilha">
              <div className="flex items-baseline gap-3">
                <h2 className="text-md font-medium text-fg">{t.trilha}</h2>
                <span className="tnum text-xs text-fg-subtle">
                  {registro.trail.length} {t.aplicacoes}
                </span>
                <span className="tnum text-xs text-fg-subtle">
                  {new Set(registro.trail.map((e) => e.field)).size} {t.camposTocados}
                </span>
              </div>
              <div className="mt-2">
                <TrilhaCampoACampo trail={registro.trail} />
              </div>
            </section>
          </>
        ) : (
          <p className="text-sm text-fg-subtle">{t.semDestino}</p>
        )}
      </div>
    </Surface>
  )
}
