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

### DT-01 (parcial): `@Transactional` em use cases Mongo-backed

**Estado**: **Parcialmente resolvido (2026-05-16)**. Os 5 use cases com escrita
primária em PostgreSQL (JPA) receberam `@Transactional`:
`SaveToLibraryUseCase`, `ChangeReadingListUseCase`, `AddRecommendationUseCase`,
`UpdateUserProfileUseCase`, `RemoveWorkFromGroupUseCase`.

**Sub-item adiado**: 14 use cases com escrita primária em MongoDB
(Comment×3, Rating×3, News×3, Title×3, RecordViewHistory, CreateErrorLog) **não**
foram anotados. Motivo: não há `MongoTransactionManager` configurado e o MongoDB
do `docker-compose` roda **standalone** (sem `--replSet`), logo transações
multi-documento não são suportadas. Anotar com o `@Transactional` (JPA) atual
não traria atomicidade e poderia abrir transação JPA inútil.

**Recomendação para resolver o sub-item**: configurar MongoDB como replica set +
registrar `MongoTransactionManager`, então anotar os use cases Mongo qualificando
o tx manager. Não-bloqueante enquanto não vai a produção.

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

### DT-16: `npm run build` falha no typecheck de arquivos de teste

**Descrição**: `npm run build` roda `tsc -b` que inclui arquivos de teste.
Há erros TS pré-existentes (não relacionados às mudanças de 2026-05-16) em
`src/test/factories/admin/*` (LocalizedString espera
`Partial<Record<locale,string>>`, fábricas passam `string`/`null`),
`src/feature/news/service/newsService.test.ts` e
`src/feature/manga/component/card/horizontal/HorizontalCard.tsx`
(`t('card.chaptersCount', { count: string })` — `count` deveria ser `number`).
Introduzido provavelmente no commit i18n `bb72601`.

**Impacto**: `npm run build` quebra; `vite build` direto funciona (91 chunks,
code-splitting OK). `npx tsc --noEmit` (config app) passa — só `tsc -b` (inclui
testes) falha.

**Recomendação**: ajustar as fábricas/test types para `LocalizedString` e
corrigir o tipo de `count` em `HorizontalCard`. Média prioridade.

---

## Itens Resolvidos (2026-05-16)

| ID | Dívida | Resolução |
|----|--------|-----------|
| DT-01 | `@Transactional` em writes JPA | 5 use cases JPA anotados (sub-item Mongo adiado — ver acima) |
| DT-04 | UserController injetava repository ports | Criado `GetUserViewHistoryUseCase`; content-locales reusa `GetUserProfileUseCase`; ports removidos do controller; testes atualizados + teste de application novo |
| DT-05 | Sem Error Boundaries | **Stale** — `ErrorBoundary` + `RouteErrorFallback` já existiam e estão integrados em `main.tsx` |
| DT-06 | Validação de forms insuficiente | `react-hook-form` + `zod` + `@hookform/resolvers`; `buildLoginSchema`/`buildSignUpSchema` com mensagens i18n; `Login`/`SignUp` migrados (demais forms = resíduo de baixa prioridade) |
| DT-07 | Sem lazy loading de rotas | `React.lazy` em `PublicRoutes`/`ProtectedRoutes` + `<Suspense>` no `RootLayout`; build gera 91 chunks por rota |
| DT-11 | Logging sem rotação | `RollingFileAppender` (SizeAndTimeBased, 50MB/30d/1GB, JSON) no profile `prod` do `logback-spring.xml` |
| DT-12 | `localhost:5000` em useCategoryFilters | **Stale** — hook não tem mais fetch hardcoded (só state) |
| DT-14 | Sem i18n | **Stale** — i18n completo (pt-BR/en-US/es-ES) via `react-i18next`, 16 namespaces |
| DT-15 | React Query DevTools comentado | Habilitado em `main.tsx` apenas em dev (`import.meta.env.DEV`) |

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
| **Alta** | 1 parcial | DT-01 (sub-item Mongo), DT-02 (componente/E2E) |
| **Média** | 3 | DT-08, DT-10, DT-16 |
| **Baixa** | 2 | DT-03, DT-09, DT-13 (resíduo) |
| **Resolvidos 2026-05-16** | 9 | DT-01*, DT-04, DT-05, DT-06, DT-07, DT-11, DT-12, DT-14, DT-15 |
