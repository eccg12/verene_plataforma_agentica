/** Rotas do protótipo. Telas novas registram seu path aqui antes de virar rota. */
export const paths = {
  home: '/',
  missionControl: '/mission-control',
  playbook: '/playbook',
  mapping: '/mapping',
  /** Base da rota de rastreabilidade; o id do registro vem depois. */
  recordBase: '/record',
  record: '/record/:id',
  duplicates: '/review/duplicates',
  exceptions: '/review/exceptions',
  packages: '/packages',
  reconciliation: '/reconciliation',
  styleguide: '/styleguide',
} as const

export type Path = (typeof paths)[keyof typeof paths]
