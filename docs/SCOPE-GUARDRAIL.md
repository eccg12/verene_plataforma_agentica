# Guardrail de escopo — o que vai para o cliente

**Regra única deste documento:** tela sem entregável correspondente no SoW não vai
para o cliente. Nem na demonstração conduzida, nem no artifact enviado depois.

O protótipo existe para sustentar o que foi contratado. Cada tela abaixo é
julgada por uma pergunta só — *qual artefato do SoW ela evidencia?* — e não pela
impressão que causa. Tela que sustenta argumento sem entregável atrás é promessa,
e promessa em demonstração vira expectativa que o projeto não cobre.

> Este arquivo não existia. Ele foi criado agora, junto com a versão artifact.
> A coluna **Artefato** usa a numeração A0–A7 e os critérios CA-01–CA-04 que já
> vivem em `src/data/gates.ts`, isto é, o modelo contratual que o próprio
> protótipo executa. **Antes de enviar ao cliente, confira essa coluna contra o
> SoW assinado** — a numeração aqui é a do protótipo, não uma transcrição do
> documento contratual, que não está neste repositório.

## As duas versões

| | Projeto (`src/`) | Artifact (`dist-artifact/kepler-galaxy.jsx`) |
|---|---|---|
| Uso | demonstração conduzida, em sala | envio ao cliente pelo chat, para explorar depois |
| Fixtures | 42 fornecedores · 18 contratos · 24 materiais | 24 · 12 · 14, com todos os tipos de defeito preservados |
| Escopo declarado na tela | 2.080 registros · 48 pacotes | idem, separado do subconjunto demonstrado |
| Camada narrada | 15 cenas, ligada ao abrir | idem — mesmo roteiro, mesmos cartões de agente |
| Fonte de verdade | **sim** | não — é um recorte, e o repositório manda |

## Telas

| Tela | Artefato / critério | Gate | Artifact | Por quê |
|---|---|---|---|---|
| `/mission-control` | A0 — escopo declarado e recibo de recepção | G0 | **entra** | O denominador de todo percentual medido depois. Sem ele, nenhum número dos Gates seguintes tem contra o que ser medido. |
| `/mapping` | A1 — dicionário de mapeamento aprovado | G1 | **entra** | É o entregável do G1, campo a campo contra a configuração ativa do tenant, com as divergências do padrão SAP declaradas uma a uma. |
| `/record/:id` | A2 — rastreabilidade em nível de campo | G2 | **entra** | É o que sustenta "100% transformados" na auditoria: valor de origem, regra aplicada com id e versão, valor final. |
| `/review/duplicates` | A2 — registro de deduplicação decidido | G2 | **entra** | O racional do match sinal a sinal e a decisão humana registrada. É o entregável que o G2 assina. |
| `/review/exceptions` | A3 — registro de exceções decididas | G3 | **entra** | Cada exceção com dono nomeado, prazo e decisão. Sem esta tela o G3 não tem o que aprovar. |
| `/review/candidate` | A3 — exceção `DEF-TGT-04` escalada, não resolvida no código | G3 | **entra** | Evidencia a regra de negócio que não existe escrita em lugar nenhum e a roteia ao dono. É parte do registro de exceções, não uma tela à parte do escopo. |
| `/playbook` | A7 — documentação do playbook na versão da entrega | G7 (e G0, pelo selo) | **entra** | A documentação é gerada das próprias regras. É entregável de encerramento e também a evidência do playbook selado no G0. |
| `/packages` | A4 — pacote, manifest e checksum | G4 | **entra** | O artefato que vai para a carga, com a conformidade conferida e a simulação registrada. |
| `/reconciliation` | A6 — reconciliação origem × destino · CA-01 a CA-04 | G6 | **entra** | O entregável comercialmente mais pesado: fecha a conta, explica toda diferença e mede os quatro critérios de aceite. |
| `/gates` | A0–A7 — a trilha de assinatura de todos os artefatos | G0–G7 | **entra** | É a tela que mostra o próprio mecanismo contratual. Sem ela, os artefatos existem sem quem os assinou. |
| `/gates/payment` | cronograma de desembolso ligado aos Gates | G1, G2, G4, G6, G7 | **entra, atrás de flag** | Existe entregável (a parcela por Gate), mas é conversa comercial, não de projeto. **Não abre sem ser pedido:** só com `?flag=comercial` na URL ou a tecla `C` na sala. |
| `/styleguide` | *nenhum* | — | **NÃO entra** | Página interna do design system. Não há entregável de SoW atrás dela, e mostrá-la desloca a conversa do que foi contratado para a estética da ferramenta. Fica no repositório, fora do artifact. |

## O que o artifact mostra sem entregável atrás — e por que continua honesto

Três coisas aparecem na tela sem serem entregáveis. Todas são **estado
declarado**, não promessa:

- **Pedidos, requisições e posições de estoque** aparecem na grade dos 48 pacotes
  como `não iniciado`. Não há extrato desses três objetos. Declarar estado de dado
  que não existe seria inventar; omiti-los da grade contradiria o escopo de 2.080
  registros que o próprio quadro soma.
- **Wave 2 e Wave 3** aparecem como planejadas, com data. São escopo declarado, não
  resultado.
- **O subconjunto demonstrado (50 registros)** aparece ao lado do escopo declarado
  (2.080 registros), com a frase que separa um do outro. O artifact roda sobre a
  amostra; o projeto é o escopo. A tela nunca apresenta um pelo outro.

## Antes de enviar

1. Conferir a coluna **Artefato** contra o SoW assinado. Qualquer linha que não
   case vira uma de duas coisas: a tela sai, ou o SoW ganha o entregável — nunca
   "deixa passar, é só demonstração".
2. Confirmar que `/gates/payment` está desligado no link enviado (sem
   `?flag=comercial`).
3. Confirmar que o selo **Ambiente de demonstração — dados sintéticos** está
   visível na barra superior. Ele é permanente e não deve ser removido para a
   captura de tela ficar mais limpa.
