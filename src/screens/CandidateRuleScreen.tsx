import { CircleSlash, ExternalLink, Hand, Loader2, Quote, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { dataBr, percentualBr } from '@/copy/format'
import { strings } from '@/copy/strings'
import {
  hipoteseDeReferencia,
  MODELO,
  type HipoteseDeRegra,
} from '@/data/candidate-hypothesis'
import {
  casoDaRegraCandidata,
  entradaParaOModelo,
  type CasoDaRegraCandidata,
  type DuplaDivergente,
} from '@/engine/candidate-rule'
import { pedirHipotese } from '@/net/rule-hypothesis'
import { useSimulation, type DecisaoDeCandidata } from '@/engine/store'

const ICON = 13
const t = strings.candidate

/** A frase que o cliente precisa ouvir do fornecedor, não do concorrente. */
function Limite() {
  return (
    <section className="border border-accent bg-surface-raised px-3 py-2.5">
      <p className="flex items-start gap-2">
        <Hand size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <span className="max-w-[70ch] text-md leading-snug text-fg">{t.limite}</span>
      </p>
      <p className="mt-1.5 max-w-[80ch] pl-6 text-sm text-fg-muted">{t.limiteNota}</p>
    </section>
  )
}

function TabelaDaDupla({ dupla }: { readonly dupla: DuplaDivergente }) {
  return (
    <article className="border border-line">
      <header className="flex flex-wrap items-baseline gap-2 border-b border-line bg-surface-sunken px-2 py-1.5">
        <span className="text-sm font-medium text-fg">{dupla.nome}</span>
        <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.evidencia.documento}</span>
        <span className="tnum text-xs text-fg-muted">{dupla.documento}</span>
      </header>

      <table className="w-full text-base">
        <thead>
          <tr className="h-7 border-b border-line">
            <th scope="col" className="w-48 px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
              {t.evidencia.colCampo}
            </th>
            {dupla.membros.map((m) => (
              <th key={m.codigo} scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                <Link to={`${paths.recordBase}/${m.codigo}`} className="text-accent hover:underline">
                  {m.codigo}
                </Link>
                <span className="ml-1.5 text-fg-muted">{m.spe}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dupla.camposDivergentes.map((campo) => (
            <tr key={campo.campo} className="border-b border-line bg-held-bg/40 last:border-b-0">
              <td className="px-2 py-1.5 text-fg">
                {campo.rotulo}
                <span className="ml-1.5 text-2xs uppercase tracking-wider text-held">{t.evidencia.divergente}</span>
              </td>
              {campo.valores.map((v) => (
                <td key={v.codigo} className="px-2 py-1.5 tnum font-medium text-held">
                  {v.valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="border-t border-line px-2 py-1.5 text-2xs text-fg-subtle">
        {t.evidencia.igualNosDois}
        {strings.simbolos.doisPontos}
        <span className="text-fg-muted">{dupla.coincidencias.join(strings.simbolos.separador)}</span>
      </p>
    </article>
  )
}

function Frequencia({ caso }: { readonly caso: CasoDaRegraCandidata }) {
  const f = caso.frequencia
  const linhas = [
    { n: f.pessoasFisicas, rotulo: t.frequencia.pessoasFisicas },
    { n: f.comCadastroEmMaisDeUmaSpe, rotulo: t.frequencia.comCadastroEmMaisDeUmaSpe },
    { n: f.divergentes, rotulo: t.frequencia.divergentes, destaque: true },
    { n: f.registrosEnvolvidos, rotulo: t.frequencia.registrosEnvolvidos },
    { n: f.spesEnvolvidas, rotulo: t.frequencia.spesEnvolvidas },
  ]
  return (
    <section>
      <h2 className="text-md font-medium text-fg">{t.frequencia.titulo}</h2>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.frequencia.nota}</p>
      <div className="mt-2 flex flex-wrap gap-px bg-line">
        {linhas.map((l) => (
          <div key={l.rotulo} className="min-w-[10rem] flex-1 bg-surface px-2 py-1.5">
            <p className={`tnum text-xl leading-none ${l.destaque ? 'text-held' : 'text-fg'}`}>{l.n}</p>
            <p className="mt-1 text-2xs text-fg-subtle">{l.rotulo}</p>
          </div>
        ))}
        <div className="min-w-[10rem] flex-1 bg-surface px-2 py-1.5">
          <p className="tnum text-xl leading-none text-held">
            {percentualBr(caso.frequencia.percentual)}
            {strings.simbolos.porcento}
          </p>
          <p className="mt-1 text-2xs text-fg-subtle">{t.frequencia.percentual}</p>
        </div>
      </div>
    </section>
  )
}

function Hipotese({
  hipotese,
  carregando,
  onConsultar,
}: {
  readonly hipotese: HipoteseDeRegra
  readonly carregando: boolean
  readonly onConsultar: () => void
}) {
  const i = t.inferencia
  return (
    <div className="border border-line bg-surface-raised">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-2 py-1.5">
        <h3 className="text-sm font-medium text-fg">{i.hipoteseTitulo}</h3>
        <span className="ml-auto text-2xs text-fg-subtle">
          {i.modelo}
          {strings.simbolos.doisPontos}
          <span className="font-mono text-fg-muted">{MODELO}</span>
        </span>
        <span className={`text-2xs ${hipotese.origem === 'ao-vivo' ? 'text-signed' : 'text-fg-subtle'}`}>
          {hipotese.origem === 'ao-vivo' ? i.origemAoVivo : i.origemReferencia}
        </span>
        <Button variant="ghost" onClick={onConsultar} disabled={carregando}>
          {carregando ? (
            <Loader2 size={ICON} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={ICON} aria-hidden="true" />
          )}
          {carregando ? i.consultando : i.consultarDeNovo}
        </Button>
      </header>

      <div className={`px-2 py-2 transition-opacity ${carregando ? 'opacity-40' : 'opacity-100'}`}>
        <p className="text-2xs uppercase tracking-wider text-fg-subtle">{i.enunciado}</p>
        <p className="mt-0.5 max-w-[85ch] text-sm text-fg">{hipotese.enunciado}</p>

        <p className="mt-2.5 text-2xs uppercase tracking-wider text-fg-subtle">{i.evidenciaCitada}</p>
        <ul className="mt-0.5">
          {hipotese.evidencia.map((e) => (
            <li key={e} className="flex gap-1.5 py-0.5 text-xs text-fg-muted">
              <Quote size={10} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
              <span className="max-w-[85ch]">{e}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 border-l-2 border-held bg-held-bg px-2 py-1.5">
          <p className="flex items-center gap-1 text-2xs uppercase tracking-wider text-held">
            <CircleSlash size={10} aria-hidden="true" />
            {i.naoConfirmavel}
          </p>
          <p className="mt-0.5 max-w-[85ch] text-xs text-fg">{hipotese.naoConfirmavel}</p>
        </div>
      </div>
    </div>
  )
}

function Contencao({ caso }: { readonly caso: CasoDaRegraCandidata }) {
  const c = t.contencao
  const decidir = useSimulation((s) => s.decidirRegraCandidata)
  const registro = useSimulation((s) => s.candidatas[caso.regra.id])

  const acoes: readonly { readonly decisao: DecisaoDeCandidata; readonly rotulo: string; readonly variante: 'primary' | 'secondary' }[] = [
    { decisao: 'confirmada', rotulo: c.confirmar, variante: 'primary' },
    { decisao: 'rejeitada', rotulo: c.rejeitar, variante: 'secondary' },
    { decisao: 'reformular', rotulo: c.reformular, variante: 'secondary' },
  ]
  const rotuloDaDecisao: Readonly<Record<DecisaoDeCandidata, string>> = {
    confirmada: c.confirmada,
    rejeitada: c.rejeitada,
    reformular: c.reformular_,
  }

  return (
    <section className="border border-held">
      <header className="border-b border-line bg-held-bg px-3 py-2">
        <h2 className="text-md font-medium text-held">{c.titulo}</h2>
      </header>
      <div className="grid gap-3 px-3 py-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-fg-subtle">{c.dono}</dt>
          <dd className="text-fg">
            {caso.dono?.nome ?? caso.area}
            <span className="ml-1.5 text-2xs text-fg-subtle">{caso.dono?.papel ?? ''}</span>
          </dd>
          <dt className="text-fg-subtle">{c.area}</dt>
          <dd className="text-fg">{caso.area}</dd>
          <dt className="text-fg-subtle">{c.prazo}</dt>
          <dd className="tnum text-fg">{dataBr(caso.prazo)}</dd>
          <dt className="text-fg-subtle">{c.severidade}</dt>
          <dd className="text-fg">{strings.severidades[caso.severidade as 'critical' | 'non-critical']}</dd>
        </dl>

        <div className="flex flex-col items-start gap-1.5">
          {registro === undefined ? (
            <div className="flex flex-wrap gap-1.5">
              {acoes.map((a) => (
                <Button key={a.decisao} variant={a.variante} onClick={() => decidir(caso.regra.id, a.decisao)}>
                  {a.rotulo}
                </Button>
              ))}
            </div>
          ) : (
            <div className="border border-line px-2 py-1.5">
              <p className="text-2xs uppercase tracking-wider text-fg-subtle">{c.decidida}</p>
              <p className="mt-0.5 text-sm text-fg">{rotuloDaDecisao[registro.decisao]}</p>
              <p className="mt-0.5 text-2xs text-fg-muted">
                {registro.assinatura.by}
                {strings.simbolos.separador}
                {c.sobre} <span className="tnum">{registro.assinatura.playbookVersion}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-line px-3 py-1.5 text-2xs text-fg-muted">
        {registro === undefined ? c.nota : c.efeito}
      </p>
    </section>
  )
}

/**
 * O momento da contenção: o agente evidencia o padrão, mede a frequência, nomeia
 * a regra que o explicaria — e para. É a única tela do protótipo com chamada de
 * rede, e é a única em que comportamento ao vivo vale mais que simulação.
 */
export function CandidateRuleScreen() {
  const caso = casoDaRegraCandidata()
  // Começa na resposta de referência e já carregando: se a chamada ao vivo não
  // completar, é ela que fica — sem estado vazio em momento nenhum.
  const [hipotese, setHipotese] = useState<HipoteseDeRegra>(hipoteseDeReferencia)
  const [carregando, setCarregando] = useState(true)
  const vivo = useRef(true)

  const buscar = useCallback(() => {
    void pedirHipotese(entradaParaOModelo(caso)).then((h) => {
      if (!vivo.current) return
      setHipotese(h)
      setCarregando(false)
    })
    // `caso` é derivado das fixtures: estável entre renders, sem efeito na dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    vivo.current = true
    buscar()
    return () => {
      vivo.current = false
    }
  }, [buscar])

  const consultar = () => {
    setCarregando(true)
    buscar()
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-lg font-medium text-fg">{t.title}</h1>
          <span className="font-mono text-xs text-accent">{caso.regra.id}</span>
        </div>
        <p className="mt-0.5 max-w-[85ch] text-sm text-fg-muted">{t.subtitle}</p>
      </header>

      <Limite />

      <section>
        <h2 className="text-md font-medium text-fg">{t.evidencia.titulo}</h2>
        <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.evidencia.nota}</p>
        <div className="mt-2 grid gap-3 xl:grid-cols-2">
          {caso.duplas.map((d) => (
            <TabelaDaDupla key={d.id} dupla={d} />
          ))}
        </div>
      </section>

      <Frequencia caso={caso} />

      <section>
        <h2 className="text-md font-medium text-fg">{t.inferencia.titulo}</h2>
        <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.inferencia.hipoteseNota}</p>
        <div className="mt-2 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="border border-line bg-surface-raised">
            <header className="border-b border-line px-2 py-1.5">
              <h3 className="text-sm font-medium text-fg">{t.inferencia.regraTitulo}</h3>
            </header>
            <dl className="px-2 py-2 text-sm">
              <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{t.inferencia.expressao}</dt>
              <dd className="font-mono text-xs text-fg">{caso.regra.expression}</dd>
              <dt className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.inferencia.justificativa}</dt>
              <dd className="max-w-[60ch] text-xs text-fg-muted">{caso.regra.rationale}</dd>
              <dt className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{t.inferencia.dona}</dt>
              <dd className="text-xs text-fg">{caso.regra.owner}</dd>
            </dl>
            <p className="border-t border-line px-2 py-1.5 text-2xs text-held">{t.inferencia.naoExecuta}</p>
            <Link
              to={paths.playbook}
              className="flex items-center gap-1 border-t border-line px-2 py-1.5 text-2xs text-accent hover:underline"
            >
              <ExternalLink size={11} aria-hidden="true" />
              {strings.nav.playbook}
            </Link>
          </div>

          <Hipotese hipotese={hipotese} carregando={carregando} onConsultar={consultar} />
        </div>
      </section>

      <Contencao caso={caso} />
    </div>
  )
}
