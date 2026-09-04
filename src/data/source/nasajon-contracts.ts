/**
 * Extrato de contratos do Nasajon, com linhas de serviço.
 *
 * Divergências reais deste extrato:
 *
 * - **Unidade de medida.** O mesmo metro linear aparece como `M` na SPE-1,
 *   `MT` na SPE-2 e `METRO` nas SPE-3 e SPE-4. Nenhuma delas é o código que o
 *   tenant espera. É o caso mais barato de mostrar e o mais caro de errar: sem
 *   normalizar, o volume contratado muda de ordem de grandeza.
 * - **Fase fiscal pendente.** Dois contratos ainda não fecharam a fase fiscal;
 *   não podem ser migrados como Outline agreement até fechar.
 * - **Saldo em aberto.** Sempre menor que o valor original, porque os contratos
 *   estão parcialmente executados. Em dois deles a soma das linhas não bate com
 *   o valor original — esse é defeito, não execução parcial.
 *
 * Valores em BRL com duas casas. Como vieram de planilha, a soma das linhas é
 * comparada com tolerância de centavo no teste, não por igualdade exata.
 */
import type { PlantedDefect, SpeId } from '@/data/types'

/** Unidade de medida como está no legado — não normalizada de propósito. */
export type UnidadeLegado = 'M' | 'MT' | 'METRO' | 'KM' | 'UN' | 'H' | 'DIA' | 'MES' | 'VB'

export interface NasajonContractLine {
  readonly item: number
  readonly descricao: string
  readonly unidadeMedida: UnidadeLegado
  readonly quantidade: number
  readonly precoUnitario: number
  readonly valorTotal: number
  readonly centroCusto: string
}

export type FaseFiscal = 'concluida' | 'pendente'

export interface NasajonContract {
  readonly numero: string
  readonly spe: SpeId
  /** Código do fornecedor em `nasajon-suppliers.ts`. */
  readonly fornecedorCodigo: string
  readonly objeto: string
  readonly tipo: 'servico' | 'fornecimento' | 'locacao'
  readonly dataInicio: string
  readonly dataFim: string
  readonly moeda: 'BRL'
  readonly valorOriginal: number
  readonly saldoAberto: number
  readonly faseFiscal: FaseFiscal
  readonly linhas: readonly NasajonContractLine[]
  readonly _plantedDefect: readonly PlantedDefect[]
}

const UOM_DIVERGENTE = (unidade: string, esperado: string): PlantedDefect => ({
  kind: 'unidade-medida-divergente',
  origin: 'defect-transformation',
  field: 'linhas[].unidadeMedida',
  note: `Metro linear registrado como "${unidade}". Outras SPEs usam "${esperado}". O tenant não aceita nenhuma das duas sem conversão.`,
})

export const nasajonContracts: readonly NasajonContract[] = [
  // ---------------- SPE-1 — metro linear como "M" ----------------
  {
    numero: 'CTR-2023-101', spe: 'SPE-1', fornecedorCodigo: 'F1001',
    objeto: 'Manutenção preventiva de linha de transmissão 230 kV — trecho Uberlândia/Araguari',
    tipo: 'servico', dataInicio: '01/03/2023', dataFim: '28/02/2025', moeda: 'BRL',
    valorOriginal: 884800.0, saldoAberto: 331800.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 230 kV', unidadeMedida: 'M', quantidade: 48000, precoUnitario: 12.5, valorTotal: 600000.0, centroCusto: 'CC-LT-230' },
      { item: 20, descricao: 'Substituição de cadeia de isoladores de suspensão', unidadeMedida: 'UN', quantidade: 320, precoUnitario: 890.0, valorTotal: 284800.0, centroCusto: 'CC-LT-230' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-102', spe: 'SPE-1', fornecedorCodigo: 'F1002',
    objeto: 'Locação de guindaste com operador para montagem de estruturas',
    tipo: 'locacao', dataInicio: '15/04/2023', dataFim: '14/04/2025', moeda: 'BRL',
    valorOriginal: 756000.0, saldoAberto: 189000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Locação de guindaste 60 t com operador', unidadeMedida: 'DIA', quantidade: 180, precoUnitario: 4200.0, valorTotal: 756000.0, centroCusto: 'CC-OBRA-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-103', spe: 'SPE-1', fornecedorCodigo: 'F1005',
    objeto: 'Levantamento topográfico de faixa de servidão',
    tipo: 'servico', dataInicio: '02/05/2023', dataFim: '01/05/2024', moeda: 'BRL',
    valorOriginal: 120000.0, saldoAberto: 42000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Levantamento topográfico de faixa de servidão', unidadeMedida: 'M', quantidade: 32000, precoUnitario: 3.75, valorTotal: 120000.0, centroCusto: 'CC-ENG-02' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-104', spe: 'SPE-1', fornecedorCodigo: 'F1004',
    objeto: 'Fornecimento de cabo condutor e cabo para-raios',
    tipo: 'fornecimento', dataInicio: '10/01/2023', dataFim: '09/01/2025', moeda: 'BRL',
    valorOriginal: 2238600.0, saldoAberto: 745200.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Cabo condutor CAA 336,4 MCM Linnet', unidadeMedida: 'M', quantidade: 26000, precoUnitario: 38.9, valorTotal: 1011400.0, centroCusto: 'CC-SUP-01' },
      { item: 20, descricao: 'Cabo para-raios OPGW 24 fibras', unidadeMedida: 'M', quantidade: 26000, precoUnitario: 47.2, valorTotal: 1227200.0, centroCusto: 'CC-SUP-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-105', spe: 'SPE-1', fornecedorCodigo: 'F1010',
    objeto: 'Projeto executivo de recapacitação de LT 138 kV',
    tipo: 'servico', dataInicio: '01/09/2023', dataFim: '31/08/2024', moeda: 'BRL',
    valorOriginal: 486000.0, saldoAberto: 486000.0, faseFiscal: 'pendente',
    linhas: [
      { item: 10, descricao: 'Projeto executivo de recapacitação de LT 138 kV', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 486000.0, valorTotal: 486000.0, centroCusto: 'CC-ENG-01' },
    ],
    _plantedDefect: [
      {
        kind: 'fase-fiscal-pendente', origin: 'defect-source', field: 'faseFiscal',
        note: 'Fase fiscal não encerrada no Nasajon. Não pode virar Outline agreement enquanto não fechar — migrar agora cria compromisso sem lastro fiscal.',
      },
    ],
  },
  // ---------------- SPE-2 — metro linear como "MT" ----------------
  {
    numero: 'CTR-2023-201', spe: 'SPE-2', fornecedorCodigo: 'F2001',
    objeto: 'Projeto básico de subestação 230/69 kV e acompanhamento de comissionamento',
    tipo: 'servico', dataInicio: '01/02/2023', dataFim: '31/01/2025', moeda: 'BRL',
    valorOriginal: 1062000.0, saldoAberto: 318600.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Projeto básico de subestação 230/69 kV', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 720000.0, valorTotal: 720000.0, centroCusto: 'CC-SE-01' },
      { item: 20, descricao: 'Acompanhamento de comissionamento', unidadeMedida: 'H', quantidade: 1200, precoUnitario: 285.0, valorTotal: 342000.0, centroCusto: 'CC-SE-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-202', spe: 'SPE-2', fornecedorCodigo: 'F2002',
    objeto: 'Locação de plataforma elevatória articulada',
    tipo: 'locacao', dataInicio: '20/03/2023', dataFim: '19/03/2025', moeda: 'BRL',
    valorOriginal: 444000.0, saldoAberto: 133200.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Locação de plataforma elevatória articulada 26 m', unidadeMedida: 'DIA', quantidade: 240, precoUnitario: 1850.0, valorTotal: 444000.0, centroCusto: 'CC-OBRA-02' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-203', spe: 'SPE-2', fornecedorCodigo: 'F2003',
    objeto: 'Manutenção corretiva de linha de transmissão 138 kV',
    tipo: 'servico', dataInicio: '05/06/2023', dataFim: '04/06/2025', moeda: 'BRL',
    valorOriginal: 637200.0, saldoAberto: 254880.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção corretiva de LT 138 kV', unidadeMedida: 'MT', quantidade: 54000, precoUnitario: 11.8, valorTotal: 637200.0, centroCusto: 'CC-LT-138' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('MT', 'M')],
  },
  {
    numero: 'CTR-2023-204', spe: 'SPE-2', fornecedorCodigo: 'F2007',
    objeto: 'Georreferenciamento de faixa de servidão',
    tipo: 'servico', dataInicio: '11/07/2023', dataFim: '10/07/2024', moeda: 'BRL',
    valorOriginal: 172200.0, saldoAberto: 68880.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Georreferenciamento de faixa de servidão', unidadeMedida: 'MT', quantidade: 41000, precoUnitario: 4.2, valorTotal: 172200.0, centroCusto: 'CC-ENG-02' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('MT', 'M')],
  },
  {
    numero: 'CTR-2023-205', spe: 'SPE-2', fornecedorCodigo: 'F2010',
    objeto: 'Transporte de estruturas metálicas para canteiros',
    tipo: 'servico', dataInicio: '01/08/2023', dataFim: '31/07/2025', moeda: 'BRL',
    valorOriginal: 520700.0, saldoAberto: 156210.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Transporte rodoviário de estruturas metálicas', unidadeMedida: 'KM', quantidade: 82000, precoUnitario: 6.35, valorTotal: 520700.0, centroCusto: 'CC-LOG-01' },
    ],
    _plantedDefect: [],
  },
  // ---------------- SPE-3 — metro linear como "METRO" ----------------
  {
    numero: 'CTR-2023-301', spe: 'SPE-3', fornecedorCodigo: 'F3001',
    objeto: 'Manutenção preventiva de linha de transmissão 500 kV',
    tipo: 'servico', dataInicio: '01/04/2023', dataFim: '31/03/2026', moeda: 'BRL',
    valorOriginal: 866200.0, saldoAberto: 433100.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 500 kV', unidadeMedida: 'METRO', quantidade: 61000, precoUnitario: 14.2, valorTotal: 866200.0, centroCusto: 'CC-LT-500' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('METRO', 'M')],
  },
  {
    numero: 'CTR-2023-302', spe: 'SPE-3', fornecedorCodigo: 'F3005',
    objeto: 'Manutenção em linha viva 230 kV com mobilização de equipe especializada',
    tipo: 'servico', dataInicio: '15/05/2023', dataFim: '14/05/2025', moeda: 'BRL',
    valorOriginal: 1000000.0, saldoAberto: 400000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção em linha viva 230 kV', unidadeMedida: 'METRO', quantidade: 38000, precoUnitario: 22.5, valorTotal: 855000.0, centroCusto: 'CC-LT-230' },
      { item: 20, descricao: 'Mobilização de equipe especializada', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 145000.0, valorTotal: 145000.0, centroCusto: 'CC-LT-230' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('METRO', 'M')],
  },
  {
    numero: 'CTR-2023-303', spe: 'SPE-3', fornecedorCodigo: 'F3003',
    objeto: 'Inspeção termográfica e ensaios de aterramento',
    tipo: 'servico', dataInicio: '01/06/2023', dataFim: '31/05/2025', moeda: 'BRL',
    valorOriginal: 680200.0, saldoAberto: 204060.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Inspeção termográfica de subestação', unidadeMedida: 'UN', quantidade: 48, precoUnitario: 8900.0, valorTotal: 427200.0, centroCusto: 'CC-SE-02' },
      { item: 20, descricao: 'Ensaio de resistência de aterramento', unidadeMedida: 'UN', quantidade: 220, precoUnitario: 1150.0, valorTotal: 253000.0, centroCusto: 'CC-SE-02' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-304', spe: 'SPE-3', fornecedorCodigo: 'F3010',
    objeto: 'Programa de monitoramento ambiental da faixa de servidão',
    tipo: 'servico', dataInicio: '01/03/2023', dataFim: '28/02/2025', moeda: 'BRL',
    valorOriginal: 520000.0, saldoAberto: 208000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Programa de monitoramento ambiental de faixa', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 380000.0, valorTotal: 380000.0, centroCusto: 'CC-AMB-01' },
      { item: 20, descricao: 'Relatório semestral de conformidade', unidadeMedida: 'UN', quantidade: 4, precoUnitario: 42000.0, valorTotal: 168000.0, centroCusto: 'CC-AMB-01' },
    ],
    _plantedDefect: [
      {
        kind: 'saldo-diverge-do-original', origin: 'defect-source', field: 'valorOriginal',
        note: 'A soma das linhas dá 548.000,00 e o cabeçalho diz 520.000,00. Aditivo lançado só na linha, sem atualizar o valor do contrato.',
      },
    ],
  },
  // ---------------- SPE-4 — metro linear como "METRO" ----------------
  {
    numero: 'CTR-2023-401', spe: 'SPE-4', fornecedorCodigo: 'F4003',
    objeto: 'Manutenção preventiva de linha de transmissão 345 kV',
    tipo: 'servico', dataInicio: '01/05/2023', dataFim: '30/04/2025', moeda: 'BRL',
    valorOriginal: 598400.0, saldoAberto: 239360.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 345 kV', unidadeMedida: 'METRO', quantidade: 44000, precoUnitario: 13.6, valorTotal: 598400.0, centroCusto: 'CC-LT-345' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('METRO', 'M')],
  },
  {
    numero: 'CTR-2023-402', spe: 'SPE-4', fornecedorCodigo: 'F4004',
    objeto: 'Locação de plataforma aérea para manutenção de estruturas',
    tipo: 'locacao', dataInicio: '10/08/2023', dataFim: '09/08/2025', moeda: 'BRL',
    valorOriginal: 420000.0, saldoAberto: 126000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Locação de plataforma aérea 42 m', unidadeMedida: 'DIA', quantidade: 200, precoUnitario: 2100.0, valorTotal: 420000.0, centroCusto: 'CC-OBRA-04' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-403', spe: 'SPE-4', fornecedorCodigo: 'F4009',
    objeto: 'Vigilância patrimonial de subestações',
    tipo: 'servico', dataInicio: '01/10/2023', dataFim: '30/09/2025', moeda: 'BRL',
    valorOriginal: 924000.0, saldoAberto: 924000.0, faseFiscal: 'pendente',
    linhas: [
      { item: 10, descricao: 'Vigilância patrimonial de subestação', unidadeMedida: 'MES', quantidade: 24, precoUnitario: 38500.0, valorTotal: 924000.0, centroCusto: 'CC-SEG-01' },
    ],
    _plantedDefect: [
      {
        kind: 'fase-fiscal-pendente', origin: 'defect-source', field: 'faseFiscal',
        note: 'Fase fiscal não encerrada no Nasajon. Não pode virar Outline agreement enquanto não fechar.',
      },
    ],
  },
  {
    numero: 'CTR-2023-404', spe: 'SPE-4', fornecedorCodigo: 'F4010',
    objeto: 'Roçada mecanizada e destoca da faixa de servidão',
    tipo: 'servico', dataInicio: '01/07/2023', dataFim: '30/06/2025', moeda: 'BRL',
    valorOriginal: 445000.0, saldoAberto: 178000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Roçada mecanizada de faixa de servidão', unidadeMedida: 'METRO', quantidade: 96000, precoUnitario: 2.85, valorTotal: 273600.0, centroCusto: 'CC-AMB-02' },
      { item: 20, descricao: 'Destoca e limpeza pontual', unidadeMedida: 'UN', quantidade: 480, precoUnitario: 320.0, valorTotal: 153600.0, centroCusto: 'CC-AMB-02' },
    ],
    _plantedDefect: [
      UOM_DIVERGENTE('METRO', 'M'),
      {
        kind: 'saldo-diverge-do-original', origin: 'defect-source', field: 'valorOriginal',
        note: 'A soma das linhas dá 427.200,00 e o cabeçalho diz 445.000,00. Diferença de 17.800,00 sem lançamento correspondente.',
      },
    ],
  },
]
