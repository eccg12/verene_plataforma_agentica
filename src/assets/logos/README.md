# Slots de logo

Substituir os dois arquivos **mantendo os nomes**:

- `verene.svg` — Verene Energia
- `monoda.svg` — Monoda Consulting Group

Os atuais são placeholders. O componente `BrandLogo` os injeta inline
(`?raw`), então um SVG que use `currentColor` acompanha a superfície (escura ou
clara) automaticamente. Se o logo oficial tiver cor fixa de marca, ele será
renderizado com a própria cor — nesse caso verifique a legibilidade sobre
`#111111` e sobre `#F7F7F7`, e se precisar peça uma variante monocromática.

Sem largura/altura fixas no `<svg>`: mantenha só o `viewBox` para o componente
controlar o tamanho.
