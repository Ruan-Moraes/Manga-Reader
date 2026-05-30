# Categories — Categorias / Busca avançada

> Catálogo filtrado por gênero, demografia, status, ano, etc.

## Rota

`/genres` ou `/categories` ou `/search` (mesma tela, query inicial diferente)

## Layout em árvore

```
<PageContainer asMain size="wide" paddingY="md">
├── <SectionHeader>
│   eyebrow="Catálogo"
│   title="Explorar"
│   meta="X obras nos filtros"
│
├── Mobile: <Button variant="raised" icon={Filter}>Filtros (3)</Button>
│   abre <Drawer side="right"> com filtros (CategoriesFilters)
│
├── Layout grid:
│   ├── (≥lg) Sidebar 260px com CategoriesFilters inline
│   └── Main content:
│       ├── <SearchField size="md" />
│       ├── Toolbar:
│       │   ├── Filtros aplicados (chips removíveis: "Shounen ×")
│       │   ├── <Select> ordenar (Relevância / A-Z / Z-A / Rating / Lançamento)
│       │   └── <SegmentedControl> grid | list
│       └── Content:
│           ├── grid de <MangaCard /> (2/3/5/6 colunas)
│           └── <Pagination /> embaixo
│
└── EmptyState `duvida` quando sem resultados
```

## CategoriesFilters (componente interno)

```
<aside>
├── Section "Gêneros" — checkbox group com contadores
├── Section "Demografia" — radio: Shounen, Seinen, Shoujo, Josei, Kodomo
├── Section "Formato" — checkbox: Mangá, Manhwa, Manhua, Webtoon
├── Section "Status" — radio: Em andamento, Completo, Hiato
├── Section "Ano" — slider range (1950 - 2026)
├── Section "Avaliação mínima" — slider 0-5
├── Section "Idiomas disponíveis" — checkbox group
└── Footer: <Button>Limpar tudo</Button> <Button primary>Aplicar (mobile)</Button>
```

## Componentes

`PageContainer`, `SectionHeader`, `SearchField`, `Select`, `SegmentedControl`, `Drawer`, `Button`, `Checkbox`, `RadioGroup`, `Badge` (chips), `MangaCard`, `Pagination`, `EmptyState`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 12 cards |
| Sem resultados | EmptyState `duvida` + "Tente ajustar os filtros" + Button "Limpar filtros" |
| Erro | EmptyState `triste` + retry |
| Sucesso | grid |

## Comportamentos

- **Filtros em URL**: `?genres=shounen,seinen&status=completed&year=2020-2026`
- **Aplicar (desktop)**: live, debounced 300ms
- **Aplicar (mobile)**: no clique do botão dentro do drawer
- **Reset**: botão "Limpar tudo" preserva busca textual
- **Sort persistido** em localStorage

## Responsividade

| Breakpoint | Layout |
|---|---|
| <lg | Sidebar oculta; botão "Filtros" abre Drawer |
| ≥lg | grid 260px + 1fr |

Cards: 2/3/5/6 colunas conforme breakpoint.

## A11y

- Sidebar como `<aside aria-label="Filtros">`
- Cada section dentro: `<fieldset>` com `<legend>`
- Chip de filtro removível: `<button>` com `aria-label="Remover filtro Shounen"`
- Count de resultados anunciado via `aria-live="polite"`
