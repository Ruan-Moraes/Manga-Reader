# Home — Tela inicial

> Vitrine principal. Risco **alto** — qualquer regressão é visível por 100% dos usuários.

## Rota

`/` (default)

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── <HeroSection>
│   ├── eyebrow="Em destaque" + ícone Sparkles
│   ├── title (manga destaque da semana)
│   ├── description (sinopse curta)
│   ├── meta (Stars + Badge gênero + Badge status)
│   ├── actions (Button primary "Começar a ler" + Button raised "Adicionar")
│   └── visual: <MangaPoster size={280} elevated />
│
├── Section: Continue lendo  (só renderiza se user logado E tem progresso)
│   ├── <SectionHeader> eyebrow="Sua biblioteca" title="Continue de onde parou" action="Ver tudo →"
│   └── grid horizontal scroll de <MangaCard progress={X} /> — 1.5/2.5/4 colunas
│
├── Section: Em alta
│   ├── <SectionHeader> eyebrow="Esta semana" title="Em alta na comunidade"
│   └── grid <MangaCard tag={<Badge>Top N</Badge>} /> — 2/3/5 colunas
│
├── Section: Lançamentos da semana
│   ├── <SectionHeader> title="Lançamentos da semana" meta="atualizado há 2h"
│   └── grid <MangaCard /> — 2/3/5 colunas
│
├── Section: Comunidade
│   ├── <SectionHeader> eyebrow="Fórum" title="O que estão discutindo"
│   ├── 3 <ForumTopicCard live={X} /> empilhados
│   └── <Button variant="raised">Ver o fórum →</Button>
│
├── Section: Grupos novos
│   ├── <SectionHeader> title="Grupos pra conhecer"
│   └── grid <GroupCard /> — 1/2/3 colunas
│
└── Section: Para você  (só logado)
    ├── <SectionHeader> eyebrow="Recomendado" title="Pra você" meta="treinado no seu histórico"
    └── grid <MangaCard /> — 2/3/5 colunas
```

## Componentes consumidos

`PageContainer`, `HeroSection`, `SectionHeader`, `MangaCard`, `MangaPoster`, `ForumTopicCard`, `GroupCard`, `Button`, `Badge`, `Stars`, `Skeleton`, `EmptyState`.

## Estados

| Estado | Quando | UI |
|---|---|---|
| Initial loading | dados ainda fetching | Skeletons no hero + 5 cards skeleton por seção |
| Empty (deslogado, sem dados) | API retorna vazio | EmptyState ilustração `pensando` + CTA "Entrar pra ver recomendações" |
| Erro de fetch | API 500 | Banner top com Toast + seções afetadas em estado vazio com retry |
| Sucesso | tudo carregado | layout completo |

## Comportamentos

- Hero destaque é **rotativo** se a API retorna múltiplos destaques (auto-advance a cada 8s, pausa no hover, indicadores embaixo do hero)
- Grids horizontais (Continue lendo): scroll-snap, sem botões prev/next no mobile; setas em hover no desktop
- "Em alta" e "Para você" usam **mesma estrutura**, só mudam título e source de dados — não criar componentes diferentes
- Click em qualquer manga card → `/title/:id`
- Click em topic card → `/forum/topic/:id`
- Click em group card → `/groups/:id`

## Responsividade

| Breakpoint | Hero | Grid |
|---|---|---|
| <640 | stack (visual em cima, copy embaixo) | 1.5 colunas com scroll horizontal |
| 640–1023 | hero stack OU side-by-side se height suficiente | 3 colunas |
| ≥1024 | side-by-side, copy 1fr, poster 280px | 5 colunas |
| ≥1280 | idem | 6 colunas |

## A11y

- Hero como `<section aria-label="Destaque da semana">`
- Cada seção como `<section>` com `<h2>` (do SectionHeader)
- Skip link "Ir pro conteúdo" no topo do PageContainer
- Auto-advance do hero respeita `prefers-reduced-motion`

## Performance

- Hero é LCP da página — preload da capa em destaque
- Lazy-load das seções abaixo do fold via `IntersectionObserver`
- `MangaCard` em listas grandes (Para você) com windowing se >50 itens
