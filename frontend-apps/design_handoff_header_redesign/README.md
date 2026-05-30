# Handoff: Redesenho do Cabeçalho (Header) — Direção A "Linha calma"

## Overview

Redesenho do cabeçalho global da plataforma **Manga Reader** (leitura de mangás/manhwas/manhuas
com camada social). O header atual é funcional, porém **denso, com espaçamentos desalinhados e uma
versão mobile pobre** (colapsa em apenas hambúrguer + lupa). Este redesenho entrega um header
**elegante, alinhado e sóbrio**, mobile-first, cobrindo navegação (mega-menus), busca com sugestões,
notificações, biblioteca, avatar, estados logado/deslogado, comportamento ao rolar e menu drawer no
mobile — **sem esconder informação importante**.

A direção escolhida é a **A · "Linha calma"**: refinamento contido, foco em alinhamento e respiro,
acento amarelo-lima usado com parcimônia.

## About the Design Files

Os arquivos em `mockup/` são **referências de design feitas em HTML/CSS/JS** — um protótipo que
mostra a aparência e o comportamento pretendidos, **não código de produção para copiar diretamente**.

A tarefa é **recriar este design no ambiente existente do codebase** do Manga Reader
(**React 19 + Vite + TypeScript + TailwindCSS v4 + React Router + React Query**, tema escuro),
usando os padrões e a stack já estabelecidos no repositório `Ruan-Moraes/Manga-Reader`. O componente
de header atual vive em `src/shared/component/**` — **refatore-o no lugar**, não crie um header
paralelo.

> O mockup usa container queries e JS vanilla apenas para demonstrar as 3 larguras e os estados lado
> a lado num único arquivo. Na implementação real, use media queries / breakpoints do Tailwind e
> componentes React normais.

## Fidelity

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios, sombras e interações são finais
e devem ser reproduzidos fielmente usando as libs e padrões do codebase. Os valores exatos estão na
seção **Design Tokens**.

## Como abrir o mockup

Abra `mockup/Cabecalho.html` no navegador. Use a barra de controle no topo:
- **Direção**: deixe em **A · Linha calma** (direção a implementar). "B · Comando" é uma alternativa mais ousada, não escolhida.
- **Estados**: alterne **Logado / Deslogado / Rolado / Busca aberta**.
- O mockup mostra 3 frames empilhados: **Mobile (390px)**, **Tablet (820px)**, **Desktop (1200px)**.
- Interações ao vivo: hover nos mega-menus (desktop), clicar na busca abre as sugestões, o hambúrguer abre o drawer no mobile.

---

## Screens / Views

É um único componente (`Header`) responsivo. Documentado por breakpoint.

### 1. Desktop (≥ 1024px)

- **Layout:** faixa única, `display: flex; align-items: center; gap: 10px;`, altura **68px**,
  `padding: 0 18px`. `background: var(--mr-primary)`, `border-bottom: 1px solid #242424`,
  `position: sticky; top: 0; z-index: 5`. Largura de conteúdo segue o container do app.
  Ordem da esquerda p/ direita: **Logo → Nav → Busca (flex, centro) → Ações (à direita, `margin-left:auto`)**.
- **Componentes:**
  - **Logo (lockup):** favicon chibi (`favicon-64x64.png`) **sem moldura**, 26×26, `border-radius: 3px`,
    `gap: 10px` até o wordmark. Wordmark **"Manga Reader"** em *itálico, peso 800, 18px*,
    `letter-spacing: 1.2px`; a palavra **"Reader"** em `--mr-accent` (#ddda2a), "Manga" em `#fff`.
  - **Nav (3 grupos):** triggers `<button>` em **sentence case** — "Descobrir", "Comunidade",
    "Sistema" — 14px, peso 700, cor `#fff`, `padding: 9px 12px`, `border-radius: 2px`, `gap: 5px`
    até o chevron (15px, opacidade .65). **Hover:** `background: rgba(221,218,42,.10)`; o chevron
    gira 180° (`transform: rotate(180deg)`, .25s).
  - **Mega-menu (painel por grupo):** `position: absolute; top: calc(100% + 10px); left: 0;`
    `min-width: 320px; padding: 8px;` `background: var(--mr-secondary)` (#252526),
    `border: 1px solid #444`, `border-radius: 8px`,
    `box-shadow: -0.25rem 0.25rem 0 0 rgba(221,218,42,.25), 0 12px 40px -12px rgba(0,0,0,.7)`.
    Abre no **hover** (com "ponte" invisível de 12px acima do painel para o mouse não perdê-lo).
    Cada item: `display: flex; gap: 12px; padding: 10px; border-radius: 2px;` hover
    `background: rgba(221,218,42,.25)`. Ícone num tile 34×34, `border-radius: 2px`,
    `background: rgba(221,218,42,.10)`, cor `--mr-accent`. Título 14/700; hint 12px `#999`.
  - **Busca:** wrapper `flex: 1; max-width: 380px;` Campo: altura **42px**, `padding: 0 10px 0 14px`,
    `background: var(--mr-primary)`, `border: 1px solid var(--mr-tertiary)` (#727273),
    `border-radius: 2px`, `gap: 10px`. Lupa 18px à esquerda (cor #727273). Input transparente,
    14px, placeholder `"Buscar títulos, autores, grupos…"` (cor #727273). `<kbd>` à direita com
    **"⌘K"**: fonte mono 11px, `padding: 3px 7px`, `background: var(--mr-gray-800)` (#2d2d2d),
    `border: 1px solid #444`, `border-radius: 2px`, cor `#999`.
    **Foco:** borda do campo vira `--mr-accent`, lupa vira `--mr-accent`. (Direção A **não** aplica
    sombra offset no campo — só a borda accent.)
  - **Ações (logado):** `display: flex; gap: 6px;`
    - Botão-ícone **Sino** (novidades): 42×42, ícone 20px, badge `--mr-danger` (#FF784F) com "3" no canto sup. dir.
    - Botão-ícone **Biblioteca** (book-open): 42×42, badge `--mr-accent` com "12" (texto `--mr-primary`).
    - **Avatar:** círculo 42px, `border: 1px solid #444`, iniciais "RM" 13/800; hover `border-color: --mr-accent`.
    - Botões-ícone: `border-radius: 2px`, hover `background: var(--mr-secondary)` + `border-color: #444`.
    - Badges: `min-width 16px; height 16px; border-radius: 999px; font 10/800; border: 2px solid var(--mr-primary)`.
  - **Ações (deslogado):** substitui o cluster por **botão "Entrar" sólido**: altura 42px,
    `padding: 0 18px`, `background: var(--mr-accent)`, texto `--mr-primary`, peso 800, 12px,
    `text-transform: uppercase`, `letter-spacing: .1em`, `border-radius: 2px`; hover `opacity: .85`.

### 2. Tablet (768–1023px)

- **Layout:** faixa única, mesma altura (68px). Ordem: **Hambúrguer → Logo → Busca (inline, flex) → Ações**.
- **Diferenças:** a **nav em texto some** (vai para o drawer); aparece o **hambúrguer** (44×44,
  `border-radius: 2px`, hover `background: var(--mr-secondary)` + `border: 1px solid #444`) que abre
  o drawer. Busca inline visível (`max-width: 460px`), com `⌘K`. Sino + Biblioteca + Avatar visíveis.

### 3. Mobile (< 768px) — resolve o "mobile pobre"

- **Layout em DUAS faixas.**
  - **Faixa 1** (~56px): `Hambúrguer (44×44) → Logo (favicon + wordmark 16px) → [margin-left:auto] → Sino → Avatar`.
    **O botão Biblioteca é escondido aqui** (fica no drawer).
  - **Faixa 2** (`padding: 0 14px 12px`): **campo de busca em largura total**, altura **44px**, **sem `⌘K`**.
    A busca **nunca** vira só um ícone — fica sempre visível.
- **Touch targets ≥ 44px.** Nav inteira no drawer.

### 4. Drawer mobile (overlay de navegação)

- Desliza da esquerda: `width: min(330px, 86vw)`, `background: var(--mr-primary)`,
  `border-right: 2px solid var(--mr-tertiary)`, `transform: translateX(-104%) → 0` em `.28s ease`.
- Overlay: `position: fixed; inset: 0; background: rgba(22,22,22,.8); backdrop-filter: blur(4px);`
  fade `.25s`.
- **Cabeçalho do drawer:** logo + botão X (fechar). `border-bottom: 2px solid var(--mr-tertiary)`.
- **Corpo:** seções da nav. Cada seção: rótulo `--mr-accent` em **MAIÚSCULAS** (10px, 800,
  `letter-spacing: .12em`) + links. Link: `min-height: 48px; gap: 14px; padding: 12px;`
  `border-left: 2px solid transparent;` hover `background: rgba(221,218,42,.10)`; item ativo tem
  `border-left-color: --mr-accent` e texto accent. Ícone 20px (cor #999).
- **Seção "Conta":** Biblioteca · Novidades · Salvos.
- **Rodapé:** avatar (40px) + nome "Ruan Moraes" (14/700) + "Postador" (11px #999) + botão Sair (log-out).
- **Fecha** por: clique no overlay, no X, ou tecla **Esc**.

---

## Interactions & Behavior

- **Mega-menu:** abre no **hover** do grupo (desktop); chevron gira 180°. "Ponte" invisível de 12px
  evita fechar ao mover o mouse para o painel. Implementar também **clique + teclado** (acessibilidade).
- **Busca — foco:** borda do campo → `--mr-accent`, lupa → accent, e abre o **painel de sugestões**
  abaixo (`top: calc(100% + 8px); left:0; right:0;` mesmo estilo do mega-menu) com:
  - **"Sugestões para você"**: itens com mini-capa 30×40 (`linear-gradient(135deg,#2a2a2c,#1d1d1f)`,
    borda #444, radius 3px — placeholder de capa), título 13/700, metadado 11px #999. Ex.:
    *Solo Leveling — Manhwa · 179 capítulos*, *Vagabond — Mangá · 327 capítulos*, *Omniscient Reader — Manhwa · 218 capítulos*.
  - **"Buscas recentes"**: linhas com ícone de lupa 16px + texto. Ex.: *berserk*, *one piece capítulo 1120*, *grupo: Tsuki Scans*.
  - O atalho **`⌘K`** (e `Ctrl+K`) deve **focar o campo** de busca de qualquer lugar da página.
- **Scroll:** ao rolar, o header **encolhe** (faixa 68→54px; logo 18→16px; campo de busca 42→38px;
  botões-ícone/avatar 42→38px) e ganha `border-bottom: 1px solid var(--mr-tertiary)` +
  `box-shadow: 0 2px 0 0 rgba(221,218,42,.25)` (linha accent fina). Transições .25–.3s.
  Use listener de scroll com `requestAnimationFrame` (ou IntersectionObserver com sentinel) — sem jank.
- **Hover geral:** links/ícones com transições de `background-color`/`border-color`/`opacity` em **.2–.3s ease**. Sem spring/bounce.
- **Responsivo:** ver seção Screens. Mobile-first.

## State Management

Estado local do componente (nomes ilustrativos):
- `isLoggedIn` — alterna cluster de ações (logado) vs botão "Entrar" (deslogado). Virá do contexto de auth real.
- `openMenu: 'descobrir' | 'comunidade' | 'sistema' | null` — qual mega-menu está aberto (hover/clique).
- `searchFocused: boolean` — controla o painel de sugestões.
- `searchQuery: string` — texto digitado (filtra sugestões; integrar com a busca/React Query do app).
- `isScrolled: boolean` — derivado do scroll (rAF).
- `drawerOpen: boolean` — abre/fecha o drawer mobile; ao abrir, prender foco; ao fechar, devolver foco ao gatilho.
- Contagens dos badges (novidades, biblioteca) vêm de dados reais.

## Design Tokens

> Já existem no projeto (Tailwind config + `src/index.css`). **Consuma os tokens, não invente valores.**
> Reproduzidos aqui (e em `mockup/colors_and_type.css`) para referência.

**Cores**
| Token | Hex / valor |
|---|---|
| `--mr-primary` (fundo) | `#161616` |
| `--mr-secondary` (superfícies/dropdowns) | `#252526` |
| `--mr-tertiary` (bordas input/botão) | `#727273` |
| `--mr-accent` (amarelo-lima) | `#ddda2a` |
| `--mr-accent-25 / -50` | `rgba(221,218,42,.25)` / `.50` |
| `--mr-danger` (badge notif.) | `#FF784F` |
| `--mr-gray-800` (kbd/scroll track) | `#2d2d2d` |
| `--mr-gray-700` (bordas card) | `#444` |
| texto | `#fff` / muted `#ccc` / subtle `#999` |

**Tipografia** — família **Nunito Sans** (variable). **Letter-spacing global `0.0625rem` (~1px)** em
todo texto (assinatura do produto). Escala: H1 32 / H2 24 / H3 20 / H4 16 / body **14** / small 12 /
tiny 11. Pesos: 400 / 600 / 700 / 800. Logo: itálico + 800.

**Espaçamento** — grade de 8: `4 / 8 / 16 / 24 / 32 / 48`. Gap do header entre clusters: 10–12px;
ações 6px. Padding lateral do header: 18px (desktop/tablet), 14px (faixa de busca mobile).

**Raios** — `2px` (botões, inputs, badges de status, tiles de ícone) · `4px` (secundário) ·
`8px` (dropdowns/painel de busca) · `999px` (avatar circular, badges pill).

**Sombras** (assinatura — offset com tom accent; **nunca** sombra de profundidade genérica):
- Dropdown/painel: `-0.25rem 0.25rem 0 0 rgba(221,218,42,.25)` (+ `0 12px 40px -12px rgba(0,0,0,.7)` opcional para profundidade do menu).
- Linha accent no scroll: `0 2px 0 0 rgba(221,218,42,.25)`.

**Transições** — `0.3s ease` (padrão). Sem spring/bounce.

**⛔ Proibições** — **nenhum gradiente** em qualquer parte do header (fundo, botões, etc); gradiente
só existe em pôster placeholder de mangá. Nenhuma sombra de elevação genérica (`0 4px 12px rgba(0,0,0,…)`).

## Assets

- **Logo/favicon:** chibi do produto. No mockup: `mockup/favicon-64x64.png`. No codebase real os
  favicons vivem em `src/assets/` (use o existente; tamanhos 32/64/192/512). O `favicon.svg` do
  bundle de design system é um placeholder vazio — **não usar**; use os PNGs.
- **Ícones:** estilo **Lucide / Feather** (outline 2px, `currentColor`, 18–24px). O repo usa SVG
  inline — manter o padrão (ou `lucide-react` se já houver). Mapeamento usado:
  `menu`, `x`, `search`, `bell` (novidades), `book-open` (biblioteca), `chevron-down`, `compass`,
  `flame`, `sparkles`, `grid`, `calendar` (Descobrir), `users`, `message-square`, `star` (Comunidade),
  `sliders`, `help-circle`, `info` (Sistema), `log-out`.
- **Sem emoji.** A expressividade do produto são as ilustrações chibi (`assets/illustrations/`), não usadas no header.

## Conteúdo / Copy (exato)

- Wordmark: **"Manga Reader"** ("Reader" em accent).
- Nav: **Descobrir** (Em alta · Lançamentos · Categorias · Eventos), **Comunidade** (Grupos & scans ·
  Fórum · Reviews), **Sistema** (Configurações · Central de ajuda · Sobre).
- Hints dos itens (ex.): "O que a comunidade está devorando agora", "Capítulos fresquinhos do dia",
  "Gêneros, temas e demografias", "Maratonas, desafios e coleções", "Times de tradução que você segue",
  "Discussões capítulo a capítulo", "Opiniões de outros leitores", "Conta, leitura e aparência",
  "Dúvidas e suporte", "O projeto Manga Reader".
- Busca placeholder: **"Buscar títulos, autores, grupos…"**; atalho **"⌘K"**.
- Botão deslogado: **"Entrar"**.
- Drawer / perfil: **"Ruan Moraes"**, papel **"Postador"**.
- **Tom:** pt-BR, sentence case na UI; UPPERCASE só em rótulos técnicos/badges com `letter-spacing .08–.12em`.

## Files

Nesta pasta de handoff:
- `README.md` — este documento (autossuficiente).
- `PROMPT_CLAUDE_CODE.md` — prompt pronto para colar no Claude Code dentro do repo.
- `mockup/Cabecalho.html` — protótipo interativo (abra no navegador; deixe na Direção A).
- `mockup/styles.css` — estilos do showcase + variantes de header + responsivo + estados.
- `mockup/app.js` — ícones, dados de nav, builders, drawer e toggles (JS vanilla, só para o mockup).
- `mockup/colors_and_type.css` — tokens do design system (cores, tipo, espaçamento, sombras, utilitários).
- `mockup/favicon-64x64.png` — logo chibi.

## Padronização (regra do projeto)

Se o redesenho alterar primitivos compartilhados (`Avatar`, `Badge`, `Button`, `Input`, ícones),
**propague para todas as call-sites** — um componente = uma implementação. Faça `grep` pelos nomes
alterados e garanta que tudo renderiza a nova versão antes de fechar.
