/**
 * Extrato de materiais do Nasajon.
 *
 * Defeitos plantados:
 *   4  sem NCM — sem ele não há classificação fiscal nem cálculo de imposto
 *   7  descrição fora de padrão — recado de comprador embutido no cadastro
 *      ("VER COM JOSE", "COMPRA URGENTE", "NAO USAR"), especificação incompleta
 *      ou caixa inconsistente. Três registros acumulam os dois defeitos.
 *
 * O padrão de descrição que o tenant espera está em `target/tenant-config.ts`.
 * Aqui os dados vêm como estão no legado — não normalizados.
 */
import type { PlantedDefect, SpeId } from '@/data/types'

export type GrupoMercadoria =
  | 'CONDUTOR' | 'ISOLADOR' | 'FERRAGEM' | 'EQUIP-SE' | 'EPI' | 'FERRAMENTA' | 'CONSUMIVEL' | 'ESTRUTURA'

export type UnidadeMaterial = 'M' | 'UN' | 'KG' | 'L' | 'PC' | 'PAR' | 'CJ'

/** Origem da mercadoria no padrão SPED: 0 nacional, 1 importação direta, 2 mercado interno. */
export type OrigemMercadoria = '0' | '1' | '2'

export interface NasajonMaterial {
  readonly codigo: string
  readonly spe: SpeId
  /** Descrição exatamente como está no legado. */
  readonly descricao: string
  readonly grupoMercadoria: GrupoMercadoria
  readonly unidadeMedida: UnidadeMaterial
  /** NCM de 8 dígitos com máscara; `null` quando o extrato não trouxe. */
  readonly ncm: string | null
  readonly origemMercadoria: OrigemMercadoria
  readonly precoMedio: number
  readonly ativo: boolean
  readonly _plantedDefect: readonly PlantedDefect[]
}

const SEM_NCM: PlantedDefect = {
  kind: 'ncm-ausente', origin: 'defect-source', field: 'ncm',
  note: 'NCM em branco. Sem classificação fiscal o material não fecha cálculo de imposto no destino.',
}
const FORA_PADRAO = (motivo: string): PlantedDefect => ({
  kind: 'descricao-fora-de-padrao', origin: 'defect-source', field: 'descricao',
  note: `Descrição fora do padrão do tenant: ${motivo}`,
})

export const nasajonMaterials: readonly NasajonMaterial[] = [
  // ---------------- SPE-1 ----------------
  { codigo: 'MAT-1001', spe: 'SPE-1', descricao: 'CABO CAA 336,4 MCM LINNET', grupoMercadoria: 'CONDUTOR', unidadeMedida: 'M', ncm: '7614.10.00', origemMercadoria: '0', precoMedio: 38.9, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1002', spe: 'SPE-1', descricao: 'CABO PARA-RAIOS OPGW 24 FIBRAS', grupoMercadoria: 'CONDUTOR', unidadeMedida: 'M', ncm: '8544.70.10', origemMercadoria: '2', precoMedio: 47.2, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1003', spe: 'SPE-1', descricao: 'ISOLADOR POLIMERICO 230 KV', grupoMercadoria: 'ISOLADOR', unidadeMedida: 'UN', ncm: '8546.90.00', origemMercadoria: '0', precoMedio: 890.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1004', spe: 'SPE-1', descricao: 'isolador vidro', grupoMercadoria: 'ISOLADOR', unidadeMedida: 'UN', ncm: '8546.10.00', origemMercadoria: '0', precoMedio: 142.5, ativo: true,
    _plantedDefect: [FORA_PADRAO('caixa baixa e sem especificação de classe ou tensão.')] },
  { codigo: 'MAT-1005', spe: 'SPE-1', descricao: 'CADEIA DE ISOLADORES SUSPENSAO 138 KV', grupoMercadoria: 'ISOLADOR', unidadeMedida: 'CJ', ncm: '8546.90.00', origemMercadoria: '0', precoMedio: 1240.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1006', spe: 'SPE-1', descricao: 'GRAMPO DE SUSPENSAO PARA CABO CAA', grupoMercadoria: 'FERRAGEM', unidadeMedida: 'UN', ncm: '7616.99.00', origemMercadoria: '0', precoMedio: 96.4, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1007', spe: 'SPE-1', descricao: 'CABO 336 MCM - VER COM JOSE', grupoMercadoria: 'CONDUTOR', unidadeMedida: 'M', ncm: null, origemMercadoria: '0', precoMedio: 38.9, ativo: true,
    _plantedDefect: [FORA_PADRAO('recado de comprador embutido na descrição ("VER COM JOSE").'), SEM_NCM] },
  // ---------------- SPE-2 ----------------
  { codigo: 'MAT-2001', spe: 'SPE-2', descricao: 'PARA-RAIOS POLIMERICO 192 KV', grupoMercadoria: 'EQUIP-SE', unidadeMedida: 'UN', ncm: '8535.40.10', origemMercadoria: '0', precoMedio: 4380.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-2002', spe: 'SPE-2', descricao: 'CHAVE SECCIONADORA 245 KV', grupoMercadoria: 'EQUIP-SE', unidadeMedida: 'UN', ncm: '8535.30.00', origemMercadoria: '1', precoMedio: 68400.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-2003', spe: 'SPE-2', descricao: 'PARAFUSO M16X50 (COMPRA URGENTE)', grupoMercadoria: 'FERRAGEM', unidadeMedida: 'UN', ncm: '7318.15.00', origemMercadoria: '0', precoMedio: 4.2, ativo: true,
    _plantedDefect: [FORA_PADRAO('marcação de urgência de compra embutida na descrição.')] },
  { codigo: 'MAT-2004', spe: 'SPE-2', descricao: 'CONECTOR CUNHA - NAO USAR - SUBSTITUIDO', grupoMercadoria: 'FERRAGEM', unidadeMedida: 'UN', ncm: null, origemMercadoria: '0', precoMedio: 58.0, ativo: false,
    _plantedDefect: [FORA_PADRAO('status do item escrito na descrição em vez de no campo de bloqueio.'), SEM_NCM] },
  { codigo: 'MAT-2005', spe: 'SPE-2', descricao: 'TRANSFORMADOR DE CORRENTE 230 KV', grupoMercadoria: 'EQUIP-SE', unidadeMedida: 'UN', ncm: '8504.31.19', origemMercadoria: '1', precoMedio: 52700.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-2006', spe: 'SPE-2', descricao: 'ESTRUTURA METALICA TORRE AUTOPORTANTE', grupoMercadoria: 'ESTRUTURA', unidadeMedida: 'KG', ncm: '7308.20.00', origemMercadoria: '0', precoMedio: 18.7, ativo: true, _plantedDefect: [] },
  // ---------------- SPE-3 ----------------
  { codigo: 'MAT-3001', spe: 'SPE-3', descricao: 'CAPACETE CLASSE B ABNT NBR 8221', grupoMercadoria: 'EPI', unidadeMedida: 'UN', ncm: '6506.10.00', origemMercadoria: '0', precoMedio: 78.9, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-3002', spe: 'SPE-3', descricao: 'LUVA ISOLANTE CLASSE 2 *** ESTOQUE MINIMO ***', grupoMercadoria: 'EPI', unidadeMedida: 'PAR', ncm: '4015.19.00', origemMercadoria: '2', precoMedio: 412.0, ativo: true,
    _plantedDefect: [FORA_PADRAO('aviso de estoque mínimo embutido na descrição.')] },
  { codigo: 'MAT-3003', spe: 'SPE-3', descricao: 'VESTIMENTA ANTIARCO 12 CAL/CM2', grupoMercadoria: 'EPI', unidadeMedida: 'CJ', ncm: '6211.33.00', origemMercadoria: '2', precoMedio: 1890.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-3004', spe: 'SPE-3', descricao: 'CINTURAO PARAQUEDISTA COM TALABARTE DUPLO', grupoMercadoria: 'EPI', unidadeMedida: 'UN', ncm: '6307.90.90', origemMercadoria: '0', precoMedio: 645.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-3005', spe: 'SPE-3', descricao: 'graxa', grupoMercadoria: 'CONSUMIVEL', unidadeMedida: 'KG', ncm: null, origemMercadoria: '0', precoMedio: 32.8, ativo: true,
    _plantedDefect: [FORA_PADRAO('descrição de uma palavra, sem tipo, aplicação ou norma.'), SEM_NCM] },
  { codigo: 'MAT-3006', spe: 'SPE-3', descricao: 'DETECTOR DE TENSAO 15 KV', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'UN', ncm: '9030.31.00', origemMercadoria: '2', precoMedio: 2340.0, ativo: true, _plantedDefect: [] },
  // ---------------- SPE-4 ----------------
  { codigo: 'MAT-4001', spe: 'SPE-4', descricao: 'kit aterramento temporario 15kv obs: falta NF', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'CJ', ncm: '8535.90.00', origemMercadoria: '0', precoMedio: 3120.0, ativo: true,
    _plantedDefect: [FORA_PADRAO('caixa baixa e pendência documental ("falta NF") escrita na descrição.')] },
  { codigo: 'MAT-4002', spe: 'SPE-4', descricao: 'ALICATE AMPERIMETRO 1000 A', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'UN', ncm: '9030.33.90', origemMercadoria: '2', precoMedio: 890.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-4003', spe: 'SPE-4', descricao: 'OLEO ISOLANTE MINERAL TIPO A', grupoMercadoria: 'CONSUMIVEL', unidadeMedida: 'L', ncm: '2710.19.32', origemMercadoria: '0', precoMedio: 24.6, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-4004', spe: 'SPE-4', descricao: 'ESCADA DIELETRICA 7 M', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'UN', ncm: null, origemMercadoria: '0', precoMedio: 1480.0, ativo: true,
    _plantedDefect: [SEM_NCM] },
  { codigo: 'MAT-4005', spe: 'SPE-4', descricao: 'FITA AUTOFUSAO 19 MM X 10 M', grupoMercadoria: 'CONSUMIVEL', unidadeMedida: 'PC', ncm: '3919.10.00', origemMercadoria: '0', precoMedio: 42.3, ativo: true, _plantedDefect: [] },
]
