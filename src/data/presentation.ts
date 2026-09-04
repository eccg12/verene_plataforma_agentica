/**
 * O roteiro da primeira sala.
 *
 * O protótipo tem nove telas e cada uma sustenta um argumento diferente. Numa
 * primeira apresentação isso é problema, não vantagem: quem explora perde o fio,
 * e quem perde o fio compra menos. Este arquivo é a ordem em que os argumentos se
 * sustentam — e o estado que cada passo precisa encontrar pronto.
 *
 * `nivel` é o quanto da onda precisa estar assinado para o passo fazer sentido.
 * Andar para a frente garante ao menos aquele nível; voltar rebobina exatamente
 * até ele, para poder remostrar um passo depois de uma pergunta.
 *
 * As notas são do apresentador e não vão para a tela do cliente.
 */
import { PARAM_REGRA, paths } from '@/app/paths'
import { CASO_FORNECEDOR } from '@/data/record-cases'

/**
 * O defeito que NÃO se resolve aprovando o registro.
 *
 * É o corte no meio da palavra: aprovar carimbaria o corte errado. Por isso o
 * roteiro o deixa retido e o resolve corrigindo a regra, no passo 6.
 */
export const DEFEITO_QUE_SE_CORRIGE_NA_REGRA = 'DEF-TRF-02'

/** A regra que o passo 6 abre e corrige. O roteiro chega nela, não perto dela. */
export const REGRA_DA_CORRECAO = 'R-SUP-023'

export const NIVEIS = {
  /** Nada assinado. A esteira para no passo 3. */
  nada: 0,
  /** De-para aprovado pelo SAP SME e assinado pelo data owner. */
  mapeamento: 1,
  /** Cada cluster de duplicata decidido. */
  duplicatas: 2,
  /** Cada exceção decidida — os 8 do corte errado ficam retidos. */
  excecoes: 3,
  /** A v1.4.0 adotada pela onda. */
  corrigido: 4,
  /** Pacote liberado e carga registrada. Falta o G6. */
  carga: 5,
} as const

export type NivelDeEstado = (typeof NIVEIS)[keyof typeof NIVEIS]

export interface PassoDoRoteiro {
  readonly n: number
  readonly id: string
  readonly nome: string
  /** Rota para onde o passo leva. */
  readonly path: string
  readonly nivel: NivelDeEstado
  /** Tempo previsto, em segundos. A soma é o tempo do roteiro. */
  readonly duracao: number
  /** A frase que abre o passo. É o que o apresentador diz, não o que a tela mostra. */
  readonly fraseChave: string
  /** O que fazer na tela durante o passo. */
  readonly acoes: readonly string[]
  /** O que sustentar, se perguntarem. */
  readonly notas: readonly string[]
}

export const passosDoRoteiro: readonly PassoDoRoteiro[] = [
  {
    n: 1,
    id: 'mission-control',
    nome: 'O que existe e em que estado',
    path: paths.missionControl,
    nivel: NIVEIS.nada,
    duracao: 55,
    fraseChave:
      'Antes de qualquer promessa: isto é o que existe hoje no Nasajon das quatro SPEs, medido, não estimado.',
    acoes: [
      'Aponte a grade de 48 pacotes — 6 objetos × 4 SPEs × 2 ciclos.',
      'Aponte o recebimento: a contagem e o fingerprint são do conteúdo, não do que o fornecedor declarou.',
      'Aponte que pedidos, requisições e estoque estão como "não iniciado".',
    ],
    notas: [
      'Os 2.080 registros do escopo são derivados, não digitados: há teste que reprova se a grade contradisser o escopo.',
      'O "não iniciado" é de propósito. Não há extrato desses três objetos, e declarar estado de dado que não existe seria inventar.',
      'Cada agente tem um revisor humano com nome. Nenhum agente é accountable.',
    ],
  },
  {
    n: 2,
    id: 'mapping',
    nome: 'O de-para é contra o tenant vivo',
    path: paths.mapping,
    nivel: NIVEIS.nada,
    duracao: 55,
    fraseChave:
      'O de-para não é contra o SAP padrão. É contra a configuração que está ligada no tenant de vocês hoje.',
    acoes: [
      'Aponte a coluna Value domain (live tenant).',
      'Abra uma divergência marcada como "Tenant Verene, não padrão SAP".',
      'Aponte o aviso: nenhuma transformação roda sobre mapeamento não aprovado.',
    ],
    notas: [
      'Mapear contra o padrão em vez do tenant é o erro que só aparece na carga, quando já custa caro.',
      'O checkpoint exige duas assinaturas distintas: o SAP SME aprova tecnicamente, o data owner assina no Gate 1.',
      'O aviso não é decorativo — é o motor. Sem as duas, a esteira para no passo 3.',
    ],
  },
  {
    n: 3,
    id: 'record',
    nome: 'Rastreabilidade em nível de campo',
    path: `${paths.recordBase}/${CASO_FORNECEDOR}`,
    nivel: NIVEIS.mapeamento,
    duracao: 55,
    fraseChave:
      'Para qualquer registro, em qualquer momento: de onde veio o valor, que regra o mudou, em que versão do playbook.',
    acoes: [
      'Percorra a trilha campo a campo: valor de origem, regra aplicada, valor final.',
      'Clique num id de regra e mostre que ele abre a regra no playbook.',
      'Aponte onde a esteira PARA: o próximo checkpoint é a fila de duplicatas.',
    ],
    notas: [
      'A trilha carrega o id da regra E a versão. Sem a versão, "foi transformado pela regra X" não diz qual redação da regra X.',
      'A linha de contrato roda pela mesma esteira, com o mesmo guarda. É o objeto de maior densidade de regra do escopo.',
      'A esteira parada aqui é o argumento do próximo passo, não um defeito da tela.',
    ],
  },
  {
    n: 4,
    id: 'duplicates',
    nome: 'O merge nunca é automático',
    path: paths.duplicates,
    nivel: NIVEIS.mapeamento,
    duracao: 50,
    fraseChave:
      'A máquina propõe o match e mostra o porquê, sinal a sinal. Quem funde dois cadastros é uma pessoa.',
    acoes: [
      'Abra o racional de um cluster: cada sinal com o peso que ele vale.',
      'Confirme um cluster na tela, para o cliente ver a decisão sendo tomada.',
      'Aponte a seção dos já cadastrados no tenant: reusar, não recriar.',
    ],
    notas: [
      'O score é a soma dos pesos que conferem, não um número solto.',
      'O código aposentado mantém cross-reference visível depois do merge.',
      'Os dois já existentes saem do cruzamento por documento, não do resultado da esteira — senão sumiriam justo enquanto o checkpoint segura.',
    ],
  },
  {
    n: 5,
    id: 'exceptions',
    nome: 'Nada é defaultado para o lote passar',
    path: paths.exceptions,
    nivel: NIVEIS.duplicatas,
    duracao: 50,
    fraseChave:
      'Não existe "aplicar valor padrão" nesta tela. Preencher por padrão é o que produz base suja com aparência de limpa.',
    acoes: [
      'Mostre uma exceção técnica e uma de negócio, com dono nomeado e prazo.',
      'Mostre o enriquecimento com a evidência anexada — a tabela do IBGE, o item da LC 116.',
      'Mostre o CNAE: sem fonte que sustente, não há proposta, e a tela diz por quê.',
    ],
    notas: [
      'As opções são liberar com decisão registrada ou manter retido. Só isso.',
      'Exceção técnica vai para o SAP SME; exceção de negócio, para o data owner.',
      'O caso do CNAE é o que prova a regra: onde não há evidência, o agente não propõe.',
    ],
  },
  {
    n: 6,
    id: 'velocidade',
    nome: 'Momento 1 — defeito achado e ressubmetido no mesmo dia',
    path: `${paths.playbook}?${PARAM_REGRA}=${REGRA_DA_CORRECAO}`,
    nivel: NIVEIS.excecoes,
    duracao: 85,
    fraseChave:
      'Oito razões sociais quebraram no meio da palavra. O defeito não é do dado: é da nossa regra — e é por isso que ele se corrige em minutos, não em uma nova rodada de extração.',
    acoes: [
      'A R-SUP-023 já abre selecionada. Mostre a correção proposta: corte: caractere → palavra.',
      'Clique em "Corrigir e publicar v1.4.0".',
      'Deixe a propagação rodar e leia os cinco nós em voz alta.',
    ],
    notas: [
      'Quem encontrou o corte errado foi a R-SUP-048, uma validação independente da regra que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.',
      'A regra não foi editada no lugar: uma redação nova foi publicada numa versão nova. É o que mantém a trilha válida.',
      'O que muda entre as duas redações é um parâmetro, e o agente o lê pelo mesmo guarda que lê a regra.',
      'As assinaturas que o artefato não invalidou foram carregadas, marcadas como revalidadas. Pacote e reconciliação caem sempre: o checksum mudou.',
      'A recomputação é instantânea. A animação mostra o caminho, não a duração — o ganho está em não haver ninguém no meio dele.',
    ],
  },
  {
    n: 7,
    id: 'contencao',
    nome: 'Momento 2 — o limite honesto',
    path: paths.candidate,
    nivel: NIVEIS.excecoes,
    duracao: 95,
    fraseChave:
      'Um agente consegue evidenciar que uma regra provavelmente existe. Ele não consegue confirmar que a regra está correta.',
    acoes: [
      'Mostre as duas duplas e o que é idêntico nos dois lados.',
      'Aponte a frequência e diga que ela é derivada do dado, não escolhida.',
      'Leia a hipótese e, principalmente, o bloco do que o modelo não consegue confirmar.',
      'Deixe a decisão em aberto ou confirme, e diga que confirmar não executa a regra.',
    ],
    notas: [
      'Esta é a única tela do protótipo que faz chamada de rede. A hipótese é gerada dos mesmos quatro registros, ao vivo.',
      'Se a chamada não completar, entra uma resposta de referência e a tela não muda de forma. Não há risco de tela em branco.',
      'A regra candidata não executa: KANON recusa regra não promovida. Promover é ato de governança, numa versão nova.',
      'São 4 pessoas físicas no extrato, todas nas duas duplas. Se perguntarem "100% de quantos?", a resposta é dois pares.',
      'Este é o momento que mais compra confiança. Não corra.',
    ],
  },
  {
    n: 8,
    id: 'reconciliacao',
    nome: 'De quem é cada defeito',
    path: paths.reconciliation,
    nivel: NIVEIS.corrigido,
    duracao: 65,
    fraseChave:
      'Origem e destino fecham, e toda diferença tem causa nomeada. E os defeitos estão separados por dono contratual.',
    acoes: [
      'Mostre a reconciliação por contagem e por valor, com a explicação de cada diferença.',
      'Vá ao registro de defeitos e leia a linha de responsabilidade Monoda.',
      'Aponte que os critérios de defeito medem apenas a origem transformation.',
    ],
    notas: [
      'Depois da correção do passo 6, a origem transformation está zerada. Antes dela estava em 8.',
      'Valor só aparece onde há montante: contratos. Fornecedor é cadastro — inventar um valor para preencher a tela seria número que não sobrevive a uma pergunta.',
      'As outras três origens não somem: elas têm dono, e o dono está nomeado na tela.',
      'Há teste que reprova uma diferença sem explicação.',
    ],
  },
  {
    n: 9,
    id: 'gate',
    nome: 'A assinatura que libera',
    path: paths.gates,
    nivel: NIVEIS.carga,
    duracao: 40,
    fraseChave:
      'Cada Gate aprova um artefato nomeado, e o Gate seguinte não abre enquanto ele não estiver assinado. Não abre com ressalva.',
    acoes: [
      'Abra o G6 e mostre a evidência entregue e o aprovador nomeado.',
      'Assine o G6 na tela.',
      'Aponte a trilha: quem, quando, e sobre qual versão de playbook.',
    ],
    notas: [
      'No estado inicial, seis dos oito Gates aparecem com entrada recusada. A recusa nomeia o artefato que falta.',
      'Assinar fora de ordem não contorna: o motor só considera assinado o artefato de um Gate cuja entrada foi admitida.',
      'A coluna da versão é o que sustenta o argumento de governança. Sem ela, "revisado e assinado" é slogan.',
      'Se o painel comercial for pedido, ele existe atrás de flag — não abra sem ser perguntado.',
    ],
  },
]

export const TOTAL_DE_PASSOS = passosDoRoteiro.length

/** Duração prevista do roteiro inteiro, em segundos. */
export const DURACAO_DO_ROTEIRO = passosDoRoteiro.reduce((acc, p) => acc + p.duracao, 0)

/** Quanto do roteiro já passou ao ENTRAR no passo `n`, em segundos. */
export function decorridoAte(n: number): number {
  return passosDoRoteiro.filter((p) => p.n < n).reduce((acc, p) => acc + p.duracao, 0)
}

export const passoPorNumero = (n: number): PassoDoRoteiro =>
  passosDoRoteiro.find((p) => p.n === n) ?? passosDoRoteiro[0]!
