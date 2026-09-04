import { useState } from 'react'

import { Circle, FileText, Play, Square } from 'lucide-react'

import {
  BrandLogo,
  Button,
  DefectOrigin,
  Section,
  StateBadge,
  Surface,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components'
import { TokenSwatch } from '@/components/TokenSwatch'
import { numeroBr } from '@/copy/format'
import { strings } from '@/copy/strings'
import {
  defectSwatches,
  defectTokens,
  paletteSwatches,
  semanticGroups,
  stateTokens,
  styleguideRows,
} from '@/data/designTokens'

import type { Surface as SurfaceName } from '../../tailwind.config'

const ICON = 14
const sg = strings.screens.styleguide

function pct(migrated: number, records: number): string {
  return `${((migrated / records) * 100).toFixed(1)}%`
}

function Body({ surface }: { readonly surface: SurfaceName }) {
  const cols = sg.table.columns
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-5">
      <Section title={sg.sections.palette} note={sg.sections.paletteNote}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {paletteSwatches.map((spec) => (
            <TokenSwatch key={spec.name} spec={spec} surface={surface} />
          ))}
        </div>
      </Section>

      <Section title={sg.sections.semantic} note={sg.sections.semanticNote}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {semanticGroups.flatMap((group) =>
            group.tokens.map((spec) => <TokenSwatch key={spec.name} spec={spec} surface={surface} />),
          )}
        </div>
      </Section>

      <Section title={sg.sections.typography} note={sg.sections.typographyNote}>
        <div className="flex flex-col gap-1.5">
          <p className="text-xl text-fg">{sg.typeSamples.pageTitle}</p>
          <p className="text-lg text-fg">{sg.typeSamples.sectionTitle}</p>
          <p className="text-base text-fg-muted">{sg.typeSamples.body}</p>
          <p className="text-sm text-fg-muted">{sg.typeSamples.small}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            {sg.typeSamples.label}
          </p>
          <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
            {sg.typeSamples.micro}
          </p>
          <div className="mt-2 flex items-baseline gap-4 border-t border-line pt-2">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">
              {sg.typeSamples.numerals}
            </span>
            <span className="tnum text-lg text-fg">{sg.typeSamples.numeralsSampleA}</span>
            <span className="tnum text-lg text-fg">{sg.typeSamples.numeralsSampleB}</span>
          </div>
        </div>
      </Section>

      <Section title={sg.sections.buttons}>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">
            <Play size={ICON} aria-hidden="true" />
            {sg.buttonSamples.primary}
          </Button>
          <Button variant="secondary">
            <FileText size={ICON} aria-hidden="true" />
            {sg.buttonSamples.secondary}
          </Button>
          <Button variant="ghost">{sg.buttonSamples.ghost}</Button>
          <Button variant="primary" disabled>
            {sg.buttonSamples.disabled}
          </Button>
        </div>
      </Section>

      <Section title={sg.sections.badges} note={sg.sections.badgesNote}>
        <div className="flex flex-wrap items-center gap-2">
          {stateTokens.map((state) => (
            <StateBadge key={state} state={state} />
          ))}
        </div>
      </Section>

      <Section title={sg.sections.defects} note={sg.sections.defectsNote}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {defectTokens.map((origin) => (
              <DefectOrigin key={origin} origin={origin} tone="tinted" />
            ))}
          </div>
          <div className="flex h-6 w-full max-w-lg overflow-hidden rounded-sm">
            <span className="w-[38%] bg-defect-source" />
            <span className="w-[27%] bg-defect-transformation" />
            <span className="w-[21%] bg-defect-target-config" />
            <span className="w-[14%] bg-defect-load" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
            {defectSwatches.map((spec) => (
              <TokenSwatch key={spec.name} spec={spec} surface={surface} />
            ))}
          </div>
        </div>
      </Section>

      <Section title={sg.sections.table} note={sg.sections.tableNote}>
        <Table>
          <Thead>
            <Tr>
              <Th>{cols.object}</Th>
              <Th numeric>{cols.records}</Th>
              <Th numeric>{cols.migrated}</Th>
              <Th numeric>{cols.defects}</Th>
              <Th numeric>{cols.rate}</Th>
              <Th>{cols.origin}</Th>
              <Th>{cols.state}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {styleguideRows.map((row) => (
              <Tr key={row.id}>
                <Td>
                  <span className="text-fg">{row.object}</span>
                </Td>
                <Td numeric>{numeroBr(row.records)}</Td>
                <Td numeric>{numeroBr(row.migrated)}</Td>
                <Td numeric>{numeroBr(row.defects)}</Td>
                <Td numeric>{pct(row.migrated, row.records)}</Td>
                <Td>
                  <DefectOrigin origin={row.origin} />
                </Td>
                <Td>
                  <StateBadge state={row.state} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Section>

      <Section title={sg.sections.logos} note={sg.sections.logosNote}>
        <div className="flex flex-wrap items-center gap-6">
          <BrandLogo brand="verene" />
          <BrandLogo brand="monoda" />
        </div>
      </Section>
    </div>
  )
}

export function StyleguideScreen() {
  const [surface, setSurface] = useState<SurfaceName>('ink')

  return (
    <Surface surface={surface} className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-2.5">
          <div className="min-w-0">
            <h1 className="text-md font-medium text-fg">{sg.title}</h1>
            <p className="truncate text-xs text-fg-subtle">{sg.subtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">{sg.surfaceLabel}</span>
            <Button
              variant={surface === 'ink' ? 'primary' : 'secondary'}
              onClick={() => setSurface('ink')}
              aria-pressed={surface === 'ink'}
            >
              <Circle size={ICON} aria-hidden="true" />
              {sg.surfaceInk}
            </Button>
            <Button
              variant={surface === 'paper' ? 'primary' : 'secondary'}
              onClick={() => setSurface('paper')}
              aria-pressed={surface === 'paper'}
            >
              <Square size={ICON} aria-hidden="true" />
              {sg.surfacePaper}
            </Button>
          </div>
        </div>
      </header>
      <Body surface={surface} />
    </Surface>
  )
}
