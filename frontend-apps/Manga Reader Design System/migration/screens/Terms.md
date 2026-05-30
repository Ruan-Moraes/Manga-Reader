# Terms — Termos de uso

> Documento legal. Texto-pesado, lógica mínima. Baixo risco.

## Rota

`/legal/terms` (ou `/terms`)

## Layout em árvore

```
<LegalShell page="terms"
           eyebrow="Documentos legais"
           title="Termos de uso"
           sub="As regras de convívio..."
           updated="DD/MM/AAAA"
           version="vX.Y"
           toc={[...]} />
│
├── Hero compacto (vem do LegalShell)
│   ├── eyebrow + Title + Sub
│   ├── Meta tags: atualizado em · versão · idioma
│   └── Tabs entre os 4 docs (Termos · Privacidade · DMCA · Contatos)
│
└── Content grid (TOC + main)
    │
    ├── TOC mobile (chips horizontais com scroll)
    │
    ├── TOC desktop (sidebar 260px sticky, IntersectionObserver pra highlight ativo)
    │
    └── Main
        ├── <LegalSection num=1 title="Aceite e quem somos" tldr={...}>
        │   conteúdo prose
        ├── <LegalSection num=2 ...>
        │   ...
        ├── ...10 seções no total
        │
        ├── Footer card: "Algo ficou confuso?" + Button "Falar com o time"
        └── <LegalCrossLinks current="terms" /> (3 cards apontando pros outros docs)
```

## Componentes compartilhados (`LegalShell`, `LegalSection`, `LegalCrossLinks`)

São componentes locais da área legal — não viram primitivos do DS. Usam apenas: `PageContainer`, `Badge`, `Icon`, `Button`, `Card`, `EmptyState`.

## Conteúdo das 10 seções

1. Aceite e quem somos
2. Sua conta
3. Uso do serviço
4. Conteúdo da comunidade
5. Direitos autorais
6. Apoio e pagamentos
7. Encerramento
8. Isenções e limites de responsabilidade
9. Mudanças nestes termos
10. Lei aplicável e foro

Cada seção tem um bloco "Em resumo" opcional (TL;DR amarelo) antes do conteúdo prose.

## Estados

| Estado | UI |
|---|---|
| Loading | Skeleton: hero + TOC + 3 seções |
| Sucesso | layout completo |
| Erro de fetch (se SSR) | EmptyState `triste` + retry |

## Comportamentos

- **TOC scroll-spy:** observer marca a seção visível (rootMargin `-30% 0px -60% 0px`)
- **Click no item do TOC**: smooth scroll com offset 72px (NavBar global)
- **Tabs**: troca entre os 4 docs do LegalShell

## Responsividade

| Breakpoint | TOC |
|---|---|
| <lg | chips horizontais com scroll, no topo do conteúdo |
| ≥lg | sidebar sticky 260px + main flex-1 |

Sections: padding mobile 18, desktop 32.

## A11y

- `<h1>` "Termos de uso"
- Seções como `<section id=...>` com `<h2>` numerado
- TOC desktop: `<aside aria-label="Sumário">`
- Cross-links: `<nav aria-label="Outros documentos">`
