# Reader — Leitor de mangá

> Tela mais sensível do produto. Risco **crítico**. Manter feature flag por 2 sprints
> após migração.

## Rota

`/title/:id/read/:chapter` (ou `/r/:titleId/:chapter`)

## Layout em árvore

```
<div className="reader-shell">  ← bg pode mudar via tweak (black/dark/paper)
│
├── Top chrome (sticky abaixo do NavBar global, auto-hide ao rolar pra baixo)
│   ├── <IconButton icon={ChevronLeft} aria-label="Voltar" />
│   ├── Title button (clicável → ChapterDropdown)
│   │   ├── Manga title (accent) + Cap. N
│   │   └── Página X de Y · status
│   └── Actions:
│       ├── Page counter (visible md+): "01/18"
│       ├── <IconButton icon={Bookmark} />
│       ├── <IconButton icon={MessageSquare} /> ← toggle comentários inline
│       └── <IconButton icon={Settings} /> ← abre Drawer
│
├── Reading area (depende do modo)
│   ├── Vertical (default, webtoon):
│   │   └── coluna com pages stacked, gap configurável,
│   │      InlineCommentMarker entre pages quando ativo
│   │
│   ├── Paged (single):
│   │   └── 1 página centralizada, click esquerdo/direito ou rails
│   │
│   ├── Double (≥lg):
│   │   └── 2 páginas lado a lado, RTL ou LTR
│   │
│   └── End of chapter card (fim da lista vertical OU page+1 em paged)
│       ├── Ilustração `feliz`
│       ├── "Você zerou o capítulo N"
│       ├── Avaliação inline: Stars input + média da comunidade
│       ├── Quick comment: Textarea + Button "Publicar"
│       └── Nav cards: próximo cap (primary) / voltar à obra / discussão
│
├── Side rails (≥lg, modos paged/double, invisíveis até hover)
│   ├── Rail esquerdo: click → prev page (ou next em RTL)
│   └── Rail direito: click → next page (ou prev em RTL)
│
├── Bottom toolbar (fixed bottom, floating, auto-hide com top)
│   ├── Grupo esquerdo: cap anterior, página anterior
│   ├── Scrubber: progress bar interativa + stamp "01/18"
│   └── Grupo direito: próxima página (primary), próximo cap
│
└── Drawer (right, ao abrir settings)
    ├── Modo: SegmentedControl (Vertical/Paged/Double)
    ├── Direção: SegmentedControl (LTR/RTL) — só não-vertical
    ├── Ajuste: SegmentedControl (Largura/Altura/Original)
    ├── Gap: SegmentedControl (0/8/16/32) — só vertical
    ├── Fundo: SegmentedControl (Preto/Escuro/Papel)
    ├── Toggle: comentários por página
    └── Lista de atalhos de teclado (Kbd table)
```

## Componentes

`IconButton`, `Drawer`, `SegmentedControl`, `Switch`, `Button`, `ProgressBar` (scrubber), `Kbd`, `Avatar` (comentários inline), `CommentBox` (mini), `Badge`, `Stars`, `Textarea`, `EmptyState` (`feliz`), `Card`.

## Estados

| Estado | UI |
|---|---|
| Loading capítulo | Skeleton: page placeholders com gradient do manga (2-3) |
| Erro de fetch | EmptyState `triste` + Button retry |
| Capítulo bloqueado (early access) | EmptyState `pensando` + CTA "Apoiar pra ler antes" |
| Capítulo não encontrado | redireciona pra TitleDetail |
| Sucesso | leitura |
| Fim do capítulo | end card visível |

## Comportamentos críticos

### Auto-hide do chrome
- Ao rolar pra baixo > 120px: ambos chrome desaparecem (transform translateY ± 100%)
- Ao rolar pra cima: reaparecem
- Quando settings drawer aberto: sempre visíveis

### Atalhos de teclado
- `←` / `K`: página anterior
- `→` / `J`: próxima página
- `S`: abrir/fechar settings
- `Esc`: fechar drawer/dropdown
- Em vertical, `J/K` faz scrollIntoView na página +1/-1
- Em paged/double, `J/K` setPage(p±step)

### Scrubber
- Click no track: pula pra página calculada
- Drag (futuro): scrubbing live
- Sempre mostra `current/total` à direita

### ChapterDropdown
- Abre ao clicar no título
- Mostra 10 últimos capítulos com indicador "Lendo"
- Click → setChapter + scrollTop

### Comentários inline (vertical apenas)
- Toggle via IconButton no top chrome
- Chip "X comentários na pg. N" entre as páginas
- Click expande fio com 1 comentário top + botão "Ver os outros N comentários"

### IntersectionObserver
- Rastreia qual página está mais centralizada (vertical mode) → atualiza scrubber + counter

## Responsividade

| Breakpoint | Mudanças |
|---|---|
| <md | Page counter no top oculto (só no scrubber); bottom toolbar full-width com margin lateral; modo Double indisponível |
| ≥md | Page counter visível no top; toolbar centralizada com max-width 640 |
| ≥lg | Side rails visíveis em paged/double; modo Double habilitado |

## A11y

- `<main aria-label="Leitor de mangá">`
- Cada página tem `<img alt="Página N do capítulo X">`
- Bottom toolbar: `role="toolbar" aria-label="Controles do leitor"`
- Drawer: já é dialog/aria-modal via Drawer base
- Scrubber: `role="slider" aria-valuemin/max/now`
- Atalhos: lista visível no drawer descreve todas as combinações
- `prefers-reduced-motion`: desliga animações de auto-hide

## Performance

- Lazy-load das próximas 3 páginas, lib das anteriores 3 (window de 6)
- Pré-fetch do próximo capítulo no last-page-50%
- `IntersectionObserver` rootMargin generoso pra evitar flicker
- Imagens com `decoding="async"` + sizes apropriados

## Notas críticas de migração

- Manter feature flag: `?reader=v2`
- Não migrar antes da Onda 6 — depende de Drawer (Fase 2), SegmentedControl (Fase 2), ProgressBar (Fase 2), Kbd (Fase 1)
- QA específico: testar em iOS Safari (auto-hide), Android Chrome (overscroll), navegação por teclado completa
