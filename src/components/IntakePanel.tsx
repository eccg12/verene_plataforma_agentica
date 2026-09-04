import { Check, TriangleAlert } from 'lucide-react'

import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/DataTable'
import { strings } from '@/copy/strings'
import { recebimentos, resumoRecebimento } from '@/engine/mission-control'

const ICON = 12
const t = strings.missionControl.intake

/**
 * Painel de recebimento. A contagem lida e o fingerprint são calculados do
 * conteúdo — não repetem o que o vendor declarou.
 */
export function IntakePanel() {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-md font-medium text-fg">{t.title}</h2>
        <span className="tnum text-xs text-fg-subtle">
          {resumoRecebimento.arquivos} {t.resumoArquivos}
        </span>
        <span className="tnum text-xs text-fg-subtle">
          {resumoRecebimento.layoutValidado} {t.resumoLayout}
        </span>
        <span className="tnum text-xs text-held">
          {resumoRecebimento.contagemDivergente} {t.resumoContagem}
        </span>
        <span className="tnum text-xs text-fg-subtle">
          {resumoRecebimento.registrosLidos} {t.resumoRegistros}
        </span>
      </div>
      <p className="mt-1 max-w-[80ch] text-sm text-fg-subtle">{t.note}</p>

      <div className="mt-3">
        <Table>
          <Thead>
            <Tr>
              <Th>{t.colArquivo}</Th>
              <Th>{t.colSpe}</Th>
              <Th>{t.colFormato}</Th>
              <Th>{t.colLayout}</Th>
              <Th numeric>{t.colDeclarados}</Th>
              <Th numeric>{t.colLidos}</Th>
              <Th>{t.colFingerprint}</Th>
              <Th>{t.colRecibo}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recebimentos.map((r) => (
              <Tr key={r.arquivo.id}>
                <Td>
                  <span className="text-fg" title={r.arquivo.layoutEsperado}>
                    {r.arquivo.nomeArquivo}
                  </span>
                </Td>
                <Td>{r.arquivo.spe}</Td>
                <Td>{r.arquivo.formato}</Td>
                <Td>
                  {r.layoutValidado ? (
                    <span className="inline-flex items-center gap-1 text-signed">
                      <Check size={ICON} aria-hidden="true" />
                      {t.layoutOk}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-held"
                      title={r.arquivo.divergenciasLayout.map((d) => `${d.campo}: ${d.problema}`).join(' · ')}
                    >
                      <TriangleAlert size={ICON} aria-hidden="true" />
                      {t.layoutDivergente}
                      <span className="tnum">{r.arquivo.divergenciasLayout.length}</span>
                    </span>
                  )}
                </Td>
                <Td numeric>{r.arquivo.registrosDeclarados}</Td>
                <Td numeric>
                  <span className={r.contagemConfere ? 'text-fg' : 'text-exception'}>{r.registrosLidos}</span>
                </Td>
                <Td>
                  <span className="font-mono text-2xs text-fg-subtle">{r.fingerprint}</span>
                </Td>
                <Td>
                  <span
                    className={r.arquivo.recibo.aceito ? 'text-signed' : 'text-held'}
                    title={r.arquivo.recibo.observacao ?? undefined}
                  >
                    {r.arquivo.recibo.numero}
                    {strings.simbolos.separador}
                    {r.arquivo.recibo.aceito ? t.reciboAceito : t.reciboRessalva}
                  </span>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <p className="mt-1.5 text-2xs text-fg-subtle">
        {t.emitidoPara} {recebimentos[0]?.arquivo.recibo.emitidoPara ?? ''}
      </p>
    </section>
  )
}
