/**
 * Tabela de municípios do IBGE — fonte de referência para o enriquecimento.
 *
 * NOVA usa esta tabela para derivar o código IBGE dos registros que vieram só
 * com município e UF. Derivar de fonte de referência é determinístico e
 * auditável; é o que separa enriquecimento de chute.
 *
 * Cobre os municípios presentes nas fixtures. Município fora desta tabela não é
 * enriquecido — o registro é retido, e é isso que se quer: a esteira não
 * inventa código de município.
 */
import type { Uf } from '@/engine/br-documents'

export interface Municipio {
  readonly nome: string
  readonly uf: Uf
  readonly codigoIbge: string
}

export const municipios: readonly Municipio[] = [
  { nome: 'Uberlandia', uf: 'MG', codigoIbge: '3170206' },
  { nome: 'Belo Horizonte', uf: 'MG', codigoIbge: '3106200' },
  { nome: 'Betim', uf: 'MG', codigoIbge: '3106705' },
  { nome: 'Juiz de Fora', uf: 'MG', codigoIbge: '3136702' },
  { nome: 'Uberaba', uf: 'MG', codigoIbge: '3170107' },
  { nome: 'Contagem', uf: 'MG', codigoIbge: '3118601' },
  { nome: 'Itajuba', uf: 'MG', codigoIbge: '3132404' },
  { nome: 'Sao Paulo', uf: 'SP', codigoIbge: '3550308' },
  { nome: 'Campinas', uf: 'SP', codigoIbge: '3509502' },
  { nome: 'Ribeirao Preto', uf: 'SP', codigoIbge: '3543402' },
  { nome: 'Bauru', uf: 'SP', codigoIbge: '3506003' },
  { nome: 'Sorocaba', uf: 'SP', codigoIbge: '3552205' },
  { nome: 'Santos', uf: 'SP', codigoIbge: '3548500' },
  { nome: 'Sao Jose dos Campos', uf: 'SP', codigoIbge: '3549904' },
  { nome: 'Guarulhos', uf: 'SP', codigoIbge: '3518800' },
  { nome: 'Jundiai', uf: 'SP', codigoIbge: '3525904' },
  { nome: 'Americana', uf: 'SP', codigoIbge: '3501608' },
  { nome: 'Matao', uf: 'SP', codigoIbge: '3529302' },
  { nome: 'Mogi Mirim', uf: 'SP', codigoIbge: '3530607' },
  { nome: 'Curitiba', uf: 'PR', codigoIbge: '4106902' },
  { nome: 'Londrina', uf: 'PR', codigoIbge: '4113700' },
  { nome: 'Maringa', uf: 'PR', codigoIbge: '4115200' },
  { nome: 'Cascavel', uf: 'PR', codigoIbge: '4104808' },
  { nome: 'Ponta Grossa', uf: 'PR', codigoIbge: '4119905' },
  { nome: 'Foz do Iguacu', uf: 'PR', codigoIbge: '4108304' },
  { nome: 'Mandaguari', uf: 'PR', codigoIbge: '4114302' },
  { nome: 'Quatro Barras', uf: 'PR', codigoIbge: '4121307' },
  { nome: 'Joinville', uf: 'SC', codigoIbge: '4209102' },
  { nome: 'Blumenau', uf: 'SC', codigoIbge: '4202404' },
  { nome: 'Chapeco', uf: 'SC', codigoIbge: '4204202' },
  { nome: 'Florianopolis', uf: 'SC', codigoIbge: '4205407' },
  { nome: 'Criciuma', uf: 'SC', codigoIbge: '4204608' },
  { nome: 'Timbo', uf: 'SC', codigoIbge: '4218004' },
  { nome: 'Jaragua do Sul', uf: 'SC', codigoIbge: '4208906' },
  { nome: 'Porto Alegre', uf: 'RS', codigoIbge: '4314902' },
  { nome: 'Caxias do Sul', uf: 'RS', codigoIbge: '4305108' },
  { nome: 'Passo Fundo', uf: 'RS', codigoIbge: '4314100' },
  { nome: 'Santa Maria', uf: 'RS', codigoIbge: '4316907' },
  { nome: 'Pelotas', uf: 'RS', codigoIbge: '4314407' },
  { nome: 'Canoas', uf: 'RS', codigoIbge: '4304606' },
  { nome: 'Novo Hamburgo', uf: 'RS', codigoIbge: '4313409' },
  { nome: 'Santa Cruz do Sul', uf: 'RS', codigoIbge: '4316808' },
  { nome: 'Erechim', uf: 'RS', codigoIbge: '4307005' },
  { nome: 'Goiania', uf: 'GO', codigoIbge: '5208707' },
  { nome: 'Anapolis', uf: 'GO', codigoIbge: '5201108' },
  { nome: 'Rio Verde', uf: 'GO', codigoIbge: '5218805' },
  { nome: 'Aparecida de Goiania', uf: 'GO', codigoIbge: '5201405' },
  { nome: 'Cuiaba', uf: 'MT', codigoIbge: '5103403' },
  { nome: 'Varzea Grande', uf: 'MT', codigoIbge: '5108402' },
  { nome: 'Rondonopolis', uf: 'MT', codigoIbge: '5107602' },
  { nome: 'Sinop', uf: 'MT', codigoIbge: '5107909' },
  { nome: 'Brasilia', uf: 'DF', codigoIbge: '5300108' },
  { nome: 'Palmas', uf: 'TO', codigoIbge: '1721000' },
  { nome: 'Rio de Janeiro', uf: 'RJ', codigoIbge: '3304557' },
  { nome: 'Duque de Caxias', uf: 'RJ', codigoIbge: '3301702' },
  { nome: 'Niteroi', uf: 'RJ', codigoIbge: '3303302' },
]

const COMBINANTES = /[\u0300-\u036f]/g

/** Normaliza para comparação: sem acento, caixa alta, sem espaço nas pontas. */
export function normalizarNome(nome: string): string {
  return nome.normalize('NFD').replace(COMBINANTES, '').toUpperCase().trim()
}

const chave = (nome: string, uf: string): string => `${normalizarNome(nome)}|${uf}`

const porChave: ReadonlyMap<string, Municipio> = new Map(
  municipios.map((m) => [chave(m.nome, m.uf), m]),
)

/** Busca determinística por nome + UF, ignorando acento e caixa. */
export function buscarMunicipio(nome: string, uf: string): Municipio | null {
  return porChave.get(chave(nome, uf)) ?? null
}
