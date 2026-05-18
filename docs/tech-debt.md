# Manga Reader — Dívidas Técnicas

> Última atualização: 16 de maio de 2026

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

### DT-13 (resíduo): call-sites com basename hardcoded

**Estado**: **Resolvido na fonte (2026-05-16)** — o basename agora é
parametrizado por `VITE_BASE_URL` (`src/shared/constant/baseUrl.ts`,
`vite.config.ts` via `loadEnv`, `.env`/`.env.example`). `main.tsx`,
`ProtectedRoutes`, `Login`, `SignUp`, `AdminSidebar` e `VerticalCardsContainer`
usam a constante.

**Resíduo**: ~50 strings `'/Manga-Reader/...'` ainda hardcoded em links/`navigate`
espalhados (ex.: `news/*`, `event/*`, `dashboard/*`, `forum/*`). Migrar para
`WEB_BASE_URL` é mecânico mas amplo (baixa prioridade).

---

_(DT-17 e DT-18 resolvidos em 2026-05-17 — ver tabela de resolvidos.)_

---

## Itens Resolvidos (2026-05-16)

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
| **Média** | 2 | DT-08, DT-10 |
| **Baixa** | 2 | DT-03, DT-09 |
| **Resolvidos 2026-05-16/17** | 13 | DT-01, DT-04, DT-05, DT-06, DT-07, DT-11, DT-12, DT-13, DT-14, DT-15, DT-16, DT-17, DT-18 |
