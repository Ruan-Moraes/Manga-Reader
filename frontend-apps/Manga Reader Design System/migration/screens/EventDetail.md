# EventDetail — Detalhe de evento

## Rota

`/events/:id`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── Event hero
│   ├── Banner (cover do evento)
│   ├── Badge tipo + Badge "Ao vivo agora" (se stream em curso)
│   ├── <h1> Title
│   ├── When (data formatada longa) · Location
│   └── Organizer (Avatar + nome + link)
│
├── Actions row
│   ├── <Button primary icon={Check}>Tenho interesse</Button>
│   ├── <Button raised icon={Bell}>Lembrar antes</Button>
│   └── <Button raised icon={Share2}>Compartilhar</Button>
│
├── Stats: X confirmados · Y interessados · Z visualizações
│
├── <Tabs>
│   ├── Sobre (default)
│   ├── Programação
│   ├── Discussão
│   └── Confirmados
│
├── TabPanel: Sobre
│   └── prose markdown (regras de spoiler, formato, etc.)
│
├── TabPanel: Programação
│   └── timeline com horários e blocos
│
├── TabPanel: Discussão
│   ├── Composer (Textarea + Button)
│   └── Lista de <CommentBox /> com replies
│
└── TabPanel: Confirmados
    └── grid de Avatar (com link pra perfil)
```

## Componentes

`PageContainer`, `Badge`, `Avatar`, `Button`, `Tabs`, `CommentBox`, `Textarea`, `Skeleton`, `EmptyState`, `StatusDot`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: banner, h1, 3 actions, stats, tab content |
| Evento passou | banner com filter, badge "Encerrado", actions desabilitadas |
| Sucesso | layout |

## Comportamentos

- Botão "Lembrar" abre Modal com opções: 1 dia / 1 hora / 15 min antes
- Discussão fica trancada após o evento (read-only)
- Live stream: se em curso, embed do player (futuro)

## Responsividade

| Breakpoint | Layout |
|---|---|
| <md | banner full-width, actions empilhadas |
| ≥md | hero com banner + actions à direita |

## A11y

- `<h1>` é título do evento
- Live badge tem `aria-live="polite"` ("ao vivo agora")
- Confirmados grid com `aria-label="Lista de X confirmados"`
