# Handoff: Redesign da Área Administrativa — Manga Reader

## Overview

Redesign completo da **área administrativa** (`/dashboard/*`) do Manga Reader — a plataforma
dark-first de leitura de mangás/manhwas/manhuas. A área é usada pelos papéis **admin** e
**poster** e cobre 9 telas: Visão geral, Usuários, Títulos, Tags, Notícias, Eventos, Grupos,
Financeiro e Assinaturas, além de uma biblioteca de componentes reutilizáveis (DataTable,
modais, gráficos, campos de formulário localizados).

Decisão de produto importante deste redesign: **todas as edições acontecem via modal**
(não há rotas de formulário em tela cheia). Listas abrem modais de criar/editar/detalhe;
exclusões usam confirmação com "digite o ID".

## About the Design Files

Os arquivos em `design/` são **referências de design feitas em HTML/React (Babel no browser)** —
protótipos que mostram aparência e comportamento pretendidos, **não** código de produção para
copiar direto. A tarefa é **recriar estes designs no codebase real do Manga Reader**
(React 19 + Vite + TypeScript + TailwindCSS v4 + React Router + React Query), usando os
padrões e a biblioteca de componentes já existentes em `src/shared/ui/`.

O protótipo roda como um **template do Design System** em `templates/admin/index.html`
(dentro do projeto de origem). Para visualizar com estilo, abra-o pelo projeto (ele carrega
os tokens `mr-*` de `styles.css`). Os caminhos relativos (`../../styles.css`, `../../assets`)
só resolvem no projeto original — na pasta de handoff, trate o código como leitura.

## Fidelity

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento, raios, sombras e interações são
finais e seguem os tokens `mr-*` do Design System. Recrie a UI fielmente usando as bibliotecas
e padrões já presentes no codebase (componentes em `src/shared/ui/`, Tailwind v4, lucide-react).
Onde o protótipo usa estilos inline, mapeie para os tokens/classes equivalentes do app.

---

## Design Tokens (fonte: `design/colors_and_type.css`, prefixo `mr-*`)

### Cores
| Token | Valor | Uso |
|---|---|---|
| `--mr-primary` / bg | `#161616` | fundo da página |
| `--mr-secondary` / surface | `#252526` | cards, modais, header |
| `--mr-tertiary` | `#727273` | bordas de inputs/botões, ícones, placeholder |
| `--mr-accent` | `#ddda2a` | marca / CTA / ativo / foco / destaque |
| `--mr-accent-25/50/75` | rgba(221,218,42, .25/.50/.75) | glows, hovers, estados |
| `--mr-danger` | `#FF784F` | destrutivo, alerta, banir, excluir |
| `--mr-text` / fg | `#ffffff` | texto |
| gray-900 `#1a1a1a` · 800 `#2d2d2d` · 700 `#444` · 600 `#555` · 400 `#777` · 300 `#999` · 200 `#ccc` | escala neutra |
| border `#444` · border-subtle `#555` · separator `#242424` | bordas |

### Tons de status (disciplina cromática — accent + neutros + coral, **sem arco-íris**)
- **live** = `--mr-accent` (ativo / em andamento / concluído-pagamento / acontecendo agora)
- **open** = `--mr-accent-75` (inscrições abertas / reembolsado / hiato-grupo)
- **soon** = `--mr-tertiary` (em breve / hiato / pendente / expirada / inativo)
- **ended** = `--mr-danger` (encerrado / cancelado / falhou / banido)

Mapas exatos (pt-BR): ver `data-*.js` — `TITLE_STATUS_TONE`, `EVENT_STATUS_TONE`,
`PAYMENT_STATUS_TONE`, `SUB_STATUS_TONE`, `GROUP_STATUS_TONE`.

### Tipografia
- Família: **Nunito Sans** (variable). Mono: Fira Code (IDs, código).
- Escala: h1 32 · h2 24 · h3 20 · h4 16 · body 14 · small 12 · tiny/label 11 (px).
- Pesos: 400 / 600 / 700 / 800.
- **Letter-spacing global `0.0625rem` (~1px) em todo texto** — assinatura do produto.
- Labels técnicos: UPPERCASE + `letter-spacing: 0.08em`.

### Espaçamento (grid 8px) e raios
- 4 / 8 / 16 / 24 / 32 / 48.
- Raios: **2px** (botões, inputs, badges de status, avatares), **4px** (secundário),
  **8px** (cards, modais), **999px** (pills, dots). Visual angular — não arredondar demais.

### Sombras (assinatura — offset accent, não profundidade)
- `--mr-shadow-elevated`: `-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)` — botão "raised" em repouso;
  some no hover + aparece outline. Cards de KPI/plano usam no hover/destaque.
- Modais usam `0 0 2rem .25rem rgba(22,22,22,.75)`. **Nunca** sombra de elevação genérica.
- **Sem gradientes** em UI (só em pôsteres placeholder de mangá).

---

## Biblioteca de componentes (recriar como componentes do codebase)

| Componente (arquivo) | Descrição |
|---|---|
| `Icon` (AdminPrimitives.jsx) | ícones outline 2px, 24×24 viewBox, estilo lucide. **No app real use `lucide-react`.** |
| `StatusPill` | pill com dot + texto uppercase; tons live/open/soon/ended. |
| `Badge` | accent / neutral / danger; pill uppercase com tracking .08em. |
| `Button` | `primary` (fill accent), `raised` (sombra offset que some no hover), `ghost` (+`danger`); `size` md/sm. |
| `IconButton` | ação de 32px (editar/excluir) com hover accent ou danger. |
| `Avatar` | quadrado 2px, iniciais sobre cor sólida (ou foto). |
| `Modal` (AdminModals.jsx) | overlay com `backdrop-filter: blur(4px)`, painel surface, head/body/foot; **body rola**, head/foot fixos; Esc fecha; scroll-lock no body. Tamanhos sm 420 / md 520 / lg 680. |
| `ConfirmModal` | confirmação destrutiva; opcional **`confirmWord`** (digite o ID p/ liberar o botão). |
| `Field` / `LocalizedField` | rótulo + (abas de idioma pt-BR/en-US/es-ES) + input/textarea. `LocalizedField` guarda `{pt-BR,en-US,es-ES}` e marca idiomas preenchidos. |
| `TextInput` / `Textarea` / `SelectInput` / `Toggle` | campos; foco = borda accent, hover = accent-50. |
| `DataTable` (DataTable.jsx) | toolbar de busca + `Buscar`, cabeçalho, linhas, **colunas que somem** (`hideBelow: 'sm'|'md'`), estados **data/loading(skeleton)/empty/error(retry)**, paginação, `onRowClick`. |
| `StateSwitcher` | controle segmentado (Dados/Carregando/Vazio/Erro) — **afordância só de revisão**, remover na implementação real (os estados reais vêm do React Query). |
| `AreaChart` / `GrowthBars` / `ChartLegend` (Charts.jsx) | SVG: área de receita (linha accent + fill 12%) e barras agrupadas (novas=accent, canceladas=coral). No app, pode usar a lib de charts já adotada. |
| `Tabs` | abas sublinhadas (accent no ativo). |
| `AdminShell` (AdminShell.jsx) | header sticky + sidebar agrupada + drawer mobile. |

### Estados de interação (replicar)
- Hover link/ícone: `opacity .8`. Hover botão raised: sombra zera + outline + peso 800.
- Hover input: borda `--mr-accent-50`. Foco input: borda `--mr-accent` (sem outline extra).
- Transições 0.3s `ease`. Sem spring/bounce.

---

## Shell / Navegação (`AdminShell.jsx`, `admin.css`)

- **Header** sticky (56px mobile / 60px ≥768px), `bg --mr-primary`, **border-bottom 2px `--mr-tertiary`**.
  Esquerda: hambúrguer (somente <1024px) + marca (favicon + wordmark "Manga **Reader**" itálico
  extrabold, "Reader" em accent + sublabel "DASHBOARD"). Direita: nome + `#id` mono + avatar.
- **Sidebar** 248px. Seções uppercase: **Geral** (Visão geral) · **Conteúdo** (Títulos, Tags,
  Notícias, Eventos) · **Comunidade** (Usuários, Grupos) · **Monetização** (Financeiro, Assinaturas).
  Item ativo: bg `--mr-accent-25`, texto/ícone accent, borda `--mr-accent-50`, barra accent à esquerda.
  Ícones lucide 18px (Home, Book, Tag, FileText/news, Calendar, Users, Layers, DollarSign, CreditCard).
- **Responsivo**: <1024px a sidebar é **drawer** (desliza da esquerda, backdrop `--mr-primary-75`
  + blur, fecha no Esc/clique fora); ≥1024px é **fixa** e o conteúdo recua `margin-left: 248px`.
- Conteúdo centralizado, `max-width ~1180px`, padding lateral 14→24→32px por breakpoint.

---

## Telas / Views

> Dados de exemplo em `design/data-*.js`. Copy e rótulos pt-BR são os finais.

### 1. Visão geral (`Overview.jsx`) — rota `/dashboard`
- **6 KPIs** clicáveis (Usuários, Obras, Grupos, Notícias, Eventos, Banidos). Cada card: ícone em
  caixa 44px (accent-25; Banidos em coral), número 28px/800, label uppercase 12px. Hover: borda
  accent-50 + sombra elevated + translateY(-1px). Grid 1→3 colunas (mobile→≥768px).
- **Distribuição por role**: barra segmentada (Admin coral · Moderador accent · Membro neutro) + legenda.
- **Crescimento**: 2 sparklines (novos usuários / obras, 30 dias) com delta accent.
- **Conteúdo**: 2 cards "Obras por status" e "Eventos por status" — cada linha: dot + label + `n · %`
  + barra proporcional.
- **Top 10 obras por ranking**: tabela # / Obra / Tipo / Avaliação (★ accent + nota 1 casa + (votos)).

### 2. Usuários (`Users.jsx`) — `/dashboard/users`
- DataTable: **ID** (mono, oculta <768), **Nome** (avatar 32 + nome), **Email** (oculta <640),
  **Role** (badge: Admin danger · Moderador accent · Membro neutral), **Status** (pill: Ativo=live ·
  Banido=ended), **Cadastro** (oculta <768), **Ações** (editar/excluir). Busca por nome/email. Paginação 8/pág.
- **Modais**: Detalhe (avatar 56 + badges + lista ID/Cadastro/Atualizado; ações Alterar role / Banir|Desbanir),
  Alterar role (select Membro/Moderador/Admin), Banir (motivo opcional, confirm danger) / Desbanir,
  Excluir (digite o ID).

### 3. Títulos (`Titles.jsx`) — `/dashboard/titles`
- DataTable: ID, Nome, Tipo (oculta <640), Status (Em andamento/Concluído/Hiato/Cancelado),
  Capítulos (oculta <768), Criado em (oculta <768), Ações. Botão **Novo título**.
- **Form modal (lg, criar/editar)**: Nome (localizado) *, Tipo (select Mangá/Manhwa/Manhua),
  Sinopse (localizada, textarea), grid Cover URL + Status, Gêneros (CSV), grid Autor/Artista/Editora,
  toggle Conteúdo adulto. Excluir no rodapé do form e por linha (digite o ID).

### 4. Tags (`Tags.jsx`) — `/dashboard/tags`
- DataTable simples: ID, Nome, Ações; ordenada A→Z; busca; paginação 12/pág. Botão **Nova tag**.
- **Form modal (sm)**: Nome da tag (localizado) — Salvar travado até pt-BR preenchido. Excluir por ID.

### 5. Notícias (`News.jsx`) — `/dashboard/news`
- DataTable: ID, Título, Categoria (badge, oculta <640), Views (formatado pt-BR, oculta <768),
  Destaque (Sim accent / Não neutral), Ações. Botão **Nova notícia**.
- **Form modal (lg)**: Título (loc)*, Categoria (select)*, Subtítulo (loc), Resumo (loc, textarea),
  grid Cover URL + Fonte, grid Autor + Tempo de leitura (number), Tags (CSV), toggles Exclusiva + Destaque.

### 6. Eventos (`Events.jsx`) — `/dashboard/events`
- DataTable: ID, Título, Tipo (badge, oculta <640), Status (Em breve/Inscrições abertas/Acontecendo
  agora/Encerrado), Local (oculta <768), Início (oculta <640), Ações. Botão **Novo evento**.
- **Form modal (lg)**: Título (loc)*, Subtítulo (loc), Descrição (loc), grid Data início + Data fim
  (date), grid Timeline + Status + Tipo (selects), grid Local + Cidade, grid Organizador + Preço +
  Imagem URL, toggles Online + Destaque.

### 7. Grupos (`Groups.jsx`) — `/dashboard/groups`
- DataTable: ID (oculta <768), Nome (avatar iniciais + nome), Username (mono accent, oculta <640),
  Status (Ativo=live/Hiato=open/Inativo=soon), Membros (oculta <768), Títulos (oculta <768),
  Entrada (oculta <768), Ações.
- **Detalhe (modal lg)**: cabeçalho + grid de info (ID, Membros, Títulos, Rating ★, Popularidade,
  Entrada), Descrição, **lista de membros** com badge de função (Líder accent) e ação **Alterar função**
  (modal select Líder/Tradutor/Editor/Revisor). Rodapé: Editar (form: Nome, Username, Status, Descrição)
  e Excluir (digite o ID).

### 8. Financeiro (`Financial.jsx`) — `/dashboard/financial`
- 3 KPIs (Total de pagamentos, Receita confirmada [accent], Receita pendente).
- **Distribuição por status** (Pendente/Concluído/Falhou/Reembolsado): tabela Status/Quantidade/Valor
  total + barra.
- 3 mini-KPIs (Receita do mês, Variação mensal [coral negativo], Receita anual).
- **Receita mensal** (AreaChart, 12 meses, eixos R$).
- **Pagamentos**: filtro por status + DataTable (ID, Valor, Status pill, Método mono, Referência mono,
  Criado em, Ações). Ações: **Atualizar status** (modal select) + Excluir (digite o ID).

### 9. Assinaturas (`Subscriptions.jsx`) — `/dashboard/subscriptions`
- 3 KPIs (Ativas live, Expiradas neutral, Canceladas coral).
- **Crescimento de assinaturas** (GrowthBars: novas accent vs canceladas coral) + legenda.
- **Abas**: **Assinaturas** (filtro + botão **Conceder** [modal: usuário + plano] + DataTable
  ID/Usuário/Plano+preço/Status/Início/Fim/Ações; Atualizar status + Excluir),
  **Planos** (3 cards Diário/Mensal/Anual, "Mais popular" no Mensal, features com ✓ accent),
  **Logs** (auditoria: quem + ação + tempo relativo, dot por tom).

---

## Interactions & Behavior
- **Edições sempre em modal** (criar/editar/detalhe). Exclusões = ConfirmModal com `confirmWord` = ID.
- DataTable: busca aplica no submit do form (botão Buscar / Enter); paginação reseta na busca.
- Estados de lista: loading (skeleton shimmer), empty (ilustração `duvida.png` + copy), error
  (ilustração `zangada.png` + "Tentar de novo"). No app real, derivar de React Query
  (`isLoading`/`isError`/dados vazios). O `StateSwitcher` é só demo — remover.
- Modal: Esc fecha, clique no backdrop fecha, scroll do body travado enquanto aberto.
- Transições 0.3s ease; sem spring.

## State Management (no codebase real)
- Listas: React Query por recurso (`useUsers`, `useTitles`, `useTags`, `useNews`, `useEvents`,
  `useGroups`, `usePayments`, `useSubscriptions`) com estados loading/error/empty.
- Mutations: criar/editar/excluir/alterar-role/banir/conceder/atualizar-status → invalidam a query.
- UI local: termo de busca, página atual, modal aberto + registro selecionado, rascunho do form
  (incl. objeto localizado `{pt-BR,en-US,es-ES}` para campos i18n).

## i18n (obrigatório)
- Idiomas: **pt-BR, en-US, es-ES**. Nada de texto hardcoded — usar `src/i18n/locales/{lang}/admin.json`.
- Campos de conteúdo (nome/sinopse/título/subtítulo/resumo/descrição/nome-da-tag) são **por idioma**:
  ver `LocalizedField`. Reservar ~30% de largura extra (PT/ES expandem vs EN).

## Responsive
- Mobile-first. Breakpoints: 320/375/425 · 640 (sm) · 768 (md, tablet) · 1024 (lg, desktop) · 1280 (xl).
- Sidebar: drawer <1024px, fixa ≥1024px. Tabelas: `overflow-x-auto` + colunas secundárias
  ocultas via `hide-sm`/`hide-md`. Grids de form: 1 col → 2/3 cols ≥600px. KPIs 1→3 cols.

## Assets
- `assets/favicon.svg` (marca). Ilustrações chibi (PNG) para estados: `duvida.png` (vazio),
  `zangada.png` (erro), `pensando.png` (placeholder). Capas via picsum (placeholder) — trocar por
  imagens reais. Ícones: substituir o `Icon` inline por **lucide-react**.

## Files (em `design/`)
- `index.html` — entrypoint (ordem de carregamento dos scripts).
- `admin.css` — layout do shell, sidebar/drawer, tabelas, modais, campos, charts, planos, logs.
- `colors_and_type.css` — tokens `mr-*` (referência).
- `AdminPrimitives.jsx` (Icon, StatusPill, Badge, Button, IconButton, Avatar)
- `AdminModals.jsx` (Modal, ConfirmModal, Field, LocalizedField, inputs, Toggle)
- `DataTable.jsx` (DataTable, Toolbar, Pagination, StateSwitcher)
- `Charts.jsx` (AreaChart, GrowthBars, ChartLegend, Tabs)
- `AdminShell.jsx`, `AdminApp.jsx`
- Telas: `Overview / Users / Titles / Tags / News / Events / Groups / Financial / Subscriptions .jsx`
- Dados: `admin-data.js`, `data-users.js`, `data-titles.js`, `data-tags.js`, `data-news.js`,
  `data-events.js`, `data-groups.js`, `data-finance.js`

## Codebase mapping (Manga Reader)
- Shell → `src/widgets/admin-panel/ui/` (AdminLayout/Header/Sidebar).
- Telas → `src/pages/dashboard/ui/` + `src/features/admin/ui/`.
- Primitivos → reusar/estender `src/shared/ui/` (Button, Card, DataTable, Modal, Input, Select, Tabs, Badge).
- Tokens → já em `src/styles/index.css` (prefixo `mr-*`); não recriar paleta.
- i18n → `src/i18n/locales/{pt-BR,en-US,es-ES}/admin.json`.
- Não alterar: paleta/identidade (dark + amarelo `#ddda2a`), rotas/papéis, nomes das seções da nav.
