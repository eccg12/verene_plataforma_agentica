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
