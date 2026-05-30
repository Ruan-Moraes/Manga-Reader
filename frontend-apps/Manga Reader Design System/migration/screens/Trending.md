# Trending — Em alta

> Ranking de obras populares com filtros temporais e categorias.

## Rota

`/trending`

## Layout em árvore

```
<PageContainer asMain size="wide" paddingY="md">
├── <SectionHeader>
│   eyebrow="Esta semana"
│   title="Em alta na comunidade"
│   meta="atualizado a cada 30 min"
│
├── Toolbar
│   ├── <SegmentedControl> Hoje | Semana | Mês | Sempre
│   ├── <Select> categoria (Todas / Shounen / Seinen / Manhwa / Webtoon...)
│   └── <Select> demografia (futuro)
│
├── Top 3 podium (apenas em ≥md)
│   ├── 2º lugar (esquerda, MangaCard size="md")
│   ├── 1º lugar (centro, MangaCard size="lg" + Badge "Top 1" + shadow accent)
│   └── 3º lugar (direita, MangaCard size="md")
│
└── Lista numerada (do 4º em diante)
    └── Cada item:
        ├── Posição em font-mr-mono extra-bold 32px accent
        ├── <MangaCard size="sm" />
        ├── Stats: leitores ativos · variação semanal (verde-amarelo / coral)
        └── Sparkline (linha de progresso de 7 dias)
```

## Componentes

`PageContainer`, `SectionHeader`, `SegmentedControl`, `Select`, `MangaCard`, `Badge`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 3 grandes no podium + 10 linhas |
| Erro | EmptyState `triste` + retry |
| Sucesso | layout completo |

## Comportamentos

- Filtros persistidos em URL: `?period=week&cat=all`
- Variação semanal: badge accent "+12%" ou danger "-8%"
- Click no card → TitleDetail

## Responsividade

| Breakpoint | Podium |
|---|---|
| <md | sem podium especial, top 3 vira lista numerada como o resto |
| ≥md | layout em 3 colunas (2º | 1º | 3º) com 1º maior |
| ≥lg | mais largura no 1º |

Lista numerada:
- <md: 1 coluna vertical
- ≥md: 2 colunas
- ≥lg: 3 colunas

## A11y

- Podium em `<ol>` com `<li>` por colocação
- "Variação semanal" deve ler "subiu X" ou "caiu X" (não apenas % com cor)
