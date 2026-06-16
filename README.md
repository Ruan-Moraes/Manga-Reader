# Manga Reader

> Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade, eventos, assinaturas e sistema de avaliações.

---

## Status do Projeto

| | |
|---|---|
| **Etapa atual** | **Fase 9 — Qualidade e polish** |
| **Próxima etapa** | Fase 10 — Produção |
| **Build** | ✅ 2000 testes (1122 backend + 878 frontend) — **0 falhas** |

```
[✅] Fase 1-5: Backend (domínios, use cases, endpoints, security, infra)
[✅] Fase 6:   Frontend UI (páginas, features, layout, guards)
[✅] Fase 7:   Testes do backend (1122 testes — domain, app, presentation, infra JPA+MongoDB, Security E2E)
[✅] Fase 8:   Integração frontend ↔ backend (features com API real)
[🔄] Fase 9:   Qualidade e polish ← ETAPA ATUAL
       ├─ ✅ 9a: Biblioteca unificada + perfil (Library tabs, MyReviews, Profile stats)
       ├─ ✅ 9b: Redesign perfil unificado (recommendations, view history, privacy)
       │      └─ ✅ Modal de configurações do usuário (Informações/Redes/Recomendações/Grupos/Privacidade),
       │             aberto de "Editar perfil" e do avatar; distinto da página de config. de SISTEMA (/settings).
       │             Endpoints novos: `GET /api/users/me/groups`, `DELETE /api/users/me` (exclusão/anonimização).
       │             Recomendações limitadas a 6 (vitrine). i18n pt/en/es.
       ├─ ✅ 9c-testes: Testes frontend (50 arquivos, 340 testes — services, hooks, utils, componentes)
       ├─ ✅ 9d-i18n: Internacionalização (pt-BR, en-US, es-ES)
       │      ├─ ✅ Infra frontend (i18next + LanguageSwitcher + namespaces)
       │      ├─ ✅ Backend (MessageSource + DTOs + SecurityExceptionHandler + emails)
       │      ├─ ✅ DB-backed domain labels (LocalizedString JSONB, DomainLabelService)
       │      └─ ✅ Content vs UI language (User.contentLocales, LocaleResolutionService)
       └─ 🔲 9c-polish: Code splitting, Error Boundaries, @Transactional fixes, a11y
[🔲] Fase 10:  Produção (CI/CD, infra cloud, deploy, monitoramento)
```

> Convenções i18n consolidadas em [`docs/i18n-guide.md`](docs/i18n-guide.md). Pendências e dívidas técnicas em [`docs/tech-debt.md`](docs/tech-debt.md).

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
9. [Dívidas Técnicas e Roadmap](#9-dívidas-técnicas-e-roadmap)
10. [Sistema de Avaliações](#10-sistema-de-avaliações)
11. [Documentação](#11-documentação)

---

## 1. Visão Geral

O **Manga Reader** é uma plataforma web completa para leitura, catalogação e comunidade de mangás, manhwas e manhuas. Monorepo: backend Spring Boot + frontend React (pnpm workspace com múltiplos apps).

| Métrica | Valor |
|---------|-------|
| Domínios de negócio | **15** (Category, Comment, ErrorLog, Event, Forum, Group, Label, Library, Manga, News, Payment, Rating, Store, Subscription, User) — Auth via Security |
| Use Cases | **123** |
| REST Controllers | **26** |
| Repositórios JPA (PostgreSQL) | **14** |
| Repositórios MongoDB | **7** |
| Migrations Flyway | **19** |
| Apps frontend | **2** (manga-reader, landing-page) |
| Pacotes compartilhados frontend | **4** (assets, design-tokens, tsconfig, types) |
| Features frontend (manga-reader) | **17** módulos |
| Idiomas suportados | **3** (pt-BR padrão/fallback, en-US, es-ES) |
| Testes backend | **1122** (0 falhas) |
| Testes frontend | **878** (126 arquivos, 0 falhas) |

---

## 2. Arquitetura

### Backend — Clean Architecture (4 camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    presentation/                         │
│           26 Controllers  ·  DTOs  ·  Mappers           │
├─────────────────────────────────────────────────────────┤
│                    application/                          │
│           123 Use Cases  ·  Port Interfaces             │
├─────────────────────────────────────────────────────────┤
│                     domain/                              │
│      15 Domínios  ·  Entities  ·  Value Objects         │
├─────────────────────────────────────────────────────────┤
│                  infrastructure/                         │
│  Persistence · Security · Email · Messaging · Seed      │
└─────────────────────────────────────────────────────────┘
```

Dependência flui para dentro: `presentation → application → domain ← infrastructure`.

### Frontend — pnpm monorepo

```
frontend-apps/
├── manga-reader/      → app principal (17 features, layout, guards, HTTP client)
├── landing-page/      → app de landing
├── packages/
│   ├── assets/        → imagens e SVGs compartilhados
│   ├── design-tokens/ → tokens de design
│   ├── tsconfig/      → configs TypeScript base
│   └── types/         → tipos compartilhados
├── pnpm-workspace.yaml
└── package.json
```

### Dual Database

| Banco | Tech | Responsável por |
|-------|------|----------------|
| **PostgreSQL** | JPA/Hibernate + Flyway (22 migrations, 14 repos) | users, groups, events, forum, library, stores, tags, subscriptions, payments, domain labels |
| **MongoDB** | Spring Data Mongo + Mongock (9 migrations, 8 repos) | titles, **chapters** (coleção própria — DT-17, `GET /api/titles/{id}/chapters` paginado + `direction` asc/desc numérico — DT-19), comments, ratings, news, view history |

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Java | 23 (Temurin) | Linguagem principal |
| Spring Boot | 3.4.3 | Framework core |
| Spring Security | 6.x | Autenticação JWT (jjwt 0.12.6) |
| Spring Data JPA / MongoDB / Redis | — | Persistência + cache |
| Spring AMQP | — | Mensageria (RabbitMQ) |
| Spring Mail / Actuator | — | Emails + health/metrics |
| SpringDoc OpenAPI | 2.8.4 | Swagger UI |
| MapStruct | 1.6.3 | Mapeamento entity ↔ DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Flyway / Mongock | — / 5.5.0 | Migrations PostgreSQL / MongoDB |
| JaCoCo | 0.8.12 | Cobertura |
| TestContainers | 1.20.5 | Testes integração MongoDB + PostgreSQL (singleton por JVM) |
| Maven | 3.9.9 | Build |

### Frontend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| pnpm | workspace | Gerenciador monorepo |
| React | 19.1.0 | UI |
| TypeScript | 5.8.3 | Tipagem |
| Vite | 6.x | Build/dev server (SWC) |
| TailwindCSS | 4.x | Estilos |
| React Router | 6.x | Roteamento SPA |
| TanStack React Query | 5.x | Server state / cache |
| Axios | 1.x | HTTP client com interceptores |
| react-i18next | — | Internacionalização |
| Vitest + @testing-library/react + MSW v2 | — | Testes |

### Serviços de aplicação

| Serviço | Porta | Responsabilidade |
|---------|-------|------------------|
| `api/core` | 8080 | API principal (Clean Architecture, 12 domínios) |
| [`api/jobs/rating-aggregator`](api/jobs/rating-aggregator) | 8081 | Agregação de avaliações (`title_rating_aggregate`) |
| [`api/jobs/orphan-cleaner`](api/jobs/orphan-cleaner) | 8082 | Reconciliação dos contadores desnormalizados (drift) + limpeza de refs órfãs cross-DB |

### Infraestrutura (Docker Compose)

| Serviço | Versão | Porta |
|---------|--------|-------|
| PostgreSQL | 17 (alpine) | 5432 |
| MongoDB | 8.0 | 27017 |
| RabbitMQ | 4 (management) | 5672 / 15672 |
| Redis | 7 (alpine) | 6379 |

---

## 4. Pré-requisitos

- **Docker** e **Docker Compose** (bancos + testes de integração)
- **Java 23** (Temurin): `sdk install java 23.0.2-tem`
- **Maven 3.9.9**: `sdk install maven 3.9.9`
- **Node.js 18+** e **pnpm**: `npm i -g pnpm`

---

## 5. Como Executar

### Backend

```bash
cd api

# Contêineres Docker sobem automaticamente via spring-boot-docker-compose
mvn spring-boot:run

# Ou manualmente:
docker compose up -d && mvn spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- `DataSeeder` popula dados de demonstração (profile != prod)

### Frontend

```bash
cd web
pnpm install                      # instala todo o workspace

pnpm --filter manga-reader dev    # app principal (dev server, proxy /api → :8080)
pnpm --filter landing-page dev    # landing page
```

### Testes

```bash
# Backend (1122 testes)
cd api
mvn test                                    # Todos
mvn test -Dtest=**/domain/**/*Test          # Apenas domain
mvn test -Dtest=**/application/**/*Test     # Apenas use cases
mvn test -Dtest=**/presentation/**/*Test    # Apenas controllers
mvn test -Dtest=**/infrastructure/**/*Test  # JPA + MongoDB + Security
mvn test -Dtest.excludedGroups=testcontainers  # Suíte leve, SEM Docker (pula testes de container)

# Frontend (340 testes)
cd web
pnpm --filter manga-reader test             # Vitest
pnpm --filter manga-reader test:watch       # Watch mode
```

---

## 6. Estrutura do Projeto

```
Manga-Reader/
├── docs/                        # Documentação técnica
│   ├── tech-debt.md             # Dívidas técnicas + backlog (fonte única)
│   ├── deployment-plan.md       # Plano de deploy em produção
│   └── i18n-guide.md            # Convenções i18n consolidadas
│
├── backend/
│   ├── docker-compose.yml       # Infra de desenvolvimento
│   ├── docker-compose.prod.yml  # Infra de produção
│   ├── Dockerfile               # Multi-stage build (Maven → JRE)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/mangareader/
│       │   ├── domain/              # 15 domínios — entities, VOs, enums
│       │   ├── application/         # 123 use cases + port interfaces
│       │   ├── infrastructure/      # Persistence (14 JPA + 7 Mongo), Security, Email, Messaging, Seed
│       │   ├── presentation/        # 26 controllers + DTOs + MapStruct mappers
│       │   └── shared/              # ApiResponse, PageResponse, i18n, exceptions, configs
│       └── test/java/com/mangareader/   # domain / application / presentation / infrastructure
│
└── frontend-apps/                # pnpm workspace
    ├── manga-reader/src/         # app principal (app/, feature/, shared/, test/, style/)
    ├── landing-page/             # app de landing
    └── packages/                 # assets, design-tokens, tsconfig, types
```

---

## 7. Testes

**170+ arquivos · 1397 testes · 0 falhas**

### Backend — 1122 testes

| Camada | Anotação | Abordagem |
|--------|----------|-----------|
| Domain | Nenhuma | JUnit 5 puro, sem Spring (entities, sub-entities, VOs, enums) |
| Application | `@ExtendWith(MockitoExtension)` | Mockito mocks dos ports |
| Presentation | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | MockMvc + `@MockitoBean TokenPort` |
| Infrastructure JPA | `@DataJpaTest` + `@ActiveProfiles("test")` | H2 in-memory |
| Infrastructure MongoDB | `@DataMongoTest` + `@Import(MongoTestContainerConfig)` | TestContainers (mongo:8.0) |
| Security E2E | `@SpringBootTest` | Fluxo Auth completo (sign-up → login → JWT → refresh → /me) |

### Frontend — 340 testes (50 arquivos)

| Camada | Abordagem |
|--------|-----------|
| Services | MSW v2 + Vitest (intercepta Axios no nível de rede) |
| Hooks | `renderHookWithProviders` + React Query + MSW |
| Componentes | `render` + @testing-library/react + MSW |
| Utilities | Vitest puro (formatters, validators, apiErrorMessages) |

Stack: Vitest 4.x + @testing-library/react 16.x + MSW v2.

### Pendente

- **Frontend E2E**: considerar Playwright para fluxos auth e navegação.

---

## 8. API — Endpoints

São **26 controllers REST**. A referência completa e sempre atualizada está no **Swagger UI**:

> `http://localhost:8080/swagger-ui.html`

Grupos principais por domínio: `auth`, `titles`, `chapters`, `comments`, `ratings`, `library`, `groups`, `news`, `events`, `forum`, `stores`, `tags`, `labels`, `subscriptions`, `payments`, `users`.

### Padrões de resposta

**Resposta simples** — `ApiResponse<T>`:
```json
{ "data": "T", "success": true, "message": "...", "statusCode": 200 }
```

**Resposta paginada** — `ApiResponse<PageResponse<T>>`:
```json
{ "data": { "content": [], "page": 0, "size": 20, "totalElements": 100, "totalPages": 5, "last": false }, "success": true }
```

Endpoints de listagem **devem** retornar `ApiResponse<PageResponse<T>>`; item único retorna `ApiResponse<T>`.

---

## 9. Dívidas Técnicas e Roadmap

Para evitar duplicação e drift, dívidas técnicas e roadmap são mantidos como **fonte única** em `docs/`:

| Documento | Conteúdo |
|-----------|----------|
| [`docs/tech-debt.md`](docs/tech-debt.md) | Dívidas técnicas + backlog de produto (prioridade e impacto) |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Plano de produção (infra, CI/CD, segurança) |

Resumo das pendências de alto nível: `@Transactional` em use cases multi-repository, code splitting / Error Boundaries no frontend, acessibilidade (ARIA), CI/CD pipeline, infra cloud + deploy.

---

## 10. Sistema de Avaliações

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
| `rankingScore` | Score ponderado para ranking |

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/ratings/title/{id}` | Lista avaliações (paginado) |
| `GET` | `/api/ratings/title/{id}/average` | Média de estrelas + contagem |
| `GET` | `/api/ratings/title/{id}/distribution` | Contagem por faixa de estrela (1–5) + total — agregação Mongo (`$round` do `overallRating`) |
| `GET` | `/api/ratings/user` | Avaliações do usuário logado |
| `POST` | `/api/ratings` | Submete/atualiza avaliação (6 categorias + comentário + título/spoiler) |
| `PUT` | `/api/ratings/{id}` | Atualiza avaliação |
| `DELETE` | `/api/ratings/{id}` | Remove avaliação |
| `POST` | `/api/ratings/{id}/vote` | Vota Útil/Contrário (`{value: "up"｜"down"}`, toggle; 1 voto/usuário; não vota a própria) |
| `DELETE` | `/api/ratings/{id}/vote` | Remove o voto do usuário |

> **Frontend:** a aba de avaliações da obra implementa o wizard de 6 categorias
> (`RatingWizard`), o gráfico de distribuição consome `/distribution` (dados
> reais — substituiu percentuais hardcoded) e os votos Útil/Contrário no `ReviewCard`
> chamam `/vote` (DT-45). Campos avançados (`reviewTitle`, `spoiler`, `top`, `upvotes`,
> `downvotes`, `myVote`) vêm do backend.

### Job Periódico

> **Status:** `ratingAverage` e `rankingScore` na entidade Title **ainda não são calculados por job periódico**. Hoje são preenchidos pelo `DataSeeder` com valores de demonstração.

---

## 11. Documentação

| Documento | Descrição |
|-----------|-----------|
| [`CLAUDE.md`](CLAUDE.md) | Arquitetura, patterns e convenções do projeto |
| [`docs/tech-debt.md`](docs/tech-debt.md) | Dívidas técnicas + backlog de produto (impacto + prioridade) |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Variáveis, infra, build, Nginx, CI/CD, segurança |
| [`docs/i18n-guide.md`](docs/i18n-guide.md) | Convenções i18n consolidadas (catálogo + UGC) |
| [`frontend-apps/manga-reader/src/i18n/locales/README.md`](web/manga-reader/src/i18n/locales/README.md) | Guia dos arquivos de tradução (react-i18next) |
| Swagger UI (`/swagger-ui.html`) | Referência viva da API REST |

---

Projeto pessoal de estudo — Ruan.
</content>
</invoke>
