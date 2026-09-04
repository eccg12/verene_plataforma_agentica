/** Rotas do protótipo. Telas novas registram seu path aqui antes de virar rota. */
export const paths = {
  home: '/',
  missionControl: '/mission-control',
  gates: '/gates',
  /** Painel comercial: só é alcançável com a flag `comercial` ligada. */
  gatesPayment: '/gates/payment',
  playbook: '/playbook',
  mapping: '/mapping',
  /** Base da rota de rastreabilidade; o id do registro vem depois. */
  recordBase: '/record',
  record: '/record/:id',
  duplicates: '/review/duplicates',
  exceptions: '/review/exceptions',
  candidate: '/review/candidate',
  packages: '/packages',
  reconciliation: '/reconciliation',
  styleguide: '/styleguide',
} as const

export type Path = (typeof paths)[keyof typeof paths]

/** Abre `/playbook` já com uma regra selecionada: `/playbook?regra=R-SUP-023`. */
export const PARAM_REGRA = 'regra'
