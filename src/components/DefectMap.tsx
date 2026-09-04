import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/DataTable'
import { strings } from '@/copy/strings'
import { qualityDimensions } from '@/data/defect-taxonomy'
import { scopeObjects } from '@/data/scope'
import {
  matrizObjetoDimensao,
  resumoDefeitos,
  taxaPorDimensao,
  taxaPorObjeto,
  type TaxaDefeito,
} from '@/engine/mission-control'

const t = strings.missionControl.defects

/** Barra proporcional. Codifica a taxa — não é ornamento. */
function BarraTaxa({ taxa, maximo }: { readonly taxa: number; readonly maximo: number }) {
  const largura = maximo === 0 ? 0 : Math.round((taxa / maximo) * 100)
  return (
    <span className="flex items-center gap-1.5">
      <span className="tnum w-12 text-right text-fg">
        {taxa.toFixed(1)}
        {strings.simbolos.porcento}
      </span>
      <span className="h-1 w-16 shrink-0 bg-surface-sunken" aria-hidden="true">
        <span className="block h-full bg-accent" style={{ width: `${largura}%` }} />
      </span>
    </span>
  )
}

function TabelaTaxa({
  titulo,
  colChave,
  linhas,
  rotulos,
}: {
  readonly titulo: string
  readonly colChave: string
  readonly linhas: readonly TaxaDefeito[]
  readonly rotulos?: Readonly<Record<string, string>>
}) {
  const maximo = Math.max(...linhas.map((l) => l.taxa), 0)
  return (
    <div>
      <h3 className="mb-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{titulo}</h3>
      <Table>
        <Thead>
          <Tr>
            <Th>{colChave}</Th>
            <Th numeric>{t.colRegistros}</Th>
            <Th numeric>{t.colDefeitos}</Th>
            <Th numeric>{t.colCriticos}</Th>
            <Th>{t.colTaxa}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {linhas.map((linha) => (
            <Tr key={linha.chave}>
              <Td>
                <span className="text-fg">{rotulos?.[linha.chave] ?? linha.rotulo}</span>
              </Td>
              <Td numeric>{linha.registros.toLocaleString('pt-BR')}</Td>
              <Td numeric>{linha.defeitos.toLocaleString('pt-BR')}</Td>
              <Td numeric>
                <span className={linha.criticos > 0 ? 'text-held' : 'text-fg-subtle'}>{linha.criticos}</span>
              </Td>
              <Td>
                <BarraTaxa taxa={linha.taxa} maximo={maximo} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  )
}

/** Mapa de defeitos do VEGA: por objeto, por dimensão e no cruzamento dos dois. */
export function DefectMap() {
  const nomeObjeto = Object.fromEntries(scopeObjects.map((o) => [o.id, o.nome]))
  const maxCelula = Math.max(...matrizObjetoDimensao.map((c) => c.defeitos), 1)

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-md font-medium text-fg">{t.title}</h2>
        <span className="tnum text-xs text-fg-subtle">
          {resumoDefeitos.registrosPerfilados} {t.resumoPerfilados}
        </span>
        <span className="tnum text-xs text-fg-subtle">
          {resumoDefeitos.defeitos} {t.resumoDefeitos}
        </span>
        <span className="tnum text-xs text-held">
          {resumoDefeitos.criticos} {t.resumoCriticos}
        </span>
        <span className="tnum text-xs text-fg-subtle">
          {resumoDefeitos.taxaGeral.toFixed(1)}
          {strings.simbolos.porcento} {t.resumoTaxa}
        </span>
      </div>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.note}</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <TabelaTaxa titulo={t.porObjeto} colChave={t.colObjeto} linhas={taxaPorObjeto} />
        <TabelaTaxa
          titulo={t.porDimensao}
          colChave={t.colDimensao}
          linhas={taxaPorDimensao}
          rotulos={strings.qualityDimensions}
        />
      </div>

      <h3 className="mt-3 mb-1.5 text-2xs uppercase tracking-wider text-fg-subtle">{t.matriz}</h3>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-base">
          <thead className="bg-surface-sunken">
            <tr className="h-7">
              <th scope="col" className="px-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {t.colObjeto}
              </th>
              {qualityDimensions.map((d) => (
                <th key={d} scope="col" className="px-2 text-right text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                  {strings.qualityDimensions[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taxaPorObjeto.map((objeto) => (
              <tr key={objeto.chave} className="h-7 border-t border-line">
                <td className="px-2 text-fg">{nomeObjeto[objeto.chave] ?? objeto.rotulo}</td>
                {qualityDimensions.map((dimensao) => {
                  const celula = matrizObjetoDimensao.find(
                    (c) => c.objetoId === objeto.chave && c.dimensao === dimensao,
                  )
                  const valor = celula?.defeitos ?? 0
                  const intensidade = valor === 0 ? 0 : 0.15 + (valor / maxCelula) * 0.55
                  return (
                    <td key={dimensao} className="px-1 py-0.5">
                      <span
                        className="flex h-5 items-center justify-end rounded-sm px-1.5 tnum text-2xs text-fg"
                        style={
                          valor === 0
                            ? undefined
                            : { backgroundColor: `color-mix(in oklab, var(--color-accent) ${Math.round(intensidade * 100)}%, transparent)` }
                        }
                      >
                        {valor === 0 ? <span className="text-fg-subtle">{valor}</span> : valor}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
