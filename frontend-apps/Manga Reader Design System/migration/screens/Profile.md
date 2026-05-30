# Profile — Perfil de leitor

> Página pública. Mostra leitor + bibliotecas + reviews recentes.

## Rota

`/u/:handle` (pública)
`/profile` (atalho pra perfil próprio)

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="md">
├── Header de perfil (Card largo)
│   ├── Banner (h=160, gradient ou imagem do user, opcional)
│   ├── Avatar 96, sobreposto -32
│   ├── Linha 1: Nome + handle + verified
│   ├── Bio (line-clamp 2 mobile, full desktop)
│   ├── Stats row: obras lidas · reviews · seguidores · seguindo
│   ├── Tags de gostos: badges accent
│   └── Actions row:
│       ├── Próprio perfil: <Button variant="raised" icon={Edit}>Editar perfil</Button>
│       └── Outro user: <Button variant="primary">Seguir</Button> + <Button variant="ghost">Mensagem</Button>
│
├── <Tabs>
│   ├── Visão geral (default)
│   ├── Lendo agora
│   ├── Concluídos
│   ├── Resenhas
│   └── Atividade
│
├── TabPanel: Visão geral
│   ├── Section "Lendo agora" (3 últimas, MangaCard com progress)
│   ├── Section "Último concluído" (5 cards)
│   ├── Section "Últimas resenhas" (3 ReviewCard com manga={true})
│   ├── Section "Grupos que segue" (grid de GroupCard size="sm")
│   └── Section "Estatísticas" (cards com totais, distribuição por gênero, etc.)
│
├── TabPanel: Lendo agora / Concluídos
│   └── grid <MangaCard /> idêntico à Library, mas só read-only
│
├── TabPanel: Resenhas
│   └── lista de <ReviewCard /> ordenada por data
│
└── TabPanel: Atividade
    └── timeline vertical: "leu cap X de Y", "publicou resenha em Z", "entrou no grupo W"
        com Avatar mini + ícone do tipo + texto + when
```

## Componentes

`PageContainer`, `Avatar`, `Badge`, `Button`, `Tabs`, `MangaCard`, `ReviewCard`, `GroupCard`, `Card`, `Stars`, `EmptyState`, `Skeleton`.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: banner, avatar, h1, stats, 6 cards |
| Perfil próprio sem dados | EmptyState `pensando` "Começa adicionando uma obra à sua biblioteca" |
| Perfil outro sem dados públicos | "Esse perfil ainda não publicou nada" + ilustração `surpresa` |
| User não existe | redirect pra 404 (EmptyState `404`) |
| Perfil privado | EmptyState `pensando` + "Esse perfil é privado" |

## Comportamentos

- **Próprio perfil**: tabs incluem rascunhos não publicados
- **Outro perfil**: tabs respeitam configurações de privacidade (algumas podem estar desabilitadas)
- **Seguir/Deixar de seguir**: optimistic update, toast confirmando
- **Banner & avatar** clicáveis no próprio perfil → upload (futuro)

## Responsividade

| Breakpoint | Header |
|---|---|
| <640 | stack: avatar centralizado, texto centralizado, actions full-width |
| 640–1023 | side-by-side: avatar à esquerda, body, actions à direita em coluna |
| ≥1024 | idem mais espaçado |

Tabs: scroll horizontal em mobile.

## A11y

- `<h1>` é o nome de exibição do user
- Avatar do banner: `alt="{nome}"` se imagem, decorativo se cover gradient
- Stats: cada card como `<dl><dt>Obras lidas</dt><dd>42</dd></dl>` para semântica
