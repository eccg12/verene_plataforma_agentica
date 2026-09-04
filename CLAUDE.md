# KEPLER

Protótipo clicável da **KEPLER**, a plataforma agêntica de dados da **Monoda Consulting
Group**, apresentada ao cliente **Verene Energia**.

Isto é um **mockup de demonstração**: sem backend, sem banco de dados, sem chamadas de
rede. Todos os dados vêm de fixtures locais e todo o "processamento" é simulado de forma
determinística. O objetivo é a demonstração ser convincente e honesta — não é um sistema
real e nada aqui deve sugerir que seja.

## Regras do projeto

Estas regras valem para todo o projeto e têm precedência sobre conveniência de
implementação. Na dúvida entre cumprir a regra e entregar mais rápido, cumpra a regra.

1. **Nenhuma chamada de rede** exceto **uma**: `src/net/rule-hypothesis.ts`, que chama
   `/api/regra-candidata` na tela de regra candidata. Fora dela: sem `fetch`,
   `XMLHttpRequest`, `WebSocket`, `EventSource`, sem CDN, sem webfont externa, sem
   analytics, sem imagem hospedada fora do repositório. A exceção é aberta **por arquivo**
   em `eslint.config.js`, e há teste que falha se `fetch` aparecer em qualquer outro
   arquivo de produção.
2. **Todo texto visível ao usuário vive em `src/copy/strings.ts`.** Nunca hardcode string
   em JSX — nem rótulo, nem placeholder, nem tooltip, nem mensagem de erro.
3. **Todo dado vive em `src/data/`.** Componentes nunca inventam dado inline.
4. **O estado da simulação é determinístico e reprodutível:** mesmo cenário + mesma versão
   de playbook = mesma saída. Sem `Math.random` em runtime — use `createRng` de
   `src/engine/random.ts`. Sem `Date.now()` — use o epoch fixo de `src/engine/clock.ts`.
5. **Nenhuma tela promete algo que o SoW não entrega.** Se em dúvida, pergunte antes de
   criar. Isso vale também para nomes de agente, números, métricas e integrações: não
   invente.
6. **Sem `localStorage`/`sessionStorage`.** O estado da demonstração vive em memória.
7. **UI inteiramente em português do Brasil.** Exceção: termos técnicos SAP e nomes de
   artefatos contratuais ficam em inglês (Business Partner, Outline agreement, Migration
   Cockpit, Gate, playbook, manifest, checksum, cutover, Fiori, XML). **Nomes dos agentes
   nunca são traduzidos.** A lista de termos preservados vive em `src/copy/glossary.ts` —
   nada dela é traduzido. Ao precisar de um novo termo em inglês, registre-o lá antes de
   usá-lo.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v4 (plugin `@tailwindcss/vite`, tokens em `src/styles/index.css`)
- React Router (data router, `createBrowserRouter`)
- `lucide-react` para ícones, `framer-motion` para animação
- **Sem UI kit pesado.** Componentes próprios em `src/components/`.

## Estrutura

```
src/
  app/         Shell da aplicação: App, router, paths
  components/  Componentes próprios reutilizáveis (barril em index.ts)
  screens/     Uma tela por rota
  data/        Fixtures — a única fonte de dado da UI (regra 3)
  engine/      Núcleo determinístico da simulação (regra 4)
  copy/        strings.ts (todo texto) e glossary.ts (termos preservados)
  styles/      Tema Tailwind e estilos base
```

Import alias: `@/` aponta para `src/`.

## Design system

Paleta extraída do deck Galaxy (co-branded Verene + Monoda). Regras de uso:

- **Duas superfícies.** `surface-ink` (#111111) para telas de cockpit/operação e
  `surface-paper` (#F7F7F7) para telas de documento (playbook, dicionário de mapeamento,
  manifest). A alternância é intencional: reforça "isto é máquina" vs "isto é evidência".
  Use o componente `Surface` — ele define o contexto e todos os tokens seguem.
- **Componentes nunca usam a paleta base direto.** Usam token semântico (`bg-surface`,
  `text-fg`, `text-accent`, `bg-signed-bg`…), porque só o token resolve por superfície.
  Duas cores do deck não passam em contraste nas duas: `verene-violet` reprova sobre a
  escura (2,36:1) e `signal-green` reprova sobre a clara (2,08:1). Por isso `--color-accent`
  vale `verene-violet-lt` no escuro e `verene-violet` no claro — a regra de uso é a mesma,
  o valor é que muda.
- **Escalas de cor separadas por temperatura.** Estados (`signed`, `held`, `exception`,
  `pending-gate`) usam matizes quentes mais um neutro frio. Origens de defeito
  (`defect-source`, `defect-transformation`, `defect-target-config`, `defect-load`) usam
  matizes frios, separadas por matiz e por luminância. As duas escalas também têm formas
  diferentes: estado é pílula com rótulo, origem de defeito é quadrado + rótulo.
- **Cor nunca é o único portador de significado.** Todo badge e toda origem levam rótulo.
- **Densidade alta.** Software para analista de dados: linha de tabela de 28px, corpo de
  13px, controles de 28px. Sem hero, sem card gigante, sem gradiente decorativo, sem
  stripe de destaque na borda de card.
- **Sem emoji.** Ícones `lucide-react` em tamanho consistente (14px em UI densa).
- **Números sempre tabulares** em tabela e contador (`tnum`). A Jost tem dígitos
  proporcionais por padrão — o "1" é 25% mais estreito que o "0" — e sem `tnum` a coluna
  numérica dança.
- **Tipografia:** Jost (variável, via `@fontsource-variable/jost`), geométrica, substituta
  web da Century Gothic do deck. Servida do bundle: webfont externa seria chamada de rede.

Onde ficam os valores: `@theme` de `src/styles/globals.css` é o que vale em runtime —
só ele emite as custom properties que as superfícies redefinem. `tailwind.config.ts` é o
espelho tipado da paleta para consumo por TypeScript, e `npm run check:tokens` falha se os
dois divergirem. Os slots de logo ficam em `src/assets/logos/` (ver README de lá).

## Fixtures

`src/data/` é a única fonte de dado da UI, dividida em:

- `source/` — extrato do Nasajon, o ERP legado das quatro SPEs. **Sujo de propósito.**
  Os defeitos são plantados e etiquetados em `_plantedDefect`, com o campo afetado, a nota
  que a tela deve mostrar e a origem na escala de cor do design system. Nenhuma tela precisa
  redescobrir defeito por heurística.
- `target/` — o tenant S/4HANA vivo da Verene (`tenant-config.ts`) e os fornecedores já
  cadastrados nele (`existing-base.ts`). As divergências do padrão SAP estão em
  `divergenciasDoPadraoSap` e são o argumento da tela do LYRA.
- `scope.ts` — o escopo declarado. Os 48 pacotes de carga são **derivados** de
  6 objetos × 4 SPEs × 2 ciclos, não digitados.

**Ao mexer em fixture, rode `npm test`.** A suíte confere o que a demo afirma: recalcula o
dígito verificador de todo CNPJ e CPF, exige que só os 3 CNPJ plantados sejam inválidos,
verifica que os 4 pares de duplicata têm mesmo CNPJ em SPEs diferentes com grafia diferente,
confere que os 2 fornecedores "já existentes" apontam para um Business Partner que existe de
fato com o mesmo CNPJ, checa que todo código IBGE bate com a UF, que quantidade × preço fecha
em toda linha de contrato, e que o escopo soma 2.080 em 48 pacotes. Números que não fecham na
frente do cliente custam mais caro que a demo inteira.

Dados inventados nunca levam nome de empresa real: CNPJ fictício em razão social real
afirmaria como verdadeiro um cadastro que não existe.

## Núcleo conceitual

A tese: **a regra vive num lugar só, versionada, e os agentes a executam — não a interpretam.**
O motor torna isso literal, não retórico.

- `src/data/playbook.ts` — o GALAXY data playbook como estrutura de dados. Cada regra tem id,
  agente, objeto, campo, tipo, expressão legível, rationale, dono, versão e status. `nature`
  separa regra **determinística** (vira código, executa) de **generativa** (proposta de regra
  candidata, não executa até um humano promover).
- `src/engine/kanon.ts` — KANON não ocupa passo. Sela a versão do playbook com checksum, gera a
  documentação a partir das regras, e é **o único caminho** por onde um agente chega a uma regra.
  `resolveRule` recusa regra fora da versão, regra candidata e regra de outro agente.
- `src/engine/pipeline.ts` — a esteira de nove passos. **Nenhum passo escreve em registro
  diretamente:** toda mutação passa por `apply`, que resolve a regra em KANON antes de aplicar e
  registra id da regra e versão do playbook na trilha. Não existe caminho alternativo — é por
  construção, não por disciplina.
- `src/data/defect-taxonomy.ts` — defeito por origem, com dono contratual. `monodaResponsavel` é
  `true` só em `transformation`: nas outras três origens a Monoda detecta, evidencia e roteia,
  mas não responde pelo defeito.

**Quatro checkpoints humanos bloqueantes.** Após o passo 3 (mapeamento), o 5 (cada cluster de
duplicata, um a um), o 7 (cada exceção decidida) e os 8 e 9 (pacote e reconciliação, pelo data
owner). Sem assinatura o passo seguinte nem roda — sai como `blocked`/`not-reached`.

**A regra é versionada, não editada.** `sealPlaybook` seleciona por **vigência**, não por
igualdade: uma regra vale de `introducedIn` até `vigenteAte` (exclusive), então a mesma regra
pode ter mais de uma redação sem duplicar o playbook a cada versão. `R-SUP-023` tem duas — a da
v0.9.0 corta `NAME_ORG1` no caractere 40, a da v1.4.0 corta no último espaço antes dele. O que
muda entre elas é o **parâmetro** `corte`, e o agente o lê por `parametroDaRegra`, que passa pelo
mesmo `resolveRule`: nenhum agente alcança parâmetro sem o guarda. Corrigir uma regra não é mexer
no código do agente — é publicar uma redação nova numa versão nova.

**Toda assinatura carrega a versão do playbook.** `Signature` registra quem, quando e sobre qual
versão — e assinatura dada sobre outra versão não vale para a corrente. Sem esse campo, "revisado
e assinado" não diz o que foi revisado: a regra pode ter mudado depois. Trocar de versão (ou de
SPE) zera as assinaturas na store, porque aprovação não atravessa recorte nem versão. A exceção é
`publicarVersao`, que **carrega** para a versão nova as assinaturas cujo artefato não mudou,
marcando-as com `revalidadaEm` — a trilha mostra sobre qual versão foi assinada E em qual foi
revalidada. Pacote e reconciliação caem sempre: o artefato mudou de checksum, e assinatura dada
sobre outro conteúdo não vale.

**Determinismo.** O estado final de um registro é *derivado* das assinaturas, nunca acumulado por
mutação ao longo dos passos: acumular dava ordem-dependência. Não há `Math.random` nem `Date.now`
no motor; o instante vem do epoch fixo de `clock.ts`. Entrada e saída são ordenadas de forma
total, então a ordem dos registros de entrada não afeta a saída. Mesma entrada + mesma versão de
playbook = saída idêntica byte a byte, e há teste comparando `JSON.stringify` de duas execuções.

**Estado da simulação** em `src/engine/store.ts` (Zustand, em memória, com `reset()`). Guarda só o
que um humano decidiu — recorte e assinaturas. O resultado da esteira não é estado: é derivado a
cada mudança, porque derivar de algo determinístico não pode divergir do que as regras produziriam.

## Telas

`AppShell` monta barra superior + navegação lateral + conteúdo. A barra mantém **sempre
visíveis** a versão do playbook e o ciclo corrente: sem os dois, nenhum número de nenhuma tela
tem contexto. A superfície escura é o padrão do shell; tela de documento aplica `surface-paper`
no próprio conteúdo e a barra continua escura — as superfícies aninham corretamente.

`/mission-control` é a tela de operação. **Todo número dela sai das fixtures**, derivado em
`src/engine/mission-control.ts`; nenhum componente calcula ou digita número. Em particular:

- a grade de 48 pacotes lê `src/data/packages.ts`, cujos volumes por SPE **somam o volume de
  referência do objeto em `scope.ts`** — há teste, o quadro não pode contradizer o escopo;
- o mapa de defeitos conta os `_plantedDefect` das fixtures, cortados por objeto e por dimensão
  de qualidade, e a soma dos dois cortes tem que bater;
- o recebimento **conta e faz o fingerprint do conteúdo de fato**, nunca repete o número que o
  vendor declarou — é isso que faz o recibo valer alguma coisa;
- o estado de atividade dos agentes é derivado do run corrente da esteira.

Onde não há extrato — pedidos, requisições e posições de estoque —, o quadro mostra `não
iniciado`. Declarar estado de dado que não existe seria inventar.

`/playbook` (KANON) e `/mapping` (LYRA) são telas de **documento**: superfície clara, dentro do
shell escuro. São evidência, não operação.

- **`/playbook`** lista as regras versionadas com filtro por agente, objeto e tipo. O detalhe traz
  expressão, justificativa, dono, versão em que a regra entrou, histórico de alterações e
  **"aplicada a N registros nesta onda"** — contado da trilha do run, com os códigos dos registros.
  Regra que não rodou mostra zero, e regra candidata mostra zero sempre, porque proposta não
  executa. "Gerar documentação" monta o texto a partir das próprias regras, na hora.
- **`/mapping`** é o dicionário campo a campo. A coluna *Value domain (live tenant)* lê os domínios
  de `tenant-config.ts` — a configuração ativa —, e cada linha aponta para a regra do playbook e
  para a divergência do padrão SAP que a afeta. Não há tabela paralela mantida à mão, e há teste
  garantindo que toda regra, todo domínio e toda divergência citados existem de fato.

`/record/:id` (escura) mostra a rastreabilidade **em nível de campo**: valor de origem, cada
regra aplicada com id clicável, versão do playbook e instante, e o valor final — ou o estado
retido. Dois casos navegáveis: um fornecedor e uma **linha de contrato**, que roda pela MESMA
esteira, com o mesmo guarda de KANON (`src/engine/contract-pipeline.ts`). O id da linha usa `~`
e não `#`: `#` viraria fragmento de URL e sumiria do path.

`/review/duplicates` (ATLAS) traz o racional do match sinal a sinal, com o peso de cada um — o
score é a soma dos pesos que conferem, não um número solto. **O merge nunca é automático:** as
ações são confirmar, rejeitar ou dividir, uma a uma, e o código aposentado mantém
cross-reference visível depois do merge. Os dois cadastros que já existem no tenant aparecem em
seção própria, derivada do cruzamento de documento — não do resultado da esteira, senão sumiriam
justamente enquanto o checkpoint segura.

`/review/exceptions` (NOVA) classifica cada retenção em técnica (vai ao SAP SME) ou de negócio
(vai ao data owner), com dono nomeado, prazo e estado. **Não existe "aplicar valor padrão"** em
lugar nenhum da tela, de propósito. O enriquecimento do NOVA mostra cada valor proposto com a
**evidência anexada** — tabela do IBGE, item da LC 116, material equivalente já classificado.
Onde não há fonte que sustente o valor, não há proposta: CNAE aparece como "sem proposta" com o
motivo, e é esse o caso que prova a regra.

`/packages` (ORION, clara) é a tela de artefato. O XML do Migration Cockpit é **gerado dos
registros de fato**, com a versão e o checksum do playbook no cabeçalho — é aí que o laço com o
KANON fecha. O tamanho por registro é medido no XML gerado, e a divisão em partes é aritmética
sobre esse número, contra os dois tetos (100 MB por arquivo, 500 registros por lote). A
conformidade confere tamanho de campo, formato, integridade e faixa de numeração; **liberar uma
exceção não lava o dado**, e é ORION que pega o campo obrigatório ainda vazio. Bloco de entrega
formal com escopo, versão, exceções conhecidas e calendário; simulação no cockpit aprovada antes
da liberação.

`/reconciliation` (SIRIUS, escura) é a tela mais importante comercialmente. Reconcilia por
contagem e por valor, por objeto e por SPE, e **toda diferença vem explicada** — há teste
exigindo que diferença sem explicação falhe. Valor só aparece onde há montante (contratos):
fornecedor é cadastro, e inventar um valor para preencher a tela seria número que não sobrevive
a uma pergunta. O registro de defeitos usa as quatro cores categóricas do design system e separa
visualmente **responsabilidade Monoda (origem `transformation`) de responsabilidade de
terceiros**. O placar mede os quatro critérios de aceite, cada um com o Gate onde é medido
(G2, G3, G4, G6) e com a frase de como o número foi obtido; os dois critérios de defeito medem
**apenas** a origem `transformation`. A verificação guiada nos apps Fiori, por objeto, fecha a
lacuna que a contagem não fecha e é registrada como evidência de Gate.

`/gates` (escura) é a tela de decisão contratual. Oito Gates, G0 a G7, cada um com quando ocorre,
o que é aprovado, a evidência entregue (com link para a tela onde ela vive), o aprovador nomeado e
o estado. Três coisas fazem ela não ser reunião de status:

- **Cada Gate aprova um artefato nomeado** (A0 a A7), e a entrada do Gate seguinte é **RECUSADA**
  enquanto esse artefato não estiver assinado. No estado inicial, seis dos oito aparecem como
  `entrada-recusada` — a recusa nomeia o artefato em falta e o Gate que o assina, e clicar nele
  leva até lá. Assinar não em ordem não contorna nada: `estadoDosGates` só considera assinado o
  artefato de um Gate cuja entrada foi admitida. Há teste, e a mutação que remove essa condição
  falha.
- **A trilha mostra quem, quando e sobre qual versão de playbook.** É a coluna que sustenta o
  argumento de governança; sem ela, a tela seria um semáforo colorido.
- **G1 a G4 são os quatro checkpoints da esteira**, assinados onde a evidência é revisada
  (`/mapping`, `/review/duplicates`, `/review/exceptions`) — o Gate mostra a trilha e leva até lá.
  G0 é a linha de base (escopo, recibo do extrato e playbook selado, assinada antes do epoch da
  simulação), e G5, G6 e G7 são assinados na própria tela.

`/gates/payment` liga Gate a parcela (G1 20%, G2 20%, G4 20%, G6 25%, G7 15% — soma 100, há teste).
Fica **atrás da flag** `comercial`: sem `?flag=comercial` na URL, a rota volta para `/gates` e nem o
link aparece. A flag liga por parâmetro de URL, vive em memória (regra 6) e `reset()` desliga. Só
percentual: o valor do contrato não vive no protótipo, e número inventado ao lado de percentual
real seria pior do que não mostrar valor. G0, G3 e G5 aparecem sem parcela — nem todo ponto de
decisão é ponto de faturamento, e um Gate sem dinheiro atrás continua bloqueante.

### Os dois momentos

**Momento 1 — velocidade, em `/playbook`.** Na v1.0.0 a `R-SUP-023` corta o nome no caractere 40
e parte palavra ao meio em **8 das 42 razões sociais**. Quem encontra é a `R-SUP-048`, uma
validação de NOVA independente da regra que quebra — se as duas viessem do mesmo raciocínio, o
defeito passaria pelas duas. O defeito é `DEF-TRF-02`, origem `transformation`, **crítico**: os
registros saem retidos e a fila diz que a ação certa não é aprovar o registro, é corrigir a
regra. No detalhe da regra aparece a correção proposta com o diff do parâmetro
(`corte: caractere → palavra`) e o botão que publica a v1.4.0. Publicar dispara `publicarVersao`,
e o painel de **Propagação** — a única animação do projeto — mostra o caminho: regra corrigida →
playbook selado (checksum novo) → onda regerada (8 retocados, 8 exceções fechadas, 7 retidos de
volta) → pacote refeito (`PKG-todas-v1.4.0`) → manifest novo aguardando reassinatura no G4. Todo
número sai de `src/engine/regeneration.ts`, que diffa os dois runs. A animação não simula
trabalho: a recomputação é instantânea, e a nota da seção diz isso — o que ela mostra é o
caminho, não a duração.

**Momento 2 — contenção, em `/review/candidate`.** As duas duplas de PF com retenção divergente
(`F1009`/`F3007` no INSS, `F2008`/`F4007` na alíquota de ISS), lado a lado, com o que é idêntico
nos dois listado embaixo — é o que descarta a explicação fácil. A frequência é derivada, não
digitada. A regra candidata é a `R-SUP-033`, que **não executa**: `resolveRule` recusa candidata.
Ao lado dela, a hipótese em linguagem natural, e a frase que fecha o argumento em destaque
próprio: *um agente consegue evidenciar que uma regra provavelmente existe; ele não consegue
confirmar que a regra está correta*. As três ações — confirmar, rejeitar, reformular — registram
a decisão do dono nomeado (Carlos Menezes, Verene · Fiscal) e **não promovem a regra**: promover é
ato de KANON, numa versão nova. `R-SUP-047` passou a reter **os dois lados** de cada dupla, como
a expressão da regra sempre disse; antes retinha só o lado etiquetado no extrato.

### A chamada de rede

A hipótese do Momento 2 vem de uma chamada real à API da Anthropic (`claude-sonnet-4-6`). A
chave **nunca entra no bundle**: fica em `ANTHROPIC_API_KEY` (sem prefixo `VITE_`), o browser
chama `/api/regra-candidata` na mesma origem, e o plugin de `vite.config.ts` — montado em `dev` e
em `preview` — faz a chamada pelo SDK oficial.

O fallback é requisito, não conforto. Sem chave, sem rede, com timeout, com JSON malformado, ou
com o `dist/` servido como estático (endpoint inexistente), a tela usa a resposta pré-gravada de
`src/data/candidate-hypothesis.ts`. A rota responde **200 mesmo quando não tem hipótese**
(`disponivel: false`): ausência não é erro, e um 5xx pintaria o console de vermelho na frente do
cliente. `pedirHipotese` nunca lança.

O texto do modelo é **apresentação e só**: não entra na esteira, no checksum nem no pacote. Há
teste garantindo que existe um único arquivo com `fetch`, que nem `src/engine/` nem `src/data/`
importam `src/net/`, e que nenhuma fonte de produção fala com `api.anthropic.com` direto.

**As telas se conectam pelo motor.** O checkpoint 1 exige duas assinaturas distintas: o SAP
SME aprova tecnicamente e o data owner assina no Gate 1. Enquanto faltar qualquer uma, `/mapping`
mostra o aviso e a esteira para no passo 3 — e o `/playbook` mostra as regras de ATLAS e NOVA com
zero registros. Assinadas as duas, as contagens sobem de 12 para 23 regras aplicadas. O aviso não
é decorativo: é o motor. Em `/gates` a mesma assinatura move o placar de 1 para 2 Gates aprovados e
tira um da fila de recusa; percorrendo as filas e assinando G4 a G7, os oito fecham e o painel
comercial passa de 0% para 100% liberado.

## Modo de apresentação

Na primeira sala o protótipo precisa ser **conduzido, não explorado**. `P` liga o roteiro: nove
passos, ~9 minutos, navegáveis por seta. A sequência é Mission Control → dicionário de mapeamento
→ rastreabilidade de um registro → fila de duplicatas → fila de exceções → Momento 1 → Momento 2
→ reconciliação por origem → assinatura do G6.

O que faz o modo servir para alguma coisa é que **cada passo encontra a onda no estado que ele
precisa**. `src/data/presentation.ts` declara o nível de estado de cada passo e `estadoDoNivel`,
na store, assina exatamente o que um humano assinaria — mesmos papéis, mesmo instante
determinístico. O que o roteiro poupa é o tempo de clicar, não a decisão. Em particular, o passo
5 chega com a fila de exceções **em aberto**, e o passo 6 chega com os 8 defeitos do corte errado
**retidos** — aprovar o registro só carimbaria o corte errado, e é corrigindo a regra que eles
saem da fila.

Andar para a frente garante **ao menos** o nível do passo, então o que o apresentador fez ao vivo
não é desfeito: publicar a v1.4.0 no passo 6 sobrevive à seta. Voltar rebobina **exatamente** até
o passo, que é o que permite remostrar depois de uma pergunta. Há teste para os dois sentidos.

- `P` liga e desliga · `← →` andam · `N` abre as notas · `R` reinicia do zero · `ESC` sai.
- As **notas do apresentador** (`N`) trazem a frase-chave a dizer, o que fazer na tela e o que
  sustentar se perguntarem. Nascem fechadas. O painel avisa que, com a tela espelhada, o cliente
  vê junto — a tecla protege o conteúdo, não o arranjo de telas.
- `R` reinicia a onda **sem derrubar o roteiro** e volta ao passo 1: é o que permite reapresentar
  sem recarregar.
- A barra inferior mostra o passo, o nome e o tempo **previsto**. Não há cronômetro: relógio de
  parede seria a única coisa não determinística da interface (regra 4).
- `/playbook?regra=R-SUP-023` abre a regra já selecionada. O roteiro chega na regra, não perto
  dela.

**O selo de ambiente de demonstração é permanente**, em toda tela, sem tecla para esconder. Um
protótipo bem feito parece um sistema — e é por parecer que ele precisa dizer que não é.

## Camada narrada

O modo de apresentação conduz **quem apresenta**. A camada narrada (`src/narrative/`) conduz
**quem assiste**: numa apresentação o espectador não sabe o que procurar e se perde, e um mockup
que funciona como produto não se explica sozinho.

São **quinze cenas em cinco atos** — o problema, os sete agentes, a esteira, os dois momentos e o
aceite —, declaradas em `src/narrative/script.ts`. Cada cena tem título, dois a três bullets em
linguagem de quem não conhece migração de SAP, a rota da tela de fundo, o seletor do elemento a
destacar e uma nota de apresentador. A regra de escrita dos bullets é dura: frase curta, nada de
jargão sem explicação junto, nada de palavra inventada.

**A narrativa é o estado inicial.** Ao abrir, ela está ligada.

**Um botão só, sempre no mesmo lugar.** Na barra superior: "Explorar livremente" enquanto narra,
"Ver apresentação" fora dela — e o rótulo diz qual das duas coisas o clique faz. Sair guarda a
cena; voltar retoma exatamente onde parou. Dois controles para a mesma escolha confundiam, e o
pino flutuante que existia ocupava um canto sem precisar. O roteiro do apresentador (tecla `P`) é
outra coisa e continua só no teclado: ele conduz quem apresenta, a narrativa conduz quem assiste.

Para o botão funcionar, o painel da cena fica **no fluxo** da linha de conteúdo, não sobreposto:
assim a barra superior continua inteira e clicável, e a versão do playbook e o ciclo seguem
visíveis durante a narração como em qualquer outra tela. O escurecimento cobre o conteúdo, nunca
a barra.

- A tela real fica ao fundo, funcionando, escurecida, com o elemento da cena em foco. O
  escurecimento é a sombra do próprio buraco do foco — uma sombra enorme para fora —, então não
  existe o instante em que a máscara e o brilho discordam.
- Os bullets aparecem **um a um**, em cascata. `prefers-reduced-motion` mostra todos de uma vez.
- Avança por clique na área escurecida, seta ou barra de espaço. O modo automático anda sozinho
  pelo tempo de leitura declarado na cena, com pausa e retomada.
- **As sete cenas de agente trazem o cartão do agente** — o que faz, o que recebe, o que entrega e
  quem responde por ele. Era o ponto mais fraco do protótipo: os agentes só apareciam como rótulo
  em tabela e nunca eram apresentados. O revisor sai de `src/data/agents.ts`, não do roteiro, para
  não haver duas verdades sobre quem assina.

**A camada não reconstrói nada.** Não altera tela, motor, fixture nem dado: navega pelas rotas que
já existem e lê o roteiro. Os dois únicos pontos de contato com o que já havia são:

1. **Um atributo `data-cena` por âncora**, em nove telas — catorze atributos, nenhuma mudança de
   layout, de classe ou de comportamento. Sem âncora estável, o holofote passaria a iluminar a
   coisa errada a cada mudança de layout, em silêncio e na frente do cliente.
2. **`src/narrative/prepare.ts`**, que leva a onda ao estado que a cena precisa encontrar — pela
   API pública da store, o mesmo caminho dos botões das telas. A cena 11 afirma que um registro
   atravessou os nove passos; com a esteira parada no passo 3 a trilha está pela metade e a cena
   mente. As exceções do corte no meio da palavra saem **rejeitadas**, não aprovadas: é corrigindo
   a regra que elas somem, e esse é o argumento da cena 13.

## Passe de qualidade

O que a suíte trava, para não voltar:

- **`src/copy/format.ts`** é o único lugar que formata data, número e moeda. Data em DD/MM/AAAA,
  milhar com ponto, decimal com vírgula, percentual colado ao símbolo. Há teste que reprova
  recorte de string para montar data fora dali, e o navegador é varrido atrás de AAAA-MM-DD
  renderizado. O ISO sobrevive num lugar só: dentro do XML do Migration Cockpit, onde é o formato
  certo.
- **Idioma.** `src/copy/__tests__/copy.test.ts` varre todo texto visível atrás de inglês fora do
  glossário. Foi assim que entraram `Gates`, `data owner`, `Value domain` e os nove nomes de passo
  da esteira, e que saíram "Status" e "Preview".
- **Consistência aritmética.** `src/engine/__tests__/consistencia.test.ts` liga os números que o
  cliente soma: origem = destino + retidos + fundidos, o total é a soma das quatro SPEs, o destino
  é o que entra no pacote e o que sai no XML, CA-03 é a contagem crítica de `transformation`, e a
  divisão do pacote fecha nos dois tetos. Roda nas duas versões de playbook.
- **Denominador na tela.** O Mission Control perfila **o que foi recebido** (71), não o que a
  fixture tem (84) — o painel ao lado conta os mesmos 71. E o escopo declarado (2.080) diz na
  própria nota que é a onda inteira, não o que o protótipo processa.
- **Esteira parada não tem destino.** Enquanto o run está bloqueado num checkpoint, a
  reconciliação por contagem não mostra número: mostrar "11 no destino" com a esteira parada no
  passo 3 seria a tela contradizendo o próprio motor, ao lado de um placar que já diz "ainda não
  mensurável".
- **Contraste.** `fg-subtle` é medido contra a PIOR superfície de cada modo, não contra a base:
  ele vive em rótulo de 10px sobre `surface-raised` e `surface-sunken`. Auditoria de todas as
  telas em 1920×1080 e 1440×900 não acusa nenhum texto abaixo de 4,5:1.
- **Jost aguenta o português.** Medido: `ç`, `ã`, `õ` e `í` vêm da própria fonte (nada de
  fallback), o acento acrescenta menos de 1px de avanço, e em caixa alta a linha de 10px não corta
  cedilha nem til.
- **Desempenho.** Troca de tela medida em toda a navegação: pior caso 36ms, muito abaixo dos
  200ms. O roteiro roda três vezes seguidas com reset entre elas e produz estado idêntico.

## Comandos

Para a chamada ao vivo do Momento 2, copie `.env.example` para `.env.local` e preencha
`ANTHROPIC_API_KEY`. Sem isso a demonstração roda igual, com a resposta de referência.

```bash
npm run dev        # dev server em http://localhost:5173
npm run build      # typecheck + build de produção
npm run preview    # serve o build
npm run typecheck  # tsc -b
npm run lint       # eslint
npm run check:tokens  # paleta de tailwind.config.ts x @theme de globals.css
npm test           # integridade das fixtures (vitest)
```

## Verificações automáticas

`eslint.config.js` torna verificáveis as regras 1, 2, 4 e 6: `fetch`, `WebSocket`,
`localStorage`, `sessionStorage`, `Math.random` e texto literal em JSX falham o lint. Ao
liberar a rota autorizada do P9, abra a exceção **por arquivo** no config — não afrouxe a
regra global.

O lint cobre o caso comum da regra 2 (texto solto em JSX), mas não pega string passada como
prop (`<Botao rotulo="Salvar" />`). Essa parte continua sendo disciplina de revisão.
