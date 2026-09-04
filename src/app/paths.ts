/** Rotas do protótipo. Telas novas registram seu path aqui antes de virar rota. */
export const paths = {
  home: '/',
  missionControl: '/mission-control',
  playbook: '/playbook',
  mapping: '/mapping',
  styleguide: '/styleguide',
} as const

export type Path = (typeof paths)[keyof typeof paths]
