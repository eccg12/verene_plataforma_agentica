/**
 * Os sete agentes do KEPLER.
 *
 * Nomes de agente nunca são traduzidos (regra 7 do CLAUDE.md) e estão
 * registrados em `src/copy/glossary.ts`.
 *
 * Seis agentes ocupam passos da esteira. KANON é transversal: não executa passo
 * nenhum — versiona o playbook e gera a documentação a partir dele. É o que
 * sustenta a tese: a regra vive num lugar só, versionada, e os outros agentes a
 * executam sem interpretar.
 */

export const agentNames = ['VEGA', 'LYRA', 'ATLAS', 'NOVA', 'ORION', 'SIRIUS', 'KANON'] as const
export type AgentName = (typeof agentNames)[number]

/**
 * Revisor humano nomeado. Não é detalhe de tela: nenhum agente é accountable.
 * Todo agente responde a uma pessoa com nome, e é essa pessoa que assina.
 */
export interface Revisor {
  readonly nome: string
  readonly papel: string
}

export interface AgentSpec {
  readonly name: AgentName
  readonly papel: string
  readonly descricao: string
  /** `true` para KANON: atua sobre o playbook, não sobre o registro. */
  readonly transversal: boolean
  readonly revisor: Revisor
}

export const agents: readonly AgentSpec[] = [
  { name: 'VEGA', papel: 'Recepção e perfilagem', transversal: false,
    revisor: { nome: 'Marina Dantas', papel: 'Monoda · Data Engineering' },
    descricao: 'Recebe o extrato e mede o que chegou. Não corrige nada — só registra o que existe, o que falta e em que formato veio.' },
  { name: 'LYRA', papel: 'Mapeamento contra o tenant', transversal: false,
    revisor: { nome: 'Rafael Queiroz', papel: 'Monoda · Arquitetura S/4HANA' },
    descricao: 'Lê a configuração viva do tenant S/4HANA e mapeia valor do legado para domínio do destino. Onde o tenant diverge do padrão SAP, é aqui que a divergência aparece.' },
  { name: 'ATLAS', papel: 'Transformação e deduplicação', transversal: false,
    revisor: { nome: 'Bruno Salgado', papel: 'Monoda · Data Engineering' },
    descricao: 'Aplica as regras de conversão e monta os clusters de duplicata. Não decide sobrevivente sozinho: propõe e espera confirmação.' },
  { name: 'NOVA', papel: 'Enriquecimento e validação', transversal: false,
    revisor: { nome: 'Carlos Menezes', papel: 'Verene · Fiscal' },
    descricao: 'Deriva o que dá para derivar de fonte de referência e valida contra as regras de negócio e os campos obrigatórios do tenant.' },
  { name: 'ORION', papel: 'Empacotamento', transversal: false,
    revisor: { nome: 'Helena Duarte', papel: 'Verene · Data owner' },
    descricao: 'Monta o pacote de carga com manifest e checksum. Só empacota registro aprovado.' },
  { name: 'SIRIUS', papel: 'Reconciliação', transversal: false,
    revisor: { nome: 'Ana Ribeiro', papel: 'Verene · Suprimentos' },
    descricao: 'Fecha a conta: o que entrou tem que ser igual ao que saiu mais o que ficou retido. Sem fechar, não há assinatura.' },
  { name: 'KANON', papel: 'Governança do playbook', transversal: true,
    revisor: { nome: 'Patrícia Lemos', papel: 'Monoda · Governança' },
    descricao: 'Versiona o playbook, sela a versão com checksum e gera a documentação a partir das regras. Nenhum outro agente escreve regra: eles executam a que KANON publicou.' },
]

export const agentByName: Readonly<Record<AgentName, AgentSpec>> = Object.fromEntries(
  agents.map((a) => [a.name, a]),
) as Readonly<Record<AgentName, AgentSpec>>
