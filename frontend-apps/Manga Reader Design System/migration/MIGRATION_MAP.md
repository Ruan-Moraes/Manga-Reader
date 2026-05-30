# MIGRATION_MAP — Manga Reader Design System

> Mapa de migração incremental do frontend existente para o design system canônico
> deste projeto. Documento mestre que dita a ordem, as dependências e o risco de
> cada passo. Toda a especificação detalhada vive nos arquivos irmãos
> (`design-tokens.json`, `components/*.md`, `screens/*.md`).

---

## Princípios de migração

1. **Tokens primeiro, sempre.** Nenhum componente novo é mergeado antes da Fase 0 estar concluída e o `tailwind.config` mesclado. Tokens são a única fonte de verdade — código não-tokenizado é tratado como dívida.
2. **Substituição progressiva, nunca rewrite.** A cada componente migrado, um adapter mantém a API antiga viva por 1 sprint antes de remover. Nada é jogado fora.
3. **Mobile-first é regra dura.** Toda spec descreve mobile primeiro; tablet e desktop são `min-width` overrides. Quem migrar um componente sem checar mobile devolve o PR.
4. **Componente compartilhado = uma implementação.** Antes de mergear, fazer `grep` pelo nome do componente novo no codebase e confirmar que TODOS os call-sites antigos foram trocados. Variações legítimas viram `variant`/`size`/`tone` no próprio componente, nunca markup customizado.
5. **letter-spacing 0.0625rem global** — aplicado no `body` via `globals.css`. É assinatura visual do produto, não bug. Quem desligar precisa justificar caso a caso.
6. **Idioma:** copy 100% em pt-BR. Migração de strings é parte do escopo de cada tela e tem que estar coberta pelo `react-i18next`.

---

## Fase 0 — Fundação

> Objetivo: estabelecer tokens, fontes, ícones e config base. Nenhum componente
> novo de UI nesta fase. Risco geral: **baixo**.

| Etapa | Esforço | Depende de | Risco | Pré-requisitos |
|---|---|---|---|---|
| **0.1** Importar `design-tokens.json` no repo (pasta `src/design-system/tokens/`) | S | — | Baixo | nenhum |
| **0.2** Mesclar `tailwind.config.suggested.js` com o `tailwind.config` existente em `theme.extend` (cores, spacing, radii, shadows, fonts, breakpoints, z-index, animations) | S | 0.1 | Baixo | revisar conflitos de nomes com tokens atuais; renomear o que conflitar com prefixo `mr-` |
| **0.3** Adicionar `globals.css.suggested` no entrypoint global (`main.tsx` ou `index.css`) | S | 0.2 | Baixo | nenhum |
| **0.4** Carregar **Nunito Sans variable** via Google Fonts CDN ou self-hosted | S | 0.3 | Baixo | escolher hosting; preferência: self-hosted via `@fontsource-variable/nunito-sans` |
| **0.5** Aplicar `letter-spacing: 0.0625rem` no `body` e nas classes utilitárias `font-*` | S | 0.4 | **Médio** | revisar visualmente algumas telas críticas — esta única mudança altera o espaço de toda a UI |
| **0.6** Instalar `lucide-react` e criar wrapper `<Icon />` (spec em `components/Icon.md`) | S | 0.5 | Baixo | nenhum |
| **0.7** Copiar ilustrações chibi (PNG) para `public/illustrations/` — ver `ASSETS_INVENTORY.md` | S | — | Baixo | nenhum |
| **0.8** Configurar plugin de prefers-reduced-motion no Tailwind (`motion-safe:` / `motion-reduce:`) — animações do design são curtas (0.3s) mas merecem o opt-out | S | 0.2 | Baixo | nenhum |
| **0.9** Documentar no README do projeto destino que a interface deve ser **sempre dark** (não há tema claro definido ainda) | S | — | Baixo | nenhum |

**Critério de saída da Fase 0:** uma página em branco renderiza com a fonte correta, tokens disponíveis em Tailwind (`bg-mr-primary`, `text-mr-fg`, etc.) e em CSS (`var(--mr-accent)`), ilustrações acessíveis em `/illustrations/`.

---

## Fase 1 — Primitivos

> Objetivo: componentes atômicos, sem dependência de outros componentes do
> design system. Cada primitivo deve ser **headless**: aceita `className` e
> faz forward de ref. Risco geral: **baixo a médio**.

| Componente | Esforço | Depende de | Risco | Notas críticas |
|---|---|---|---|---|
| **Typography** (classes utilitárias `.mr-h1` … `.mr-body`, `.mr-label`) | S | 0 | Baixo | preferir classes utilitárias sobre componente `<Heading>` — Tailwind já cobre |
| **Button** | M | 0 | **Médio** | 3 variantes: `primary`, `raised`, `ghost`. A `raised` tem `box-shadow` offset accent que zera no `:hover` e mostra outline — comportamento sutil que precisa de QA visual |
| **IconButton** | S | Button, Icon | Baixo | wrapper sobre Button com `aspect-square` |
| **Icon** | S | 0.6 | Baixo | re-exporta de `lucide-react` com `currentColor`, tamanhos canônicos 16/20/24/28 |
| **Badge** | S | 0 | Baixo | 3 variantes: `accent`, `neutral`, `danger`. Pills, uppercase, `tracking-wide` |
| **Avatar** | S | 0 | Baixo | radius 2px (angular). Cores das iniciais vêm do user — usar HSL determinístico se ausente |
| **Stars** | S | Icon | Baixo | display-only por enquanto; versão interativa fica pra Fase 2 |
| **Input** | M | 0 | Baixo | hover → border accent-50, focus → border accent. Sem outline extra |
| **Textarea** | M | Input | Baixo | reaproveita styling de Input com `resize-vertical` |
| **Select** | M | Input, Icon | Médio | usar `<select>` nativo estilizado — sem dropdown custom na Fase 1 |
| **Checkbox** | S | 0 | Baixo | `accent-color: var(--mr-accent)` no input nativo |
| **Radio** | S | 0 | Baixo | mesmo padrão do Checkbox |
| **Switch** | S | 0 | Baixo | track + thumb, ativo = fundo accent + thumb preto |
| **Label** | S | 0 | Baixo | classe utilitária + componente `<Label htmlFor>` |
| **Kbd** | S | 0 | Baixo | inline-flex, mono, border-bottom 2px |

**Critério de saída da Fase 1:** uma página de Storybook (ou rota `/design`) renderiza todos os primitivos em todos os estados visuais documentados. Testes Vitest cobrem `disabled`, `loading` e variantes via snapshot.

**Adapter de transição:** durante a Fase 1, manter os botões antigos do projeto vivos com um shim que aceita as duas APIs (props antiga + nova) e logga `console.warn` em dev quando a API antiga é usada. Remover shim ao final da fase.

---

## Fase 2 — Composições

> Objetivo: componentes que compõem primitivos. Cada composição é um molde
> reutilizável. Risco geral: **médio**.

| Componente | Esforço | Depende de | Risco | Notas |
|---|---|---|---|---|
| **Card** | S | 0 | Baixo | surface + border + radius 8px; **sem sombra em repouso** — destaque vem do hover |
| **Modal / Dialog** | M | Card, Button, Icon | Médio | overlay com blur 4px; usar `<dialog>` nativo ou Radix Dialog (preferência: nativo) |
| **Drawer** | M | Card, Icon | Médio | slide da direita (settings) e da esquerda (SideMenu); 90vw max no mobile |
| **Toast** | M | Card, Icon | Médio | top-right; auto-dismiss 4s; máx. 3 visíveis. Usar context + hook `useToast()` |
| **Tabs** | M | 0 | Médio | underline accent na ativa; suporta scroll horizontal em mobile |
| **Pagination** | M | Button, Icon | Baixo | botões prev/next + numéricos com `…` em ranges longos |
| **Tooltip** | S | 0 | Baixo | hover/focus only; `delay-300`; preferir CSS-only quando possível |
| **DropdownMenu** | M | Card, Icon | **Alto** | usar Radix Popover OU Headless UI — escolher 1 e padronizar. Sem libs gerenciais customizadas |
| **Accordion** | S | Card, Icon | Baixo | usado em FAQ e seções de help/legal; chevron rotaciona em `open` |
| **SegmentedControl** | S | Button | Baixo | grupo de Buttons com `variant="ghost"` + estado `active` |
| **ProgressBar** | S | 0 | Baixo | thin (4px) ou thick (12px); accent fill; usado em scrubber do leitor |
| **StatusDot** | S | 0 | Baixo | pulse animation só em `degraded`; tamanhos 8/10/12px |
| **SearchField** | M | Input, Icon | Baixo | composição de Input com ícone de busca à esquerda + kbd à direita |
| **EmptyState** | M | Button | Baixo | ilustração chibi + heading + sub + CTA opcional. **Sempre PNG**, nunca SVG |
| **Skeleton** | S | 0 | Baixo | shimmer keyframe; usar `motion-safe` |

**Critério de saída da Fase 2:** página `/design` cobre todas as composições; testes de interação RTL para Modal/Tabs/DropdownMenu/Accordion (foco, keyboard, ARIA).

---

## Fase 3 — Layouts

> Objetivo: chrome e templates de página. Estes componentes aparecem em
> **todas** as telas — qualquer regressão é visível instantaneamente.
> Risco geral: **médio a alto**.

| Componente | Esforço | Depende de | Risco | Notas |
|---|---|---|---|---|
| **NavBar / Header** | L | Drawer, Avatar, SearchField, Button, Badge | **Alto** | sticky top, h=64px mobile / 72px desktop, border-bottom 2px. Mobile: hamburger + logo + ícone de busca. Desktop: logo + nav links + search expandido + Novidades + Biblioteca + Avatar/Entrar |
| **SideMenu / NavDrawer** | M | Drawer, Avatar | Médio | drawer de 320px com overlay blur. Mesma drawer em mobile e desktop (abre por click no menu) |
| **Footer** | M | Input (newsletter), Icon | Médio | 4–6 colunas no desktop, stack no mobile. Status banner + bottom bar de preferências |
| **MobileTabBar** | M | Icon | Médio | só visível em <768px. Home / Buscar / Biblioteca / Perfil. Notification badge no Avatar |
| **PageContainer** | S | 0 | Baixo | `max-w-[1240px] mx-auto px-4` no mobile, `px-6` no tablet, `px-8` no desktop |
| **HeroSection** | M | Button, Badge | Baixo | full-bleed bg gradient suave; poster à direita no desktop, embaixo no mobile |
| **SectionHeader** | S | 0 | Baixo | eyebrow (mr-label) + title + meta — usado em todo block heading |

**Critério de saída da Fase 3:** uma página em branco com NavBar/SideMenu/Footer renderiza idêntica em mobile/tablet/desktop. Lighthouse a11y ≥ 95.

---

## Fase 4 — Telas (migração tela a tela)

> Objetivo: trocar cada tela existente do projeto pelo equivalente desenhado.
> A ordem é **baixo risco → alto risco**, sempre garantindo que a tela
> dependente já tem todos os componentes de que precisa.

### Onda 1 — Telas estáticas (texto-pesadas, lógica mínima)

> Migrar primeiro porque o esforço é baixo, a cobertura de componentes é
> pequena (Card, Accordion, Tabs) e elas servem de "test bed" pro Tailwind
> config sem risco de regressão funcional.

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **Terms** | S | Fase 2 | Baixo | PageContainer, SectionHeader, Card, anchor TOC |
| **Privacy** | S | Fase 2 | Baixo | idem Terms |
| **DMCA** | S | Fase 2 | Baixo | + Callout danger |
| **Contact** | M | Fase 2 | Baixo | + Input, Textarea, Select, EmptyState (estado sucesso) |
| **HelpCenter** | M | Fase 2 | Baixo | + Accordion, Tabs, SearchField |
| **NotFound** | S | Fase 2 | Baixo | EmptyState com chibi `404.png` |

### Onda 2 — Auth + Configurações

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **Login** | M | Fase 1 | Baixo | Input, Button, Card, Checkbox |
| **Register** | M | Login | Baixo | + validação inline |
| **ForgotPassword** | S | Login | Baixo | Input + Button |
| **SystemSettings** | M | Fase 2 | Médio | Tabs, Switch, Select, SegmentedControl |

### Onda 3 — Listas e descoberta

> Migrar antes de Home porque a Home consome muitos destes componentes
> de cartão.

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **MangaCard / MangaPoster** | M | Fase 1 | Médio | poster + meta sobre gradient overlay |
| **News / Novidades** | M | MangaCard, Badge, Tabs | Baixo | grid responsivo + pinned hero card |
| **Trending** | M | MangaCard | Baixo | leaderboard tabs |
| **NewReleases** | M | MangaCard | Baixo | linha do tempo de capítulos |
| **Categories** | L | MangaCard, SegmentedControl, Toolbar custom | Médio | sidebar de filtros (toggle mobile) |

### Onda 4 — Conta e biblioteca pessoal

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **Library** | M | MangaCard, Tabs | Médio | tabs de status (Lendo/Concluídos/…) + EmptyState |
| **Profile** | M | Avatar, Stars, MangaCard | Médio | header com stats + currently reading + last reviews |
| **ProfileEdit** | L | Modal, Tabs, Input, Switch | **Alto** | modal de tabs com formulário complexo; é o componente mais denso da app |

### Onda 5 — Comunidade

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **Groups** | M | GroupCard, SearchField | Médio | grid + chips de filtro |
| **GroupDetail** | L | Tabs, MangaCard, ReviewCard | Médio | hero + tabs (obras/staff/sobre) |
| **Events** | M | EventCard | Baixo | grid de eventos especiais + normais |
| **EventDetail** | M | Tabs, Card | Baixo | hero + sessões/programação |
| **Forum** | L | ForumTopicCard, Tabs | Médio | listagem com filtros + tags |
| **ForumTopic** | L | CommentBox, Pagination | **Alto** | thread com replies aninhadas; manter ordem de comentários estável durante a migração |
| **ForumComposer** | M | Modal, Textarea, Tabs | Médio | modal de criação de tópico |

### Onda 6 — Telas centrais (alto risco, migrar por último)

| Tela | Esforço | Depende de | Risco | Componentes-chave |
|---|---|---|---|---|
| **Home** | L | tudo da Onda 3 + HeroSection | **Alto** | é a vitrine; qualquer regressão é vista por 100% dos usuários |
| **TitleDetail** | L | Stars, ChapterListItem, ReviewCard, CommentBox, Tabs | **Alto** | tela mais densa em informação; é onde o usuário decide ler |
| **Reader** | L | Drawer, ProgressBar (scrubber), keyboard handlers, IntersectionObserver | **Crítico** | qualquer regressão de scroll/auto-hide impacta UX core. Manter feature flag durante 2 sprints |

**Critério de saída da Fase 4:** todas as telas migradas; remover código legado de UI; remover adapters de transição; rodar Lighthouse mobile em todas; cobertura mínima de testes Vitest+RTL de 70% nos componentes compartilhados.

---

## Considerações específicas do design system

### O que NÃO pode escapar na migração

1. **Sombras offset accent**, não sombras de profundidade. Qualquer `0 4px 12px rgba(0,0,0,.2)` no codebase é violação.
2. **Sem gradientes em UI** — só em pôsteres placeholder de mangá. Botões, headers e backgrounds são cores chapadas.
3. **Sem emoji.** A linguagem emocional são as 7 ilustrações chibi. Bloquear no lint:
   ```json
   "no-restricted-syntax": ["error", { "selector": "Literal[value=/\\p{Emoji}/u]", "message": "Use ilustrações chibi em vez de emoji." }]
   ```
4. **Radii angulares.** `2px` em botões/inputs/badges, `8px` em cards. Quem usar `rounded-full` fora de avatares/pills paga o café da próxima reunião.
5. **Transições de 0.3s `ease`**. Sem spring, sem bounce.
6. **Spacing global 0.0625rem.** Manter no `body` e nas classes utilitárias.

### Riscos transversais

- **CSS legado** — provavelmente há estilos globais conflitantes (resets, normalize variantes). Auditar `index.css` antes da Fase 0; isolar tudo que conflita.
- **`accent-color` em inputs** — funciona em todos os navegadores modernos, mas regressões em Safari iOS são comuns. Testar nativo cedo.
- **Letter-spacing global** quebra layouts apertados em listas densas (timestamps, badges em linha). Auditar telas críticas após 0.5.
- **Font loading** — Nunito Sans variable é ~80kb. Carregar com `font-display: swap` e preload no `<head>`.
- **Lucide vs SVGs handmade** — o código antigo deve ter SVGs inline; mapear cada ícone antigo → nome Lucide equivalente antes da Fase 1.6. Lista em `ASSETS_INVENTORY.md`.

### Sequenciamento por equipe

Se duas pessoas tocam o codebase:
- **Pessoa A** segue a sequência canônica (Fase 0 → 1 → 2 → 3 → Telas Onda 1–6).
- **Pessoa B** pode pegar telas estáticas (Onda 1) em paralelo a partir do final da Fase 1, desde que use stubs dos componentes que ainda não existem.
- **Sem pessoa C tocando em Reader** até o resto estar entregue. É a tela que mais quebra silenciosamente.

---

## Estimativa total

| Fase | Esforço acumulado | Sprints (1 dev FT) |
|---|---|---|
| Fase 0 | M | 0.5 |
| Fase 1 | L | 1.5 |
| Fase 2 | XL | 2 |
| Fase 3 | L | 1 |
| Fase 4 — Onda 1 | M | 0.5 |
| Fase 4 — Onda 2 | M | 1 |
| Fase 4 — Onda 3 | L | 1.5 |
| Fase 4 — Onda 4 | L | 1.5 |
| Fase 4 — Onda 5 | XL | 2 |
| Fase 4 — Onda 6 | XL | 2.5 |
| **Total** | — | **~14 sprints** (≈ 3,5 meses com 1 dev) |

Com 2 devs em paralelo a partir da Fase 2: ~9 sprints (≈ 2 meses).

---

## Próximos artefatos do pacote

Aguardando aprovação deste mapa para gerar, nesta ordem:

1. `design-tokens.json` — fonte da verdade
2. `tailwind.config.suggested.js` — config Tailwind
3. `globals.css.suggested` — CSS vars
4. `ASSETS_INVENTORY.md` — inventário de assets
5. `components/*.md` — uma especificação por componente (~45 arquivos)
6. `screens/*.md` — uma especificação por tela (~25 arquivos)

Cada `.md` segue o template definido nas restrições deste documento: nome, finalidade, props/variantes, estados, anatomia, a11y, exemplo TS + Tailwind, dependências.
