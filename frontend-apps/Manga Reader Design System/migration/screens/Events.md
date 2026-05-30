# Events — Eventos

> Calendário e listagem de eventos da comunidade.

## Rota

`/events`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── <SectionHeader>
│   eyebrow="Comunidade"
│   title="Eventos"
│   meta="X próximos eventos"
│
├── Toolbar
│   ├── <SegmentedControl> Próximos | Esta semana | Este mês | Passados
│   ├── <Select> tipo (Todos / Lançamento / Encontro / Stream / Anúncio)
│   └── (futuro) view toggle: lista | calendário
│
├── Section "Em destaque"
│   ├── <SectionHeader size="sm" title="Em destaque" />
│   └── grid de <EventCard special /> (1/2 colunas)
│
└── Section "Próximos"
    ├── <SectionHeader size="sm" title="Próximos" />
    └── grid de <EventCard /> (1/2/3 colunas)
```

## Componentes

`PageContainer`, `SectionHeader`, `SegmentedControl`, `Select`, `EventCard`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 2 special + 6 normal |
| Vazio | EmptyState `pensando` "Sem eventos no momento" + Button "Criar evento" (se permitido) |
| Tab Passados vazia | EmptyState `surpresa` "Nada por aqui ainda" |
| Sucesso | seções com cards |

## Comportamentos

- Filtros em URL (`?period=week&type=stream`)
- "Tenho interesse" toggle direto no card
- Click → `/events/:id`

## Responsividade

| Breakpoint | Grids |
|---|---|
| <640 | special: 1col / normal: 1col |
| 640–1023 | special: 1col / normal: 2col |
| ≥1024 | special: 2col / normal: 3col |

## A11y

- Eventos passados marcados claramente (não só visual)
- Botão "interesse" com `aria-pressed`
