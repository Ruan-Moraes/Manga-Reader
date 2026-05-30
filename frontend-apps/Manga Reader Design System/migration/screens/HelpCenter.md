# HelpCenter — Central de ajuda

> Hub de suporte: busca, categorias, FAQ, status, contato.

## Rota

`/help`

## Layout em árvore

```
<PageContainer asMain size="default" paddingY="none">  ← hero é full-bleed
│
├── Hero (cor de fundo distinta, padding generoso)
│   ├── eyebrow + ícone Help "Central de ajuda"
│   ├── <h1>Como podemos ajudar?</h1>
│   ├── Sub
│   ├── <SearchField size="lg" shortcut="⌘K" />
│   │   placeholder "Como mudar a direção de leitura, esqueci a senha..."
│   ├── Chips "Buscas populares": mudar idioma · spoiler · importar MAL · cancelar apoio
│   └── Status banner inline: StatusDot pulse + "Tudo operando" + link "Ver detalhes →"
│
├── Section: Categorias
│   ├── <SectionHeader> eyebrow="Navegue por tópico" title="Categorias"
│   └── grid de cards categoria (1/2/3 colunas)
│       ├── Ícone (40 box accent-25 / accent quando ativo)
│       ├── Label + descrição curta
│       └── Count "X artigos"
│
├── Section: Artigos populares OU Resultados da busca (mesmo lugar)
│   ├── <SectionHeader> eyebrow={q ? `Resultados para "${q}"` : 'Mais buscados'}
│   │                  title={q ? `${N} encontrados` : 'Artigos populares'}
│   └── lista de articles:
│       ├── Numeração 01/02/03... (mr-mono accent)
│       ├── Body: cat label + título + stats (views + helpful%)
│       └── Chevron R
│
│   Sem resultados: EmptyState `duvida` "Nada por '...'", CTA abrir chamado
│
├── Section: FAQ Accordion
│   ├── <SectionHeader> eyebrow="Respostas rápidas" title="Perguntas frequentes"
│   └── <Accordion> com 6-8 itens
│       Cada item: pergunta + resposta + thumbs (Sim/Não foi útil)
│
├── Section: Falar com o time (CTA card grande)
│   ├── Ilustração chibi `pensando`
│   ├── eyebrow "Não achou o que procurava?"
│   ├── <h3>Falar com o time</h3>
│   ├── Sub: "Tempo médio de resposta: 4h12min"
│   └── 3 channel cards:
│       ├── Abrir chamado (primary - email)
│       ├── Perguntar no fórum
│       └── Canal prioritário (danger - conta hackeada / conteúdo ilegal)
│
└── Section: Status do sistema
    ├── <SectionHeader> eyebrow="Saúde da plataforma" title="Status do sistema"
    │                  meta="Última checagem há 2 min"
    └── grid de status tiles (1/2/3 colunas)
        Cada tile: StatusDot + label + estado (Operando/Degradado/Indisponível)
```

## Componentes

`PageContainer`, `SectionHeader`, `SearchField`, `Badge`, `Card`, `Accordion`, `Button`, `StatusDot`, `EmptyState` (`duvida`, `pensando`), `Modal` (contact).

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: hero, 6 cat cards, 6 articles |
| Busca sem resultado | EmptyState `duvida` + CTA chamado |
| Status degraded | banner topo com aviso + link status page |
| Sucesso | layout completo |

## Comportamentos

- **⌘K** abre Modal de busca global (futuro: command palette)
- **Categoria clicável** → filtra artigos exibidos OU navega pra `/help/cat/:slug` (decisão futura)
- **Modal de chamado**: form (assunto pills + textarea + botão enviar) → confirmação com ilustração `feliz`
- **Status grid** atualiza via polling 5 min

## Responsividade

| Breakpoint | Grids |
|---|---|
| <md | 1 coluna em tudo |
| 640–1023 | categorias 2 col, status 2 col, articles 2 col |
| ≥1024 | categorias 3 col, status 3 col, articles 2 col |

CTA card "Falar com o time": stack em mobile, horizontal em desktop.

## A11y

- Search input com `<Label>` invisível "Buscar na ajuda"
- Status tiles: `role="status"` + label completo ("Leitor de mangá: Operando")
- Accordion: handled by component
