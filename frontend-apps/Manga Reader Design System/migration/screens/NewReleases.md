# NewReleases — Lançamentos recentes

> Linha do tempo de capítulos publicados, agrupados por dia.

## Rota

`/new` ou `/releases`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── <SectionHeader>
│   eyebrow="Capítulos novos"
│   title="Lançamentos recentes"
│   meta="X capítulos nas últimas 24h"
│
├── Filter row (sticky)
│   ├── <SearchField size="sm" placeholder="Filtrar por obra" />
│   ├── <Select options={["Todos idiomas", "PT-BR", "EN", "JP"]} />
│   └── <Switch /> "Só obras na minha biblioteca"
│
└── Timeline groups
    ├── Grupo: HOJE
    │   ├── Header: HOJE · 12 capítulos
    │   └── Lista de items por capítulo:
    │       ├── Hora (HH:MM)
    │       ├── <MangaPoster size={60} radius="sm" />
    │       ├── Manga title + cap. number + group avatar
    │       └── Badges (idioma, "novo desde sua última visita")
    │
    ├── Grupo: ONTEM
    ├── Grupo: HÁ 2 DIAS
    └── ...
```

## Componentes

`PageContainer`, `SectionHeader`, `SearchField`, `Select`, `Switch`, `MangaPoster`, `Avatar` (group), `Badge`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 5 grupos de 4 itens |
| Vazio com filtro "só biblioteca" | EmptyState `pensando` "Nenhum cap. novo nas obras que você segue" + Button "Descobrir novas obras" |
| Vazio total | EmptyState `surpresa` "Tudo em dia!" |
| Sucesso | timeline |

## Comportamentos

- **Infinite scroll** carregando mais grupos antigos ao chegar perto do fim
- Click em item → vai direto pro Reader
- "Marcar tudo como visto" no header de cada grupo

## Responsividade

| Breakpoint | Layout |
|---|---|
| <md | 1 coluna, poster 48 |
| ≥md | 2 colunas, poster 60 |
| ≥lg | 3 colunas |

## A11y

- Group headers com `<h2>` semântico (data)
- Hora visível e lida ("publicado às 14:32")
