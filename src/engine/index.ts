/**
 * Núcleo da simulação.
 *
 * O estado é determinístico e reprodutível: mesmo cenário + mesma versão de
 * playbook produzem exatamente a mesma saída. Nada aqui faz I/O — os agentes,
 * Gates e execuções de playbook são derivados das fixtures de `src/data/`.
 */

export * from './clock'
export * from './random'
