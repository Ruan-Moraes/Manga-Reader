# Groups — Lista de grupos

> Catálogo de grupos de scan/tradução com filtros.

## Rota

`/groups`

## Layout em árvore

```
<PageContainer asMain size="wide" paddingY="md">
├── <SectionHeader>
│   eyebrow="Comunidade"
│   title="Grupos de scan"
│   meta="X grupos ativos"
│   action={<Button variant="raised">Reivindicar grupo</Button>}
│
├── Toolbar (sticky)
│   ├── <SearchField size="md" />
│   ├── <Select> ordenar (Mais ativos / Mais seguidores / A-Z / Recentes)
│   └── Chips de status: Ativos · Em hiato · Verificados · Todos
│
├── Featured (1-2 grupos em destaque, <GroupCard /> larger)
│   └── grid 1/2 cols
│
└── grid <GroupCard /> (1/2/3/4 colunas)
```

## Componentes

`PageContainer`, `SectionHeader`, `Button`, `SearchField`, `Select`, `Badge` (chips), `GroupCard`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 2 featured + 8 cards |
| Sem resultados | EmptyState `duvida` |
| Sucesso | grid |

## Comportamentos

- **Reivindicar grupo**: redirect para `/profile/edit#groups` (form de solicitação)
- **Seguir** direto do card (optimistic + Toast)
- Click em card → `/groups/:id`

## Responsividade

| Breakpoint | Grid |
|---|---|
| <640 | 1 coluna |
| 640–1023 | 2 colunas |
| 1024–1279 | 3 colunas |
| ≥1280 | 4 colunas |

## A11y

- Chips de status como `<button role="checkbox" aria-checked>`
- "Verificado" tem tooltip + label explicativo
