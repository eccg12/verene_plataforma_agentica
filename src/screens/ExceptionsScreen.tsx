import { Check, Lock, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/app/paths'
import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { dataBr } from '@/copy/format'
import { strings } from '@/copy/strings'
import { nasajonSuppliers } from '@/data/source/nasajon-suppliers'
import {
  propostasDeMaterial,
  propostasDeServico,
  propostasParaFornecedor,
  type PropostaEnriquecimento,
} from '@/engine/enrichment'
import { filaDeExcecoes, resumoDaFila, type ExcecaoNaFila } from '@/engine/exception-queue'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

const ICON = 13
const t = strings.exceptions

const CLASSE_COR = { tecnica: 'text-defect-transformation', negocio: 'text-defect-target-config' } as const
const ESTADO_COR = { aberta: 'text-held', liberada: 'text-signed', 'mantida-retida': 'text-exception' } as const

function LinhaExcecao({ item }: { readonly item: ExcecaoNaFila }) {
  const decidir = useSimulation((s) => s.decideException)
  const e = item.excecao
  const estadoRotulo = t.estados[item.estado]

  return (
    <tr className="border-t border-line align-top hover:bg-surface-raised">
      <td className="px-2 py-1.5">
        <Link to={`${paths.recordBase}/${e.recordCode}`} className="font-mono text-2xs text-accent">
          {e.recordCode}
        </Link>
      </td>
      <td className="px-2 py-1.5">
        <p className="text-xs text-fg">{e.nome}</p>
        <p className="text-2xs text-fg-subtle">{e.mensagem}</p>
        <p className="mt-0.5 font-mono text-2xs text-fg-subtle">{e.ruleId}</p>
      </td>
      <td className="px-2 py-1.5">
        <span className="text-2xs text-fg-muted">{strings.defectOrigins[e.origin]}</span>
        <span className={`block text-2xs ${e.severidade === 'critical' ? 'text-held' : 'text-fg-subtle'}`}>
          {strings.severidades[e.severidade]}
        </span>
      </td>
      <td className="px-2 py-1.5">
        <span className={`text-xs font-medium ${CLASSE_COR[item.classe]}`}>
          {item.classe === 'tecnica' ? t.tecnica : t.negocio}
        </span>
        <span className="block text-2xs text-fg-subtle">
          {t.encaminhadaA}
          {strings.simbolos.doisPontos}
          {item.encaminhadaA}
        </span>
      </td>
      <td className="px-2 py-1.5">
        {item.dono ? (
          <>
            <p className="text-xs text-fg">{item.dono.nome}</p>
            <p className="text-2xs text-fg-subtle">{item.dono.papel}</p>
          </>
        ) : (
          <p className="text-2xs text-fg-subtle">{e.roteadoPara}</p>
        )}
      </td>
      <td className="px-2 py-1.5">
        <p className="tnum text-xs text-fg">{dataBr(item.prazo)}</p>
        <p className="tnum text-2xs text-fg-subtle">
          {item.prazoDias} {t.prazoDias}
        </p>
      </td>
      <td className="px-2 py-1.5">
        <span className={`text-xs font-medium ${ESTADO_COR[item.estado]}`}>{estadoRotulo}</span>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <Button variant="secondary" onClick={() => decidir(e.id, 'approved')} disabled={item.decisao !== null}>
            <Check size={ICON} aria-hidden="true" />
            {t.liberar}
          </Button>
          <Button variant="ghost" onClick={() => decidir(e.id, 'rejected')} disabled={item.decisao !== null}>
            <Lock size={ICON} aria-hidden="true" />
            {t.manterRetido}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function CardProposta({ proposta }: { readonly proposta: PropostaEnriquecimento }) {
  const e = t.enriquecimento
  const temEvidencia = proposta.evidencia !== null
  return (
    <li className={`border bg-surface-raised p-2.5 ${temEvidencia ? 'border-line' : 'border-held'}`}>
      <p className="flex items-baseline gap-2">
        <Link to={`${paths.recordBase}/${proposta.recordCode}`} className="font-mono text-2xs text-accent">
          {proposta.recordCode}
        </Link>
        <span className="text-xs text-fg">{proposta.rotuloCampo}</span>
        <span className="ml-auto font-mono text-2xs text-fg-subtle">{proposta.ruleId}</span>
      </p>

      {temEvidencia ? (
        <>
          <p className="mt-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{e.valorProposto}</p>
          <p className="font-mono text-md text-signed">{proposta.valorProposto}</p>
          <div className="mt-1.5 border-l-2 border-signed bg-surface-sunken px-2 py-1.5">
            <p className="inline-flex items-center gap-1 text-2xs uppercase tracking-wider text-signed">
              <Paperclip size={10} aria-hidden="true" />
              {e.evidencia}
            </p>
            <p className="mt-0.5 text-xs text-fg">{proposta.evidencia?.fonte}</p>
            <p className="font-mono text-2xs text-fg-muted">{proposta.evidencia?.referencia}</p>
            <p className="mt-0.5 text-2xs text-fg-subtle">{proposta.evidencia?.detalhe}</p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-2xs uppercase tracking-wider text-held">{e.semProposta}</p>
          <p className="mt-0.5 text-sm text-fg-muted">{proposta.motivoSemProposta}</p>
        </>
      )}
    </li>
  )
}

export function ExceptionsScreen() {
  const approvals = useSimulation((s) => s.approvals)
  const playbookVersion = useSimulation((s) => s.playbookVersion)
  const reset = useSimulation((s) => s.reset)
  const run = runDeTodasSpes(playbookVersion, approvals)
  const bloqueado = run.blockedAt !== null && run.blockedAt !== 'package'

  const fila = filaDeExcecoes(run, approvals.excecoes)
  const resumo = resumoDaFila(fila)

  // O enriquecimento do NOVA é um passo da esteira, não remédio de exceção:
  // vale para todo o escopo, não só para quem já está retido.
  const propostas = [
    ...nasajonSuppliers.flatMap((s) => propostasParaFornecedor(s.codigo)),
    ...propostasDeMaterial(),
    ...propostasDeServico(),
  ]

  return (
    <Surface surface="ink" className="min-h-full">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
            <span className="tnum text-xs text-fg-subtle">
              {resumo.total} {t.resumo.total}
            </span>
            <span className="tnum text-xs text-held">
              {resumo.abertas} {t.resumo.abertas}
            </span>
            <span className="tnum text-xs text-defect-transformation">
              {resumo.tecnicas} {t.resumo.tecnicas}
            </span>
            <span className="tnum text-xs text-defect-target-config">
              {resumo.negocio} {t.resumo.negocio}
            </span>
            <Button variant="ghost" onClick={reset} className="ml-auto">
              {t.reverter}
            </Button>
          </div>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>

          <div className="mt-2 border-l-2 border-accent bg-surface-raised px-3 py-2">
            <p className="text-sm font-medium text-accent">{t.semDefault}</p>
            <p className="max-w-[80ch] text-sm text-fg-muted">{t.semDefaultNota}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-2xs">
            <span className={CLASSE_COR.tecnica}>
              {t.tecnica}
              {strings.simbolos.doisPontos}
              <span className="text-fg-subtle">{t.tecnicaNota}</span>
            </span>
            <span className={CLASSE_COR.negocio}>
              {t.negocio}
              {strings.simbolos.doisPontos}
              <span className="text-fg-subtle">{t.negocioNota}</span>
            </span>
          </div>
        </header>

        {bloqueado ? (
          <div className="border border-held bg-surface-raised px-3 py-3">
            <p className="text-sm font-medium text-held">{t.bloqueadoTitulo}</p>
            <p className="mt-0.5 max-w-[80ch] text-sm text-fg-muted">{t.bloqueadoNota}</p>
            <div className="mt-2 flex gap-1.5">
              <Link to={paths.mapping}>
                <Button variant="primary">{t.irParaMapeamento}</Button>
              </Link>
              <Link to={paths.duplicates}>
                <Button variant="secondary">{t.irParaDuplicatas}</Button>
              </Link>
            </div>
          </div>
        ) : fila.length === 0 ? (
          <p className="border border-line bg-surface-raised px-3 py-3 text-sm text-fg-subtle">{t.vazia}</p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-base">
              <thead className="bg-surface-sunken">
                <tr className="h-7">
                  {[t.colRegistro, t.colExcecao, t.colOrigem, t.colClasse, t.colDono, t.colPrazo, t.colEstado, t.colAcoes].map(
                    (c) => (
                      <th key={c} scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                        {c}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {fila.map((item) => (
                  <LinhaExcecao key={item.excecao.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section>
          <h2 className="text-md font-medium text-fg">{t.enriquecimento.titulo}</h2>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.enriquecimento.nota}</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {propostas.map((p) => (
              <CardProposta key={p.id} proposta={p} />
            ))}
          </ul>
        </section>
      </div>
    </Surface>
  )
}
