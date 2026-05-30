# GroupDetail — Detalhe do grupo

## Rota

`/groups/:id`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── Group hero
│   ├── Banner (h=200, gradient ou imagem do grupo)
│   ├── Avatar 96 sobreposto
│   ├── Linha 1: Nome + verified
│   ├── Handle @grupo
│   ├── StatusDot + label
│   ├── Tags pills (idiomas, gêneros)
│   ├── Bio
│   └── Actions: <Button primary>Seguir</Button> + <Button raised>Compartilhar</Button>
│
├── Stats row (4 cards)
│   ├── Seguidores
│   ├── Obras
│   ├── Capítulos publicados
│   └── Tempo médio entre capítulos
│
├── <Tabs>
│   ├── Obras (default)
│   ├── Atividade
│   ├── Membros
│   └── Sobre
│
├── TabPanel: Obras
│   ├── Toolbar: <Select> ordenar + chips de status
│   └── grid <MangaCard /> com badge do progresso de tradução
│
├── TabPanel: Atividade
│   └── timeline de publicações (mesmo formato de NewReleases mas filtrado por grupo)
│
├── TabPanel: Membros
│   └── grid de cards (Avatar 64 + role + entrou em)
│
└── TabPanel: Sobre
    ├── Bio completa
    ├── Histórico (criado em, marcos)
    ├── Onde nos encontrar (Discord, X, etc.)
    └── Email de contato
```

## Componentes

`PageContainer`, `Avatar`, `Badge`, `Button`, `StatusDot`, `Tabs`, `Card`, `Select`, `MangaCard`, `Skeleton`, `EmptyState`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: banner, avatar, h1, 4 stats, grid 6 cards |
| Grupo não encontrado | 404 |
| Inativo | banner com aviso "Esse grupo está inativo desde X" |
| Sucesso | layout completo |

## Comportamentos

- Seguir/parar de seguir: optimistic + Toast
- Click em obra → TitleDetail
- Link "Reivindicar perfil" se grupo não verificado E user não é membro

## Responsividade

| Breakpoint | Hero |
|---|---|
| <md | banner h=140, avatar 80, stack vertical |
| ≥md | banner h=200, avatar 96 sobreposto |

Stats row:
- <md: 2 cols (2x2)
- ≥md: 4 cols

## A11y

- `<h1>` é nome do grupo
- Stats como `<dl>`
- Tabs com painéis condicionalmente renderizados
