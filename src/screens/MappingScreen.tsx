import { useState } from 'react'

import { CircleAlert, PenLine, ShieldCheck, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/Button'
import { Surface } from '@/components/Surface'
import { strings } from '@/copy/strings'
import { mappedObjects, mappingByObjeto, type FieldMapping } from '@/data/mapping-dictionary'
import {
  divergenciasDoPadraoSap,
  valueDomains,
  type DivergenciaPadrao,
  type ValueDomain,
} from '@/data/target/tenant-config'
import type { MigrationObjectId } from '@/data/types'
import { useSimulation } from '@/engine/store'

const ICON = 14
const t = strings.mapping

const domainById = (id: string): ValueDomain | undefined => valueDomains.find((d) => d.id === id)
const divergenciaById = (id: string): DivergenciaPadrao | undefined =>
  divergenciasDoPadraoSap.find((d) => d.id === id)

/**
 * Coluna do domínio de valor. Mostra o que está na configuração ATIVA do
 * tenant — não uma tabela paralela mantida à mão. Onde a Verene saiu do padrão
 * SAP, a célula é marcada.
 */
function ValueDomainCell({ mapping }: { readonly mapping: FieldMapping }) {
  const dominio = mapping.valueDomainId === null ? undefined : domainById(mapping.valueDomainId)
  const divergente = mapping.divergenciaId !== null

  if (!dominio) {
    return <span className="text-2xs text-fg-subtle">{t.domain.semDominio}</span>
  }

  return (
    <div className={divergente ? 'border-l-2 border-accent pl-2' : ''}>
      <p className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xs text-fg">{dominio.id}</span>
        <span className="tnum text-2xs text-fg-subtle">
          {dominio.entradas.length} {t.domain.entradas}
        </span>
      </p>
      <ul className="mt-0.5 flex flex-wrap gap-1">
        {dominio.entradas.map((e) => (
          <li
            key={e.codigo}
            title={e.texto}
            className="rounded-sm border border-line bg-surface-sunken px-1 py-px font-mono text-2xs text-fg-muted"
          >
            {e.codigo}
          </li>
        ))}
      </ul>
      {divergente ? (
        <p className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-accent">
          <TriangleAlert size={11} aria-hidden="true" />
          {t.divergencia.marca}
        </p>
      ) : (
        <p className="mt-0.5 text-2xs text-fg-subtle">{t.domain.lidoDe}</p>
      )}
    </div>
  )
}

function PainelAssinatura() {
  const approvals = useSimulation((s) => s.approvals)
  const approveSme = useSimulation((s) => s.approveMappingSme)
  const approveOwner = useSimulation((s) => s.approveMapping)
  const reset = useSimulation((s) => s.reset)
  const run = useSimulation((s) => s.run)
  const a = t.assinatura

  const sme = approvals.mapeamentoSme
  const owner = approvals.mapeamento
  const liberado = run.checkpoints.find((c) => c.id === 'mapeamento')?.liberado === true

  const estado = (assinatura: typeof sme): { texto: string; classe: string } => {
    if (!assinatura) return { texto: a.pendente, classe: 'text-held' }
    if (assinatura.decision === 'rejected') return { texto: a.recusado, classe: 'text-exception' }
    return { texto: a.aprovado, classe: 'text-signed' }
  }
  const estadoSme = estado(sme)
  const estadoOwner = estado(owner)

  return (
    <section className="border border-line bg-surface-raised">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2">
        <h2 className="text-base font-medium text-fg">{a.titulo}</h2>

        <span className="flex items-baseline gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{a.sme}</span>
          <span className={`text-xs font-medium ${estadoSme.classe}`}>{estadoSme.texto}</span>
          {sme ? <span className="text-2xs text-fg-subtle">{sme.by}</span> : null}
        </span>

        <span className="flex items-baseline gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">
            {a.dataOwner}
            {strings.simbolos.separador}
            {a.gate}
          </span>
          <span className={`text-xs font-medium ${estadoOwner.classe}`}>
            {owner && owner.decision === 'approved' ? a.assinado : estadoOwner.texto}
          </span>
          {owner ? <span className="text-2xs text-fg-subtle">{owner.by}</span> : null}
        </span>

        <div className="ml-auto flex gap-1.5">
          <Button variant={sme ? 'secondary' : 'primary'} onClick={() => approveSme('approved')} disabled={sme !== null}>
            <ShieldCheck size={ICON} aria-hidden="true" />
            {a.aprovarSme}
          </Button>
          <Button
            variant={owner ? 'secondary' : 'primary'}
            onClick={() => approveOwner('approved')}
            disabled={owner !== null}
          >
            <PenLine size={ICON} aria-hidden="true" />
            {a.assinarOwner}
          </Button>
          <Button variant="ghost" onClick={reset}>
            {a.reverter}
          </Button>
        </div>
      </div>

      {liberado ? null : (
        <div className="flex items-start gap-2 border-l-2 border-held bg-held-bg px-3 py-2">
          <CircleAlert size={ICON} className="mt-0.5 shrink-0 text-held" aria-hidden="true" />
          <p>
            <span className="text-sm font-medium text-held">{a.aviso}</span>
            <span className="block text-sm text-fg-muted">{a.avisoNota}</span>
          </p>
        </div>
      )}
    </section>
  )
}

function PainelDivergencias({ objeto }: { readonly objeto: MigrationObjectId }) {
  const doObjeto = divergenciasDoPadraoSap.filter((d) => d.objetos.includes(objeto))
  if (doObjeto.length === 0) return null
  const d = t.divergencia

  return (
    <section>
      <h2 className="text-base font-medium text-fg">
        {d.titulo} <span className="tnum text-xs text-fg-subtle">{doObjeto.length}</span>
      </h2>
      <div className="mt-2 grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {doObjeto.map((div) => (
          <article key={div.id} className="border border-accent bg-surface-raised p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xs text-accent">{div.id}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-accent">
                <TriangleAlert size={11} aria-hidden="true" />
                {d.marca}
              </span>
            </div>
            <h3 className="mt-1 text-base font-medium text-fg">{div.titulo}</h3>
            <p className="mt-1 text-sm text-fg-muted">{div.descricao}</p>

            <p className="mt-2 text-2xs uppercase tracking-wider text-fg-subtle">{d.padraoSap}</p>
            <p className="text-sm text-fg-muted">{div.padraoSap}</p>

            <p className="mt-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{d.configVerene}</p>
            <p className="text-sm text-fg">{div.configuracaoVerene}</p>

            <p className="mt-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{d.impacto}</p>
            <p className="text-sm text-fg-muted">{div.impacto}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MappingScreen() {
  const [objeto, setObjeto] = useState<MigrationObjectId>('business-partner')
  const linhas = mappingByObjeto(objeto)

  return (
    <Surface surface="paper" className="min-h-full">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-fg">{t.title}</h1>
          <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.subtitle}</p>
        </header>

        <PainelAssinatura />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-2xs uppercase tracking-wider text-fg-subtle">{t.objetoLabel}</span>
          {mappedObjects.map((o) => (
            <Button key={o} variant={o === objeto ? 'primary' : 'secondary'} onClick={() => setObjeto(o)}>
              {strings.migrationObjects[o]}
            </Button>
          ))}
        </div>

        <PainelDivergencias objeto={objeto} />

        <section>
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-base">
              <thead className="bg-surface-sunken">
                <tr className="h-7">
                  <th scope="col" className="w-52 px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t.tabela.campoOrigem}
                  </th>
                  <th scope="col" className="w-52 px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t.tabela.campoAlvo}
                  </th>
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t.tabela.regra}
                  </th>
                  <th scope="col" className="w-64 px-2 text-left text-2xs font-semibold uppercase tracking-wider text-accent">
                    {t.tabela.valueDomain}
                  </th>
                  <th scope="col" className="w-24 px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t.tabela.padrao}
                  </th>
                  <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                    {t.tabela.excecao}
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((m) => {
                  const divergencia = m.divergenciaId === null ? undefined : divergenciaById(m.divergenciaId)
                  return (
                    <tr
                      key={m.id}
                      className={`border-t border-line align-top ${divergencia ? 'bg-accent-fill/6' : ''}`}
                    >
                      <td className="px-2 py-1.5">
                        <p className="font-mono text-2xs text-fg">{m.campoOrigem}</p>
                        <p className="text-2xs text-fg-subtle">{m.campoOrigemDescricao}</p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-mono text-2xs text-fg">{m.campoAlvo}</p>
                        <p className="text-2xs text-fg-subtle">{m.campoAlvoDescricao}</p>
                        {m.obrigatorio ? (
                          <p className="mt-0.5 text-2xs text-fg-muted">{t.tabela.obrigatorio}</p>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="text-xs text-fg-muted">{m.regraConversao}</p>
                        {m.ruleId ? (
                          <p className="mt-0.5 font-mono text-2xs text-accent">{m.ruleId}</p>
                        ) : (
                          <p className="mt-0.5 text-2xs text-fg-subtle">{t.semRegra}</p>
                        )}
                        {m.dependencia ? (
                          <p className="mt-0.5 text-2xs text-fg-subtle">
                            {t.tabela.dependencia}
                            {strings.simbolos.doisPontos}
                            {m.dependencia}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5">
                        <ValueDomainCell mapping={m} />
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={m.valorPadrao ? 'font-mono text-2xs text-fg' : 'text-2xs text-fg-subtle'}>
                          {m.valorPadrao ?? t.semPadrao}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="text-xs text-fg-muted">{m.tratamentoExcecao}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Surface>
  )
}
