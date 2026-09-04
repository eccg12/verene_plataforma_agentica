import { useEffect, useMemo, useRef, useState } from 'react'

import { ArrowRight, FileText, Wrench, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PARAM_REGRA, paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/DataTable'
import { Surface } from '@/components/Surface'
import { strings } from '@/copy/strings'
import { agentNames, type AgentName } from '@/data/agents'
import { historicoDaRegra } from '@/data/playbook-history'
import { playbookRules, ruleTypes, type PlaybookRule, type RuleType } from '@/data/playbook'
import { PropagationTrail, type NoDePropagacao } from '@/components/PropagationTrail'
import { diffDeRegeneracao, regraCorrigida } from '@/engine/regeneration'
import { generateDocumentation, sealPlaybook } from '@/engine/kanon'
import { resumoDoPlaybook, usoDasRegras } from '@/engine/playbook-usage'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 14
const t = strings.playbook

const OBJETOS = ['fornecedores', 'materiais-servicos', 'contratos', 'transversal'] as const
type ObjetoFiltro = (typeof OBJETOS)[number]

const ROTULO_OBJETO: Record<ObjetoFiltro, string> = {
  fornecedores: 'Fornecedores',
  'materiais-servicos': 'Materiais e serviços',
  contratos: 'Contratos',
  transversal: 'Transversal',
}

type Filtro<T extends string> = T | 'todos'

function Seletor<T extends string>({
  rotulo,
  valor,
  opcoes,
  rotulos,
  aoMudar,
}: {
  readonly rotulo: string
  readonly valor: Filtro<T>
  readonly opcoes: readonly T[]
  readonly rotulos?: Readonly<Record<string, string>>
  readonly aoMudar: (v: Filtro<T>) => void
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-2xs uppercase tracking-wider text-fg-subtle">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value as Filtro<T>)}
        className="h-6 rounded-sm border border-line-strong bg-surface px-1.5 text-xs text-fg"
      >
        <option value="todos">{t.filtros.todos}</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {rotulos?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Painel de documentação gerada. Não é texto guardado — é montado do playbook. */
function DocumentacaoGerada({ aoFechar }: { readonly aoFechar: () => void }) {
  const secoes = generateDocumentation()
  return (
    <div className="mt-3 border border-accent bg-surface-raised">
      <div className="flex items-center gap-3 border-b border-line px-3 py-2">
        <h3 className="text-base font-medium text-fg">{t.documentacaoTitulo}</h3>
        <Button variant="ghost" onClick={aoFechar} className="ml-auto">
          <X size={ICON} aria-hidden="true" />
          {t.fecharDocumentacao}
        </Button>
      </div>
      <p className="border-b border-line px-3 py-2 text-sm text-fg-muted">{t.documentacaoNota}</p>
      <div className="max-h-96 overflow-y-auto px-3 py-2">
        {secoes.map((secao) => (
          <section key={secao.agent} className="mb-3">
            <h4 className="text-xs font-semibold tracking-wide text-accent">{secao.agent}</h4>
            <ul className="mt-1">
              {secao.regras.map((r) => (
                <li key={r.id} className="border-t border-line py-1.5">
                  <p className="text-xs text-fg">
                    <span className="font-mono text-2xs text-fg-subtle">{r.id}</span> {r.titulo}
                  </p>
                  <p className="font-mono text-2xs text-fg-muted">{r.expressao}</p>
                  <p className="text-2xs text-fg-subtle">{r.porque}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

/**
 * A correção de uma regra, quando existe redação mais nova que a versão em uso.
 *
 * Não é edição no lugar: a redação nova já está publicada e selada por KANON, e
 * o que o botão faz é a onda ADOTAR essa versão. É a diferença entre mexer na
 * regra e versionar a regra — e é ela que sustenta a trilha.
 */
function BlocoDeCorrecao({ regra }: { readonly regra: PlaybookRule }) {
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const approvals = useSimulation((s) => s.approvals)
  const publicar = useSimulation((s) => s.publicarVersao)
  const c = strings.correcao

  const proxima = regraCorrigida(regra.id, playbookVersion)
  if (proxima === null) return null

  const antes = runDeTodasSpes(playbookVersion, approvals)
  const depois = runDeTodasSpes(proxima.versao, approvals)
  const diff = diffDeRegeneracao(antes, depois)
  const alteracao = historicoDaRegra(regra.id).find((a) => a.versao === proxima.versao)

  const parametros = [
    ...new Set([
      ...Object.keys(regra.parametros ?? {}),
      ...Object.keys(proxima.regra.parametros ?? {}),
    ]),
  ].filter((k) => String(regra.parametros?.[k]) !== String(proxima.regra.parametros?.[k]))

  return (
    <section className="mt-3 border border-accent bg-surface-sunken">
      <header className="border-b border-line px-2.5 py-1.5">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-accent">
          <Wrench size={ICON} aria-hidden="true" />
          {c.titulo}
        </h3>
      </header>

      <div className="px-2.5 py-2">
        <p className="max-w-[75ch] text-xs text-fg-muted">{c.nota}</p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-2xs uppercase tracking-wider text-fg-subtle">{c.expressaoAntes}</p>
            <p className="mt-0.5 font-mono text-2xs text-fg-muted line-through decoration-held">{regra.expression}</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-fg-subtle">{c.expressaoDepois}</p>
            <p className="mt-0.5 font-mono text-2xs text-fg">{proxima.regra.expression}</p>
          </div>
        </div>

        {parametros.map((nome) => (
          <p key={nome} className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xs">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">{c.parametro}</span>
            <span className="font-mono text-fg">{nome}</span>
            <span className="font-mono text-held">{String(regra.parametros?.[nome])}</span>
            <ArrowRight size={11} className="text-fg-subtle" aria-hidden="true" />
            <span className="font-mono text-signed">{String(proxima.regra.parametros?.[nome])}</span>
          </p>
        ))}

        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{c.publicadaEm}</dt>
            <dd className="tnum text-accent">{proxima.versao}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{c.autor}</dt>
            <dd className="text-fg">{alteracao?.autor ?? proxima.regra.owner}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{c.afetados}</dt>
            <dd className="tnum text-fg">{diff.registrosRetocados.length}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{c.excecoesFecham}</dt>
            <dd className="tnum text-fg">{diff.excecoesFechadas.length}</dd>
          </div>
        </dl>

        <Button className="mt-2" onClick={() => publicar(proxima.versao)}>
          <Wrench size={ICON} aria-hidden="true" />
          {c.publicar} {proxima.versao}
        </Button>
      </div>
    </section>
  )
}

function DetalheRegra({ regra }: { readonly regra: PlaybookRule }) {
  const run = useSimulation((s) => s.run)
  const uso = usoDasRegras(run).get(regra.id)
  const historico = historicoDaRegra(regra.id)
  const d = t.detalhe

  return (
    <div className="border border-line bg-surface-raised p-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-accent">{regra.id}</span>
        <span className="text-base font-medium text-fg">{regra.field}</span>
        <span className="ml-auto rounded-sm border border-line-strong px-1.5 py-0.5 text-2xs text-fg-muted">
          {strings.ruleStatus[regra.status]}
        </span>
        <span className="rounded-sm border border-line-strong px-1.5 py-0.5 text-2xs text-fg-muted">
          {strings.ruleNature[regra.nature]}
        </span>
      </div>

      {regra.nature === 'generative' ? (
        <p className="mt-2 border-l-2 border-held bg-held-bg px-2 py-1.5 text-xs text-held">
          {d.candidataAviso}
        </p>
      ) : null}

      <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{d.expressao}</p>
      <p className="mt-0.5 font-mono text-xs text-fg">{regra.expression}</p>

      <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{d.justificativa}</p>
      <p className="mt-0.5 text-sm text-fg-muted">{regra.rationale}</p>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2 text-xs">
        <div>
          <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{d.dono}</dt>
          <dd className="text-fg">{regra.owner}</dd>
        </div>
        <div>
          <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{d.criadaEm}</dt>
          <dd className="tnum text-fg">{regra.createdAt}</dd>
        </div>
        <div>
          <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{d.entrouEm}</dt>
          <dd className="tnum text-fg">{regra.introducedIn}</dd>
        </div>
        <div>
          <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{d.publicadaEm}</dt>
          <dd className="tnum text-fg">{regra.playbookVersion}</dd>
        </div>
      </dl>

      <p className="mt-3 text-2xs uppercase tracking-wider text-fg-subtle">{d.historico}</p>
      {historico.length === 0 ? (
        <p className="mt-0.5 text-sm text-fg-subtle">{d.semHistorico}</p>
      ) : (
        <ol className="mt-1">
          {historico.map((h, i) => (
            <li key={`${h.versao}-${i}`} className="border-t border-line py-1.5">
              <p className="flex items-baseline gap-2 text-xs">
                <span className="tnum font-medium text-accent">{h.versao}</span>
                <span className="tnum text-fg-subtle">{h.data}</span>
                <span className="text-fg-muted">{h.tipo}</span>
                <span className="ml-auto text-2xs text-fg-subtle">{h.autor}</span>
              </p>
              <p className="text-sm text-fg-muted">{h.nota}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 border-t border-line pt-2">
        <p className="text-2xs uppercase tracking-wider text-fg-subtle">{d.aplicadaA}</p>
        {uso && uso.registros > 0 ? (
          <>
            <p className="mt-0.5 text-base text-fg">
              <span className="tnum font-medium">{uso.registros}</span> {d.registros}
              <span className="ml-2 tnum text-xs text-fg-subtle">
                {uso.aplicacoes} {d.aplicacoes}
              </span>
            </p>
            <p className="mt-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{d.verRegistros}</p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {uso.codigos.map((codigo) => (
                <li
                  key={codigo}
                  className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-2xs text-accent"
                >
                  {codigo}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-0.5 text-sm text-fg-subtle">{d.naoAplicada}</p>
        )}
      </div>

      <BlocoDeCorrecao regra={regra} />
    </div>
  )
}

/** O painel de propagação, montado do diff entre as duas versões. */
function Propagacao({ de, para }: { readonly de: string; readonly para: string }) {
  const approvals = useSimulation((s) => s.approvals)
  const p = strings.propagacao
  const dt = p.detalhe
  const painel = useRef<HTMLElement>(null)

  // A publicação acontece no detalhe da regra, lá embaixo na tabela. Sem trazer
  // o painel para a vista, a animação roda fora da tela — que é o mesmo que não
  // existir na hora que ela precisa existir.
  useEffect(() => {
    painel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [de, para])

  const diff = diffDeRegeneracao(runDeTodasSpes(de, approvals), runDeTodasSpes(para, approvals))
  const alterada = diff.regrasAlteradas[0]
  const parametro = alterada
    ? Object.keys(alterada.parametrosPara ?? {})
        .filter((k) => String(alterada.parametrosDe?.[k]) !== String(alterada.parametrosPara?.[k]))
        .map((k) => `${k}${strings.simbolos.doisPontos}${String(alterada.parametrosPara?.[k])}`)
    : []

  const nos: readonly NoDePropagacao[] = [
    {
      id: 'regra',
      titulo: p.nos.regra,
      detalhes: [alterada?.id ?? '', ...parametro].filter((d) => d !== ''),
      path: paths.playbook,
    },
    {
      id: 'playbook',
      titulo: p.nos.playbook,
      detalhes: [para, `${dt.checksum}${strings.simbolos.doisPontos}${diff.checksumPara}`],
      path: paths.playbook,
    },
    {
      id: 'onda',
      titulo: p.nos.onda,
      detalhes: [
        `${diff.registrosRetocados.length} ${dt.retocados}`,
        `${diff.excecoesFechadas.length} ${dt.excecoesFechadas}`,
        `${diff.retidosDe - diff.retidosPara} ${dt.retidosLiberados}`,
      ],
      path: paths.exceptions,
    },
    {
      id: 'pacote',
      titulo: p.nos.pacote,
      detalhes: [diff.pacotePara?.id ?? '', `${diff.pacotePara?.total ?? 0} ${dt.registros}`].filter((d) => d !== ''),
      path: paths.packages,
    },
    {
      id: 'manifest',
      titulo: p.nos.manifest,
      detalhes: [diff.pacotePara?.datasetChecksum ?? '', dt.aguardaG4].filter((d) => d !== ''),
      path: paths.gates,
    },
  ]

  return (
    <section ref={painel} className="scroll-mt-4 border border-accent bg-surface-sunken px-2.5 py-2">
      <h2 className="text-md font-medium text-accent">{p.titulo}</h2>
      <p className="mt-0.5 max-w-[85ch] text-xs text-fg-muted">{p.nota}</p>
      <div className="mt-2">
        <PropagationTrail nos={nos} chave={`${de}-${para}`} />
      </div>
    </section>
  )
}

export function PlaybookScreen() {
  const run = useSimulation((s) => s.run)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const regeneracao = useSimulation((s) => s.regeneracao)
  const [agente, setAgente] = useState<Filtro<AgentName>>('todos')
  const [objeto, setObjeto] = useState<Filtro<ObjetoFiltro>>('todos')
  const [tipo, setTipo] = useState<Filtro<RuleType>>('todos')
  // A regra pode vir na URL. É o que faz o roteiro de apresentação abrir a regra
  // certa em vez de deixar quem apresenta caçando linha numa tabela de 55.
  const [busca] = useSearchParams()
  const [selecionada, setSelecionada] = useState<string | null>(
    busca.get(PARAM_REGRA) ?? playbookRules[0]?.id ?? null,
  )
  const [mostrarDoc, setMostrarDoc] = useState(false)

  const selado = sealPlaybook(playbookVersion)
  const resumo = resumoDoPlaybook(run)
  const uso = useMemo(() => usoDasRegras(run), [run])

  const vigentes = selado.rules
  const filtradas = vigentes.filter(
    (r) =>
      (agente === 'todos' || r.agent === agente) &&
      (objeto === 'todos' || r.object === objeto) &&
      (tipo === 'todos' || r.type === tipo),
  )
  const regra = vigentes.find((r) => r.id === selecionada) ?? null

  return (
    <Surface surface="paper" className="min-h-full">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.versaoCorrente}</span>
              <span className="tnum text-md font-medium text-accent">{selado.version}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.checksumLabel}</span>
              <span className="font-mono text-xs text-fg-muted">{selado.checksum}</span>
            </span>
            <Button variant="primary" onClick={() => setMostrarDoc((v) => !v)} className="ml-auto">
              <FileText size={ICON} aria-hidden="true" />
              {t.gerarDocumentacao}
            </Button>
          </div>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>

          {regeneracao === null ? null : (
            <div className="mt-3">
              <Propagacao de={regeneracao.de} para={regeneracao.para} />
            </div>
          )}

          <p className="mt-2 inline-flex items-center gap-2 border-l-2 border-accent bg-surface-sunken px-2 py-1.5">
            <span className="text-xs font-medium text-accent">{t.referenciado}</span>
            <span className="text-sm text-fg-muted">{t.referenciadoNota}</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle">
            <span className="tnum">
              {resumo.total} {t.resumo.total}
            </span>
            <span className="tnum">
              {resumo.ativas} {t.resumo.ativas}
            </span>
            <span className="tnum text-held">
              {resumo.candidatas} {t.resumo.candidatas}
            </span>
            <span className="tnum">
              {resumo.deterministicas} {t.resumo.deterministicas}
            </span>
            <span className="tnum">
              {resumo.generativas} {t.resumo.generativas}
            </span>
            <span className="tnum text-signed">
              {resumo.aplicadasNestaOnda} {t.resumo.aplicadas}
            </span>
          </div>
        </header>

        {mostrarDoc ? <DocumentacaoGerada aoFechar={() => setMostrarDoc(false)} /> : null}

        <div className="flex flex-wrap items-center gap-3 border-y border-line py-2">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.filtros.titulo}</span>
          <Seletor rotulo={t.filtros.agente} valor={agente} opcoes={agentNames} aoMudar={setAgente} />
          <Seletor rotulo={t.filtros.objeto} valor={objeto} opcoes={OBJETOS} rotulos={ROTULO_OBJETO} aoMudar={setObjeto} />
          <Seletor rotulo={t.filtros.tipo} valor={tipo} opcoes={ruleTypes} rotulos={strings.ruleTypes} aoMudar={setTipo} />
          <Button
            variant="ghost"
            onClick={() => {
              setAgente('todos')
              setObjeto('todos')
              setTipo('todos')
            }}
          >
            {t.filtros.limpar}
          </Button>
          <span className="tnum ml-auto text-xs text-fg-subtle">
            {filtradas.length} {t.filtros.resultado}
          </span>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Table>
            <Thead>
              <Tr>
                <Th>{t.tabela.id}</Th>
                <Th>{t.tabela.agente}</Th>
                <Th>{t.tabela.campo}</Th>
                <Th>{t.tabela.tipo}</Th>
                <Th>{t.tabela.natureza}</Th>
                <Th numeric>{t.tabela.aplicada}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtradas.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setSelecionada(r.id)}
                      className={`font-mono text-2xs ${r.id === selecionada ? 'font-semibold text-accent' : 'text-fg hover:text-accent'}`}
                    >
                      {r.id}
                    </button>
                  </Td>
                  <Td>{r.agent}</Td>
                  <Td>
                    <span className="text-fg">{r.field}</span>
                  </Td>
                  <Td>{strings.ruleTypes[r.type]}</Td>
                  <Td>
                    <span className={r.nature === 'generative' ? 'text-held' : 'text-fg-muted'}>
                      {strings.ruleNature[r.nature]}
                    </span>
                  </Td>
                  <Td numeric>
                    {(() => {
                      const n = uso.get(r.id)?.registros ?? 0
                      return <span className={n > 0 ? 'text-fg' : 'text-fg-subtle'}>{n}</span>
                    })()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <div>
            <h2 className="mb-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{t.detalhe.titulo}</h2>
            {regra ? (
              <DetalheRegra regra={regra} />
            ) : (
              <p className="border border-line bg-surface-raised p-3 text-sm text-fg-subtle">
                {t.detalhe.vazio}
              </p>
            )}
          </div>
        </div>
      </div>
    </Surface>
  )
}
