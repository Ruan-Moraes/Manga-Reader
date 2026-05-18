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

### DT-19: Resíduos frontend da migração de capítulos (DT-17)

**Origem**: ao mover capítulos para coleção própria (DT-17), `Title` deixou de
embarcar `chapters`. O tipo `Title.chapters` virou opcional para evitar ripple,
mas dois pontos ficaram degradados:

1. **Badge "último capítulo" no catálogo**: cards (`VerticalCard`,
   `CategoryFilters`, `HorizontalCard`, etc.) liam `title.chapters` para exibir
   o capítulo mais recente. Como o backend não envia mais `chapters` no
   `TitleResponse`, esses badges renderizam vazio. Fix correto: expor um campo
   leve no `TitleResponse` (ex.: `latestChapterNumber`/`chaptersCount`
   desnormalizado) ou buscar via endpoint dedicado nos cards.
2. **`ChapterList` pagina em memória**: a página de detalhe usa
   `useChapters(size=500)` e o `ChapterList` continua paginando o array no
   cliente. Server-side pagination de UI (controles + `page/size` reais) é
   evolução pendente — o risco crítico (documento 16 MB) já está resolvido no
   backend, então isto é não-bloqueante.

**Impacto**: cosmético (badge vazio) + UX de listagem de capítulos não escala
para séries muito longas na tela de detalhe. Sem risco de dados.

**Recomendação**: (1) adicionar `chaptersCount`/`latestChapterNumber`
desnormalizado ao `TitleResponse` (consolidado por job ou atualizado em
write de capítulo) e religar os cards; (2) paginação real de UI no
`ChapterList`. Baixa-Média prioridade.

---

### DT-20: Fragilidade dos testes Mongock + TestContainers

**Descrição**: numa execução de `mvn test` (2026-05-18), 9 erros
`DataAccessResourceFailure: ... Connection refused` nos testes que usam
MongoDB TestContainers (`V004LocalizeCatalogContentTest`,
`V005AddLanguageToUgcTest`, `V009MigrateChaptersToCollectionTest` — falha em
`@BeforeEach`/`clean`). O container Mongo estava reiniciando
(`health: starting`). Reexecução passou (1036, 0 falha) — **não é defeito de
código**, é flakiness de infraestrutura de teste.

**Impacto**: builds de CI ficam não-determinísticos (falsos vermelhos);
agravado após habilitar também `testcontainers:postgresql` (mais containers
concorrendo por recursos Docker, suíte mais pesada/lenta).

**Recomendação**:
- Reusar um único container por suíte (singleton container pattern /
  `@Testcontainers` com container `static` compartilhado) em vez de subir/
  derrubar por classe.
- Healthcheck/espera explícita antes do primeiro acesso; aumentar
  `startup timeout`.
- Avaliar agrupar todos os testes Mongock numa classe/ordem dedicada para
  reduzir ciclos de container.
- Em CI: garantir Docker com recursos suficientes; possível retry
  automático só para a camada de testes de container.

Média prioridade (não bloqueia código; bloqueia confiabilidade de CI).

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

**Recomendação**:
- Antes do primeiro deploy: dump/restore de um dump representativo de prod em
  staging e rodar o boot com V009; conferir contagem
  `sum(titles.chapters.size)` == `chapters.count()` e ausência de
  `titles.chapters`.
- Backup do banco antes do deploy que aplicar V009.
- Logar métricas na execução (títulos processados, capítulos inseridos) para
  auditoria pós-migração.

Bloqueia produção do recurso de capítulos até validação em staging.

---

### DT-22: Suíte de testes mais pesada (Postgres TestContainers)

**Descrição**: para cobrir `EventRepositoryAdapter.searchByTitle` (query
`jsonb_each_text`, não suportada por H2) foi habilitada a dependência
`org.testcontainers:postgresql` e criado `EventSearchByTitlePostgresTest`
(~17 s só essa classe, sobe container `postgres:17`). Antes, testes JPA
usavam só H2 (sem Docker).

**Impacto**: `mvn test` agora exige Docker também para Postgres (além do
Mongo já existente); suíte mais lenta e mais sensível a recursos (ver
DT-20). Ambientes sem Docker não rodam a suíte completa.

**Recomendação**:
- Singleton container Postgres reutilizado entre classes (quando houver
  mais testes Postgres-TC), padrão consistente com DT-20.
- Tag/grupo separado (ex.: `@Tag("testcontainers")`) para permitir rodar
  só os testes leves (H2/unit) localmente e os de container em CI.
- Documentar requisito de Docker no README de testes.

Baixa-Média prioridade (trade-off aceito: cobertura real do JSONB > custo).

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
| **Baixa-Média** | 2 | DT-19 (resíduos frontend DT-17), DT-22 (peso suíte Postgres-TC) |
| **Média (CI)** | 1 | DT-20 (flake Mongock + TestContainers) |
| **Bloqueia prod (capítulos)** | 1 | DT-21 (V009 sem validação em staging/prod) |
| **Baixa** | 2 | DT-03, DT-09 |
| **Resolvidos 2026-05-16/17** | 13 | DT-01, DT-04, DT-05, DT-06, DT-07, DT-11, DT-12, DT-13, DT-14, DT-15, DT-16, DT-17, DT-18 |
