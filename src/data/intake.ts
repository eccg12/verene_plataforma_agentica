/**
 * Painel de recebimento: o que o fornecedor de extração entregou.
 *
 * Aqui vive só o METADADO da entrega — nome do arquivo, layout esperado, o que
 * o vendor declarou ter mandado, e o recibo formal emitido a ele. A contagem
 * real de registros e o fingerprint são CALCULADOS do conteúdo das fixtures em
 * `src/engine/intake.ts`, nunca declarados: um recibo que repete o número do
 * vendor em vez de conferir não serve de recibo.
 *
 * A diferença entre `registrosDeclarados` e o que a leitura encontra é o
 * primeiro achado do processo, e é dele que sai a conversa com o vendor.
 */
import type { Cycle } from '@/data/scope'
import type { SpeId } from '@/data/types'

export type FormatoArquivo = 'XLSX' | 'CSV' | 'XML'

export interface DivergenciaLayout {
  readonly campo: string
  readonly problema: string
}

export interface ReciboRecebimento {
  readonly numero: string
  readonly emitidoEm: string
  /** A quem o recibo foi emitido. */
  readonly emitidoPara: string
  readonly aceito: boolean
  readonly observacao: string | null
}

export interface ArquivoRecebido {
  readonly id: string
  readonly nomeArquivo: string
  readonly formato: FormatoArquivo
  readonly objetoId: string
  readonly spe: SpeId
  readonly ciclo: Cycle
  readonly recebidoEm: string
  readonly layoutEsperado: string
  /** Divergências de layout encontradas na conferência. Vazio = layout validado. */
  readonly divergenciasLayout: readonly DivergenciaLayout[]
  /** Quantos registros o fornecedor de extração declarou ter entregue. */
  readonly registrosDeclarados: number
  readonly recibo: ReciboRecebimento
}

const VENDOR = 'Verene · TI Corporativa (extração Nasajon)'

export const arquivosRecebidos: readonly ArquivoRecebido[] = [
  // ---- Wave 1 · fornecedores ----
  {
    id: 'ARQ-001', nomeArquivo: 'NASAJON_FORNECEDORES_SPE1_20260105.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-05',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [], registrosDeclarados: 11,
    recibo: { numero: 'REC-2026-0001', emitidoEm: '2026-01-05', emitidoPara: VENDOR, aceito: true, observacao: null },
  },
  {
    id: 'ARQ-002', nomeArquivo: 'NASAJON_FORNECEDORES_SPE2_20260105.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-05',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [], registrosDeclarados: 11,
    recibo: { numero: 'REC-2026-0002', emitidoEm: '2026-01-05', emitidoPara: VENDOR, aceito: true, observacao: null },
  },
  {
    id: 'ARQ-003', nomeArquivo: 'NASAJON_FORNECEDORES_SPE3_20260106.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-3', ciclo: 'ciclo-1', recebidoEm: '2026-01-06',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [],
    // o vendor declarou 11; a leitura encontra 10
    registrosDeclarados: 11,
    recibo: {
      numero: 'REC-2026-0003', emitidoEm: '2026-01-06', emitidoPara: VENDOR, aceito: false,
      observacao: 'Contagem declarada não confere com a leitura. Recibo emitido com ressalva.',
    },
  },
  {
    id: 'ARQ-004', nomeArquivo: 'NASAJON_FORNECEDORES_SPE4_20260106.CSV', formato: 'CSV',
    objetoId: 'fornecedores', spe: 'SPE-4', ciclo: 'ciclo-1', recebidoEm: '2026-01-06',
    layoutEsperado: 'LAY-FOR-v3',
    divergenciasLayout: [
      { campo: 'INSCRICAO_MUNICIPAL', problema: 'Coluna ausente no arquivo; o layout v3 a exige.' },
      { campo: 'DT_CADASTRO', problema: 'Entregue como texto livre, não como data.' },
    ],
    registrosDeclarados: 10,
    recibo: {
      numero: 'REC-2026-0004', emitidoEm: '2026-01-06', emitidoPara: VENDOR, aceito: false,
      observacao: 'Duas divergências de layout. Arquivo aceito para perfilagem, não para carga.',
    },
  },
  // ---- Wave 2 · materiais e serviços ----
  {
    id: 'ARQ-005', nomeArquivo: 'NASAJON_MATERIAIS_SPE1_20260108.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-08',
    layoutEsperado: 'LAY-MAT-v2', divergenciasLayout: [], registrosDeclarados: 7,
    recibo: { numero: 'REC-2026-0005', emitidoEm: '2026-01-08', emitidoPara: VENDOR, aceito: true, observacao: null },
  },
  {
    id: 'ARQ-006', nomeArquivo: 'NASAJON_MATERIAIS_SPE2_20260108.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-08',
    layoutEsperado: 'LAY-MAT-v2', divergenciasLayout: [], registrosDeclarados: 6,
    recibo: { numero: 'REC-2026-0006', emitidoEm: '2026-01-08', emitidoPara: VENDOR, aceito: true, observacao: null },
  },
  {
    id: 'ARQ-007', nomeArquivo: 'NASAJON_MATERIAIS_SPE3_20260109.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-3', ciclo: 'ciclo-1', recebidoEm: '2026-01-09',
    layoutEsperado: 'LAY-MAT-v2',
    divergenciasLayout: [{ campo: 'NCM', problema: 'Coluna presente, mas entregue sem máscara em parte das linhas.' }],
    registrosDeclarados: 6,
    recibo: {
      numero: 'REC-2026-0007', emitidoEm: '2026-01-09', emitidoPara: VENDOR, aceito: true,
      observacao: 'Divergência de máscara tratada na transformação. Não bloqueia.',
    },
  },
  // ---- Wave 3 · contratos ----
  {
    id: 'ARQ-008', nomeArquivo: 'NASAJON_CONTRATOS_SPE1_20260112.XML', formato: 'XML',
    objetoId: 'contratos', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-12',
    layoutEsperado: 'LAY-CTR-v1', divergenciasLayout: [], registrosDeclarados: 5,
    recibo: { numero: 'REC-2026-0008', emitidoEm: '2026-01-12', emitidoPara: VENDOR, aceito: true, observacao: null },
  },
  {
    id: 'ARQ-009', nomeArquivo: 'NASAJON_CONTRATOS_SPE2_20260112.XML', formato: 'XML',
    objetoId: 'contratos', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-12',
    layoutEsperado: 'LAY-CTR-v1',
    divergenciasLayout: [{ campo: 'UNIDADE_MEDIDA', problema: 'Domínio livre: metro linear vem como "MT" e não como "M".' }],
    registrosDeclarados: 5,
    recibo: {
      numero: 'REC-2026-0009', emitidoEm: '2026-01-12', emitidoPara: VENDOR, aceito: true,
      observacao: 'Divergência de unidade tratada por regra do playbook. Não bloqueia.',
    },
  },
]
