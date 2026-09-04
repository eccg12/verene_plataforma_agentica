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

## Comandos

```bash
npm run dev        # dev server em http://localhost:5173
npm run build      # typecheck + build de produção
npm run preview    # serve o build
npm run typecheck  # tsc -b
npm run lint       # eslint
```

## Verificações automáticas

`eslint.config.js` torna verificáveis as regras 1, 2, 4 e 6: `fetch`, `WebSocket`,
`localStorage`, `sessionStorage`, `Math.random` e texto literal em JSX falham o lint. Ao
liberar a rota autorizada do P9, abra a exceção **por arquivo** no config — não afrouxe a
regra global.

O lint cobre o caso comum da regra 2 (texto solto em JSX), mas não pega string passada como
prop (`<Botao rotulo="Salvar" />`). Essa parte continua sendo disciplina de revisão.
