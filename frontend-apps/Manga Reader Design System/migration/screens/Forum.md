# Forum — Lista de tópicos

> Hub principal de discussões da comunidade.

## Rota

`/forum`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── <SectionHeader>
│   eyebrow="Comunidade"
│   title="Fórum"
│   meta="X tópicos · Y posts hoje"
│   action={<Button variant="primary" icon={Plus}>Novo tópico</Button>}
│
├── Status banner (live)
│   StatusDot pulse + "X.XXX leitores discutindo agora"
│
├── Toolbar (sticky)
│   ├── <SearchField size="md" placeholder="Buscar no fórum" />
│   ├── <Select> ordenar (Recentes / Mais ativos / Top semana / Mais visualizados)
│   └── <SegmentedControl> Todos | Discussão | Spoiler livre | Notícia
│
├── Tópicos fixados (1-3, badge "Fixado")
│   └── lista de <ForumTopicCard pinned />
│
├── Categorias (chips horizontais com count)
│   └── botões scrolláveis com counts
│
└── lista de <ForumTopicCard />
    └── <Pagination /> embaixo
```

## Componentes

`PageContainer`, `SectionHeader`, `Button`, `StatusDot`, `SearchField`, `Select`, `SegmentedControl`, `Badge`, `ForumTopicCard`, `Pagination`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: 8 topic cards |
| Vazio | EmptyState `pensando` + "Seja o primeiro a abrir uma discussão" + Button "Novo tópico" |
| Erro | EmptyState `triste` + retry |
| Sucesso | layout |

## Comportamentos

- "Novo tópico" abre `<ForumComposer />` (modal)
- Click em topic card → `/forum/topic/:id`
- Chip de categoria atua como filtro (URL `?cat=spoiler-livre`)
- "Live count" atualiza via polling/WS (futuro)

## Responsividade

| Breakpoint | Layout |
|---|---|
| <md | 1 coluna; toolbar stack |
| ≥md | 1 coluna mais largo; toolbar inline |

## A11y

- Status live: `aria-live="polite"` contando "X leitores discutindo agora"
- Composer abre como dialog/modal
