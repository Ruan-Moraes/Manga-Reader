# News — Novidades

> Feed de atualizações do app, mundo dos mangás e comunidade.

## Rota

`/news`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── <SectionHeader> eyebrow="Novidades" title="O que rolou essa semana"
│
├── <Tabs> variant="pills" size="sm"
│   ├── Tudo (default)
│   ├── O app
│   ├── Mundo dos mangás
│   └── Comunidade
│
├── Pinned hero card (1, se houver "pinned" no resultado filtrado)
│   ├── Badges (Fixado, categoria, when)
│   ├── <h2> Title
│   ├── Excerpt + Body
│   └── <Button variant="raised">Ler mais</Button>
│
├── grid de news cards (auto-fill minmax 280px)
│   └── Card por item:
│       ├── Top stripe colorida (tone do item)
│       ├── Badges (categoria, when)
│       ├── <h3> Title
│       ├── Excerpt (line-clamp 3)
│       └── <a>Ler mais →</a>
│
└── Vazio: <EmptyState illustration="duvida" title="Nada por aqui nessa categoria" />
```

## Componentes

`PageContainer`, `SectionHeader`, `Tabs`, `Card`, `Badge`, `Button`, `EmptyState`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: hero card + 6 normal cards |
| Vazio (categoria) | EmptyState `duvida` |
| Sucesso | hero + grid |

## Comportamentos

- Filter persiste em URL: `?cat=app`
- Click em qualquer card → `/news/:id`
- Hero pinned card só aparece em tab "Tudo" OU se item pinned bate a categoria

## Responsividade

| Breakpoint | Grid |
|---|---|
| <640 | 1 coluna |
| 640–1023 | 2 colunas |
| ≥1024 | 3 colunas |

## A11y

- `<article>` por card
- Tabs com counters opcionais em badge
