# TitleDetail — Detalhe da obra

> Tela mais densa em informação. Risco **alto** — é onde o usuário decide ler.

## Rota

`/title/:id`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── Title head (stack mobile, side-by-side desktop ≥md)
│   ├── <MangaPoster size={240} elevated /> + IconButton "Salvar" sobreposto
│   └── Title body
│       ├── eyebrow uppercase: gêneros (Badges)
│       ├── <h1> Título
│       ├── Autor + ano + status
│       ├── Rating row: <Stars value={4.9} size={20} /> + "4.9 · 1.482 votos"
│       ├── Sinopse (line-clamp 4 mobile, expandir; full desktop)
│       ├── Actions row:
│       │   ├── <Button variant="primary" icon={Play}>Começar a ler</Button>
│       │   ├── <Button variant="raised" icon={Bookmark}>Adicionar</Button>
│       │   └── <IconButton icon={Share2} />
│       └── Meta strip: capítulos · idiomas · grupos publicando
│
├── <Tabs> (sticky abaixo do head)
│   ├── Capítulos (default)
│   ├── Resenhas
│   ├── Grupos
│   └── Sobre
│
├── TabPanel: Capítulos
│   ├── Filter row: <Select> idioma + <SegmentedControl> ordem + <SearchField>
│   ├── Lista de <ChapterListItem /> agrupados por arco
│   └── <Pagination /> embaixo (50 por página)
│
├── TabPanel: Resenhas
│   ├── Rating breakdown (barra horizontal por 1-5 estrelas)
│   ├── <Button primary>Escrever resenha</Button> (só logado)
│   ├── Filtros: ordenar por (Top / Recentes / Polêmicas)
│   └── Lista de <ReviewCard /> com paginação
│
├── TabPanel: Grupos
│   └── grid <GroupCard /> dos grupos que publicaram a obra
│
└── TabPanel: Sobre
    ├── Sinopse completa
    ├── Tags/gêneros
    ├── Status, demografia, formato
    ├── Onde encontrar (links físicos)
    └── Obras relacionadas: grid <MangaCard size="sm" />
```

## Componentes

`PageContainer`, `MangaPoster`, `Stars`, `Badge`, `Button`, `IconButton`, `Tabs`, `ChapterListItem`, `ReviewCard`, `GroupCard`, `MangaCard`, `SegmentedControl`, `Select`, `SearchField`, `Pagination`, `Skeleton`, `EmptyState`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: poster, h1, 4 linhas, tabs, 8 chapter items |
| Sucesso | layout completo |
| Erro 404 | EmptyState `404` + Button "Voltar ao catálogo" |
| Sem capítulos (pré-lançamento) | EmptyState `pensando` + "Disponível em data" |
| Sem reviews | EmptyState `pensando` + CTA "Seja o primeiro a escrever" |
| Sem grupos | EmptyState `pensando` + texto explicativo |

## Comportamentos

- **Sticky tabs:** ao rolar, tabs grudam no topo logo abaixo do NavBar global
- **Sinopse expandível** em mobile (3 linhas + "Ler mais")
- **IconButton Salvar** sempre visível sobre o poster, mostra estado (Bookmark filled = na biblioteca)
- **Compartilhar** abre native share sheet onde disponível; senão, modal com botões copy link / X / Whatsapp
- **Status do user na obra** (lendo, planejado, dropado) selecionável via DropdownMenu no botão "Adicionar"
- "Começar a ler" navega pro último capítulo lido OU cap. 1 se nunca leu

## Responsividade

| Breakpoint | Head |
|---|---|
| <md | stack: poster centralizado (220px) + body |
| ≥md | side-by-side: poster 240px (fixo) + body flex-1 |
| ≥lg | poster 280px |

Lista de capítulos:
- <md: lista vertical pura
- ≥md: 2 colunas opcional (toggle "compact view")

## A11y

- `<h1>` único na tela (título da obra)
- Tabs com `role="tablist"`, panels com `role="tabpanel"`
- Stars: ler "X de 5 estrelas, baseado em Y votos"
- Sinopse: `<section aria-label="Sinopse">`

## Performance

- Capa é LCP — preload via `<link rel="preload">` se possível
- Tab Capítulos é a default; lazy-load das outras tabs
- Lista de capítulos com windowing se > 200 itens
