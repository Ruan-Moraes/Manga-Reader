# Manga Reader

> Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade, eventos e sistema de avaliações.

---

## 🎯 Foco Atual: Testes do Backend

**Fase ativa**: Implementação de testes automatizados no backend.
**Próxima fase**: Finalização das features e integração frontend ↔ backend.

O backend possui ~80 endpoints e 60+ use cases implementados. A cobertura de testes atingiu **95 arquivos de teste** e **531 testes passando**. O foco atual é **completar testes de infraestrutura MongoDB e segurança**.

### Progresso dos Testes

```
[✅] Domain: 13/13 entidades e VOs testadas (~107 testes)
[✅] Application: 60/60 use cases testados (~206 testes)
[✅] Presentation: 13/13 controllers testados (~129 testes)
[✅] Infrastructure JPA: 7/7 adapters PostgreSQL testados (~46 testes)
[✅] Infrastructure Security: JwtTokenProvider unitário
[🔲] Infrastructure MongoDB: 0/4 adapters (TestContainers) — não iniciado
[🔲] Security: Fluxo Auth integrado — não iniciado
```

### Ordem de execução dos testes

| # | Camada | Escopo | Abordagem |
|---|--------|--------|-----------|
| 1 | **Domain** | Entidades, VOs, Enums | JUnit 5 puro, sem Spring |
| 2 | **Application** | Use Cases (60+) | Unitários com mocks dos ports |
| 3 | **Infrastructure** | Repositories/Adapters | Integração com H2/TestContainers |
| 4 | **Presentation** | Controllers (13) | MockMVC + Spring Security Test |
| 5 | **Security** | JWT, Auth Guards | Testes de endpoints com/sem token |

### Após os testes

1. Completar endpoints pendentes (chapters, user profile, forgot/reset password)
2. Integrar frontend com API real (10 de 13 features usam mock data)
3. CI/CD pipeline
4. Preparar para produção

> Documentação completa do projeto disponível em [`/docs`](docs/overview.md).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Pré-requisitos](#4-pré-requisitos)
5. [Como Executar](#5-como-executar)
6. [Estrutura do Projeto](#6-estrutura-do-projeto)
7. [Estado Atual da Implementação](#7-estado-atual-da-implementação)
8. [API — Endpoints Disponíveis](#8-api--endpoints-disponíveis)
9. [Cobertura Frontend × Backend](#9-cobertura-frontend--backend)
10. [Dívidas Técnicas](#10-dívidas-técnicas)
11. [Pendências Funcionais](#11-pendências-funcionais)
12. [Roadmap](#12-roadmap)

---

## 1. Visão Geral

O **Manga Reader** é composto por:

| Camada | Tecnologia | Descrição |
|--------|-----------|-----------|
| **Frontend** | React 19 + TypeScript + Vite | SPA com catálogo, fórum, biblioteca pessoal, eventos, notícias |
| **Backend** | Spring Boot 3.4.3 + Java 23 | API REST com Clean Architecture, dual database |
| **Bancos** | PostgreSQL 17 + MongoDB 8 | Relacional (users, groups, events, forum, library, stores, tags) + Documental (titles, chapters, comments, ratings, news) |
| **Infra** | Docker Compose | PostgreSQL, MongoDB, RabbitMQ 4, Redis 7 |

### Números atuais

| Métrica | Valor |
|---------|-------|
| Domínios implementados | **12** (Auth, Manga, Chapter, Comment, Rating, Library, Group, News, Event, Forum, Category/Tag, Store) |
| Use Cases | **60+** |
| REST Controllers | **13** |
| Endpoints REST | **~80** |
| Tabelas PostgreSQL | **14** |
| Coleções MongoDB | **4** |
| Páginas Frontend | **22+** |
| Features Frontend | **13** (3 com API real, 10 com mock data) |
| Testes automatizados | **531** (95 arquivos — domain, application, presentation, infra JPA completa) |

---

## 2. Arquitetura

### Backend — Clean Architecture (4 camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    presentation/                         │
│         13 Controllers  ·  ~80 endpoints  ·  DTOs       │
├─────────────────────────────────────────────────────────┤
│                    application/                          │
│           60+ Use Cases  ·  Port Interfaces             │
├─────────────────────────────────────────────────────────┤
│                     domain/                              │
│     11 Domínios  ·  Entities  ·  Value Objects          │
├─────────────────────────────────────────────────────────┤
│                  infrastructure/                         │
│  Persistence · Security · Email · Messaging · Seed      │
└─────────────────────────────────────────────────────────┘
```

### Frontend — Arquitetura Modular por Feature

```
src/
├── app/        → Layouts, rotas (22+), router (guards)
├── feature/    → 13 módulos (auth, manga, chapter, comment, ...)
├── shared/     → 33 componentes, HTTP client, constantes, tipos
├── mock/       → 11 datasets (substituição pendente por API real)
└── style/      → Tailwind + customizações
```

### Dual Database

| Banco | Dados |
|-------|-------|
| **PostgreSQL** | Users, SavedManga, Groups, Events, EventTickets, EventParticipants, ForumTopics, ForumReplies, Stores, Tags |
| **MongoDB** | Titles, Chapters, Comments, MangaRatings, NewsItems |

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
| Mongock | — | Migrations MongoDB |
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

### Infraestrutura

| Serviço | Versão | Porta | Status |
|---------|--------|-------|--------|
| PostgreSQL | 17 (alpine) | 5432 | ✅ Em uso |
| MongoDB | 8.0 | 27017 | ✅ Em uso |
| RabbitMQ | 4 (management) | 5672/15672 | ✅ Configurado |
| Redis | 7 (alpine) | 6379 | ✅ Configurado (cache TTL 5 min) |

---

## 4. Pré-requisitos

- **Docker** e **Docker Compose** (para os bancos de dados)
- **SDKMAN** (gerenciamento de JDK/Maven)
- **Java 23** (Temurin): `sdk install java 23.0.2-tem`
- **Maven 3.9.9**: `sdk install maven 3.9.9`
- **Node.js 18+** e **npm/pnpm** (para o frontend)

---

## 5. Como Executar

### Backend

```bash
cd backend

# Os contêineres Docker sobem automaticamente via spring-boot-docker-compose
# Ou manualmente:
docker compose up -d

# Compilar e rodar
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk use java 23.0.2-tem
mvn spring-boot:run
```

O servidor inicia em `http://localhost:8080`.
Swagger UI disponível em `http://localhost:8080/swagger-ui.html`.

O `DataSeeder` popula automaticamente dados de demonstração na primeira execução.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server em `http://localhost:5173`.

---

## 6. Estrutura do Projeto

```
Manga-Reader/
├── docs/                    # Documentação completa do projeto
│   ├── overview.md          # Visão geral e estado atual
│   ├── frontend-analysis.md # Análise técnica do frontend
│   ├── backend-analysis.md  # Análise técnica do backend
│   ├── tech-debt.md         # Dívidas técnicas (prioridade + impacto)
│   ├── pending-tasks.md     # Tarefas pendentes por área
│   └── deployment-plan.md   # Plano de deploy em produção
│
├── backend/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/mangareader/
│       ├── domain/              # Entidades, VOs, Enums (11 domínios)
│       ├── application/         # 60+ Use Cases + Ports (interfaces)
│       ├── infrastructure/      # Persistence, Security, Email, Messaging, Seed
│       ├── presentation/        # 13 Controllers + DTOs + Mappers
│       └── shared/              # ApiResponse, PageResponse, exceptions, configs
│
└── frontend/
    └── src/
        ├── app/                 # Layout, rotas (22+), router (guards)
        ├── feature/             # 13 módulos (auth, manga, comment, rating, etc.)
        ├── mock/                # Dados mock (10 features ainda dependem disto)
        ├── shared/              # 33 componentes, HTTP client, constantes, tipos
        └── style/               # CSS global + Tailwind
```

---

## 7. Estado Atual da Implementação

### Backend — ✅ Funcionalidades Core Implementadas

| Fase | Escopo | Status |
|------|--------|--------|
| Foundation | Scaffold, Docker, Clean Architecture, configs | ✅ |
| Auth | JWT (sign-in, sign-up, refresh, me, forgot/reset password) | ✅ |
| Manga | Titles CRUD + busca + filtros | ✅ |
| Chapters | Listagem e leitura por número | ✅ |
| Comments | CRUD + reações (like/dislike) | ✅ |
| Ratings | CRUD + médias por título | ✅ |
| Library | Salvar, remover, mudar lista | ✅ |
| Groups | CRUD + join/leave + works | ✅ |
| News | Listagem + busca + categorias | ✅ |
| Events | Listagem + filtro por status | ✅ |
| Forum | CRUD tópicos + replies + categorias | ✅ |
| Tags | Listagem + busca | ✅ |
| Stores | Listagem + por título | ✅ |
| Security | JWT, BCrypt, CORS, Rate Limiting | ✅ |
| Infra | Email, RabbitMQ, Redis cache, Seed data | ✅ |
| **Testes** | **531 testes (95 arquivos) — domain ✅, application ✅, presentation ✅, infra JPA ✅** | **🔄 Em andamento** |

### Frontend — ✅ UI Completa, ⚠️ Integração Pendente

| Área | Status |
|------|--------|
| 22+ páginas com UI responsiva | ✅ |
| 13 módulos de feature | ✅ |
| HTTP client com interceptores | ✅ |
| Guards (AuthGuard, RoleGuard) | ✅ |
| 3 features com API real (titles, tags, comments GET) | ✅ |
| 10 features com mock data | ⚠️ Pendente |
| Validação de formulários | ⚠️ Pendente |
| Testes frontend | 🔲 Não iniciado |

---

## 8. API — Endpoints Disponíveis

### Auth (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/sign-in` | Não | Login |
| POST | `/api/auth/sign-up` | Não | Cadastro |
| POST | `/api/auth/refresh` | Não | Refresh token |
| GET | `/api/auth/me` | Sim | Usuário atual |
| POST | `/api/auth/forgot-password` | Não | Solicitar reset |
| POST | `/api/auth/reset-password` | Não | Resetar senha |

### Titles (`/api/titles`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/titles` | Não |
| GET | `/api/titles/{id}` | Não |
| GET | `/api/titles/search?q=` | Não |
| GET | `/api/titles/genre/{genre}` | Não |
| GET | `/api/titles/filter?genres=&sort=` | Não |

### Chapters (`/api/titles/{titleId}/chapters`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/titles/{titleId}/chapters` | Não |
| GET | `/api/titles/{titleId}/chapters/{number}` | Não |

### Tags (`/api/tags`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/tags` | Não |
| GET | `/api/tags/{id}` | Não |
| GET | `/api/tags/search?q=` | Não |

### Comments (`/api/comments`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/comments/title/{titleId}` | Não |
| POST | `/api/comments` | Sim |
| PUT | `/api/comments/{id}` | Sim |
| DELETE | `/api/comments/{id}` | Sim |
| POST | `/api/comments/{id}/react` | Sim |

### Ratings (`/api/ratings`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/ratings/title/{titleId}` | Não |
| GET | `/api/ratings/title/{titleId}/average` | Não |
| POST | `/api/ratings` | Sim |
| PUT | `/api/ratings/{id}` | Sim |
| DELETE | `/api/ratings/{id}` | Sim |
| GET | `/api/ratings/user/me` | Sim |

### Library (`/api/library`) — Todos autenticados

| Método | Endpoint |
|--------|----------|
| GET | `/api/library` |
| POST | `/api/library` |
| PATCH | `/api/library/{titleId}` |
| DELETE | `/api/library/{titleId}` |

### Groups (`/api/groups`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/groups` | Não |
| GET | `/api/groups/{id}` | Não |
| GET | `/api/groups/username/{username}` | Não |
| GET | `/api/groups/title/{titleId}` | Não |
| POST | `/api/groups` | Sim |
| PUT | `/api/groups/{id}` | Sim |
| POST | `/api/groups/{id}/join` | Sim |
| POST | `/api/groups/{id}/leave` | Sim |
| POST | `/api/groups/{id}/works` | Sim |
| DELETE | `/api/groups/{id}/works/{titleId}` | Sim |

### News (`/api/news`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/news` | Não |
| GET | `/api/news/{id}` | Não |
| GET | `/api/news/category/{category}` | Não |
| GET | `/api/news/search?q=` | Não |

### Events (`/api/events`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/events` | Não |
| GET | `/api/events/{id}` | Não |
| GET | `/api/events/status/{status}` | Não |

### Forum (`/api/forum`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/forum` | Não |
| GET | `/api/forum/{id}` | Não |
| GET | `/api/forum/category/{category}` | Não |
| GET | `/api/forum/categories` | Não |
| POST | `/api/forum` | Sim |
| POST | `/api/forum/{id}/reply` | Sim |
| PUT | `/api/forum/{id}` | Sim |
| DELETE | `/api/forum/{id}` | Sim |

### Stores (`/api/stores`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/stores` | Não |
| GET | `/api/stores/{id}` | Não |
| GET | `/api/stores/title/{titleId}` | Não |

### Users (`/api/users`)

| Método | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/users/{id}` | Não |
| GET | `/api/users/me` | Sim |
| PATCH | `/api/users/me` | Sim |

---

## 9. Cobertura Frontend × Backend

### Status de integração por feature

| Feature | GET (API real) | CRUD (API real) | Fonte Atual |
|---------|:-:|:-:|-------------|
| **manga** (titles) | ✅ | — | API real |
| **category** (tags) | ✅ | — | API real |
| **comment** | ✅ | ❌ | API real (GET) / Mock (CRUD) |
| **auth** | 🔲 | 🔲 | Endpoints definidos, não testados |
| **rating** | ❌ | ❌ | Mock data |
| **group** | ❌ | ❌ | Mock data |
| **library** | ❌ | ❌ | Mock data (localStorage) |
| **news** | ❌ | ❌ | Mock data |
| **event** | ❌ | ❌ | Mock data |
| **forum** | ❌ | ❌ | Mock data |
| **store** | ❌ | ❌ | Mock data |
| **user** | ❌ | ❌ | Mock data |

### Ordem de migração sugerida (pós-testes)

| # | Service | Justificativa |
|---|---------|---------------|
| 1 | `authService` | Fundação — autenticação para todos os endpoints protegidos |
| 2 | `libraryService` | Feature pessoal chave, CRUD completo |
| 3 | `ratingService` | Interação social, CRUD completo |
| 4 | `commentService` (CRUD) | Completar integração parcial existente |
| 5 | `userService` | Perfil do usuário |
| 6 | `forumService` | Comunidade, CRUD com replies |
| 7 | `groupService` | Comunidade, CRUD com membros e works |
| 8 | `newsService` | Conteúdo editorial (read-only) |
| 9 | `eventService` | Conteúdo editorial (read-only) |
| 10 | `storeService` | Complementar (read-only) |

---

## 10. Dívidas Técnicas

### 🔴 Críticas

| # | Dívida | Impacto |
|---|--------|---------|
| 1 | **Testes de controller quebrados** (13 controllers com ApplicationContext failure) + 0 testes no frontend | Bloqueante para produção |
| 2 | **10 features frontend usam mock data** | Aplicação não funcional em cenário real |

### 🟡 Importantes

| # | Dívida | Impacto |
|---|--------|---------|
| 3 | Sem CI/CD pipeline | Deploys manuais, sem verificação automática |
| 4 | Auth end-to-end não testado | Fluxo de autenticação pode falhar em produção |
| 5 | Validação insuficiente em formulários frontend | UX degradada, dados inválidos |

### 🟢 Menores

| # | Dívida |
|---|--------|
| 6 | Componentes de página grandes (>100 linhas) — precisam de split |
| 7 | Sem lazy loading / code splitting para rotas |
| 8 | Sem acessibilidade (ARIA, HTML semântico) |
| 9 | Conteúdo placeholder em Termos de Uso e DMCA |
| 10 | Referências cross-database (PostgreSQL ↔ MongoDB) sem integridade documentada |
| 11 | Basename `/Manga-Reader` hardcoded |
| 12 | Sem i18n |

> Detalhamento completo com prioridades em [`docs/tech-debt.md`](docs/tech-debt.md).

---

## 11. Pendências Funcionais

### Backend — Testes (foco atual)

| Camada | Escopo | Status |
|--------|--------|--------|
| Domain | 13/13 entidades e VOs (~107 testes) | ✅ Completo |
| Application | 60/60 Use Cases (~206 testes) | ✅ Completo |
| Presentation | 13/13 Controllers (~129 testes) | ✅ Completo |
| Infrastructure JPA | 7/7 adapters PostgreSQL (~46 testes) | ✅ Completo |
| Infrastructure Security | JwtTokenProvider unitário | ✅ Completo |
| Infrastructure MongoDB | 0/4 adapters (Title, Comment, Rating, News) | 🔲 Não iniciado |
| Security integrado | Fluxo Auth E2E com TestContainers | 🔲 Não iniciado |

### Frontend — Integração (próxima fase)

| Tarefa | Quantidade |
|--------|-----------|
| Conectar features à API real | 10 features |
| Implementar validação de formulários | 8 formulários |
| Implementar lazy loading (React.lazy) | 22+ rotas |
| Refatorar componentes grandes | ~9 páginas |

> Lista completa em [`docs/pending-tasks.md`](docs/pending-tasks.md).

---

## 12. Roadmap

```
[✅]  Fase 1-5: Backend features (domínios, use cases, endpoints, security, infra)
[✅]  Fase 6: Frontend UI (22+ páginas, 13 features, layout, guards)
[🔄]  Fase 7: Testes do backend ← ESTAMOS AQUI
        ├─ ✅ Domain entities e VOs (13/13)
        ├─ ✅ Use Cases unitários (60/60)
        ├─ ✅ Controllers MockMVC (13/13)
        ├─ ✅ Infrastructure JPA (7/7 adapters)
        ├─ ✅ JwtTokenProvider unitário
        ├─ 🔲 Infrastructure MongoDB (0/4 adapters — TestContainers)
        └─ 🔲 Security integrado (fluxo Auth E2E)
[🔲]  Fase 8: Integração frontend ↔ backend
        ├─ Migrar 10 features de mock → API real
        ├─ Testar auth end-to-end
        └─ Alinhar tipos e paginação
[🔲]  Fase 9: Qualidade e polish
        ├─ Testes frontend
        ├─ Validação de formulários
        ├─ Lazy loading / code splitting
        └─ Acessibilidade
[🔲]  Fase 10: Produção
        ├─ CI/CD pipeline (GitHub Actions)
        ├─ Infraestrutura cloud
        ├─ Deploy staging + produção
        └─ Monitoramento
```

> Plano detalhado de deploy em [`docs/deployment-plan.md`](docs/deployment-plan.md).

---

## Plano de Testes — Progresso

### Concluído

- **Domain (13/13)** — User, Title, Chapter(VO), Comment, Event, ForumReply, ForumTopic, Group, SavedManga, NewsItem, MangaRating, Store, Tag (~107 testes)
- **Application (60/60)** — Todos os use cases com mocks dos ports (~206 testes)
- **Presentation (13/13)** — Todos os controllers escritos (~129 testes) — **mas todos falhando** (ver abaixo)
- **Infrastructure parcial** — UserRepositoryAdapter, LibraryRepositoryAdapter, TagRepositoryAdapter (H2), JwtTokenProvider (unitário)

### Próximas etapas

1. **Infrastructure MongoDB** — adapters com TestContainers: Title, Comment, Rating, News
2. **Security integrado** — fluxo Auth completo (@SpringBootTest + TestContainers)
3. **CI** — GitHub Actions pipeline (JaCoCo já no pom.xml)

### Histórico de execução

| Data | Ação |
|------|------|
| 2026-03-09 | User — 4 testes unitários ✅ |
| 2026-03-09 | Documentação completa do projeto criada em `/docs` |
| 2026-03-10 | Domain completo — 13 entidades/VOs testadas ✅ |
| 2026-03-10 | Application completo — 60 use cases testados ✅ |
| 2026-03-11 | Presentation — 13 controllers escritos (todos falhando) |
| 2026-03-11 | Infrastructure parcial — 3 adapters JPA + JwtTokenProvider |
| 2026-03-12 | Fix: controllers corrigidos (TokenPort mock), TitleTest, JoinGroupUseCaseTest, TagRepositoryAdapterTest |
| 2026-03-12 | Infrastructure JPA completo — 4 novos adapters: Event, Store, Forum, Group (H2) |

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [`docs/overview.md`](docs/overview.md) | Visão geral, stack, arquitetura, fase de desenvolvimento |
| [`docs/frontend-analysis.md`](docs/frontend-analysis.md) | Análise técnica completa do frontend |
| [`docs/backend-analysis.md`](docs/backend-analysis.md) | Análise técnica completa do backend |
| [`docs/tech-debt.md`](docs/tech-debt.md) | 15 dívidas técnicas com impacto e prioridade |
| [`docs/pending-tasks.md`](docs/pending-tasks.md) | Tarefas pendentes organizadas por área + roadmap |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Variáveis, infra, build, Nginx, CI/CD, checklist de segurança |

---

## Contato

Projeto pessoal de estudo — Ruan.
