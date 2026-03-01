# Manga Reader

> Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade, eventos e sistema de avaliações.

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
| Arquivos Java (backend) | **180** |
| Domínios implementados | **12** (Auth, Manga, Chapter, Comment, Rating, Library, Group, News, Event, Forum, Category/Tag, Store) |
| Endpoints REST | **~40** |
| Frontend services | **13** (todos ainda em mock) |
| Testes automatizados | **1** (context load — mínimo) |

---

## 2. Arquitetura

### Clean Architecture (4 camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    presentation/                         │
│         Controllers  ·  DTOs  ·  Mappers                │
├─────────────────────────────────────────────────────────┤
│                    application/                          │
│            Use Cases  ·  Port Interfaces                │
├─────────────────────────────────────────────────────────┤
│                     domain/                              │
│         Entities  ·  Value Objects  ·  Enums             │
├─────────────────────────────────────────────────────────┤
│                  infrastructure/                         │
│   Adapters · Repositories · Security · Seed · Config    │
└─────────────────────────────────────────────────────────┘
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
| SpringDoc OpenAPI | 2.8.4 | Documentação Swagger UI |
| MapStruct | 1.6.3 | Mapeamento DTO (parcial — maioria usa mappers estáticos) |
| Lombok | — | Redução boilerplate |
| Flyway | — | Migrations SQL (configurado, **não utilizado ainda**) |
| Maven | 3.9.9 | Build |

### Frontend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 19 | UI |
| TypeScript | — | Tipagem |
| Vite | — | Build/dev server |
| TailwindCSS | — | Estilos |
| Axios | — | HTTP client (pronto, **não utilizado ainda**) |
| React Query | — | Cache/state (parcial) |

### Infraestrutura

| Serviço | Versão | Porta | Status |
|---------|--------|-------|--------|
| PostgreSQL | 17 (alpine) | 5432 | ✅ Em uso |
| MongoDB | 8.0 | 27017 | ✅ Em uso |
| RabbitMQ | 4 (management) | 5672/15672 | ⚠️ Contêiner sobe, **não utilizado no código** |
| Redis | 7 (alpine) | 6379 | ⚠️ Contêiner sobe, **não utilizado no código** |

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
├── backend/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/mangareader/
│       ├── domain/              # Entidades, Value Objects, Enums
│       │   ├── category/        # Tag (entity) + PublicationStatus, SortCriteria (enums)
│       │   ├── comment/         # Comment (MongoDB)
│       │   ├── event/           # Event, EventTicket, EventParticipant + VOs
│       │   ├── forum/           # ForumTopic, ForumReply + ForumCategory
│       │   ├── group/           # Group, GroupMember, GroupWork + enums
│       │   ├── library/         # SavedManga + ReadingListType
│       │   ├── manga/           # Title (MongoDB), Chapter (VO)
│       │   ├── news/            # NewsItem (MongoDB) + NewsAuthor, NewsCategory, NewsReaction
│       │   ├── rating/          # MangaRating (MongoDB)
│       │   ├── store/           # Store + StoreAvailability
│       │   └── user/            # User, UserSocialLink + UserRole
│       ├── application/         # Use Cases + Ports (interfaces)
│       │   ├── auth/            # SignIn, SignUp, RefreshToken
│       │   ├── category/        # GetTags, GetTagById, SearchTags
│       │   ├── comment/         # CRUD + ReactToComment
│       │   ├── event/           # GetEvents, GetById, GetByStatus
│       │   ├── forum/           # CRUD + CreateReply
│       │   ├── group/           # CRUD + Join
│       │   ├── library/         # Save, Remove, ChangeList, GetLibrary
│       │   ├── manga/           # GetTitles, GetById, Search, Genre, Filter
│       │   ├── news/            # GetNews, GetById, GetByCategory, Search
│       │   ├── rating/          # Submit, Delete, GetByTitle, GetAverage, GetUser
│       │   └── store/           # GetStores, GetById
│       ├── infrastructure/
│       │   ├── persistence/     # JPA/Mongo repositories + adapters
│       │   ├── security/        # JWT filter, provider, SecurityConfig
│       │   └── seed/            # DataSeeder (dados de demonstração)
│       ├── presentation/        # Controllers + DTOs + Mappers
│       └── shared/              # ApiResponse, PageResponse, exceptions, configs
│
└── frontend/
    └── src/
        ├── app/                 # Layout, rotas, router
        ├── feature/             # 13 módulos (auth, manga, comment, rating, etc.)
        ├── mock/                # Dados mock (ainda em uso por TODOS os services)
        ├── shared/              # Componentes, constantes, HTTP client, types
        └── style/               # CSS global
```

---

## 7. Estado Atual da Implementação

### Fases concluídas

| Fase | Escopo | Arquivos | Status |
|------|--------|----------|--------|
| **Fase 0** | Foundation — scaffold, Docker, Clean Architecture, configs | 55 | ✅ Concluída |
| **Fase 1** | Auth (JWT) + Manga (CRUD + busca) | +25 = 80 | ✅ Concluída |
| **Fase 2** | Comments (CRUD + reações) + Ratings (CRUD + médias) | +24 = 104 | ✅ Concluída |
| **Fase 3** | Library (salvar/remover/lista) + Groups (CRUD + join) | +24 = 128 | ✅ Concluída |
| **Fase 4** | News + Events + Forum | +34 = 162 | ✅ Concluída |
| **Fase 5** | Category/Tags + Store + Filtro avançado de títulos | +18 = 180 | ✅ Concluída |

### Cobertura CRUD por controller

| Controller | GET | POST | PUT | PATCH | DELETE | Avaliação |
|-----------|-----|------|-----|-------|--------|-----------|
| AuthController | — | sign-in, sign-up, refresh | — | — | — | Parcial (falta forgot/reset password, `/me`) |
| TagController | all, byId, search | — | — | — | — | Read-only (adequado) |
| TitleController | all, byId, search, genre, filter | — | — | — | — | Read-only (adequado para público) |
| CommentController | byTitle | create, like, dislike | update | — | delete | **CRUD completo** |
| RatingController | byTitle, average, user | submit | — | — | delete | Falta update |
| LibraryController | userLibrary | save | — | changeList | remove | **CRUD completo** |
| GroupController | all, byId, byUsername | create, join | — | — | — | Falta update, delete, leave |
| NewsController | all, byId, byCategory, search | — | — | — | — | Read-only |
| EventController | all, byId, byStatus | — | — | — | — | Read-only |
| ForumController | all, byId, byCategory | createTopic, createReply | — | — | — | Falta update, delete |
| StoreController | all, byId | — | — | — | — | Read-only |

### Ports × Adapters

| Port | Adapter | Status |
|------|---------|--------|
| UserRepositoryPort | UserRepositoryAdapter | ✅ |
| TitleRepositoryPort | TitleRepositoryAdapter | ✅ |
| CommentRepositoryPort | CommentRepositoryAdapter | ✅ |
| RatingRepositoryPort | RatingRepositoryAdapter | ✅ |
| LibraryRepositoryPort | LibraryRepositoryAdapter | ✅ |
| GroupRepositoryPort | GroupRepositoryAdapter | ✅ |
| NewsRepositoryPort | NewsRepositoryAdapter | ✅ |
| EventRepositoryPort | EventRepositoryAdapter | ✅ |
| ForumRepositoryPort | ForumRepositoryAdapter | ✅ |
| TagRepositoryPort | TagRepositoryAdapter | ✅ |
| StoreRepositoryPort | StoreRepositoryAdapter | ✅ |
| **TokenPort** | — | ❌ **Sem adapter** (JwtTokenProvider existe mas não implementa o port) |

### Entidades sem use cases

| Entidade | Motivo |
|----------|--------|
| `EventParticipant` | Nenhum endpoint de participação em eventos |
| `EventTicket` | Gerenciado inline com Event, mas sem CRUD próprio |
| `GroupWork` | Obras do grupo — seed existe, mas sem CRUD |
| `User` (perfil) | Apenas auth existe; sem controller de perfil |
| `UserSocialLink` | Sem CRUD — valor criado no seed |

---

## 8. API — Endpoints Disponíveis

### Auth (`/api/auth`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/sign-in` | Não | Login com email/senha |
| POST | `/api/auth/sign-up` | Não | Registro |
| POST | `/api/auth/refresh` | Não | Renovar access token |

### Titles (`/api/titles`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/titles` | Não | Listar todos |
| GET | `/api/titles/{id}` | Não | Por ID |
| GET | `/api/titles/search?q=` | Não | Busca por nome |
| GET | `/api/titles/genre/{genre}` | Não | Por gênero |
| GET | `/api/titles/filter?genres=a,b&sort=MOST_READ` | Não | Busca avançada multi-gênero + ordenação |

### Tags (`/api/tags`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/tags` | Não | Todas (ordenadas A-Z) |
| GET | `/api/tags/{id}` | Não | Por ID |
| GET | `/api/tags/search?q=` | Não | Busca parcial |

### Comments (`/api/comments`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/comments/title/{titleId}` | Não | Comentários de um título |
| POST | `/api/comments` | Sim | Criar comentário |
| PUT | `/api/comments/{id}` | Sim | Editar comentário |
| DELETE | `/api/comments/{id}` | Sim | Remover comentário |
| POST | `/api/comments/{id}/like` | Sim | Like |
| POST | `/api/comments/{id}/dislike` | Sim | Dislike |

### Ratings (`/api/ratings`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/ratings/title/{titleId}` | Não | Avaliações de um título |
| GET | `/api/ratings/title/{titleId}/average` | Não | Média de avaliações |
| GET | `/api/ratings/user` | Sim | Minhas avaliações |
| POST | `/api/ratings` | Sim | Submeter avaliação |
| DELETE | `/api/ratings/{id}` | Sim | Remover avaliação |

### Library (`/api/library`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/library` | Sim | Minha biblioteca |
| POST | `/api/library` | Sim | Salvar título |
| PATCH | `/api/library/{titleId}` | Sim | Mudar lista de leitura |
| DELETE | `/api/library/{titleId}` | Sim | Remover da biblioteca |

### Groups (`/api/groups`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/groups` | Não | Listar todos |
| GET | `/api/groups/{id}` | Não | Por ID |
| GET | `/api/groups/username/{username}` | Não | Por username |
| POST | `/api/groups` | Sim | Criar grupo |
| POST | `/api/groups/{id}/join` | Sim | Entrar no grupo |

### News (`/api/news`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/news` | Não | Todas as notícias |
| GET | `/api/news/{id}` | Não | Por ID |
| GET | `/api/news/category/{category}` | Não | Por categoria |
| GET | `/api/news/search?q=` | Não | Busca por título |

### Events (`/api/events`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/events` | Não | Todos os eventos |
| GET | `/api/events/{id}` | Não | Por ID |
| GET | `/api/events/status/{status}` | Não | Por status |

### Forum (`/api/forum`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/forum?page=0&size=20&sort=createdAt&direction=desc` | Não | Tópicos paginados |
| GET | `/api/forum/{id}` | Não | Tópico com respostas |
| GET | `/api/forum/category/{category}` | Não | Por categoria |
| POST | `/api/forum` | Sim | Criar tópico |
| POST | `/api/forum/{id}/replies` | Sim | Responder tópico |

### Stores (`/api/stores`)

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/api/stores` | Não | Todas as lojas |
| GET | `/api/stores/{id}` | Não | Por ID |

---

## 9. Cobertura Frontend × Backend

### Status de migração dos services

**Nenhum** service do frontend foi migrado para consumir a API real. Todos os 13 services usam `simulateDelay()` + dados mock. O HTTP client (Axios) está pronto com interceptors, injeção de Bearer token e tratamento de erro, mas **não é usado por nenhum service**.

### Endpoints que o frontend espera mas o backend NÃO tem

| Funcionalidade | Endpoint esperado | Prioridade |
|---------------|-------------------|-----------|
| Capítulos de um título | `GET /api/titles/{id}/chapters` | 🔴 Alta |
| Capítulo por número | `GET /api/titles/{id}/chapters/{num}` | 🔴 Alta |
| Perfil do usuário logado | `GET /api/auth/me` | 🔴 Alta |
| Atualizar perfil | `PATCH /api/users/me` | 🟡 Média |
| Recuperação de senha | `POST /api/auth/forgot-password` | 🟡 Média |
| Resetar senha | `POST /api/auth/reset-password` | 🟡 Média |
| Atualizar avaliação | `PUT /api/ratings/{id}` | 🟡 Média |
| Lojas por título | `GET /api/stores/title/{titleId}` | 🟡 Média |
| Grupos por título | `GET /api/groups/title/{titleId}` | 🟡 Média |
| Notícias relacionadas | `GET /api/news/{id}/related` | 🟢 Baixa |
| Fontes de notícias | `GET /api/news/sources` | 🟢 Baixa |
| Eventos relacionados | `GET /api/events/{id}/related` | 🟢 Baixa |
| Categorias do fórum (lista) | `GET /api/forum/categories` | 🟢 Baixa |
| Membro por ID | `GET /api/groups/members/{id}` | 🟢 Baixa |

### Endpoints do backend que o frontend ainda não consome

| Backend pronto | Frontend service não usa |
|---------------|------------------------|
| `POST /api/auth/sign-up` | Sem service call de sign-up real |
| `POST /api/auth/refresh` | Sem auto-refresh de token |
| `GET /api/tags/search?q=` | Frontend não busca tags via API |
| `GET /api/titles/filter` | Frontend filtra client-side |
| `GET /api/news/search` | Frontend filtra client-side |
| `GET /api/news/category/{cat}` | Frontend filtra client-side |
| `POST /api/forum` | Frontend não cria tópicos via API |
| `POST /api/forum/{id}/replies` | Frontend não cria replies via API |
| `POST /api/groups` | Frontend não cria grupos via API |
| `POST /api/groups/{id}/join` | Frontend não entra em grupo via API |

---

## 10. Dívidas Técnicas

### 🔴 Críticas

| # | Dívida | Descrição | Impacto |
|---|--------|-----------|---------|
| 1 | **Zero testes** | Apenas 1 teste (context load). Sem testes unitários, de integração ou de controller. Testcontainers e spring-security-test estão comentados no POM. | Risco alto de regressão |
| 2 | **Sem migrations (Flyway/Mongock)** | Schema PostgreSQL gerenciado por `ddl-auto: update`. Sem migration files. Flyway desabilitado. Mongock não configurado. | Schema drift, impossível rollback |
| 3 | **JWT secret hardcoded** | Secret fixo em `application.yml` no profile padrão. Sem rotação de chaves. | Vulnerabilidade em qualquer deploy não-dev |
| 4 | **TokenPort sem adapter** | O port `TokenPort` existe na camada de aplicação mas `JwtTokenProvider` não o implementa formalmente. | Quebra do princípio de inversão de dependência |
| 5 | **`ddl-auto: update` em dev** | Hibernate gerencia o schema sem controle de versão. Já marcado como TODO para trocar pra `validate`. | Mudanças de schema não rastreáveis |

### 🟡 Importantes

| # | Dívida | Descrição |
|---|--------|-----------|
| 6 | **Redis não utilizado** | Contêiner sobe no Docker Compose, dependency comentada no POM. Nenhum `@Cacheable` ou uso de cache. |
| 7 | **RabbitMQ não utilizado** | Contêiner sobe, dependency comentada. Nenhum producer/consumer implementado. Planejado para `rating.submitted`, `user.profile.updated`. |
| 8 | **Frontend 100% mock** | Nenhum dos 13 services consome a API real. HTTP client Axios pronto mas não utilizado. |
| 9 | **Sem rate limiting** | Nenhum mecanismo de proteção contra abuso (Bucket4j, Resilience4j, etc.). |
| 10 | **Sem logback.xml** | Logging usa apenas config do `application.yml`. Sem rotação de logs, sem formato JSON para produção. |
| 11 | **MapStruct parcialmente usado** | Declarado no POM com processor, mas todos os mappers são manuais (classes estáticas `*Mapper`). |
| 12 | **Sem validação em alguns DTOs** | Requests como `SaveToLibraryRequest`, `ChangeListRequest` podem não ter `@Valid` completo. |
| 13 | **Sem paginação em vários endpoints** | Titles, Comments, Ratings, News, Events, Groups retornam listas completas sem paginação. Apenas Forum usa `PageResponse`. |

### 🟢 Menores

| # | Dívida | Descrição |
|---|--------|-----------|
| 14 | **Java 23 vs README** | README de arquitetura menciona Java 21 LTS, mas `pom.xml` e SDKMAN usam Java 23. |
| 15 | **Seed data em produção** | `DataSeeder` roda em `@Profile("!test")` — rodaria em prod se não houver cuidado. Deveria ser `@Profile("dev")`. |
| 16 | **ForumMapper `postCount` hardcoded** | `ForumMapper` retorna `postCount = 0` para todos os autores (placeholder). |
| 17 | **Sem HATEOAS** | Respostas não incluem links de navegação entre recursos. |
| 18 | **Sem versionamento de API** | Endpoints em `/api/` sem prefixo de versão (`/api/v1/`). |

---

## 11. Pendências Funcionais

### Endpoints que precisam ser criados

| Prioridade | Endpoint | Domínio | Descrição |
|-----------|----------|---------|-----------|
| 🔴 | `GET /api/titles/{id}/chapters` | Chapter | Listar capítulos de um título |
| 🔴 | `GET /api/titles/{id}/chapters/{num}` | Chapter | Ler capítulo específico |
| 🔴 | `GET /api/auth/me` | Auth | Retornar dados do usuário logado |
| 🟡 | `POST /api/auth/forgot-password` | Auth | Solicitar recuperação de senha |
| 🟡 | `POST /api/auth/reset-password` | Auth | Resetar senha com token |
| 🟡 | `PUT /api/ratings/{id}` | Rating | Atualizar avaliação existente |
| 🟡 | `PATCH /api/users/me` | User | Atualizar perfil |
| 🟡 | `GET /api/stores/title/{titleId}` | Store | Lojas que vendem um título |
| 🟡 | `PUT /api/forum/{id}` | Forum | Editar tópico |
| 🟡 | `DELETE /api/forum/{id}` | Forum | Remover tópico |
| 🟡 | `PUT /api/groups/{id}` | Group | Editar grupo |
| 🟡 | `DELETE /api/groups/{id}/leave` | Group | Sair do grupo |
| 🟢 | `GET /api/news/{id}/related` | News | Notícias relacionadas |
| 🟢 | `GET /api/events/{id}/related` | Event | Eventos relacionados |
| 🟢 | `GET /api/forum/categories` | Forum | Lista de categorias disponíveis |
| 🟢 | `POST /api/events/{id}/participate` | Event | Participar de evento |

### Use cases que precisam ser criados

| Entidade | Use Case faltante |
|----------|-------------------|
| Chapter | GetChaptersByTitle, GetChapterByNumber |
| User | GetProfile, UpdateProfile |
| EventParticipant | ParticipateInEvent, CancelParticipation |
| GroupWork | AddWorkToGroup, RemoveWorkFromGroup |
| Rating | UpdateRating |
| ForumTopic | UpdateTopic, DeleteTopic |
| Group | UpdateGroup, LeaveGroup, DeleteGroup |

### Migração Frontend → API real

Para cada service, a migração envolve:

1. Substituir `simulateDelay()` + mock data por chamada ao `api` (Axios client)
2. Mapear resposta `ApiResponse<T>` para o tipo esperado
3. Remover import do `@mock/data/*`
4. Configurar `VITE_API_BASE_URL` no `.env`

**Ordem sugerida de migração:**

| # | Service | Justificativa |
|---|---------|---------------|
| 1 | `authService.ts` | Fundação — todos os outros services autenticados dependem dela |
| 2 | `titleService.ts` | Core do produto — catálogo |
| 3 | `tagService.ts` | Complementar ao catálogo (filtros) |
| 4 | `chapterService.ts` | Core — leitura de capítulos (requer backend endpoint novo) |
| 5 | `commentService.ts` | Interação social primária |
| 6 | `ratingService.ts` | Interação social |
| 7 | `libraryService.ts` | Funcionalidade pessoal chave |
| 8 | `storeService.ts` | Complementar |
| 9 | `groupService.ts` | Comunidade |
| 10 | `newsService.ts` | Conteúdo editorial |
| 11 | `eventService.ts` | Conteúdo editorial |
| 12 | `forumService.ts` | Comunidade |
| 13 | `userService.ts` | Requer backend endpoints novos |

---

## 12. Roadmap

### Fase 6 — Capítulos + Perfil + Auth completo

- [ ] Criar `ChapterController` com endpoints de leitura
- [ ] Criar `GET /api/auth/me` retornando dados do usuário logado
- [ ] Criar `UserController` para CRUD de perfil
- [ ] Implementar forgot/reset password (requer configuração de e-mail ou token simples)
- [ ] Corrigir `TokenPort` para que `JwtTokenProvider` implemente a interface
- [ ] Adicionar `PUT /api/ratings/{id}` (update rating)

### Fase 7 — Testes

- [ ] Descomentar Testcontainers no POM (PostgreSQL + MongoDB)
- [ ] Descomentar `spring-security-test`
- [ ] Escrever testes unitários para todos os use cases
- [ ] Escrever testes de integração para os repositories/adapters
- [ ] Escrever testes de controller (`@WebMvcTest` ou `MockMvc`)
- [ ] Atingir cobertura mínima de 80%

### Fase 8 — Migrations

- [ ] Gerar migration Flyway V1 a partir do schema atual (dump do PostgreSQL)
- [ ] Habilitar Flyway em dev (`enabled: true`)
- [ ] Trocar `ddl-auto: update` para `ddl-auto: validate`
- [ ] Configurar Mongock para MongoDB (indexes, collections)

### Fase 9 — Cache + Mensageria

- [ ] Descomentar dependências Redis e RabbitMQ no POM
- [ ] Configurar `@EnableCaching` + `@Cacheable` nos endpoints de leitura mais acessados
- [ ] Implementar consumer RabbitMQ para `rating.submitted` (recalcular média)
- [ ] Implementar consumer para `user.profile.updated` (desnormalização MongoDB)

### Fase 10 — Polish + Produção

- [ ] Adicionar paginação em todos os endpoints de listagem
- [ ] Implementar rate limiting (Bucket4j)
- [ ] Criar `logback-spring.xml` com formato JSON e rotação
- [ ] Adicionar versionamento de API (`/api/v1/`)
- [ ] Configurar HTTPS/TLS
- [ ] Revisar `DataSeeder` para rodar apenas com `@Profile("dev")`
- [ ] Pipeline CI/CD (build + test + Docker image + deploy)
- [ ] Monitoramento com Prometheus + Grafana (via Spring Actuator)

### Fase 11 — Migração Frontend

- [ ] Migrar `authService.ts` (sign-in, sign-up, refresh, me)
- [ ] Migrar `titleService.ts` + `chapterService.ts`
- [ ] Migrar `commentService.ts` + `ratingService.ts`
- [ ] Migrar `libraryService.ts` + `tagService.ts`
- [ ] Migrar services restantes
- [ ] Remover diretório `@mock/` e `mockApi.ts`
- [ ] Configurar `.env` com `VITE_API_BASE_URL=http://localhost:8080`

---

## Contato

Projeto pessoal de estudo — Ruan.
