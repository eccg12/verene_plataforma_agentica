/**
 * Fornecedores já cadastrados na Verene, no tenant S/4HANA.
 *
 * É contra esta base que o escopo do Nasajon tem que ser confrontado antes de
 * qualquer carga. Dois registros aqui são os mesmos CNPJ que aparecem no
 * extrato das SPEs (F1004 e F3003): devem ser REUSADOS, não recriados. Criar de
 * novo gera Business Partner duplicado com o mesmo CNPJ — o tipo de erro que só
 * aparece meses depois, no fechamento fiscal.
 *
 * Números de Business Partner dentro da faixa externa ZFOR declarada em
 * `tenant-config.ts` (1000000000 a 1499999999).
 *
 * Todas as razões sociais são fictícias, escolhidas no registro do setor. Não
 * há nome de empresa real aqui de propósito: são registros inventados, com CNPJ
 * inventado, e associar os dois a uma empresa que existe seria afirmar como
 * verdadeiro um cadastro que não é.
 */
import type { Uf } from '@/data/types'

export interface ExistingSupplier {
  /** Número do Business Partner no tenant. */
  readonly businessPartner: string
  readonly grupoContas: 'ZFOR' | 'ZFPF' | 'ZFOI'
  readonly razaoSocial: string
  readonly cnpjCpf: string
  readonly municipio: string
  readonly codigoIbge: string
  readonly uf: Uf
  readonly condicaoPagamento: string
  readonly bloqueado: boolean
  readonly criadoEm: string
  /** Código no extrato do Nasajon quando o mesmo CNPJ reaparece no escopo. */
  readonly duplicadoDoNasajon: string | null
}

export const existingSuppliers: readonly ExistingSupplier[] = [
  // --- os dois que reaparecem no escopo das SPEs ---
  { businessPartner: '1000004472', grupoContas: 'ZFOR', razaoSocial: 'CONDULINK COMERCIO DE CABOS E CONDUTORES LTDA', cnpjCpf: '09175283000187', municipio: 'Campinas', codigoIbge: '3509502', uf: 'SP', condicaoPagamento: 'Z2856', bloqueado: false, criadoEm: '2021-06-14', duplicadoDoNasajon: 'F1004' },
  { businessPartner: '1000004488', grupoContas: 'ZFOR', razaoSocial: 'INSPETEC ENSAIOS E INSPECOES TECNICAS LTDA', cnpjCpf: '07048362000100', municipio: 'Porto Alegre', codigoIbge: '4314902', uf: 'RS', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-09-02', duplicadoDoNasajon: 'F3003' },
  // --- demais fornecedores já ativos na Verene ---
  { businessPartner: '1000003011', grupoContas: 'ZFOR', razaoSocial: 'VOLTERA ENERGIA EQUIPAMENTOS LTDA', cnpjCpf: '27418036000146', municipio: 'Jundiaí', codigoIbge: '3525904', uf: 'SP', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2020-02-11', duplicadoDoNasajon: null },
  { businessPartner: '1000003024', grupoContas: 'ZFOR', razaoSocial: 'TERMINALIX INDUSTRIA DE CONECTORES LTDA', cnpjCpf: '31570492000184', municipio: 'Itajubá', codigoIbge: '3132404', uf: 'MG', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-03-05', duplicadoDoNasajon: null },
  { businessPartner: '1000003058', grupoContas: 'ZFOR', razaoSocial: 'FERROLINHA PRODUTOS ELETRICOS SA', cnpjCpf: '19284637000185', municipio: 'Mandaguari', codigoIbge: '4114302', uf: 'PR', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2020-04-22', duplicadoDoNasajon: null },
  { businessPartner: '1000003077', grupoContas: 'ZFOR', razaoSocial: 'PORCELINHA ISOLADORES CERAMICOS SA', cnpjCpf: '26095183000160', municipio: 'Timbó', codigoIbge: '4218004', uf: 'SC', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-05-18', duplicadoDoNasajon: null },
  { businessPartner: '1000003102', grupoContas: 'ZFOR', razaoSocial: 'MONTELET ENGENHARIA E MONTAGENS LTDA', cnpjCpf: '33741620000130', municipio: 'Belo Horizonte', codigoIbge: '3106200', uf: 'MG', condicaoPagamento: 'Z2856', bloqueado: false, criadoEm: '2020-07-09', duplicadoDoNasajon: null },
  { businessPartner: '1000003119', grupoContas: 'ZFOR', razaoSocial: 'MANTENSUL SERVICOS DE MANUTENCAO LTDA', cnpjCpf: '21860497000198', municipio: 'Florianópolis', codigoIbge: '4205407', uf: 'SC', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-08-27', duplicadoDoNasajon: null },
  { businessPartner: '1000003143', grupoContas: 'ZFOR', razaoSocial: 'ALVORADA ENGENHARIA DE TRANSMISSAO SA', cnpjCpf: '29013758000146', municipio: 'São Paulo', codigoIbge: '3550308', uf: 'SP', condicaoPagamento: 'Z306090', bloqueado: false, criadoEm: '2020-09-14', duplicadoDoNasajon: null },
  { businessPartner: '1000003166', grupoContas: 'ZFOR', razaoSocial: 'CABOPAR CONDUTORES ELETRICOS LTDA', cnpjCpf: '35472109000106', municipio: 'Quatro Barras', codigoIbge: '4121307', uf: 'PR', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2020-10-30', duplicadoDoNasajon: null },
  { businessPartner: '1000003188', grupoContas: 'ZFOR', razaoSocial: 'VITRALUX INDUSTRIA E COMERCIO LTDA', cnpjCpf: '24689031000160', municipio: 'Mogi Mirim', codigoIbge: '3530607', uf: 'SP', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-11-11', duplicadoDoNasajon: null },
  { businessPartner: '1000003205', grupoContas: 'ZFOR', razaoSocial: 'FORJANORTE COMPONENTES FORJADOS SA', cnpjCpf: '30157842000112', municipio: 'Canoas', codigoIbge: '4304606', uf: 'RS', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2021-01-19', duplicadoDoNasajon: null },
  { businessPartner: '1000003231', grupoContas: 'ZFOR', razaoSocial: 'VERDELINHA CONSULTORIA AMBIENTAL LTDA', cnpjCpf: '22394076000181', municipio: 'Curitiba', codigoIbge: '4106902', uf: 'PR', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-02-08', duplicadoDoNasajon: null },
  { businessPartner: '1000003254', grupoContas: 'ZFOR', razaoSocial: 'PROTELINHA EQUIPAMENTOS DE SEGURANCA LTDA', cnpjCpf: '36820513000196', municipio: 'Contagem', codigoIbge: '3118601', uf: 'MG', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2021-03-16', duplicadoDoNasajon: null },
  { businessPartner: '1000003277', grupoContas: 'ZFOR', razaoSocial: 'CALDEIRASUL CALDEIRARIA E EQUIPAMENTOS LTDA', cnpjCpf: '25731904000118', municipio: 'Duque de Caxias', codigoIbge: '3301702', uf: 'RJ', condicaoPagamento: 'Z2856', bloqueado: true, criadoEm: '2021-04-27', duplicadoDoNasajon: null },
  { businessPartner: '1000003299', grupoContas: 'ZFOR', razaoSocial: 'TRACADO ENGENHARIA DE PROJETOS LTDA', cnpjCpf: '32046871000132', municipio: 'Rio de Janeiro', codigoIbge: '3304557', uf: 'RJ', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-05-10', duplicadoDoNasajon: null },
  { businessPartner: '1000003318', grupoContas: 'ZFOR', razaoSocial: 'METALUME INDUSTRIA E COMERCIO SA', cnpjCpf: '28619350000150', municipio: 'São Paulo', codigoIbge: '3550308', uf: 'SP', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2021-07-21', duplicadoDoNasajon: null },
  { businessPartner: '1000003340', grupoContas: 'ZFOR', razaoSocial: 'TRANSMINAS COMPANHIA DE TRANSMISSAO SA', cnpjCpf: '34205176000100', municipio: 'Belo Horizonte', codigoIbge: '3106200', uf: 'MG', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-08-03', duplicadoDoNasajon: null },
  { businessPartner: '1000003362', grupoContas: 'ZFOR', razaoSocial: 'MEGAVOLT EQUIPAMENTOS ELETRICOS LTDA', cnpjCpf: '23508914000163', municipio: 'Sorocaba', codigoIbge: '3552205', uf: 'SP', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2021-10-15', duplicadoDoNasajon: null },
  { businessPartner: '1000003385', grupoContas: 'ZFOR', razaoSocial: 'GEOVISTA SENSORIAMENTO REMOTO LTDA', cnpjCpf: '31792648000171', municipio: 'São José dos Campos', codigoIbge: '3549904', uf: 'SP', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-11-29', duplicadoDoNasajon: null },
  { businessPartner: '1000003407', grupoContas: 'ZFOR', razaoSocial: 'SERRA AZUL ENGENHARIA SA', cnpjCpf: '26340187000166', municipio: 'Belo Horizonte', codigoIbge: '3106200', uf: 'MG', condicaoPagamento: 'Z306090', bloqueado: false, criadoEm: '2022-01-12', duplicadoDoNasajon: null },
  { businessPartner: '1000003429', grupoContas: 'ZFOR', razaoSocial: 'ELETROMEC BANDEIRANTES LTDA', cnpjCpf: '35916402000115', municipio: 'Matão', codigoIbge: '3529302', uf: 'SP', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2022-02-24', duplicadoDoNasajon: null },
  { businessPartner: '1000003451', grupoContas: 'ZFOR', razaoSocial: 'CARTOTOP TOPOGRAFIA E ENGENHARIA LTDA', cnpjCpf: '29874531000195', municipio: 'Brasília', codigoIbge: '5300108', uf: 'DF', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2022-03-30', duplicadoDoNasajon: null },
  { businessPartner: '1000003474', grupoContas: 'ZFOR', razaoSocial: 'MOTORSUL EQUIPAMENTOS ELETRICOS SA', cnpjCpf: '21063795000157', municipio: 'Jaraguá do Sul', codigoIbge: '4208906', uf: 'SC', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2022-05-06', duplicadoDoNasajon: null },
  { businessPartner: '1000003496', grupoContas: 'ZFOR', razaoSocial: 'VIDROLET ISOLADORES LTDA', cnpjCpf: '33482160000173', municipio: 'Caxias do Sul', codigoIbge: '4305108', uf: 'RS', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2022-06-17', duplicadoDoNasajon: null },
  { businessPartner: '1000003512', grupoContas: 'ZFOR', razaoSocial: 'ROTOMEC SERVICOS INDUSTRIAIS SA', cnpjCpf: '27159048000101', municipio: 'Guarulhos', codigoIbge: '3518800', uf: 'SP', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2022-08-09', duplicadoDoNasajon: null },
  { businessPartner: '1000003535', grupoContas: 'ZFOR', razaoSocial: 'ICAMAR GUINDASTES E TRANSPORTES LTDA', cnpjCpf: '30728563000161', municipio: 'Santos', codigoIbge: '3548500', uf: 'SP', condicaoPagamento: 'Z028', bloqueado: false, criadoEm: '2022-09-27', duplicadoDoNasajon: null },
  { businessPartner: '1000003557', grupoContas: 'ZFOR', razaoSocial: 'BIOAXIS ENGENHARIA AMBIENTAL LTDA', cnpjCpf: '24915307000180', municipio: 'Campinas', codigoIbge: '3509502', uf: 'SP', condicaoPagamento: 'Z030', bloqueado: true, criadoEm: '2022-11-14', duplicadoDoNasajon: null },
  { businessPartner: '1000003579', grupoContas: 'ZFOR', razaoSocial: 'CABOFIO CONDUTORES SA', cnpjCpf: '36074819000140', municipio: 'Americana', codigoIbge: '3501608', uf: 'SP', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2023-01-23', duplicadoDoNasajon: null },
  { businessPartner: '1000003591', grupoContas: 'ZFOR', razaoSocial: 'TOPOPLAN LEVANTAMENTOS TOPOGRAFICOS LTDA', cnpjCpf: '22587036000156', municipio: 'Goiânia', codigoIbge: '5208707', uf: 'GO', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2023-03-08', duplicadoDoNasajon: null },
]
