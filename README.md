# Manga Reader

> Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade, eventos e sistema de avaliações.

---

## Status do Projeto

| | |
|---|---|
| **Etapa atual** | **Fase 9 — Qualidade e polish** |
| **Próxima etapa** | Fase 10 — Produção |
| **Build** | ✅ Verde — 762 testes passando (727 backend + 35 frontend), 0 failures |

```
[✅] Fase 1-5: Backend (domínios, use cases, endpoints, security, infra)
[✅] Fase 6:   Frontend UI (29 páginas, 13 features, layout, guards)
[✅] Fase 7:   Testes do backend (727 testes — domain, app, presentation, infra JPA+MongoDB, Security E2E)
[✅] Fase 8:   Integração frontend ↔ backend (13/13 features com API real)
[🔄] Fase 9:   Qualidade e polish ← ETAPA ATUAL
       ├─ ✅ 9a: Biblioteca unificada + perfil (Library tabs, MyReviews, Profile stats)
       ├─ ✅ 9b: Redesign perfil unificado (recommendations, view history, privacy, enriched profile)
       └─ 🔲 9c: Code splitting, Error Boundaries, @Transactional fixes, a11y
[🔲] Fase 10:  Produção (CI/CD, infra cloud, deploy, monitoramento)
```

> Documentação detalhada em [`/docs`](docs/overview.md).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Pré-requisitos](#4-pré-requisitos)
5. [Como Executar](#5-como-executar)
6. [Estrutura do Projeto](#6-estrutura-do-projeto)
7. [Testes](#7-testes)
8. [API — Endpoints](#8-api--endpoints)
9. [Integração Frontend × Backend](#9-integração-frontend--backend)
10. [Dívidas Técnicas](#10-dívidas-técnicas)
11. [Roadmap](#11-roadmap)

---

## 1. Visão Geral

O **Manga Reader** é uma plataforma web completa para leitura, catalogação e comunidade de mangás, manhwas e manhuas. Monorepo com backend Spring Boot e frontend React.

| Métrica | Valor |
|---------|-------|
| Domínios de negócio | **12** (Auth, User, Manga, Chapter, Comment, Rating, Library, Group, News, Event, Forum, Category/Tag, Store) |
| Use Cases | **70** |
| REST Controllers | **13** |
| Endpoints REST | **74** |
| Tabelas PostgreSQL | **15** (incluindo user_recommendations) |
| Coleções MongoDB | **6** (incluindo view_history) |
| Páginas frontend | **29** |
| Rotas públicas / protegidas | **23** / **4** |
| Features frontend | **13** (todas integradas com API real) |
| Componentes compartilhados | **~37** |
| Arquivos TypeScript | **272** |
| Testes backend | **727** (127 arquivos — domain, application, presentation, infra JPA + MongoDB + Security E2E) |

---

## 2. Arquitetura

### Backend — Clean Architecture (4 camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    presentation/                         │
│         13 Controllers  ·  74 endpoints  ·  DTOs        │
├─────────────────────────────────────────────────────────┤
│                    application/                          │
│            70 Use Cases  ·  Port Interfaces             │
├─────────────────────────────────────────────────────────┤
│                     domain/                              │
│     12 Domínios  ·  Entities  ·  Value Objects          │
├─────────────────────────────────────────────────────────┤
│                  infrastructure/                         │
│  Persistence · Security · Email · Messaging · Seed      │
└─────────────────────────────────────────────────────────┘
```

### Frontend — Arquitetura Modular por Feature

```
src/
├── app/        → Layouts, rotas (23 públicas, 4 protegidas), router (guards)
├── feature/    → 13 módulos (auth, manga, chapter, comment, ...)
├── shared/     → ~37 componentes, HTTP client, constantes, tipos
├── mock/       → (removido — todas as features usam API real)
└── style/      → Tailwind + customizações
```

### Dual Database

| Banco | Dados |
|-------|-------|
| **PostgreSQL** (15 tabelas) | Users, SavedManga, Groups, Events, EventTickets, EventParticipants, ForumTopics, ForumReplies, Stores, Tags, UserSocialLinks, GroupMembers, GroupWorks, StoreTitles, UserRecommendations |
| **MongoDB** (6 coleções) | Titles, Comments, MangaRatings, NewsItems, ViewHistory, CommentReactions |

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Java | 23 (Temurin) | Linguagem principal |
| Spring Boot | 3.4.3 | Framework core |
| Spring Security | 6.x | Autenticação JWT (jjwt 0.12.6) |
| Spring Data JPA | — | Acesso PostgreSQL |
| Spring Data MongoDB | — | Acesso MongoDB |
| Spring Data Redis | — | Cache (TTL 5 min) |
| Spring AMQP | — | Mensageria (RabbitMQ) |
| Spring Mail | — | Envio de emails |
| Spring Actuator | — | Health checks e métricas |
| SpringDoc OpenAPI | 2.8.4 | Documentação Swagger UI |
| MapStruct | 1.6.3 | Mapeamento entity ↔ DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Flyway | — | Migrations PostgreSQL |
| Mongock | 5.5.0 | Migrations MongoDB |
| JaCoCo | 0.8.12 | Cobertura de código |
| TestContainers | 1.20.5 | Testes de integração MongoDB |
| Maven | 3.9.9 | Build |

### Frontend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 19.1.0 | UI |
| TypeScript | 5.8.3 | Tipagem |
| Vite | 6.2.6 | Build/dev server (SWC) |
| TailwindCSS | 4.1.3 | Estilos |
| React Router | 6.24.0 | Roteamento SPA |
| TanStack React Query | 5.73.3 | Server state / cache |
| Axios | 1.13.5 | HTTP client com interceptores |
| React Toastify | 11.0.5 | Notificações |

### Infraestrutura (Docker Compose)

| Serviço | Versão | Porta |
|---------|--------|-------|
| PostgreSQL | 17 (alpine) | 5432 |
| MongoDB | 8.0 | 27017 |
| RabbitMQ | 4 (management) | 5672 / 15672 |
| Redis | 7 (alpine) | 6379 |

---

## 4. Pré-requisitos

- **Docker** e **Docker Compose** (para os bancos de dados e testes de integração)
- **Java 23** (Temurin): `sdk install java 23.0.2-tem`
- **Maven 3.9.9**: `sdk install maven 3.9.9`
- **Node.js 18+** e **npm** (para o frontend)

---

## 5. Como Executar

### Backend

```bash
cd backend

# Os contêineres Docker sobem automaticamente via spring-boot-docker-compose
mvn spring-boot:run

# Ou manualmente:
docker compose up -d && mvn spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- O `DataSeeder` popula dados de demonstração automaticamente (profile != prod)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dev server: `http://localhost:5173` (proxy de `/api/*` para `:8080`)

### Testes

```bash
cd backend
mvn test                                    # Todos os 727 testes
mvn test -Dtest=**/domain/**/*Test          # Apenas domain
mvn test -Dtest=**/application/**/*Test     # Apenas use cases
mvn test -Dtest=**/presentation/**/*Test    # Apenas controllers
mvn test -Dtest=**/infrastructure/**/*Test  # JPA + MongoDB + Security
```

---

## 6. Estrutura do Projeto

```
Manga-Reader/
├── docs/                        # Documentação técnica
│   ├── overview.md              # Visão geral e estado atual
│   ├── frontend-analysis.md     # Análise técnica do frontend
│   ├── backend-analysis.md      # Análise técnica do backend
│   ├── tech-debt.md             # Dívidas técnicas (prioridade + impacto)
│   ├── pending-tasks.md         # Tarefas pendentes por área
│   └── deployment-plan.md       # Plano de deploy em produção
│
├── backend/
│   ├── docker-compose.yml       # Infra de desenvolvimento
│   ├── docker-compose.prod.yml  # Infra de produção
│   ├── Dockerfile               # Multi-stage build (Maven → JRE)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/mangareader/
│       │   ├── domain/              # Entidades, VOs, Enums (12 domínios)
│       │   ├── application/         # 70 Use Cases + Port interfaces
│       │   ├── infrastructure/      # Persistence (7 JPA + 4 Mongo), Security, Email, Messaging, Seed
│       │   ├── presentation/        # 13 Controllers (74 endpoints) + DTOs + MapStruct Mappers
│       │   └── shared/              # ApiResponse, PageResponse, exceptions, configs
│       └── test/java/com/mangareader/
│           ├── domain/              # 30 test files — JUnit 5 puro
│           ├── application/         # 70 test files — Mockito mocks
│           ├── presentation/        # 13 test files — @WebMvcTest + MockMvc
│           └── infrastructure/      # 13 test files — H2 (JPA) + TestContainers (Mongo) + JWT + E2E
│
└── frontend/
    └── src/
        ├── app/                     # Layout, 27 rotas (23 públicas + 4 protegidas), router (AuthGuard, RoleGuard)
        ├── feature/                 # 13 módulos (auth, manga, chapter, comment, rating, ...)
        │   └── {feature}/           # component/ + hook/ + service/ + type/ + context/
        ├── shared/                  # ~37 componentes, HTTP client, constantes, tipos
        ├── mock/                    # 11 datasets mock
        ├── asset/                   # Imagens e SVGs
        └── style/                   # Tailwind CSS global
```

---

## 7. Testes

**131 arquivos de teste · 762 testes · 0 failures · 0 errors**

### Backend — 127 arquivos, 727 testes

| Camada | Arquivos | Testes | Anotação | Abordagem |
|--------|:--------:|:------:|----------|-----------|
| Domain | 30 | 192 | Nenhuma | JUnit 5 puro, sem Spring (entidades, sub-entities, VOs, enums) |
| Application | 70 | 245 | `@ExtendWith(MockitoExtension)` | Mockito mocks dos ports |
| Presentation | 13 | 133 | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | MockMvc + `@MockitoBean TokenPort` |
| Infrastructure JPA | 7 | 72 | `@DataJpaTest` + `@ActiveProfiles("test")` | H2 in-memory |
| Infrastructure MongoDB | 4 | 51 | `@DataMongoTest` + `@Import(MongoTestContainerConfig)` | TestContainers (mongo:8.0) |
| Infrastructure Security | 1 | 17 | `@ExtendWith(MockitoExtension)` | JwtTokenProvider unitário |
| Security E2E | 1 | 16 | `@SpringBootTest` + `@Import(MongoTestContainerConfig)` | Fluxo Auth completo (sign-up → login → JWT → refresh → /me) |
| Root | 1 | 1 | `@SpringBootTest` | Smoke test (context loads) |

### Frontend — 4 arquivos, 35 testes

| Hook | Testes | Abordagem |
|------|:------:|-----------|
| useSearchTitles | 6 | React Query wrapper — enabled, placeholderData, error |
| useAuth | 12 | localStorage, /me recovery, login/register/logout, role mapping |
| useBookmark | 9 | Optimistic updates, rollback on error, session guard |
| useCommentCRUD | 8 | React Query mutations, toast notifications, loading states |

Stack: Vitest + @testing-library/react + MSW v2 (intercepta Axios no nível de rede)

### Pendente

- **Frontend — Componentes**: Testes de componentes (CommentsSection, Library, UserProfile, SearchResults)
- **Frontend — E2E**: Considerar Playwright para fluxos auth e navegação

### Histórico

| Data | Ação |
|------|------|
| 2026-03-09 | Início dos testes + documentação do projeto |
| 2026-03-10 | Domain completo (13/13) + Application completo (60/60) |
| 2026-03-11 | Presentation (13/13) + Infrastructure parcial (3 JPA + JWT) |
| 2026-03-12 | Fix controllers (TokenPort mock) + Infrastructure JPA completo (7/7) |
| 2026-03-13 | Infrastructure MongoDB completo (4/4 via TestContainers) |
| 2026-03-14 | Domain completo (25/25 — sub-entities, VOs, enums) + Security E2E (16 testes) |
| 2026-03-15 | Fase 9a/9b — 7 novos use cases (profile), domain +5 (sub-entities/VOs), application +10, total: 727 testes |
| 2026-03-25 | Fase 9c — Setup testes frontend (Vitest + RTL + MSW), 4 hooks testados: useSearchTitles, useAuth, useBookmark, useCommentCRUD (35 testes) |

---

## 8. API — Endpoints

### Auth (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| POST | `/api/auth/sign-in` | Não | Login |
| POST | `/api/auth/sign-up` | Não | Cadastro |
| POST | `/api/auth/refresh` | Não | Refresh token |
| GET | `/api/auth/me` | Sim | Usuário atual |
| POST | `/api/auth/forgot-password` | Não | Solicitar reset |
| POST | `/api/auth/reset-password` | Não | Resetar senha |

### Titles (`/api/titles`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/titles` | Não |
| GET | `/api/titles/{id}` | Não |
| GET | `/api/titles/search?q=` | Não |
| GET | `/api/titles/genre/{genre}` | Não |
| GET | `/api/titles/filter?genres=&sort=` | Não |

### Chapters (`/api/titles/{titleId}/chapters`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/titles/{titleId}/chapters` | Não |
| GET | `/api/titles/{titleId}/chapters/{number}` | Não |

### Comments (`/api/comments`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/comments/title/{titleId}` | Não |
| POST | `/api/comments` | Sim |
| PUT | `/api/comments/{id}` | Sim |
| DELETE | `/api/comments/{id}` | Sim |
| POST | `/api/comments/{id}/like` | Sim |
| POST | `/api/comments/{id}/dislike` | Sim |
| GET | `/api/comments/{id}/reactions` | Sim |

### Ratings (`/api/ratings`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/ratings/title/{titleId}` | Não |
| GET | `/api/ratings/title/{titleId}/average` | Não |
| POST | `/api/ratings` | Sim |
| PUT | `/api/ratings/{id}` | Sim |
| DELETE | `/api/ratings/{id}` | Sim |
| GET | `/api/ratings/user` | Sim |

### Library (`/api/library`) — Todos autenticados

| Método | Endpoint |
|--------|----------|
| GET | `/api/library` |
| GET | `/api/library/counts` |
| POST | `/api/library` |
| PATCH | `/api/library/{titleId}` |
| DELETE | `/api/library/{titleId}` |

### Groups (`/api/groups`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/groups` | Não |
| GET | `/api/groups/{id}` | Não |
| GET | `/api/groups/username/{username}` | Não |
| GET | `/api/groups/title/{titleId}` | Não |
| POST | `/api/groups` | Sim |
| PUT | `/api/groups/{id}` | Sim |
| POST | `/api/groups/{id}/join` | Sim |
| DELETE | `/api/groups/{id}/leave` | Sim |
| POST | `/api/groups/{id}/works` | Sim |
| DELETE | `/api/groups/{id}/works/{titleId}` | Sim |

### News (`/api/news`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/news` | Não |
| GET | `/api/news/{id}` | Não |
| GET | `/api/news/category/{category}` | Não |
| GET | `/api/news/search?q=` | Não |

### Events (`/api/events`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/events` | Não |
| GET | `/api/events/{id}` | Não |
| GET | `/api/events/status/{status}` | Não |

### Forum (`/api/forum`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/forum` | Não |
| GET | `/api/forum/{id}` | Não |
| GET | `/api/forum/category/{category}` | Não |
| GET | `/api/forum/categories` | Não |
| POST | `/api/forum` | Sim |
| POST | `/api/forum/{id}/replies` | Sim |
| PUT | `/api/forum/{id}` | Sim |
| DELETE | `/api/forum/{id}` | Sim |

### Stores (`/api/stores`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/stores` | Não |
| GET | `/api/stores/{id}` | Não |
| GET | `/api/stores/title/{titleId}` | Não |

### Tags (`/api/tags`)

| Método | Endpoint | Auth |
|--------|----------|:----:|
| GET | `/api/tags` | Não |
| GET | `/api/tags/{id}` | Não |
| GET | `/api/tags/search?q=` | Não |

### Users (`/api/users`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|:----:|-----------|
| GET | `/api/users/{id}` | Não | Perfil público |
| GET | `/api/users/{id}/profile` | Não | Perfil enriquecido (stats, recommendations) |
| GET | `/api/users/{id}/comments` | Não | Comentários do usuário |
| GET | `/api/users/{id}/history` | Não | Histórico de visualização |
| GET | `/api/users/me` | Sim | Usuário atual |
| PATCH | `/api/users/me` | Sim | Atualizar perfil |
| POST | `/api/users/me/recommendations` | Sim | Adicionar recomendação |
| DELETE | `/api/users/me/recommendations/{titleId}` | Sim | Remover recomendação |
| PUT | `/api/users/me/recommendations/reorder` | Sim | Reordenar recomendações |
| PATCH | `/api/users/me/privacy` | Sim | Atualizar configurações de privacidade |
| POST | `/api/users/me/history` | Sim | Registrar visualização |

---

## 9. Integração Frontend × Backend

| Feature | GET | CRUD | Fonte atual |
|---------|:---:|:----:|-------------|
| **auth** | ✅ | ✅ | API real (sign-in, sign-up, refresh, /me, forgot/reset password) |
| **manga** (titles) | ✅ | — | API real |
| **category** (tags) | ✅ | — | API real |
| **library** | ✅ | ✅ | API real (CRUD + auth guard) |
| **rating** | ✅ | ✅ | API real (submit, update, delete, get by title/user, average) |
| **comment** | ✅ | ✅ | API real (create, update, delete, list by title) |
| **user** | ✅ | ✅ | API real (get profile, update profile) |
| **forum** | ✅ | ✅ | API real (topics CRUD, posts CRUD) |
| **group** | ✅ | ✅ | API real (CRUD, members, works) |
| **news** | ✅ | — | API real (list, detail, reactions) |
| **event** | ✅ | — | API real (list, detail, participants, tickets) |
| **store** | ✅ | — | API real (list, detail) |

### Lacunas conhecidas

| Feature | Lacuna | Impacto |
|---------|--------|---------|
| **news** | Endpoint `/related` não implementado no backend | Seção "notícias relacionadas" sem dados |
| **event** | Endpoint `/related` não implementado no backend | Seção "eventos relacionados" sem dados |
| **group** | Endpoint `/members/{id}` não implementado no backend | Detalhe de membro indisponível |
| **category** | `useCategoryFilters` com `localhost:5000` hardcoded | Filtro de categorias apontando para API errada |

---

## 10. Dívidas Técnicas

### Críticas

| # | Dívida | Impacto |
|---|--------|---------|
| 1 | **~23 use cases sem `@Transactional`** | Risco de LazyInitializationException e inconsistência de dados em operações multi-repository |
| 2 | **0 testes no frontend** | Sem garantia de qualidade no frontend |

### Importantes

| # | Dívida | Impacto |
|---|--------|---------|
| 3 | Sem CI/CD pipeline | Deploys manuais, sem verificação automática |
| 4 | UserController injeta repository ports diretamente | Violação da Clean Architecture (controllers devem depender apenas de use cases) |
| 5 | Sem Error Boundaries no frontend | Um erro em qualquer componente crasha toda a app |

### Menores

| # | Dívida |
|---|--------|
| 6 | Sem lazy loading / code splitting para rotas |
| 7 | Sem acessibilidade completa (ARIA, HTML semântico parcial) |
| 8 | Conteúdo placeholder em Termos de Uso e DMCA |
| 9 | Referências cross-database sem integridade documentada |
| 10 | Basename `/Manga-Reader` hardcoded |
| 11 | Sem i18n |
| 12 | `localhost:5000` hardcoded em useCategoryFilters |

> Detalhamento completo em [`docs/tech-debt.md`](docs/tech-debt.md).

---

## 11. Roadmap

```
[✅] Fase 1-5: Backend features
       Domínios, use cases, endpoints, security, email, messaging, cache, seed data

[✅] Fase 6: Frontend UI
       29 páginas, 13 features, layout responsivo, guards, HTTP client

[✅] Fase 7: Testes do backend (727 testes)
       ├─ ✅ Domain (30 files — entidades, sub-entities, VOs, enums)
       ├─ ✅ Application (70 use cases)
       ├─ ✅ Presentation (13 controllers)
       ├─ ✅ Infrastructure JPA (7) + MongoDB (4) + JWT
       └─ ✅ Security E2E (16 testes — fluxo Auth completo)

[✅] Fase 8: Integração frontend ↔ backend (13/13 features)
       ├─ ✅ authService, libraryService, ratingService, commentService (CRUD completo)
       ├─ ✅ userService, forumService, groupService
       └─ ✅ newsService, eventService, storeService (read-only)

[🔄] Fase 9: Qualidade e polish ← ETAPA ATUAL
       ├─ ✅ 9a: Biblioteca unificada (tabs, contagens, paginação) + MyReviews + Profile stats
       ├─ ✅ 9b: Perfil enriquecido (recommendations, view history, privacy, enriched profile)
       └─ 🔲 9c: Code splitting, Error Boundaries, @Transactional fixes, a11y, testes frontend

[🔲] Fase 10: Produção
       ├─ CI/CD pipeline (GitHub Actions + JaCoCo)
       ├─ Infraestrutura cloud
       ├─ Deploy staging + produção
       └─ Monitoramento
```

> Plano detalhado de deploy em [`docs/deployment-plan.md`](docs/deployment-plan.md).

---

## Sistema de Avaliações (Rating)

### Estrutura da Review

Cada review possui notas por categoria:

| Campo | Descrição |
|-------|-----------|
| `funRating` | Diversão |
| `artRating` | Arte |
| `storylineRating` | Enredo |
| `charactersRating` | Personagens |
| `originalityRating` | Originalidade |
| `pacingRating` | Ritmo |
| `overallRating` | Média das 6 categorias (calculado automaticamente) |

### Consolidação na Obra (Title)

| Campo | Descrição |
|-------|-----------|
| `ratingAverage` | Média dos `overallRating` de todas as reviews |
| `ratingCount` | Quantidade total de reviews |
| `rankingScore` | Score para ranking no sistema (considera média, quantidade e peso estatístico) |

### Job Periódico (não implementado)

Os campos `ratingAverage` e `rankingScore` na entidade Title serão calculados por um **job periódico** (processo agendado) que:

1. Busca o `overallRating` de todas as reviews de cada obra
2. Calcula `ratingAverage` (média simples) e `rankingScore` (score ponderado)
3. Atualiza esses valores na entidade da obra

> **Status:** Essa funcionalidade **ainda não está implementada**. Os campos existem na entidade mas são preenchidos apenas pelo DataSeeder com valores de demonstração.

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [`docs/overview.md`](docs/overview.md) | Visão geral, stack, arquitetura, fase de desenvolvimento |
| [`docs/frontend-analysis.md`](docs/frontend-analysis.md) | Análise técnica completa do frontend |
| [`docs/backend-analysis.md`](docs/backend-analysis.md) | Análise técnica completa do backend |
| [`docs/tech-debt.md`](docs/tech-debt.md) | Dívidas técnicas com impacto e prioridade |
| [`docs/pending-tasks.md`](docs/pending-tasks.md) | Tarefas pendentes organizadas por área |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Variáveis, infra, build, Nginx, CI/CD, checklist de segurança |

---

Projeto pessoal de estudo — Ruan.
