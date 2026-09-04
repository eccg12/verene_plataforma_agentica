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

1. **Nenhuma chamada de rede** exceto a rota explicitamente autorizada no P9. Sem `fetch`,
   `XMLHttpRequest`, `WebSocket`, `EventSource`, sem CDN, sem webfont externa, sem
   analytics, sem imagem hospedada fora do repositório.
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

**Determinismo.** O estado final de um registro é *derivado* das assinaturas, nunca acumulado por
mutação ao longo dos passos: acumular dava ordem-dependência. Não há `Math.random` nem `Date.now`
no motor; o instante vem do epoch fixo de `clock.ts`. Entrada e saída são ordenadas de forma
total, então a ordem dos registros de entrada não afeta a saída. Mesma entrada + mesma versão de
playbook = saída idêntica byte a byte, e há teste comparando `JSON.stringify` de duas execuções.

**Estado da simulação** em `src/engine/store.ts` (Zustand, em memória, com `reset()`). Guarda só o
que um humano decidiu — recorte e assinaturas. O resultado da esteira não é estado: é derivado a
cada mudança, porque derivar de algo determinístico não pode divergir do que as regras produziriam.

## Comandos

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
