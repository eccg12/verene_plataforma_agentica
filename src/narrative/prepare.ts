/**
 * Leva a onda ao estado que a cena precisa encontrar.
 *
 * A cena 11 afirma que um registro atravessou os nove passos. Com a esteira
 * parada no passo 3, a trilha está pela metade e a cena mente para quem assiste.
 * Preparar não é fachada: assina exatamente o que um humano assinaria, com os
 * mesmos papéis e o mesmo instante determinístico, **pela API pública da store**
 * — o mesmo caminho que os botões das telas usam. Nada aqui alcança o motor por
 * dentro.
 *
 * Uma decisão fica de fora do "aprovar tudo": as exceções do corte no meio da
 * palavra saem REJEITADAS. Aprovar o registro assim só carimbaria o corte
 * errado, e é justamente corrigindo a regra que elas somem — o argumento da
 * cena 13.
 */
import { DEFEITO_QUE_SE_CORRIGE_NA_REGRA } from '@/data/presentation'
import { NIVEIS, type NivelDeEstado } from '@/data/presentation'
import { PROXIMA_VERSAO } from '@/data/playbook'
import { runDeTodasSpes, useSimulation } from '@/engine/store'

/**
 * O nível que a onda já alcançou, lido do estado — não de um contador.
 *
 * Serve para não refazer trabalho: andar da cena 8 para a 9, ambas no mesmo
 * nível, não deve reprocessar assinatura nenhuma.
 */
function nivelJaAlcancado(): NivelDeEstado {
  const { approvals, playbookVersion, assinaturasDeGate, spe } = useSimulation.getState()
  if (spe !== 'todas') return NIVEIS.nada
  if (approvals.mapeamentoSme === null || approvals.mapeamento === null) return NIVEIS.nada
  const run = runDeTodasSpes(playbookVersion, approvals)
  if (run.clusters.length === 0 || !run.clusters.every((c) => approvals.clusters[c.id])) {
    return NIVEIS.mapeamento
  }
  if (!run.exceptions.every((e) => approvals.excecoes[e.id])) return NIVEIS.duplicatas
  if (playbookVersion !== PROXIMA_VERSAO) return NIVEIS.excecoes
  if (approvals.pacote === null || assinaturasDeGate.G5 === undefined) return NIVEIS.corrigido
  return NIVEIS.carga
}

/**
 * Deixa a onda exatamente no nível pedido.
 *
 * Sempre parte do zero quando precisa recuar, porque voltar uma cena tem que
 * remostrar a tela como ela estava — se acumulasse, rever a cena 5 depois da 13
 * mostraria a v1.4.0 publicada, e a explicação deixaria de fazer sentido.
 */
export function prepararNivel(nivel: NivelDeEstado): void {
  if (nivelJaAlcancado() === nivel) return

  const s = useSimulation.getState()
  s.reset()
  // O recorte abre em uma SPE; a narrativa fala das quatro o tempo todo, e as
  // filas de revisão são cross-SPE por natureza. Trocar o recorte zera as
  // assinaturas, então vem antes de tudo.
  useSimulation.getState().setSpe('todas')
  if (nivel <= NIVEIS.nada) return

  const atual = () => useSimulation.getState()
  const versao = () => atual().playbookVersion

  atual().approveMappingSme('approved')
  atual().approveMapping('approved')
  if (nivel <= NIVEIS.mapeamento) return

  atual().confirmAllClusters('approved')
  if (nivel <= NIVEIS.duplicatas) return

  atual().decideAllExceptions('approved')
  for (const e of runDeTodasSpes(versao(), atual().approvals).exceptions) {
    if (e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA) {
      atual().decideException(e.id, 'rejected')
    }
  }
  if (nivel <= NIVEIS.excecoes) return

  atual().publicarVersao(PROXIMA_VERSAO)
  if (nivel <= NIVEIS.corrigido) return

  atual().approvePackage('approved')
  atual().assinarGate('G5', 'approved')
}
