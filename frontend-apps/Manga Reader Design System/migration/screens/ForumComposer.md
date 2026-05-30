# ForumComposer — Compositor de tópico/resposta

> Modal de criação de tópico novo. Para reply, é o composer inline do ForumTopic.

## Rota

Trigger: botão "Novo tópico" em `/forum` (modal sobre a página atual).
Rota dedicada (fallback mobile): `/forum/new`

## Layout em árvore

```
<Modal open onClose size="lg" title="Novo tópico">
├── Header inside (eyebrow + title acima)
│
├── Body
│   ├── Categoria (composer-cats — botões pills)
│   │   ├── Discussão
│   │   ├── Spoiler livre
│   │   ├── Pergunta
│   │   ├── Notícia
│   │   └── Outros
│   │
│   ├── Título (Input)
│   │
│   ├── Obra relacionada (autocomplete opcional)
│   │   ├── SearchField com sugestões dropdown
│   │   └── Selected: MangaPoster size=60 + título + botão remover
│   │
│   ├── Conteúdo (Textarea autoResize, min-h=200)
│   │   ├── Markdown toolbar (B, I, Link, Quote, Spoiler, Code)
│   │   └── Hint: "Spoiler de cap > 7 dias atrás é livre. Caps recentes: use [spoiler]"
│   │
│   ├── Tags livres (até 5, input chip)
│   │
│   ├── Toggle "Marcar como spoiler" (Switch)
│   │
│   └── Preview (botão "Pré-visualizar" → toggle markdown vs rendered)
│
└── Footer
    ├── Meta: tempo médio de resposta · regras do fórum (link)
    └── Botões: <Button ghost>Cancelar</Button> <Button primary>Publicar</Button>
```

## Componentes

`Modal`, `Input`, `Textarea`, `SearchField`, `Switch`, `Button`, `Badge`, `MangaPoster`, `Toast`.

## Estados

| Estado | UI |
|---|---|
| idle | form vazio |
| draft (saving) | indicator "Rascunho salvo" |
| submitting | Button primary loading |
| success | Modal fecha + Toast accent + redirect para o tópico criado |
| validation error | Inputs com `error` + Toast com resumo |

## Comportamentos

- **Auto-save de rascunho** em localStorage a cada 3s; restaura ao abrir
- **Validações** (no submit):
  - Categoria obrigatória
  - Título: 10-120 chars
  - Conteúdo: mín 30 chars
- **Spoiler tag rápida**: highlight de texto + botão na toolbar envolve com `[spoiler]…[/spoiler]`
- **Markdown live preview** opcional
- **Atalho ⌘+Enter**: publica
- **Esc**: confirma descarte se há rascunho não-vazio

## Responsividade

| Breakpoint | Modal |
|---|---|
| <md | Modal full-screen (max-height: 100vh, sem rounded corners) |
| ≥md | Modal centralizado, max-w 720 |

## A11y

- Modal já cuida de dialog/aria-modal/focus trap
- Toolbar de markdown: `role="toolbar"` + cada botão com `aria-label` + `title`
- Auto-save anunciado discretamente via `aria-live="polite"`
