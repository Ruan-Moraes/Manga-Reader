# Manga Reader — Dívidas Técnicas

> Última atualização: 18 de maio de 2026

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
roda **333 testes em 48 arquivos, 0 falhas** (`npx vitest run`). Os 8 falhando
descritos em 2026-03 não existem mais.

**Adiado (não-prod)**: ainda **não há testes de componente nem E2E**
(CommentsSection, Library, UserProfile, SearchResults sem cobertura; sem
Playwright). Não-bloqueante enquanto não vai a produção.

---

### DT-03: Sem pipeline CI/CD — **Adiado (não-prod)**

Nenhum workflow de CI/CD. **Decisão 2026-05-16**: não implementar pipelines
enquanto o projeto não for a produção. Quando for: GitHub Actions
lint → test → build (ver `deployment-plan.md`).

---

### DT-08: Acessibilidade incompleta (a11y) — **Adiado (não-prod)**

Acessibilidade parcial (alguns `aria-label`, `role`, HTML semântico). Faltam
labels em botões icon-only, landmarks consistentes e testes de a11y. Auditoria
completa adiada como não-bloqueante.

---

### DT-09: Conteúdo placeholder em páginas legais — **Adiado (não-prod)**

Termos de Uso / DMCA / About com placeholder. Texto legal vinculante exige
revisão jurídica — fora do escopo de código. Bloqueia produção; não-bloqueante
para desenvolvimento.

---

### DT-10: Refs cross-database sem job de limpeza — **Adiado (não-prod)**

Refs cross-DB (`user_libraries.title_id`, `group_works.title_id`,
`store_titles.title_id`) **já estão documentadas** via Javadoc nas entidades
`SavedManga`, `GroupWork`, `StoreTitle`. O **job de limpeza de órfãos** é
infraestrutura grande — adiado como não-bloqueante.

---

### DT-24: Migração FSD frontend incompleta

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

**Pendente — deferido com rationale** (desligado no `steiger.config.ts`):
- `public-api`/`no-public-api-sidestep` em `shared/`: imports por caminho de segmento são idiomáticos.
- `fsd/inconsistent-naming` off: falso-positivo em `news` (substantivo, não plural).
- `Pagination`: 2 componentes distintos (não dup real) — unificar exige decisão de UX (escolhido `@ui/Pagination`, execução pendente).

**Prioridade**: Baixa (FSD essencialmente completo: layers + segmentos + @x, tsc 0, suite verde, lint verde full).

---

### DT-25: Auditoria frontend — FSD / SRP / dead-code (mapeamento 2026-05-30)

Varredura manual+heurística de `frontend-apps/manga-reader/src` (~720 arquivos). **Só documentação — nada corrigido aqui.** Escopo: violações FSD além do que o steiger pega (verde), responsabilidade excessiva, código morto/obsoleto.

#### 25.1 — Código morto / obsoleto
- ✅ **Feito**: `entities/comment/model/useCommentEditor.tsx` removido (0 consumidores; substituído por `useCommentRichEditor`).
- **Mock data em runtime**: `pages/forum/ui/parts/forumTopicMock.ts` (usado por ForumTopic/TopicHeader/TopicReplies) e `pages/profile/ui/parts/userProfileMock.ts` (UserProfile/Header). **Em uso** — telas ainda não migradas p/ API real. Migrar + remover mock.
- ✅ **Feito**: slice `pages/term/` removido (eram stubs `<Navigate>`). As rotas legadas
  `/terms-of-use` e `/dmca` agora redirecionam inline no router (`<Navigate to="/legal/...">`).
  Comportamento preservado, slice redundante eliminado.
- 3 `TODO/FIXME` espalhados (baixo).

#### 25.2 — FSD: pureza de segmento (hooks fora de `model/`) — ✅ Feito
Movidos de `ui/` p/ `model/` do slice: `useChapterReader` (pages/chapter), `useEvents`
(pages/event), `useComposerFormState` (pages/forum, +removida pasta `hook/`),
`useSidebarMenuItems` + `useMenuData` (widgets/header, +removida `hooks/`), `useNavSearch`
(widgets/header). tsc 0, lint verde, suite verde.

#### 25.3 — Responsabilidade excessiva (god files, LOC)
- **`pages/design/ui/DesignPrimitives.tsx` — 1516 LOC** (showcase do design-system). Quebrar por seção em `parts/`.
- `shared/ui/Footer.tsx` (353) · `features/admin/model/admin.types.ts` (327 — split por subdomínio) · `entities/comment/model/internal/useCommentRichEditor.tsx` (285) · `features/admin/ui/AdminEventForm.tsx` (242) · `entities/rating/ui/modal/wizard/RatingWizard.tsx` (239) · `pages/category/ui/CategoryFilters.tsx` (216) · `widgets/header/ui/navbar/NavBar.tsx` (212).
- Páginas legais (`Contact` 340, `Privacy` 290, `Dmca` 253) — texto jurídico placeholder inline; mover conteúdo p/ i18n/dados (ver DT-09).

#### 25.4 — Duplicação / nomes colididos (triar)
- **`Pagination`** — 2 componentes distintos (`@ui` text vs `navigation/` icon). Unificar = UX (escolhido `@ui/Pagination`).
- **Não-dups (composição/contexto, só confunde por nome)**: `Footer`/`NavBar`/`SideMenu`/`MobileTabBar` — a versão widget **compõe** o kit `@ui` (ok); `AboutTab` (title vs settings), `TitleDetails` (page vs entity), `CommentsSection` (comment vs user/profile), `Logo` (main vs admin) — contextos diferentes. Considerar renomear p/ clareza.

#### 25.5 — Já aceito / deferido (não re-auditar)
- `shared` public-api/sidestep (idiomático); `inconsistent-naming` off (`news`); 3 desvios same-layer (layout shells, design showcase) com exceção file-scoped.

**Prioridade**: Baixa-Média. Quick wins: 25.1 (dead code) + 25.2 (mover hooks). Maior: 25.3 (DesignPrimitives).

---

### DT-13 (resíduo): call-sites com basename hardcoded

**Estado**: **Resolvido na fonte (2026-05-16)** — o basename agora é
parametrizado por `VITE_BASE_URL` (`src/shared/constant/WEB_BASE_URL.ts`,
`vite.config.ts` via `loadEnv`, `.env`/`.env.example`). `main.tsx`,
`ProtectedRoutes`, `Login`, `SignUp`, `AdminSidebar` e `VerticalCardsContainer`
usam a constante.

**Resíduo**: ~50 strings `'/Manga-Reader/...'` ainda hardcoded em links/`navigate`
espalhados (ex.: `news/*`, `event/*`, `dashboard/*`, `forum/*`). Migrar para
`WEB_BASE_URL` é mecânico mas amplo (baixa prioridade).

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

## Resumo por Prioridade

| Prioridade | Em aberto | IDs |
|-----------|-----------|-----|
| **Crítica** | 0 | — |
| **Alta** | 1 | DT-02 (componente/E2E) |
| **Média** | 3 | DT-08, DT-10, DT-24 |
| **Resíduo só-infra (não-código)** | 1 | DT-21 (lado-código fechado; falta dump prod em staging — runbook documentado) |
| **Baixa** | 2 | DT-03, DT-09 |
| **Resolvidos 2026-05-16/17/18** | 18 | DT-01, DT-04, DT-05, DT-06, DT-07, DT-11, DT-12, DT-13, DT-14, DT-15, DT-16, DT-17, DT-18, DT-19, DT-20, DT-21 (código), DT-22, DT-23 |
