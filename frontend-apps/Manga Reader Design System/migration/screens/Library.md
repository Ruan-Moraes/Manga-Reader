# Library — Minha biblioteca

> Coleção pessoal organizada por status. Acessível só logado.

## Rota

`/library` (redireciona pra `/login?next=/library` se deslogado)

## Layout em árvore

```
<PageContainer asMain size="wide" paddingY="md">
├── <SectionHeader>
│   eyebrow="Sua coleção"
│   title="Minha biblioteca"
│   meta="X obras · atualizada agora"
│   action={<Button variant="raised" icon={Plus}>Adicionar</Button>}
│
├── <Tabs> variant="underline"
│   ├── Todas (default)
│   ├── Lendo (badge contador)
│   ├── Concluídos
│   ├── Em espera
│   ├── Largados
│   └── Planejados
│
├── Toolbar row (sticky abaixo das tabs)
│   ├── <SearchField size="sm" placeholder="Buscar na biblioteca" />
│   ├── <Select options={ordering} />   ← Recentes / A-Z / Z-A / Rating
│   └── <SegmentedControl> grid | list  (toggle de layout)
│
└── Content
    ├── Se layout=grid: grid de <MangaCard progress={X} size="md" />
    │                    2/3/5/6 colunas
    │
    ├── Se layout=list: lista de <ChapterListItem variante> — uma linha por obra
    │                    com: poster mini + título + último cap lido + ações
    │
    └── <Pagination /> embaixo
```

## Componentes

`PageContainer`, `SectionHeader`, `Tabs`, `MangaCard`, `SearchField`, `Select`, `SegmentedControl`, `Pagination`, `Button`, `EmptyState`, `Skeleton`.

## Estados (por tab)

| Estado | UI |
|---|---|
| Loading | grid de 8 skeleton cards |
| Vazio (sem nenhum item no status) | EmptyState `pensando` + CTA específico ("Que tal começar por aqui?" + link descobrir) |
| Vazio após filtro/busca | EmptyState `duvida` + "Tente outro termo" |
| Sucesso | grid/list |

## Comportamentos

- **Status tab** muda lista; URL reflete via `?status=reading`
- **Long-press / context menu** num MangaCard abre DropdownMenu: Mover para…, Marcar como…, Remover
- **Multi-select** (desktop, hold Shift): aparece toolbar com ações em massa
- **Importar lista** (do MAL/AniList): botão "Adicionar" abre Modal com 3 abas (Buscar / Importar / Colar URL)
- Layout escolhido (`grid`/`list`) salvo em `localStorage`
- Em mobile, `list` view é o default (mais útil em screen pequeno)

## Responsividade

| Breakpoint | Grid colunas | Layout default |
|---|---|---|
| <640 | 2 | list |
| 640–1023 | 3 | grid |
| 1024–1279 | 5 | grid |
| ≥1280 | 6 | grid |

Toolbar: stack vertical em <640; side-by-side acima.

## A11y

- Tabs com contadores: `aria-label="Lendo, 12 obras"` (já que o número não é sempre legível pelos leitores)
- Multi-select: live region anuncia "X obras selecionadas"
- Confirmar antes de remover (Modal com botão danger)
