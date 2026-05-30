# ForumTopic — Detalhe do tópico

> Thread completa com replies aninhadas. Risco **alto** — preservar ordem dos comentários durante migração.

## Rota

`/forum/topic/:id`

## Layout em árvore

```
<PageContainer asMain size="narrow" paddingY="md">
├── Breadcrumb: Fórum › Categoria › Título atual
│
├── Topic head
│   ├── Badges (categoria, fixado, spoiler)
│   ├── <h1> Title
│   ├── Author row: Avatar + nome + handle + when
│   └── Stats: replies · views · live count
│
├── Original post (first <CommentBox highlighted />)
│   ├── Content
│   └── Footer: vote + reply + share + bookmark
│
├── Toolbar (sticky)
│   ├── <Select> ordenar (Top / Recentes / Antigos)
│   └── <Switch> "Mostrar marcações de spoiler"
│
├── Lista de <CommentBox /> (replies)
│   ├── Cada reply pode ter replies (nível 1 aninhado, max)
│   └── Após 5 replies, "Ver mais X respostas" colapsa
│
├── <Pagination /> ou infinite scroll
│
└── Reply composer (sticky bottom OU final da lista)
    ├── <Textarea autoResize placeholder="Comentar (sem spoiler de cap futuro)" />
    └── Actions row: Markdown hints + <Button primary>Publicar</Button>
```

## Componentes

`PageContainer`, `Badge`, `Avatar`, `CommentBox`, `Textarea`, `Button`, `Select`, `Switch`, `Pagination`, `Skeleton`, `EmptyState`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: title, original post, 5 replies |
| Sem replies | EmptyState `pensando` + "Seja o primeiro a responder" |
| Tópico fechado | Composer escondido + banner "Tópico fechado por mod em X" |
| Spoiler avisado | banner topo "Esse tópico contém spoilers; conteúdo borrado por padrão" |

## Comportamentos

- **Spoiler tags inline** (`<spoiler>texto</spoiler>` em markdown) → renderiza borrado, click pra revelar
- **Reply em específico**: click "Responder" no CommentBox preenche composer com referência
- **Vote**: optimistic
- **Mod actions** (se moderator): pinned/fechar/remover acessíveis em DropdownMenu
- **Mention** (`@user`): autocomplete no composer

## Responsividade

| Breakpoint | Composer |
|---|---|
| <md | sticky bottom (fica acima da tab bar com 72px offset) |
| ≥md | inline no final da lista |

Replies aninhadas:
- <md: padding-left 12, sem border-left visual
- ≥md: padding-left 16 + border-left 2px accent-25

## A11y

- Original post tem `aria-label="Post original do tópico"`
- Replies aninhadas: estrutura `<ul>` + `<li>` com `aria-level`
- Spoiler tags: `<button aria-expanded>` que revela conteúdo
- Composer Textarea com `<Label>` "Sua resposta"

## Performance

- Lista de replies com windowing se > 100
- Markdown rendered server-side (ou client com cache)
