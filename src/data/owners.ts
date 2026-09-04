/**
 * Donos nomeados. Exceção sem pessoa não é exceção, é registro perdido.
 *
 * A fila do NOVA roteia por classe: exceção técnica vai para o SAP SME, exceção
 * de negócio vai para o data owner da Verene. Cada área tem um nome, e é esse
 * nome que aparece na tela — não "time de dados".
 */

export interface Owner {
  readonly area: string
  readonly nome: string
  readonly papel: string
}

export const owners: readonly Owner[] = [
  { area: 'Verene · Suprimentos', nome: 'Ana Ribeiro', papel: 'Gerente de suprimentos' },
  { area: 'Verene · Fiscal', nome: 'Carlos Menezes', papel: 'Coordenador fiscal' },
  { area: 'Verene · Data owner', nome: 'Helena Duarte', papel: 'Data owner do projeto' },
  { area: 'Verene · Arquitetura S/4HANA', nome: 'Rafael Queiroz', papel: 'SAP SME' },
  { area: 'Verene · Basis', nome: 'Tiago Fontes', papel: 'Coordenador Basis' },
  { area: 'Monoda · Data Engineering', nome: 'Marina Dantas', papel: 'Líder de data engineering' },
  { area: 'Monoda · Arquitetura S/4HANA', nome: 'Rafael Queiroz', papel: 'SAP SME' },
  { area: 'Monoda · Governança', nome: 'Patrícia Lemos', papel: 'Governança do playbook' },
]

const porArea: ReadonlyMap<string, Owner> = new Map(owners.map((o) => [o.area, o]))

export function ownerDaArea(area: string): Owner | null {
  return porArea.get(area) ?? null
}
