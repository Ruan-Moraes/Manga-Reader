# Prompt para o Claude Code — Redesenho do `Header` (Direção A · "Linha calma")

> Cole o conteúdo abaixo (da linha `---` em diante) no Claude Code, dentro do repositório
> `Ruan-Moraes/Manga-Reader`. O mockup interativo de referência está em `header/Cabecalho.html`
> (abra no navegador e deixe na **Direção A** para ver mobile/tablet/desktop e todos os estados).

---

## Tarefa

Redesenhar o componente de cabeçalho (`Header`) do Manga Reader. O header atual é funcional
mas **denso/poluído, com espaçamentos desalinhados e uma versão mobile pobre** (vira apenas
hambúrguer + lupa). Quero um header **elegante, alinhado e sóbrio**, que funcione bem tanto no
mobile quanto no desktop **sem esconder informação importante**.

Implemente a **Direção A — "Linha calma"**: refinamento contido, foco em alinhamento e respiro,
acento amarelo-lima usado com parcimônia.

## Contexto do projeto

- Stack: **React 19 + Vite + TypeScript + TailwindCSS v4 + React Router + React Query**. Tema escuro único. UI 100% em **pt-BR**.
- Localize o componente atual em `src/shared/component/**` (algo como `Header/`). Refatore-o no lugar — não crie um header paralelo.
- Os tokens já existem no projeto (Tailwind config + `src/index.css`). **Use os tokens, não invente cores nem valores avulsos.**

## Tokens a usar (não desviar)

| Token | Valor | Uso |
|---|---|---|
| `--mr-primary` | `#161616` | fundo do header |
| `--mr-secondary` | `#252526` | dropdowns, painel de busca, hover de ícones |
| `--mr-tertiary` | `#727273` | bordas de input/botão, borda inferior no scroll |
| `--mr-accent` | `#ddda2a` | acento (amarelo-lima): foco da busca, badges, botão Entrar |
| `--mr-accent-25/50` | `rgba(221,218,42,.25/.5)` | glows, hover, sombras |
| `--mr-danger` | `#FF784F` | badge de notificações |
| `--mr-gray-700` | `#444` | bordas de card/dropdown |
| texto | `#fff` / `#ccc` / `#999` | primário / muted / subtle |

- **Fonte:** Nunito Sans. **Letter-spacing global `0.0625rem` (~1px)** em todo texto do header — assinatura do produto, não esqueça.
- **Raios (angular!):** `2px` (rounded-xs) em botões, inputs, badges de status. `8px` em dropdowns/painel de busca. **Nunca arredondar tudo.**
- **Sombras:** apenas a sombra **offset com tom accent** — `box-shadow: -0.25rem 0.25rem 0 0 rgba(221,218,42,.25)` (usada nos dropdowns). **Proibido** `0 4px 12px rgba(0,0,0,…)` (sombra de profundidade genérica).
- **Transições:** `0.3s ease`. Sem spring/bounce.
- **Gradientes: PROIBIDOS** em qualquer parte do header (fundo, botões, etc). Gradiente só existe em pôster placeholder de mangá.

## Estrutura (Direção A — "Linha calma")

Uma única `<header>` sticky no topo, `background: var(--mr-primary)`, `border-bottom: 1px solid #242424`,
`z-index` alto. Conteúdo alinhado por flex com `gap` consistente (grade de 8px) — **não usar margens
avulsas por elemento**. A faixa do desktop/tablet tem ~68px de altura.

**Logo (lockup):** o favicon (`src/assets/favicon-*.png` — o chibi) **sem** tile/moldura, ~26px,
`border-radius: 3px`. Ao lado, o wordmark **"Manga Reader"** em *itálico + 800*, com "Reader" em
`--mr-accent` e `letter-spacing: 1.2px`.

**Navegação (desktop ≥1024px):** três grupos com dropdown (mega-menu). Rótulos em **sentence case**
(Descobrir / Comunidade / Sistema), `14px`, peso 700, cor branca. **Sem underline animado** — o
destaque do hover/ativo é apenas `background: rgba(221,218,42,.10)` no trigger (radius 2px). Chevron
de 15px que gira 180° quando o painel abre.
- **Descobrir** → Em alta · Lançamentos · Categorias · Eventos
- **Comunidade** → Grupos & scans · Fórum · Reviews
- **Sistema** → Configurações · Central de ajuda · Sobre

  Cada item do dropdown: ícone accent (tile 34px, fundo `rgba(221,218,42,.10)`) + título 14/700 +
  hint 12px `#999`. Painel: `background: var(--mr-secondary)`, `border 1px #444`, `radius 8px`,
  e a **sombra offset accent**. Abrir no **hover** (com uma "ponte" invisível de ~12px pro mouse não
  perder o painel) e também por clique/teclado (acessibilidade).

**Busca (média, equilibrada):** campo flexível, `max-width ~380px`, altura `42px`, `radius 2px`,
borda `--mr-tertiary`. Ícone de lupa à esquerda, placeholder `"Buscar títulos, autores, grupos…"`,
e o atalho **`⌘K`** num `<kbd>` à direita (borda/texto sutil em cinza). **Mantenha o `⌘K`.**
  - **No foco:** borda vira `--mr-accent` e a lupa fica accent. (Na Direção A **não** usar a sombra offset no campo — apenas a borda accent, mantendo o tom sóbrio.)
  - **No foco:** abrir um **painel de sugestões** abaixo (mesma cara dos dropdowns) com duas seções:
    "Sugestões para você" (itens com mini-capa + título + metadado) e "Buscas recentes" (linha com ícone de lupa). O atalho `⌘K` deve focar o campo.

**Ações (à direita):** sino de notificações (badge `--mr-danger` com contagem), biblioteca
(badge `--mr-accent` com contagem) e avatar (círculo 42px). Botões-ícone com hit-area 42px,
hover = fundo `--mr-secondary` + borda `#444`.
  - **Deslogado:** trocar o cluster por um botão **"Entrar" sólido accent** (`background: var(--mr-accent)`, texto `--mr-primary`, peso 800, uppercase, `letter-spacing .1em`, radius 2px, hover `opacity .85`).

## Responsivo (mobile-first — obrigatório)

Use os breakpoints canônicos do `tailwind.config`: `sm 640`, `md 768`, `lg 1024`.

- **Mobile (base, <768px) — resolver o "mobile pobre":** header em **duas faixas**.
  - Faixa 1 (~56px): hambúrguer (44×44) + logo (favicon + wordmark 16px) + sino + avatar. **Esconder o botão Biblioteca aqui** (ele vai no drawer).
  - Faixa 2: **campo de busca em largura total** (altura 44px, sem `⌘K`). **Não** reduzir a busca a um ícone — ela fica sempre visível e acessível.
  - Touch targets ≥ 44px. Nav vai toda para o **drawer**.
- **Tablet (≥768px):** faixa única — hambúrguer (abre drawer com a nav) + logo + busca inline (flex, com `⌘K`) + sino + biblioteca + avatar.
- **Desktop (≥1024px):** esconde o hambúrguer, mostra a **nav em texto** com os três mega-menus.

**Drawer mobile:** desliza da esquerda (largura `min(330px, 86vw)`), overlay `rgba(22,22,22,.8)`
com `backdrop-filter: blur(4px)`, borda direita `2px var(--mr-tertiary)`. Lista as seções da nav
(rótulo accent em maiúsculas + itens com ícone, min-height 48px, hover `rgba(221,218,42,.10)`,
borda-esquerda accent no item ativo) + bloco "Conta" + rodapé com avatar/nome/sair. Fecha por
clique no overlay, no X, ou tecla `Esc`.

## Estado de scroll

Ao rolar a página, o header **encolhe suavemente** (faixa 68→54px, logo e busca menores) e ganha
`border-bottom: 1px solid var(--mr-tertiary)` + `box-shadow: 0 2px 0 0 rgba(221,218,42,.25)`
(fininha linha accent). Transição 0.25–0.3s. Use um listener de scroll com `requestAnimationFrame`
(ou IntersectionObserver com sentinel) — sem jank.

## Acessibilidade

- `<header>` + `<nav aria-label="Navegação principal">`. Triggers de mega-menu como `<button>` com `aria-expanded`/`aria-haspopup`; navegação por teclado (Tab/Enter/Esc) e foco visível (anel accent).
- Busca: `<input aria-label="Buscar">`, painel de sugestões navegável por teclado.
- Drawer: `role="dialog"`, foco preso enquanto aberto, devolve foco ao botão que abriu; fecha no `Esc`.
- Ícones decorativos com `aria-hidden`; botões-ícone com `aria-label`. Contraste AA.
- Ícones: estilo **Lucide / Feather** (outline 2px, `currentColor`). O repo usa SVG inline — manter o padrão (ou `lucide-react`, se já houver). Tamanhos 18–24px.

## Mapeamento dos ícones (referência do mockup)

`menu`, `search`, `bell` (novidades), `book-open`/`library` (biblioteca), `chevron-down`,
`compass`/`flame`/`sparkles`/`grid`/`calendar` (Descobrir), `users`/`message-square`/`star` (Comunidade),
`sliders`/`help-circle`/`info` (Sistema), `log-out`, `x` (fechar drawer).

## Checklist de aceite

- [ ] Header sticky, fundo `#161616`, **zero gradiente**, raios 2px/8px, letter-spacing ~1px aplicado.
- [ ] Logo sem moldura (favicon + wordmark itálico, "Reader" accent).
- [ ] Mobile mostra **busca em largura total** (não só ícone) e não corta avatar/sino; targets ≥44px.
- [ ] Tablet em faixa única com busca inline; nav no drawer.
- [ ] Desktop com nav em **sentence case** (hover = fundo accent translúcido) + mega-menus com sombra offset.
- [ ] Busca: foco → **borda accent** (sem sombra) + painel de sugestões; `⌘K` foca o campo.
- [ ] Estados logado (sino+biblioteca+avatar) e deslogado (Entrar **sólido accent**) corretos.
- [ ] Scroll encolhe o header e adiciona a linha accent inferior, sem jank.
- [ ] Drawer com overlay+blur, teclado/Esc, foco preso.
- [ ] Nada de cor/sombra/raio fora dos tokens; nenhuma sombra de profundidade genérica.
- [ ] `tsc` e lint limpos; sem warnings de acessibilidade óbvios.

## Padronização (regra do projeto)

Se este redesenho alterar primitivos compartilhados (`Avatar`, `Badge`, `Button`, `Input`,
ícones), **propague para todas as call-sites** — um componente = uma implementação. Faça `grep`
pelos nomes alterados e garanta que tudo renderiza a nova versão antes de fechar.
