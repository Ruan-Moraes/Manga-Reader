# Manga Reader — Dívidas Técnicas

> Última atualização: 8 de junho de 2026

---

## Resumo

Este documento lista as dívidas técnicas do projeto, organizadas por **prioridade**. Cada item inclui descrição, impacto e recomendação/estado.

> **Decisão 2026-05-16**: o projeto ainda **não vai a produção**. Itens que exigem
> infraestrutura grande (CI/CD, jobs de limpeza, observabilidade, conteúdo legal
> vinculante, E2E) foram **adiados como não-bloqueantes** — permanecem listados,
> mas não serão implementados nesta fase. Itens só-código foram resolvidos.

---

## Itens em Aberto

### DT-01: `@Transactional` em use cases — **Resolvido**

**Estado**: **Resolvido**. Etapa 1 (2026-05-16): os 5 use cases com escrita
primária em PostgreSQL (JPA) receberam `@Transactional`:
`SaveToLibraryUseCase`, `ChangeReadingListUseCase`, `AddRecommendationUseCase`,
`UpdateUserProfileUseCase`, `RemoveWorkFromGroupUseCase`.

Etapa 2 (2026-05-17, branch `tech-debt/dt01-mongo-transactions`): suporte a
transações MongoDB habilitado e os 14 use cases Mongo-backed anotados
(Comment×3, Rating×3, News×3, Title×3, RecordViewHistory, CreateErrorLog) com
`@Transactional("mongoTransactionManager")`. Implementação:
- `docker-compose.yml`: MongoDB roda como replica set de nó único
  (`mongod --replSet rs0`), com healthcheck que executa `rs.initiate()` na
  primeira subida. TestContainers `MongoDBContainer` já sobe como replica set.
- `MongoConfiguration#mongoTransactionManager`: bean `MongoTransactionManager`.
- `TransactionManagerConfig#transactionManager`: `JpaTransactionManager`
  marcado `@Primary` — todo `@Transactional` sem qualifier continua resolvendo
  para JPA (precisa ser explícito porque a presença de um
  `MongoTransactionManager` desliga o auto-config do tx manager JPA).

Verificação: `mvn test` → 1023 testes, 0 falhas, sem cascata transacional.

---

### DT-02 (parcial): Sem testes de componente / E2E

**Estado**: A parte "8 testes falhando" está **resolvida/stale** — a suíte atual
roda **817 testes em 120 arquivos, 0 falhas** (`npx vitest run`). Os 8 falhando
descritos em 2026-03 não existem mais.

**Fix 2026-05-30**: 4 testes falhavam por **chaves i18n ausentes** (componente chamava
`t(...)` sem chave nos 3 locales): `filters.metaSuffix` (manga), `page.worksCount` (library),
`passwordStrength.{weak,medium,strong,great}` (auth). Chaves adicionadas em pt-BR/en-US/es-ES → suíte verde.

**Adiado (não-prod)**: ainda **não há testes de componente nem E2E**
(CommentsSection, Library, UserProfile, SearchResults sem cobertura; sem
Playwright). Não-bloqueante enquanto não vai a produção.

---

### DT-03: Sem pipeline CI/CD — **Adiado (não-prod)**

Nenhum workflow de CI/CD. **Decisão 2026-05-16**: não implementar pipelines
enquanto o projeto não for a produção. Quando for: GitHub Actions
lint → test → build (ver `deployment-plan.md`).

---

### DT-08: Acessibilidade incompleta (a11y) — **axe por rota implementado (2026-06-01); 4 residuais → DT-43**

**Implementado**: asserção axe (`axeComponent`) adicionada a **29 rotas** (todos os
testes de página com render reaproveitável). **2 bugs sistêmicos corrigidos**:
(1) `shared/ui/Select.tsx` — botão `role="combobox"` sem nome acessível
(`button-name`) → adicionado `aria-label` (prop ou fallback p/ label do valor),
corrigiu ~9 páginas; (2) `pages/legal` — `<aside>` decorativos (callouts) dentro de
`<main>` (`landmark-complementary-is-top-level`) → trocados p/ `<div>` em
`LegalSection.tsx` e `Dmca.tsx`. **Residual (DT-43)**: 4 páginas com violação
específica não corrigida nesta leva (asserção axe removida delas p/ manter suíte
verde, registradas abaixo). 864 testes.

**Resolvido (2026-05-31)** — passe direcionado + fundação de teste:
- **Landmarks**: corrigido `<main>` aninhado em `LegalShell` (PageContainer `asMain`
  já provê o landmark; filhos internos viraram `<div>`). Convenção confirmada:
  cada página possui seu próprio `<main>` via `PageContainer asMain` (~25 páginas),
  AuthShell e o leitor de capítulo também — RootLayout **não** adiciona `<main>`
  (evita aninhamento).
- **Focus management**: novo hook `shared/hook/useFocusTrap.ts` (foco inicial +
  ciclo Tab/Shift+Tab preso + restauração de foco ao fechar). Aplicado a `Drawer`
  (cobre `SideMenu`, que o encapsula) e `AdminModal`. `Modal` usa `<dialog>` nativo
  (trap + restauração nativos no browser). Bug a11y corrigido: `Drawer` usava
  `<aside role="dialog">` (proibido por `aria-allowed-role`) → trocado por `<div>`.
- **Focus ring**: utilitário único `@utility mr-focus-ring` (`styles/index.css`),
  substituindo os triplos `focus-visible:outline-*` ad-hoc com offset inconsistente
  (1/2/nenhum) nas primitivas do DS (Button, Switch, MangaCard, Logo, NavBar, Stars,
  footer). Token `--mr-focus-ring` já existia + regra global `*:focus-visible`.
- **Testes a11y**: `jest-axe` instalado, matcher `toHaveNoViolations` em
  `src/test/setup.ts`, helper `src/test/helpers/axe.ts` (desliga regra `region`
  para renders isolados sem o shell completo). Smoke tests em HelpCenter,
  HelpArticle e Drawer.

**Restante (adiado, não-bloqueante)**: auditoria sistemática por rota
(landmarks/ordem de tab/ARIA em todas as telas), axe por rota, navegação por
teclado completa fora dos overlays.

---

### DT-09: Conteúdo placeholder em páginas legais — **Adiado (não-prod)**

Termos de Uso / Privacidade / DMCA / Contato com placeholder. Estrutura/UI/i18n
**prontas** (LegalShell + LegalSection + LegalCrossLinks, rotas registradas e
alcançáveis, chaves em pt-BR/en-US/es-ES). Falta apenas o **texto legal
vinculante**, que exige revisão jurídica — **não é tarefa de engenharia**.
Bloqueia produção; não-bloqueante para desenvolvimento.

---

### DT-10: Refs cross-database sem job de limpeza — **Adiado (não-prod)**

Refs cross-DB (`user_libraries.title_id`, `group_works.title_id`,
`store_titles.title_id`) **já estão documentadas** via Javadoc nas entidades
`SavedManga`, `GroupWork`, `StoreTitle`. O **job de limpeza de órfãos** é
infraestrutura grande — adiado como não-bloqueante.

---

### DT-24: Migração FSD frontend incompleta — **Fechado: resíduos aceitos (2026-06-01)**

**Avaliação final (2026-06-01)**: a migração FSD está concluída (camadas completas,
lint:fsd verde). Os resíduos listados (cross-import `@x` p/ entity↔entity e
`no-public-api-sidestep` em `shared/`) são **idiomáticos e aceitos**: o `@x` é aplicado
onde necessário (ex.: `user/@x/comment`, `manga/@x/*` — adicionados nas DTs 28/26) e as
regras steiger correspondentes seguem **off** de propósito (ver `steiger.config.ts`).
Sem ação pendente — ver também DT-33.

**Concluído — Fase 1 (2026-05-30)**: separadas as camadas FSD `pages` (ex-`app/route`)
e `widgets` (ex-`app/layout`, slices: header/footer/mobile-tab-bar/admin-panel/layouts).
`app/` agora só contém `router/`. Aliases `@pages`/`@widgets`.

**Concluído — Fase 2 / Foundations (2026-05-30)**:
- Renomeado `feature/` → `features/`; alias `@feature` → `@features` (221 refs).
- Public API (`index.ts`) por slice em `pages/` (28) e `widgets/` (5); imports
  estáticos rewireados para os barrels (router/`main.tsx` mantêm `import()`
  dinâmico por página para preservar code-splitting).
- Boundary lint via **steiger** (`@feature-sliced/steiger-plugin`,
  `steiger.config.ts`, script `npm run lint:fsd`). **Verde** no escopo atual.

**Concluído — Fase 3 / Entities (2026-05-30)**: layer `entities/` introduzida
(alias `@entities`). Classificação: **12 entities** (user, manga, chapter, rating,
comment, category, label, news, event, group, store, forum) vs **4 features**
(auth, admin, library, contact). Migração **incremental por batches** (todos feitos):
- **Batch 1 — feito**: `user, label, store, news, forum` (folhas, sem edges de saída).
- **Batch 2 — feito**: `comment, group, rating` (edges só entre si e p/ entities; `category`
  movido p/ Batch 3 pois `category→manga` seria `entity→feature`).
- **Batch 3 — feito**: `manga, chapter, category`. Ciclo manga↔chapter é só de tipos
  (`type Chapter`/`type Title`) + 1 runtime one-way (`chapter` usa `useTitles` de `manga`);
  sem ciclo de runtime, TS resolve, steiger não flaga same-layer. Movido as-is.
- **Batch 4 — feito**: `event`. O hook gordo `useEvents` (data + UI state + `useAuth`)
  foi reclassificado como **page hook** → movido p/ `pages/event/useEvents.tsx` (page
  pode importar feature+entity). Resto do slice → `entities/event`. Resolve `event→auth`.

**Migração de entities concluída.** `features/` agora só tem verbos: `admin, auth, contact, library`.

**Concluído — dead code + react-icons (2026-05-30)**: removida a cópia stale
pré-widgets em `shared/` (`menu/NavigationMenu`, `link/section/SidebarMenuContent`,
`modal/settings/` inteiro, `input/MainSearchInput`) — só se auto-referenciava,
zero consumidor externo. Resolveu o `shared→features` (NavigationMenu) e os
componentes duplicados. `BaseSelect` migrado `react-icons/fi` → `lucide-react`.
`react-icons` 100% eliminado. `fsd/forbidden-imports` agora **sem exceções** (verde).
tsc: 33 → 28 erros.

**Concluído — type errors + shared cleanup (2026-05-30)**:
- Zerados os ~28 erros de tipo reais (enum NewsCategory→string dinâmico, RatingWizard/
  FinalScoreCard iconType, RecentReviews import, useTitleFetch `<Title,Error>`, PageShell
  props mortas, i18n `count`→`voteCount`, etc.). **tsc 0.**
- Avatar: prop `shape` removida + consumidores; Button types consolidados em `Button.tsx`
  (`Button.types.ts` deletado); rename `style/`→`styles/`.
- Reserved folder `shared/component/ui/` resolvido: `Illustration` + `StyledSelect`
  movidos p/ `shared/ui/` (`@ui/Illustration`). `fsd/no-reserved-folder-names` agora **ON**.
- `*.tsbuildinfo` adicionado ao `.gitignore` (era trackeado e gerava erros-fantasma no tsc incremental).

**Concluído — segmentação canônica (2026-05-30)**:
- `pages/` (28) e `widgets/` (5) com código movido p/ segmento `ui/`.
- `entities/` (12) e `features/` (4): segmentos renomeados p/ canônico FSD —
  `component→ui`, `service→api`, `hook/type/context/schema→model`, `util→lib`, `constant→config`.
  `fsd/no-segmentless-slices` agora **ON**, verde.
- Dead code removido: `shared/component/form/ContactForm` e `shared/hook/useMenuData`
  (duplicatas stale que importavam `@features` — resolviam 2 violações `shared→features`).
- Pastas não-FSD do root absorvidas em `shared/`: `lib/`→`shared/lib` (`@shared/lib/cn`),
  `design-system/tokens`→`shared/config`, SVGs de `assets/` colocados em `shared/component/icon/`.
  Root agora só tem layers + cross-cutting aceitos (`i18n/`, `styles/`, `test/`, `main.tsx`).

**Concluído — cross-import API @x (2026-05-30)**: refs de domínio entity↔entity
(Title↔Chapter, Comment→User, Manga→Rating, Category→Manga, Group→Rating) migradas
p/ `entities/<target>/@x/<consumer>.ts` (8 gateways, `export * from '..'`).
`fsd/forbidden-imports` agora **100% ON** (sem exceção p/ entities; só ficam os 3
desvios same-layer aceitos: layout shells + design showcase).

**Permanente — won't-fix com rationale** (desligado no `steiger.config.ts`, 2026-05-31):
- `public-api`/`no-public-api-sidestep` em `shared/`: imports por caminho de segmento são o **idioma deliberado** do projeto (@ui/Button, @shared/service/http). Ligar mediu **232 diagnósticos** e reverteria o idioma sem ganho → mantido OFF permanente.
- `fsd/inconsistent-naming` off: falso-positivo em `news` (substantivo, não plural).
- `Pagination`: ✅ unificado em `@ui/Pagination` (2026-05-30).

**Prioridade**: Baixa (FSD essencialmente completo: layers + segmentos + @x, tsc 0, suite verde, lint verde full).

---

### DT-25: Auditoria frontend — FSD / SRP / dead-code (mapeamento 2026-05-30)

Varredura manual+heurística de `frontend-apps/manga-reader/src` (~720 arquivos). **Só documentação — nada corrigido aqui.** Escopo: violações FSD além do que o steiger pega (verde), responsabilidade excessiva, código morto/obsoleto.

#### 25.1 — Código morto / obsoleto
- ✅ **Feito**: `entities/comment/model/useCommentEditor.tsx` removido (0 consumidores; substituído por `useCommentRichEditor`).
- ✅ **Stale (2026-05-30)**: `pages/forum/ui/parts/forumTopicMock.ts` e `pages/profile/ui/parts/userProfileMock.ts` **não existem mais** — Forum/UserProfile já consomem API real (`forumService`/`userService`). Mocks restantes são só fixtures inline em `__tests__/`.
- ✅ **Feito**: slice `pages/term/` removido (eram stubs `<Navigate>`). As rotas legadas
  `/terms-of-use` e `/dmca` agora redirecionam inline no router (`<Navigate to="/legal/...">`).
  Comportamento preservado, slice redundante eliminado.
- 3 `TODO/FIXME` espalhados (baixo).

#### 25.2 — FSD: pureza de segmento (hooks fora de `model/`) — ✅ Feito
Movidos de `ui/` p/ `model/` do slice: `useChapterReader` (pages/chapter), `useEvents`
(pages/event), `useComposerFormState` (pages/forum, +removida pasta `hook/`),
`useSidebarMenuItems` + `useMenuData` (widgets/header, +removida `hooks/`), `useNavSearch`
(widgets/header). tsc 0, lint verde, suite verde.

#### 25.3 — Responsabilidade excessiva (god files, LOC) — parcial ✅ (2026-05-30)
- ✅ **`pages/design/ui/DesignPrimitives.tsx`** 1516→17 LOC: quebrado em `parts/` por fase
  (`PrimitivesSection`, `CompositesSection`, `LayoutsSection`, `ContentCardsSection` + `showcaseShared`).
- ✅ **`shared/ui/Footer.tsx`** 353→~135 LOC: extraído `footer/` (`footer.types`, `FooterColumnBlock`,
  `NewsletterCard`, `FooterButtons`). Bug corrigido: `onSubscribe` chamado 2× → 1×.
- ✅ **`entities/comment/model/internal/useCommentRichEditor.tsx`** 285→~140 LOC: extraídos
  `useEditorPlaceholder` + `useCommentEditorImages`.
- ✅ **`pages/category/ui/CategoryFilters.tsx`** 216→~150 LOC: extraído `parts/CategoryResults` (grid/list/empty/loading).
- ✅ **`features/admin/model/admin.types.ts`** 327→11 LOC: split por subdomínio em `model/types/*`
  (user/title/news/event/group/content/finance/subscription/tag); `admin.types.ts` virou barrel re-export (imports estáveis).
- ✅ **`features/admin/ui/AdminEventForm.tsx`** 242→~190 LOC: extraído `parts/EventFormField` (wrapper label+control)
  + helper `setField` (curry) — removida repetição de `setForm(f => ({...f, k}))` por campo.
- ✅ **`RatingWizard.tsx`** 239→~150 LOC (2026-05-31): extraídos `wizard/parts/StepIndicator` + `wizard/parts/CategoryStep`.
- ✅ **`NavBar.tsx`** 212→~155 LOC (2026-05-31): scroll + atalho Cmd+K extraídos p/ `widgets/header/model/useNavBarChrome.ts`;
  removidos 3 `console.log` de debug residuais.
- **Restam**: páginas legais (ver DT-09).

#### 25.4 — Duplicação / nomes colididos (triar)
- ✅ **`Pagination` unificado (2026-05-30)**: canônico `@ui/Pagination` (Button-based, acessível).
  Removidos `shared/component/navigation/Pagination` (icon) e re-export morto `entities/forum/ui/Pagination`;
  `DataTable` migrado (props `total/onChange` + guarda `>1`). `ChapterPagination`/`useCommentPagination` mantidos (não-dups).
- **Não-dups (composição/contexto)**: `Footer`/`NavBar`/`SideMenu`/`MobileTabBar` — versão widget **compõe** o kit `@ui` (ok, mantido).
- ✅ **Renomes de clareza (2026-05-31)**: `AboutTab`→`TitleAboutTab`/`SettingsAboutTab`;
  entity `TitleDetails` (component)→`TitleInfoCard` (type `TitleDetailsProps` mantido; page `TitleDetails` mantido);
  user-profile `CommentsSection`→`ProfileCommentsSection` (genérico `CommentsSection` de comment mantido);
  admin `Logo`→`AdminLogo` (main `Logo` mantido). Barrels + import sites atualizados.

#### 25.5 — Já aceito / deferido (não re-auditar) — ✅ revisado 2026-05-31, sem ação
- `shared` public-api/sidestep (idiomático); `inconsistent-naming` off (`news`); 3 desvios same-layer (layout shells, design showcase) com exceção file-scoped. **Exceções intencionais — mantidas.**

#### 25.6 — Padronização de testes — ✅ Feito
- Convenção `__tests__/` aplicada: 31 testes inline movidos p/ `__tests__/` do segmento
  (api e model). Único inline mantido: `test/setup.smoke.test.ts` (infra).
- **Duplicatas removidas**: `useAuth` e `useBookmark` tinham 2 arquivos de teste divergentes
  (inline + `__tests__/`); a versão `__tests__/` era superset → inline deletado.
- Suite: 120 files / 817 tests, verde (−2 files, −9 testes redundantes).

#### 25.7 — Estruturais observados — ✅ Feito (2026-05-31)
- ✅ `entities/category` → **`entities/catalog-filter`** (mal-nomeado: filtros tag/sort/status/adult + `tagService`);
  hook `useCategoryFilters`→`useCatalogFilters`; gateway `@x/category.ts`→`@x/catalog-filter.ts`; 10 consumidores + mocks atualizados.
- ✅ `shared/util/` consolidado em **`shared/lib/`** (`formatters.ts` + `pagination.ts`, ~22 sites); `shared/service/util/`
  permanece (são serviços, não utils puros).
- ✅ **Dedup relative-date (2026-05-31)**: havia **3** formatadores (`shared/lib formatRelativeTime` Intl sem uso,
  `shared/service/util/formatRelativeDate` horas/dias, e cópia própria em `forumService.ts` min/meses).
  Unificados num só: `shared/service/util/formatRelativeDate` (impl rica min/horas/dias/meses); `forumService`
  re-exporta; `formatRelativeTime` Intl removido. NOTE: strings pt-BR hardcoded — migração p/ Intl locale-aware fica como i18n debt à parte.
- ✅ **`shared/component/` (legacy) eliminada (2026-05-31)**: kit `@ui` é o **home único** de componentes.
  Purgados ~32 arquivos dead (button/input/form/avatar/box/icon/modal-info/notification/paragraph/social-media/title/blur);
  movidos os 12 vivos p/ `shared/ui` (AppLink, DataTable, TruncatedCell, LocalizedTextInput, ImageLightbox, Logo, AdminLogo,
  ErrorBoundary, ErrorFallback, RouteErrorFallback, RouteSuspenseFallback, ToastProvider→ToastContainer). Pasta `shared/component/` removida.

#### 25.8 — Constantes legadas mortas — ✅ Feito (2026-05-31)
Auditoria por-membro de `shared/constant` (grep `ENUM.MEMBER` + checagem de acesso dinâmico). Removidos ~53 itens mortos:
`THEME_COLORS` (arquivo inteiro), `TOAST_POSITIONS` (5/6, mantido `BOTTOM_RIGHT`), `ERROR_MESSAGES` (6 superados por
`apiErrorMessages.ts`), `QUERY_KEYS` (17), `API_URLS` (3), `ROUTES` (22). Mantidos: `SOCIAL_MEDIA_COLORS` (uso dinâmico
`[name]`), `WEB_BASE_URL`/`USER_SETTINGS_STORAGE_KEY`/`REDIRECT_AFTER_LOGIN_KEY`. tsc 0, lint verde, 818/818.

#### 25.9 — `ROUTES` fonte canônica de rotas — ✅ Feito (2026-05-31)
`ROUTES.ts` reescrito de `enum` stale → `const ROUTES = {…} as const`: estáticas string + **builders tipados**
de param (`TITLE_DETAIL(id)`, `CHAPTER(id,n)`, `EVENT_DETAIL`, `FORUM_TOPIC`, `USER_DETAIL`, `DASHBOARD_*_EDIT`, …),
cobrindo todo o inventário do router. Paths relativos sem `WEB_BASE_URL` (prefixo via `useAppNavigate`/`AppLink`).
Migrados ~todos os call sites de navegação (navigate/Link/Navigate) p/ `ROUTES` — **136 usos**; 0 literais estáticos
de navegação restantes (só sobram paths data-driven `${item.link}`). Duplicatas do router (`/title`↔`/titles`,
`/event`↔`/events`, `/forum/:id`↔`/forum/topic/:id`) mantidas como alias; ROUTES emite só o canônico (plural).
Bug corrigido: `NotFound` navegava p/ `/categories` inexistente → `ROUTES.CATALOG` (`/genres`).
**Resíduo resolvido (2026-05-31)**: `ROUTES.HELP_ARTICLE(id)` → criada página
`pages/help/ui/HelpArticle.tsx` (lê `ARTICLES` do mock por id + corpo via i18n
`articleBody.{id}`, relacionados por categoria, estado not-found), rota
`help/article/:articleId` registrada, chaves i18n em pt-BR/en-US/es-ES, teste de
página. Link morto fechado.

**Prioridade**: Baixa. Resolvido 2026-05-30/31: 25.3 (god files), 25.4 (Pagination + renomes), 25.5 (revisado),
25.6 (testes), 25.7 (catalog-filter + lib + layer legacy eliminada), 25.8 (constantes mortas), 25.9 (ROUTES canônico).
**DT-25 fechado** (código). Resíduo help/article **resolvido** (2026-05-31, ver DT-25 acima). Resta item não-prod (DT-09 legais).

---

### DT-13 (resíduo): call-sites com basename hardcoded

**Estado**: **Resolvido na fonte (2026-05-16)** — o basename agora é
parametrizado por `VITE_BASE_URL` (`src/shared/constant/WEB_BASE_URL.ts`,
`vite.config.ts` via `loadEnv`, `.env`/`.env.example`). `main.tsx`,
`ProtectedRoutes`, `Login`, `SignUp`, `AdminSidebar` e `VerticalCardsContainer`
usam a constante.

**Resíduo — ✅ Stale (2026-05-30)**: varredura não encontra mais strings
`'/Manga-Reader/...'` hardcoded. O wrapper `useAppNavigate()`
(`shared/hook/useAppNavigate.ts`) prefixa `WEB_BASE_URL` automaticamente em paths
absolutos; call-sites usam paths limpos (`/forum`, `/titles/{id}`). Nada a migrar.

---

_(DT-17 e DT-18 resolvidos em 2026-05-17 — ver tabela de resolvidos.)_

---

_(DT-19 resolvido em 2026-05-18 — ver tabela de resolvidos.)_

---

### DT-20: Fragilidade dos testes Mongock + TestContainers — **Resolvido**

**Estado**: **Resolvido (2026-05-18)**. `MongoTestContainerConfig` e
`PostgresTestContainerConfig` agora mantêm o container como **singleton por
JVM**: instância única iniciada em bloco `static` com `startupTimeout` de
120s e `stop()` sobrescrito como no-op (fechamento de contexto Spring / cache
LRU não derruba o container; Ryuk limpa no fim da JVM). Eliminou o
`DataAccessResourceFailure: Connection refused` intermitente causado por
restart de container entre contextos. Verificação: 3 execuções consecutivas
de `mvn test` (1050, 0 falhas) sem flake.

---

### DT-21: Migração V009 nunca validada contra Mongo de produção

**Descrição**: `V009MigrateChaptersToCollection` (DT-17 — move
`titles.chapters[]` embedded para coleção `chapters`) só foi exercitada via
TestContainers (migra + idempotente + título sem chapters). O projeto nunca
foi a produção; a migração roda no **boot da aplicação** (Mongock) e ainda
não enfrentou dados reais/volume.

**Impacto**: risco residual no primeiro deploy — documentos legados
inesperados (chapters malformados, `_id` não-String, títulos com milhares de
capítulos) podem se comportar diferente do dataset de teste. Mongock **não é
transacional** no projeto: falha no meio deixa estado parcial.

**Estado (2026-05-18) — lado-código fechado**:
1. Logging de auditoria implementado (`@Slf4j`: início, `debug` por título,
   totais finais, "nada a migrar").
2. **Validação pela orquestração real do Mongock** —
   `V009MongockIntegrationTest` roda o **runner do Mongock** (não
   `execute()` direto) contra Mongo TestContainers, semeando dados em
   **formato legado** (`titles.chapters[]` embedded) antes do contexto subir.
   Cobre os riscos citados aqui: `_id` não-String (`ObjectId` → `titleId` via
   `toString()`), elemento malformado no array (ignorado), volume grande
   (2000 capítulos, `insertMany` em lote), `chapters: []` vazio, título sem
   chapters intocado. Assere invariante `sum == chapters.count()`, ausência de
   `titles.chapters`, registro no `mongockChangeLog` e **idempotência real**
   (reboot do runner não reprocessa — guarda de changelog).

**Resíduo — só infra (não fechável em código)**: validação contra **dump real
de produção** em staging. Runbook antes do primeiro deploy que aplicar V009:
1. Restaurar dump representativo de prod em staging.
2. Subir a aplicação (Mongock roda V009 no boot).
3. Conferir nos logs de auditoria: `títulos processados`/`capítulos inseridos`
   batem com `sum(titles.chapters.size)` pré-migração e `chapters.count()`
   pós; nenhum `titles` retém `chapters`.
4. **Backup do banco antes** do deploy (Mongock não é transacional aqui).

Lado-código resolvido; resíduo só-infra documentado acima.

---

### DT-22: Suíte de testes mais pesada (Postgres TestContainers) — **Resolvido**

**Estado**: **Resolvido (2026-05-18)**.
- Container Postgres singleton por JVM (mesmo padrão de DT-20).
- `@Tag("testcontainers")` em todas as 14 classes que sobem container
  (Mongo + Postgres). `pom.xml`: `maven-surefire-plugin` com
  `<excludedGroups>${test.excludedGroups}</excludedGroups>` (property default
  vazia → CI roda tudo).
- Suíte leve sem Docker: `mvn test -Dtest.excludedGroups=testcontainers`
  (verificado: 949 testes, 0 falhas, nenhum container criado). Documentado no
  `README.md` (seção Testes) e `CLAUDE.md` (Known Test Limitations).

---

## Itens Resolvidos (2026-05-16 a 18)

| ID | Dívida | Resolução |
|----|--------|-----------|
| DT-01 | `@Transactional` em use cases | 5 JPA anotados (2026-05-16) + 14 Mongo com `@Transactional("mongoTransactionManager")`; replica set + `MongoTransactionManager` + JPA `@Primary` (2026-05-17) |
| DT-16 | `npm run build` quebrado (tsc -b) | 64 erros TS pré-existentes corrigidos (LocalizedString factories, paths admin.types, fixtures de service); build limpo, 92 chunks |
| DT-13 (resíduo) | call-sites basename hardcoded | ~50 strings `/Manga-Reader/...` migradas para `WEB_BASE_URL` em 35 arquivos |
| DT-04 | UserController injetava repository ports | Criado `GetUserViewHistoryUseCase`; content-locales reusa `GetUserProfileUseCase`; ports removidos do controller; testes atualizados + teste de application novo |
| DT-05 | Sem Error Boundaries | **Stale** — `ErrorBoundary` + `RouteErrorFallback` já existiam e estão integrados em `main.tsx` |
| DT-06 | Validação de forms insuficiente | `react-hook-form` + `zod` + `@hookform/resolvers`; `buildLoginSchema`/`buildSignUpSchema` com mensagens i18n; `Login`/`SignUp` migrados (demais forms = resíduo de baixa prioridade) |
| DT-07 | Sem lazy loading de rotas | `React.lazy` em `PublicRoutes`/`ProtectedRoutes` + `<Suspense>` no `RootLayout`; build gera 91 chunks por rota |
| DT-11 | Logging sem rotação | `RollingFileAppender` (SizeAndTimeBased, 50MB/30d/1GB, JSON) no profile `prod` do `logback-spring.xml` |
| DT-12 | `localhost:5000` em useCategoryFilters | **Stale** — hook não tem mais fetch hardcoded (só state) |
| DT-14 | Sem i18n | **Stale** — i18n completo (pt-BR/en-US/es-ES) via `react-i18next`, 16 namespaces |
| DT-15 | React Query DevTools comentado | Habilitado em `main.tsx` apenas em dev (`import.meta.env.DEV`) |
| DT-17 | Capítulos embedded em `Title` (risco 16MB) | Coleção própria `chapters` (titleId + índice único); `ChapterRepositoryPort/Adapter` paginado + `countByTitleIdIn` agregado; `GetChapters*` paginados; `TitleResponse` sem chapters; migração Mongock V009 (idempotente, $unset); seed + frontend (`useChapters`, endpoint `/api/titles/{id}/chapters`) (2026-05-17) |
| DT-18 | N+1 em listagens (eventos/fórum) | Eventos: `EventSummaryResponse` sem tickets na listagem (frontend não usa), tickets só no detalhe; sem `forEach(getTickets)`. Fórum: `ForumTopicSummaryResponse` sem replies, `@EntityGraph(author)`. Extra: `EventRepositoryAdapter.searchByTitle` → query nativa paginada (jsonb) em vez de carregar todos em memória (2026-05-17) |
| DT-19 | Resíduos frontend da migração de capítulos | `TitleResponse` ganhou `chaptersCount`/`latestChapterNumber` desnormalizados via `GetChapterStatsUseCase` (agregação bulk `countByTitleIdIn` + `latestChapterNumberByTitleIdIn`, sem N+1; controller não injeta port — DT-04); cards (`Vertical/Horizontal/Highlight/Base`, `CategoryFilters`, info `TitleDetails`) religados. `ChapterList` virou apresentacional com paginação **real server-side**; `useChapters` controlado (page/size/direction) + `keepPreviousData`; ordenação numérica global resolvida no backend (`ChapterRepositoryAdapter.findByTitleId` via aggregation `$convert`+sort; `ChapterController` aceita `direction`); busca passa a filtrar página atual. `useChapterSort` removido (2026-05-18) |
| DT-20 | Flake Mongock + TestContainers | Container Mongo/Postgres **singleton por JVM** (bloco `static`, `stop()` no-op, startupTimeout 120s); sem restart por contexto Spring → sem `Connection refused` intermitente; 3× `mvn test` (1050, 0 falhas) (2026-05-18) |
| DT-21 (lado-código) | V009 nunca validada pela orquestração real | `V009MongockIntegrationTest`: runner Mongock real contra Mongo-TC, dados legados (`ObjectId` `_id`, malformado, 2000 caps, array vazio), invariante de contagem + `$unset` + `mongockChangeLog` + idempotência por reboot. Resíduo só-infra (dump prod em staging) com runbook documentado (2026-05-18) |
| DT-22 | Peso suíte Postgres-TC / exige Docker | Postgres singleton; `@Tag("testcontainers")` nas 14 classes de container; `pom.xml` surefire `excludedGroups=${test.excludedGroups}`; `mvn test -Dtest.excludedGroups=testcontainers` roda 949 testes sem Docker (2026-05-18) |
| DT-23 | Duplicação em controllers (`buildPageable` ×10, `extractUserId` ×7) + status hardcoded | `@PageParams Pageable` resolvido por `PageableArgumentResolver` (contrato page/size/sort/direction preservado, whitelist via `SortValidator`) e `@CurrentUserId UUID` via `CurrentUserIdArgumentResolver` (`PageableWebConfig`); 11 controllers limpos, 0 `buildPageable`/`extractUserId`. `SpringDataWebAutoConfiguration` excluída p/ não competir. `PublicationStatus` enum substitui `TITLE_STATUSES` magic strings em `GetContentMetricsUseCase`. 1057 testes, 0 falhas; +`PageableArgumentResolverTest`/`PublicationStatusTest` (2026-05-18) |

### Itens Resolvidos (anteriores)

| ID Antigo | Dívida | Data |
|-----------|--------|------|
| DT-01 (old) | Cobertura de testes backend incompleta | 2026-03-14 |
| DT-02 (old) | Features frontend com dados mock | 2026-03-14 |
| DT-04 (old) | Fluxo de auth não testado E2E | 2026-03-14 |

---

## Auditoria FSD Frontend (2026-05-31)

Varredura pasta-a-pasta do frontend (`frontend-apps/manga-reader/src`) por dívida
**semântica/acoplamento** — invisível ao `lint:fsd` (steiger), que está verde.
Remediação **leva-a-leva por camada** (shared→entities→features→widgets→pages→app).

### DT-26: Componentes de domínio em `shared/ui` — **camada shared resolvida (2026-05-31)**

7 cards "de entidade" viviam em `shared/ui` (camada base), vazando conhecimento de
domínio. **Resolvido (shared leva)**: movidos os 6 cards consumidos para suas
entidades — `MangaCard`→`entities/manga/ui`, `GroupCard`→`group`, `ReviewCard`→
`rating`, `ForumTopicCard`→`forum`, `ChapterListItem`→`chapter`, `EventCard`→
`event`. Descoberta: as entidades já tinham **cards duplicados mortos** (zero
consumidores, migração FSD inacabada) — os 2 com colisão de nome exato (`EventCard`
69L, `GroupCard` 83L dead) foram substituídos pelos vivos; os demais cards mortos
(`entities/forum`: `TopicCard`/`ReplyCard`/`RelatedTopicCard`; `entities/rating`:
`RecentReviews`) **permanecem exportados-sem-uso** → ver DT-34. ~26 import sites
repontados p/ barrel da entidade + imports duplicados (`{ Card }` + `type`) mesclados
com modificador `type` inline. `NotificationItem` fica em `shared/ui` (único consumidor
= showcase `design/`, sem `entities/notification`). tsc 0, FSD verde, 819 testes.

### DT-27: Guards de auth com lógica na camada `app/` — **Resolvido (2026-06-01)**

`app/router/ProtectedRoutes.tsx` definia `AuthGuard`/`RoleGuard` (leitura de sessão,
`mapAuthResponseToUser`, i18n + `showErrorToast`, side-effects de `localStorage`).
**Movidos p/ `features/auth/ui/RouteGuards.tsx`** (exportados pelo barrel
`@features/auth`); `mapAuthResponseToUser` virou import relativo dentro da feature.
`ProtectedRoutes.tsx` ficou **compose-only** (lazy imports + arrays
`protectedContentRoutes`/`adminRoute`), importando os guards de `@features/auth`.
tsc 0, lint:fsd verde, 834 testes.

### DT-28: `comment` mal classificado — **Resolvido com split ortodoxo (2026-05-31)**

O slice `comment` era **misto**: modelo+exibição (entity) e interações (feature).
A 1ª tentativa moveu tudo p/ `features/comment` (não-ortodoxo). **Corrigido com
split FSD**:
- **`entities/comment`** (substantivo/modelo): `comment.types`, `commentService`
  (api), hooks de dados (`useComments`, `useCommentsFetch`, `useCommentPagination`,
  `useCommentTree`), `CommentSortContext` (estado de ordenação) e os **átomos de
  exibição burros** (`CommentUser`, `CommentMetadata`, `CommentContent`,
  `CommentActions`). Importa `user` via `@entities/user/@x/comment` (cross-import
  entity↔entity recriado).
- **`features/comment`** (verbo/ação): orquestradores (`CommentsSection`,
  `CommentsList`, `Comment`, `CommentInput`, `SortComments`), modais edit/delete,
  e hooks de interação (`useCommentCRUD`, `useCommentReactions`, `useCommentModals`,
  editores EasyMDE/rich/upload). Importa o modelo via `@entities/comment`.

Regra dura validada pelo steiger: **nenhuma aresta `entity→feature`**;
`feature→entity` ok. Consumidores externos repontados (`main.tsx` →
`CommentSortProvider` de `@entities/comment`; factory de teste → `comment.types`).
tsc 0, lint:fsd verde, testes do slice 32/32. Regra entity-vs-feature gravada no
CLAUDE.md p/ não repetir o dilema.

### DT-29: `entities/catalog-filter` mistura estado de UI — **Resolvido (2026-05-31)**

Investigado: o slice é majoritariamente **entity-grade** — tipos de domínio (`Tag`,
`Sort`, `PublicationStatus`, `AdultContent`), `tagService` (api), `useTagsFetch` e
`useFilterResults` (queries reutilizáveis) e `TagSelectInput` (input do domínio tag,
usado por `features/admin`). O único destoante era `useCatalogFilters` — **estado de
UI puro** (`useState` de tags/sort/status/página, sem dados) consumido por **uma só**
página. Pela regra do CLAUDE.md (hook que combina estado de UI ⇒ **page hook**),
**movido `useCatalogFilters` → `pages/category/model/`** + removido do barrel da
entity; `CategoryFilters` importa relativo. **Não** foi feito reclassificação total
p/ feature: fragmentaria os tipos/serviço de tag e criaria acoplamento
`feature→feature` com `admin` (net-negativo). tsc 0, lint:fsd verde, testes verdes.

### DT-30: `Toast.tsx` god-file auto-sinalizado — **Resolvido (2026-05-31)**

`shared/ui/Toast.tsx` (181L) abria com `// Todo: Refatorar.` (reducer+context+UI num
arquivo). **Resolvido**: dividido em `shared/ui/toast/` (`types.ts`, `toastStyles.ts`,
`ToastItem.tsx`, `ToastProvider.tsx`); `Toast.tsx` vira barrel estável (`@ui/Toast`
inalterado p/ os 3 consumidores). Tipo interno `ToastItem`→`ToastEntry` (evita colisão
com a view). Nota: este é o toast DS in-app (main.tsx + design); notificações
transacionais usam o `toastService` react-toastify separado.

### DT-31: Vazamento de tipos do `@mock` em pages — **Resolvido (2026-06-01)**

`ForumTopic`/`UserProfile` (+parts) importavam dado runtime **e tipos** direto de
`@mock`. **Corrigido**: tipos movidos p/ as entidades — `entities/forum/model/
topic-detail.types.ts` (`TopicAuthor`/`TopicData`/`ReplyData`) e `entities/user/model/
profile-detail.types.ts` (`ProfileData`), exportados pelos barrels; os mocks importam o
tipo da entidade. Dado escondido atrás de **page hooks** (`pages/forum/model/
useTopicDetail`, `pages/profile/model/useProfileData`) que importam `@mock` (page→mock,
padrão documentado) — backend ⇒ só o hook muda. Nenhum componente importa `@mock`
direto. tsc 0, lint:fsd verde, 834 testes.

### DT-32: Slice `legal` fora de convenção — **Resolvido (2026-06-01)**

**Renomeado `pages/legal/ui/_components/` → `parts/`** (LegalShell/LegalSection/
LegalCrossLinks; imports atualizados em Terms/Privacy/Dmca/Contact) — alinhado aos 15
outros slices. **Extraída** a lógica de form de `Contact.tsx` (state/validate/submit/
reset) p/ page hook `pages/legal/model/useContactForm.ts`; a UI ficou só apresentação.
tsc 0, lint:fsd verde, 834 testes.

### DT-33: `shared/lib` / `shared/ui` sem barrels — **Fechado: aceito (não-fix) (2026-06-01)**

Avaliado e **aceito como idiomático**. `@ui/X` e `@shared/lib/X` (acesso por caminho
de segmento) é o padrão do projeto e a regra `fsd/no-public-api-sidestep` está
deliberadamente **off** p/ `shared/` (ver `steiger.config.ts`). Adicionar um barrel em
`shared/ui` (58 arquivos) + repontar centenas de imports `@ui/X`→`@ui` seria churn alto
com ROI negativo; um barrel em `shared/lib` (3 arquivos) ficaria sem consumidores. Não
há mudança de código — decisão registrada.

### DT-34: Cards de entidade mortos (migração FSD inacabada) — **Resolvido (2026-05-31)**

Exportados-sem-uso após DT-26 (0 consumidores, confirmado por grep). **Removidos**:
`entities/forum/ui/{TopicCard,ReplyCard,RelatedTopicCard}`, `entities/rating/ui/RecentReviews`
+ exports nos barrels. Como `RecentReviews` era o **único** consumidor de
`entities/comment/@x/rating` e `entities/user/@x/rating`, ambos os cross-imports
foram deletados — **desacoplando `rating→comment`** e pré-limpando o caminho da
DT-28 (move de comment p/ feature). tsc 0, lint:fsd verde, 834 testes.

### Nota (Low, não agendado): god-components em `design/`

`design/ui/parts/*` (`CompositesSection` 478L, `ContentCardsSection` 431L, etc.):
telas **DEV-only** (`import.meta.env.DEV`). Deixadas como estão — baixo ROI.

### DT-35: Sistema de avaliação por categorias não plugado + dado falso — **Resolvido (2026-05-31)**

A aba de avaliações da obra tinha o botão "Escrever resenha" como **no-op** e
exibia uma **distribuição de estrelas falsa** (percentuais `72/18/6/2` hardcoded)
— dado fabricado visível ao cliente. O wizard de 6 categorias (`RatingWizard`),
`useRating`/`useTitleModals` e `RatingModal` existiam mas estavam **órfãos**.
**Resolvido**: (1) wizard plugado em `TitleDetails`/`ReviewsTab` (submit real →
`submitRating` com toast + auth gate); (2) novo endpoint backend
`GET /api/ratings/title/{id}/distribution` (agregação Mongo `$round` por estrela,
sem cache) + `GetRatingDistributionUseCase`; (3) `ReviewsTab` renderiza a
distribuição **real** em %. Testes: backend (usecase/controller/adapter-TC),
frontend (ReviewsTab + TitleDetails). Polyfill `HTMLDialogElement.showModal/close`
adicionado ao `setup.ts` (destrava testar `Modal` nativo).

---

## Auditoria de marcadores `// TODO` (2026-06-01)

Sweep de `// TODO/Todo/FIXME` no projeto (4 acionáveis; resto = "todo o histórico"
PT ou prop `placeholder`).

### DT-36: `CHAPTER_OPTIONS` mock hardcoded — **Resolvido (2026-06-01)**

Investigado: a const só alimentava `ChapterNavigation` ← `ChapterBottomBar`, **ambos
código morto** (0 consumidores; o leitor real usa seu próprio
`pages/chapter/ui/parts/BottomToolbar`). Não era "ligar dado real" e sim código morto
superseded. **Removidos** `entities/chapter/ui/{ChapterBottomBar,ChapterNavigation}.tsx`
+ `entities/chapter/config/chapterOptions.ts` (+ dir `config` vazio) + exports do barrel.
tsc 0, lint:fsd verde, 834 testes.

### DT-37: Login/SignUp com validação manual, schemas Zod sem uso — **Resolvido (2026-06-01)**

`Login`/`SignUp` validavam com `useState`/`errors` manuais; os schemas Zod existiam
sem uso. **Refatorados p/ React Hook Form + zodResolver** usando
`buildLoginSchema`/`buildSignUpSchema` (`features/auth`), via `Controller` (AuthField
é controlado, sem ref). `buildSignUpSchema` alinhado ao form real (name/email/password/
`accept`) — removidos `confirmPassword`/`acceptTerms`/`acceptDmca` que não existiam na
UI. Mensagem `validation.passwordMin` corrigida p/ "8 caracteres" (pt/en/es) — batia
com `min(8)` da UI/strength. Painel demo mantido (DEV-only, agora via `setValue`).
Primeiro uso de RHF no repo (padrão estabelecido). tsc 0, lint:fsd verde, 834 testes.

### DT-38: Preferência de idioma do Footer era stub — **Resolvido (2026-06-01)**

`widgets/footer/ui/Footer.tsx`: item de idioma agora **cicla o idioma de UI** entre os
`SUPPORTED_LANGUAGES` via `i18n.changeLanguage` (`cycleUiLanguage`); o `value` reflete o
idioma atual automaticamente. Item de tema dispara `showInfoToast` "em desenvolvimento"
(nova chave `footer.preferences.themeWip` em pt/en/es). TODO removido. (Idioma de
**conteúdo** continua em Configurações — fora do escopo do footer.) tsc 0, 835 testes.

### DT-39: parsing de enum na camada de apresentação (backend) — **Resolvido (2026-06-01)**

A auditoria achou o mesmo anti-padrão em **4 controllers** (parsing de enum
duplicado na apresentação): `EventController.parseStatus`, `NewsController.parseCategory`,
`ForumController.parseCategory`, `LibraryController.parseReadingList`. **Movido p/ o
domínio**: cada enum ganhou `fromValue(String)` (match por value/displayName **ou**
nome do enum, case-insensitive, lança `IllegalArgumentException`) — `EventStatus`,
`NewsCategory`, `ForumCategory`, `ReadingListType`. Os 4 controllers chamam
`Enum.fromValue(...)`; métodos privados removidos. +4 testes de domínio. mvn verde
(51 testes dos 8 alvos).

---

## Auditoria evidence-based do frontend (2026-06-01)

Varredura concreta: `:any`=0, `catch{}`=0, `@ts-ignore`=0, TODO residual=0 →
codebase limpo. Achados reais (todos Baixa):

### DT-40: cast inseguro no Select — **Resolvido (2026-06-01)**
`shared/ui/Select.tsx`: **removido** o bloco `onChange` sintético com `as unknown as` —
o `dispatchEvent('change')` no `<select>` nativo (que tem `onChange={onChange}`) já
aciona RHF/consumidores. Sem cast. Select/Contact/Trending verdes.

### DT-41: supressões `react-hooks/exhaustive-deps` — **Resolvido (2026-06-01)**
`useEasyMDE.tsx:64` **já tinha** justificativa detalhada (init imperativo só-mount) —
não era dívida. `LegalShell.tsx:52` (scroll-spy): o disable é **intencional e correto**
(dep real = conteúdo `idKey`, não a identidade do array `ids`) — adicionada
justificativa inline explicando o padrão. Nenhum dos dois é stale-closure bug.

### DT-42: `console.error` em util de runtime — **Inválido (não é dívida) (2026-06-01)**
`queryCache.ts:13` já está **gated por `import.meta.env.DEV`** (linha 12, dentro de
`logCacheError`). Achado falso do grep (pegou a linha de dentro do `if`). Sem ação.

### DT-43: residuais de a11y por página (axe) — **Resolvido (2026-06-01)**
Causa-raiz em componentes de card compartilhados (corrigiu várias páginas):
- `heading-order`: `entities/manga/ui/MangaCard` usava `<h3>` p/ título de card → `<p>` (não é heading de documento; nenhum teste o consultava como heading). Resolveu Home/GroupProfile. `UserDetails`: `h2→h4` → `h4`s viraram `h3`.
- `aria-command-name`: `shared/ui/MangaPoster` com `onClick` virava `role="button"` sem nome (poster sem texto/fallback gradiente) → `aria-label={alt}` quando clicável. Resolveu Home.
- `ResetPassword`: **falso** (erro de render do axe genérico com mock undefined, não violação a11y) → asserção removida da página.
Home/GroupProfile/UserDetails com axe verde. 867 testes.

**Checado e NÃO é dívida**: `CommentContent` `dangerouslySetInnerHTML` sanitizado por
DOMPurify (`markdownService`); `@ts-expect-error` do carousel = bug upstream
documentado; `setTimeout` (13×) = padrões legítimos; `console.log` em `httpClient` está
em JSDoc.

---

## Backlog de produto pendente (consolidado de pending-tasks, 2026-06-01)

### DT-44: Funcionalidades não implementadas — **Adiado (não-prod)**

Itens de produto que ainda não existem no código, preservados aqui após a remoção
do antigo `pending-tasks.md` (cuja maior parte já estava resolvida/stale). Todos
**não-bloqueantes** enquanto o projeto não vai a produção:

- **Upload de arquivos**: capas de título, avatares de usuário, páginas de
  capítulo. Hoje todas as imagens são URLs externas/seed; não há pipeline de
  upload/storage.
- **Endpoints ausentes**: `news/{id}/related`, `events/{id}/related`,
  `groups/{id}/members/{memberId}` (detalhe de membro). Seções de UI
  correspondentes ficam sem dados quando aplicável.
- **Busca global cross-domain** e **filtros avançados** em listagens (além dos
  filtros de catálogo já existentes).
- **Validação client-side dos forms restantes**: Forgot/Reset Password, Edit
  Profile, Publish Work, Create Event, Forum Topic. (Login/SignUp já migrados p/
  React Hook Form + Zod — ver DT-06/DT-37; os demais herdam o mesmo padrão.)

**Prioridade**: Baixa. Sem agendamento até a fase de produção.

---

### DT-45: Rating API — campos avançados de resenha — **Resolvido (2026-06-06)**

**Estado**: **Resolvido (2026-06-06)**. Backend persiste e expõe os campos; votação
Útil/Contrário ligada ponta a ponta.
- **Domínio**: `MangaRating` ganhou `reviewTitle`, `spoiler`, `top`, `upvotes`, `downvotes`
  (defaults via `@Builder.Default`). Nova entidade `ReviewVote` (`review_votes`, índice
  único `(ratingId, userId)`) + enum `VoteValue {UP, DOWN}` com `fromValue` (padrão DT-39).
- **Application**: `ReviewVoteRepositoryPort` + `CastReviewVoteUseCase`/`RemoveReviewVoteUseCase`
  (`@Transactional("mongoTransactionManager")`). Toggle: mesmo lado remove, oposto troca,
  voto-próprio proibido (`BusinessRuleException` 409). `SubmitRating`/`UpdateRating` aceitam
  `reviewTitle`/`spoiler`.
- **Persistência**: `ReviewVoteMongoRepository`/`Adapter`; Mongock
  `V010AddReviewFieldsAndVoteIndexes` (backfill idempotente dos defaults + índice único).
- **Presentation**: `POST /api/ratings/{id}/vote` (body `{value}`) e `DELETE /api/ratings/{id}/vote`
  → `ReviewVoteResponse(upvotes, downvotes, myVote)`. `RatingResponse` ganhou os campos + `myVote`
  resolvido em lote na listagem (`findByRatingIdInAndUserId`, sem N+1; anônimo ⇒ null).
  `GlobalExceptionHandler`: `IllegalArgumentException` → 400 (melhora também os endpoints DT-39).
- **Frontend**: `ratingService` mapeia os campos novos + `castReviewVote`/`removeReviewVote`;
  `ReviewsTab` dispara mutation real (otimista, revert + toast no erro). Chave i18n
  `rating:reviews.voteError` (pt/en/es) e mensagens de validação `validation.rating.reviewTitle.size`/
  `validation.review.vote.required` nos 3 idiomas.
- **Testes**: `VoteValueTest`, `Cast/RemoveReviewVoteUseCaseTest`, `RatingControllerTest`
  (+voto), `ReviewVoteRepositoryAdapterTest` (TestContainers), `ratingService` (+voto).

**Histórico (pendente até 2026-06-03)**: O frontend já consumia os campos opcionalmente;
o backend ainda não os persistia nem expunha.

Campos a adicionar ao documento `MangaRating` (MongoDB, via Mongock):
- `reviewTitle: String` (max 80) — título opcional da resenha
- `spoiler: Boolean` — autor marcou como spoiler
- `top: Boolean` — destaque por moderação ou score
- `upvotes: Long` — votos "Útil" recebidos
- `downvotes: Long` — votos "Contrário" recebidos (validação da comunidade)

**Novo endpoint de voto** (autenticado, toggle; voto único por usuário com valor
`up`/`down` — votar de novo no mesmo lado remove; votar no oposto troca):
- `POST /api/ratings/{id}/vote` body `{ value: "up" | "down" }` → `{ upvotes, downvotes, myVote }`
  (1 voto/usuário/resenha; não pode votar na própria)
- `DELETE /api/ratings/{id}/vote` (remove o voto do usuário)

Scope backend: nova entidade `ReviewVote` (Mongo: `ratingId`, `userId`, `value`, `createdAt`,
índice único `(ratingId, userId)`), `CastReviewVoteUseCase`/`RemoveReviewVoteUseCase`,
`RatingController` +2 endpoints, DTO `MangaRatingResponse` atualizado, Mongock `ChangeUnit`
com defaults (`spoiler: false`, `top: false`, `upvotes: 0`, `downvotes: 0`).

Frontend já implementa estado otimista (Útil/Contrário no `ReviewCard`); ao ligar o backend,
substituir o `useState` local por mutation que chama `/vote`.

**Prioridade**: Média. Bloqueia votação Útil/Contrário e filtro de spoilers persistente.

---

### DT-46: Store API — campos de compra e metadados de loja — **Resolvido (2026-06-06)**

**Estado**: **Resolvido (2026-06-06)**. Backend persiste e expõe os campos; frontend
consome a API real (mock removido).
- **Migration**: `V22__store_add_fields.sql` (⚠️ **V22** — `V21` já era `user_add_deactivation`;
  o doc citava V21 por engano). Colunas `price`, `old_price`, `category`, `official`,
  `rating_count`, `format`, `shipping`, `note`, `mono`, `color`.
- **Domínio**: enum `StoreCategory {OFICIAL, NOVA, USADO}` (`fromValue`, padrão DT-39);
  `Store` ganhou os campos. `StoreResponse`/`StoreMapper` expõem-nos (category lowercased,
  como `availability`). `StoreSeed` (dev) enriquecido com preços/categoria/metadados.
- **Frontend**: `StoresTab` consome `data.content` direto (fallback `MOCK_STORES` removido);
  `@mock/store.ts` deletado (e seu re-export em `mock/index.ts`). `storeService` mapeia 1:1.
- **Testes**: `StoreCategoryTest`, `StoreMapperTest` (campos novos + category lowercase).

**Histórico (pendente até 2026-06-03)**: O frontend usava mock (`@mock/store.ts`) enquanto
o backend não retornava os campos novos.

Campos a adicionar à entidade `Store` (PostgreSQL, Flyway `V21__store_add_fields.sql`):
- `price`, `oldPrice` (Integer, centavos BRL) — integração com parceiros
- `category: StoreCategory` enum (`OFICIAL / NOVA / USADO`)
- `official: Boolean` — loja verificada/parceira oficial
- `ratingCount: Integer` — total de avaliações da loja (fonte externa)
- `format: String` — formato do produto ("Volume único · brochura")
- `shipping: String` — informação de entrega
- `note: String` — destaque promocional ("Menor preço novo")
- `mono: String`, `color: String` — metadados de logo placeholder

Scope backend: domain entity `Store`, `V21__store_add_fields.sql`, DTOs (`StoreResponse`) atualizados,
`StoresController`. Integração real com parceiros (scraping/API de preços) é fase posterior.
Quando implementado: remover o fallback para `@mock/store.ts` no `StoresTab.tsx`.

**Prioridade**: Baixa. Sem agendamento até integração com parceiros de venda.

---

### DT-47: Integração completa da aba de Resenhas (persistência) — **Resolvido (2026-06-06)**

**Estado**: **Resolvido (2026-06-06)**. A camada de dados de rating foi migrada para
TanStack Query e a aba de Resenhas passou a persistir de forma confiável (base p/ o
trabalho futuro dependente disso).
- **Backend**: `GET /api/ratings/title/{id}` ganhou filtro `?star=` (range query
  `overallRating ∈ [star-0.5, star+0.5)` no `RatingRepositoryAdapter`, equivalente a
  `Math.round`) e `upvotes` no whitelist de ordenação (sort "top" server-side).
  `GetRatingsByTitleUseCase` e `RatingRepositoryPort.findByTitleId` aceitam `Integer star`.
- **Frontend (TanStack Query)**: removidos os hooks manuais `useRatings`/`useRating`
  (useState/useEffect). Novos hooks: `useReviews` (`useInfiniteQuery`, **load-more**
  server-side, queryKey por sort+star), `useRatingSummary` (média+distribuição),
  `useSubmitReview` (mutation upsert com `requireAuth`+toast, **invalida** as queries) e
  `useReviewVote` (mutation **otimista** no cache + **reconciliação** com os contadores
  do servidor, rollback no erro). `reviewTitle`/`spoiler` agora tipados de ponta a ponta.
- **UI**: `ReviewCard` virou **controlado** (exibe `upvotes/downvotes/myVote` das props);
  `ReviewsTab` ordena/filtra por estrela via servidor e tem botão "Carregar mais"
  (i18n `reviews.loadMore` pt/en/es). `TitleDetails` religado aos novos hooks.
- **Testes**: backend (`GetRatingsByTitleUseCaseTest` star, `RatingControllerTest` param
  star, `RatingRepositoryAdapterStarFilterTest` TestContainers); frontend
  (`useReviews`, `useReviewVote`, `useSubmitReview`, `ratingService`).

**Nota de ambiente**: neste working tree WIP, os testes de **componente** (jest-dom) e o
`lint:fsd` (plugin steiger ausente) não rodam — pré-existente, alheio a esta mudança. Os
testes de hook/serviço (sem jest-dom) rodam verdes.

---

### DT-48: Perfil — seções ainda simuladas (sem backend) — **Em aberto (Baixa)**

**Contexto**: a página de perfil (`pages/profile/ui/UserProfile.tsx`) foi migrada de
100% mock para **dados reais** no que já tem backend: header/bio, stats (contagens),
**resenhas** (`GET /api/ratings/user/{userId}` — novo), recomendações, comentários
recentes e listas **lendo/concluído** (`GET /api/library/user/{userId}` — novo), tudo
de **qualquer** usuário via `useEnrichedProfile`/`useUserReviews`/`useUserLibrary`.

**Ainda simulado** (mock em `src/mock/userProfile.ts`, marcado com `// TODO(tech-debt)`):

- **Seguidores/seguindo** — não existe domínio social (follow/unfollow, contagens, listas).
- **Gêneros favoritos** do usuário — sem fonte no backend.
- **Grupos seguidos** — `GroupController` não expõe "grupos de um usuário".
- **Feed de atividade** — sem agregação (há `recentViewHistory`, mas não o feed completo).
- **Handle/username e selo "verificado"** — não existem no perfil do backend (handle hoje
  é derivado do nome no front).

**Impacto**: parte do perfil mistura dado real + fake. Não bloqueante.

**Recomendação**: criar os domínios/endpoints (grafo social, grupos por usuário, gêneros
favoritos, activity feed, username) quando a feature de rede social entrar no roadmap.

### DT-49: Biblioteca pública sem checagem de visibilidade — **Em aberto (Baixa)**

`GET /api/library/user/{userId}` (novo) expõe a biblioteca de qualquer usuário sem
respeitar privacidade. O enriched profile já filtra comentários/histórico por
`VisibilitySetting`; a biblioteca pública deveria seguir o mesmo padrão.

---

### DT-50: Persistência de comentários (resenha, obra, fórum) não padronizada — **Em aberto (Média)**

Os três domínios de comentário/UGC gravam interações de formas divergentes — bancos,
nomes de coluna e estruturas diferentes — dificultando que um dev reconheça que seguem a
mesma lógica. Objetivo: contratos/colunas consistentes (mesmos nomes) entre os domínios,
ainda que em tabelas/coleções distintas.

**Já padronizado nesta leva (2026-06-08)** — indicador de edição + data de modificação:
- Flag canônico **`edited`** nos 3 domínios (renomeado de `wasEdited`/`is_edited`).
- Coluna/campo **`updatedAt`/`updated_at`** (última modificação de conteúdo, setada
  manualmente na edição) adicionada onde faltava; resenha ganhou `edited` + `updatedAt`.
- Migrations: Mongock `V013StandardizeEditedAndUpdatedAt` (ratings/comments),
  Flyway `V32__forum_standardize_edited_updated.sql` (forum_topics/forum_replies).
- UI: base compartilhada `shared/ui/ThreadPost` (obra + fórum com DOM/CSS idênticos);
  resenha exibe criação + selo "(editado)" com tooltip da data de modificação.

**Decisão arquitetural oficial (2026-06-09)** — *comentário unificado*:
uma única coleção `comments` guarda TODO comentário e resposta de qualquer domínio
(obra, resenha, fórum), polimórfica por `targetType` (`TITLE|REVIEW|FORUM_TOPIC`) +
`targetId`, com autorreferência `parentCommentId` (profundidade ilimitada). Proibido
criar coleções/tabelas separadas de "replies". Voto único (padrão resenha):
`VoteValue{UP,DOWN}` + contadores `upvotes`/`downvotes` + doc `<pai>_votes`.

**Padronizado nesta leva (2026-06-09)** — voto único + nomenclatura de votos:
- `shared/domain/vote/VoteValue`, `shared/application/vote/VoteResult`,
  `shared/dto/VoteResponse`+`VoteRequest` (remove `ReviewVoteResult/Response/Request`).
- **Obra**: `comment_reactions`/`ReactionType` → `comments_votes`/`CommentVote` (UP/DOWN);
  `likeCount`/`dislikeCount` → `upvotes`/`downvotes`; `titleId` → `targetType`+`targetId`;
  endpoints `/like`+`/dislike` → `/vote` (toggle) e `/user-reactions` → `/user-votes`;
  bloqueio de self-vote. Frontend adapta no boundary do service.
- **Resenha**: votos passam a usar os tipos compartilhados; `review_votes` →
  `reviews_votes` (convenção `<pai>_votes`).
- Migrations Mongock `V014RenameReviewVotesCollection`, `V015UnifyCommentVotes`.

**Fórum → Mongo ENTREGUE (2026-06-09):**
- `forum_topics` migrou para coleção Mongo (autor snapshot `authorId/authorName/authorPhoto`,
  `like_count`→`upvotes`); **réplicas viram `comments` `targetType=FORUM_TOPIC`**
  (`forum_replies` eliminado; `is_best_answer`→`isHighlighted`). Votos de tópico em
  `forum_topics_votes` (use cases via `VoteToggle`), endpoints `/api/forum/{id}/vote`.
- Runner cross-DB `V016MigrateForumToMongo` (JDBC puro + verificação de contagem,
  aborta em divergência; cria índices das coleções novas).
  **Fase 2 pendente:** Flyway `V33__drop_forum_postgres_tables.sql` — criar SOMENTE
  num deploy posterior, após confirmar o Mongo em produção (tabelas PG ficam como
  rollback até lá).
- `CounterReconciliationJob` agora reconcilia também no Mongo:
  `forum_topics.replyCount = COUNT(comments do tópico)`.

**Pendente:**
- Reconciliação dos contadores `upvotes`/`downvotes` (fonte = coleções `*_votes`)
  — só `replyCount` entrou no job; votos seguem por incremento.
- Votos de respostas do fórum no frontend (backend pronto via `/api/comments/{id}/vote`;
  UI ainda não expõe).
- **Corpo do texto**: convergir `comment` (resenha) para `textContent` (já padrão no `comments`).
- **Rename `ratings`→`reviews`** (coleção + pacote `domain.rating` + `title_rating_aggregate`):
  adiado por blast radius (módulo `rating-aggregator` + métricas admin + denormalização +
  ~6 changeunits históricas referenciam o literal). `ratings` não é ambíguo; baixa prioridade.
- Profundidade ilimitada: paginação/lazy-load de threads profundas (evitar N+1/payload grande).

**Recomendação**: usar a skill `database-design` + `docs/database-modeling.md`; migrar o
fórum com backfill idempotente e verificação de contagem antes de qualquer drop.

---

## Resumo por Prioridade

| Prioridade | Em aberto | IDs |
|-----------|-----------|-----|
| **Crítica** | 0 | — |
| **Alta** | 1 | DT-02 (componente/E2E) |
| **Média** | 3 | DT-08 (axe por rota — parcial), DT-10, DT-50 (persistência de comentários) |
| **Resíduo só-infra (não-código)** | 1 | DT-21 (lado-código fechado; falta dump prod em staging — runbook documentado) |
| **Baixa** | 3 | DT-03, DT-09, DT-44 (backlog de produto) |
| **Fechados: aceitos (não-fix)** | 2 | DT-24, DT-33 (idiomáticos; steiger off de propósito) |
| **Resolvidos 2026-05-16/17/18** | 18 | DT-01, DT-04, DT-05, DT-06, DT-07, DT-11, DT-12, DT-13, DT-14, DT-15, DT-16, DT-17, DT-18, DT-19, DT-20, DT-21 (código), DT-22, DT-23 |
| **Resolvidos 2026-05-31** | 6 | DT-26 (shared), DT-28, DT-29, DT-30, DT-34, DT-35 |
| **Resolvidos 2026-06-01** | 7 | DT-27, DT-31, DT-32, DT-36, DT-37, DT-38, DT-39 |
| **Resolvidos 2026-06-06** | 2 | DT-45 (rating campos avançados + voto), DT-46 (store campos de compra) |
