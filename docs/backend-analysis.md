# Manga Reader — Análise Técnica do Backend

> Última atualização: 25 de março de 2026

---

## 1. Stack Tecnológica

| Dependência | Versão | Função |
|------------|--------|--------|
| Spring Boot | 3.4.3 | Framework principal |
| Java | 23 | Linguagem |
| Spring Data JPA | — | ORM para PostgreSQL |
| Spring Data MongoDB | — | ODM para MongoDB |
| Spring Security | — | Autenticação e autorização |
| Spring Data Redis | — | Cache |
| Spring AMQP | — | Mensageria (RabbitMQ) |
| Spring Mail | — | Envio de emails |
| Spring Actuator | — | Health checks e métricas |
| Spring Validation | — | Validação de beans |
| PostgreSQL | 17 | Banco relacional |
| MongoDB | 8.0 | Banco documental |
| Redis | 7 | Cache (TTL: 5 min) |
| RabbitMQ | 4 | Mensageria assíncrona |
| Flyway | — | Migrações PostgreSQL |
| Mongock | — | Migrações MongoDB |
| jjwt | 0.12.6 | Tokens JWT (HS256) |
| MapStruct | 1.6.3 | Mapeamento entity ↔ DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Springdoc OpenAPI | 2.8.4 | Documentação Swagger |
| BCrypt | — | Hash de senhas |

### Dependências de Teste (todas em uso)

| Dependência | Função |
|------------|--------|
| JUnit 5 (Jupiter) | Framework de testes (727 testes) |
| H2 Database | Banco em memória para testes JPA |
| TestContainers | Containers Docker para testes MongoDB (mongo:8.0) |
| Spring Security Test | Testes E2E de segurança |
| MockMVC | Testes de controllers (@WebMvcTest) |
| Mockito | Mocks para testes de use cases |

---

## 2. Arquitetura

### Padrão: Clean Architecture (4 camadas)

```
┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Camada de Apresentação)                 │
│  13 REST Controllers, 74 endpoints, JSON I/O                 │
│  Responsabilidade: Recebe HTTP, valida input, delega         │
├──────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER (Camada de Aplicação)                     │
│  70 Use Cases, port-driven design, DTOs (records)            │
│  Responsabilidade: Orquestra lógica de negócio               │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER (Camada de Domínio)                            │
│  11 Domínios (User, Manga, Comment, Forum, etc.)             │
│  Responsabilidade: Entidades e regras de negócio puras       │
├──────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (Camada de Infraestrutura)             │
│  PostgreSQL, MongoDB, Email, RabbitMQ, Redis, Security       │
│  Responsabilidade: Implementações concretas dos ports        │
└──────────────────────────────────────────────────────────────┘
```

**Classe Principal**: `com.mangareader.MangaReaderApplication`

**Padrão de Use Case**: Cada use case tem responsabilidade única com Input/Output baseados em Java records. Dependências injetadas via ports (interfaces) definidos na camada de aplicação.

---

## 3. Camada de Domínio (12 Domínios)

### 3.1. User (PostgreSQL)

```
User {
  id: UUID (PK)
  name: String(100)
  email: String(255) [UNIQUE]
  passwordHash: String
  bio: String(500)
  photoUrl: String
  bannerUrl: String
  role: Enum(MEMBER, ADMIN)
  commentVisibility: Enum(PUBLIC, FRIENDS_ONLY, PRIVATE)
  viewHistoryVisibility: Enum(PUBLIC, FRIENDS_ONLY, PRIVATE)
  socialLinks: List<UserSocialLink>
  recommendations: List<UserRecommendation>
  createdAt, updatedAt: Timestamp
}

UserSocialLink {
  id: UUID (PK)
  userId: UUID (FK → users)
  platform: String(50) [github, twitter, etc.]
  url: String(500)
}

UserRecommendation {
  id: UUID (PK)
  userId: UUID (FK → users)
  titleId: String [ref MongoDB]
  titleName: String
  position: Integer [default 0]
}

ViewHistory (MongoDB — coleção `view_history`) {
  id: String (ObjectId)
  userId: String [Indexed]
  titleId: String
  titleName: String
  titleCover: String
  viewedAt: Timestamp [Indexed]
  Compound Index: (userId, titleId)
}
```

### 3.2. Title / Manga (MongoDB — coleção `titles`)

```
Title {
  id: String (ObjectId)
  type: String [Manga, Manhwa, Manhua]
  name: String [Full-text index, weight=10]
  synopsis: String [Full-text index, weight=3]
  cover: String (URL)
  genres: List<String> [Indexed]
  chapters: List<Chapter> {
    number: Integer
    title: String
    releaseDate: Date
    pages: List<String> (URLs)
  }
  popularity: String [Indexed]
  score: String
  author: String [Full-text index, weight=5]
  artist, publisher: String
  createdAt, updatedAt: Timestamp
}
```

### 3.3. Comment (MongoDB — coleção `comments`)

```
Comment {
  id: String (ObjectId)
  titleId: String [Indexed]
  parentCommentId: String [Indexed, null se root]
  userId: String [Indexed]
  userName, userPhoto: String
  textContent, imageContent: String
  isHighlighted, wasEdited: Boolean
  likeCount, dislikeCount: Integer
  createdAt: Timestamp
}
```

### 3.4. Forum Topic e Reply (PostgreSQL)

```
ForumTopic {
  id: UUID (PK)
  authorId: UUID (FK → users)
  title: String(300)
  content: TEXT
  category: Enum
  tags: JSONB
  viewCount, replyCount, likeCount: Integer
  isPinned, isLocked, isSolved: Boolean
  createdAt, lastActivityAt: Timestamp
}

ForumReply {
  id: UUID (PK)
  topicId: UUID (FK → forum_topics)
  authorId: UUID (FK → users)
  content: TEXT
  likes: Integer
  isEdited, isBestAnswer: Boolean
  createdAt: Timestamp
}
```

### 3.5. Event (PostgreSQL)

```
Event {
  id: UUID (PK)
  title: String(200)
  subtitle, description: String
  image: String, gallery: JSONB []
  startDate, endDate: Timestamp
  timezone: String(50)
  timeline: Enum [PAST, UPCOMING, ONGOING]
  status: Enum [NOW_BOOKING, SOON, LIVE, FINISHED, CANCELLED]
  type: Enum [CONFERENCE, MEETUP, WORKSHOP]
  location: Embedded {label, address, city, isOnline, mapLink, directions}
  organizer: Embedded {organizerId, name, avatar, profileLink, contact}
  priceLabel: String(100)
  participants, interested: Integer
  isFeatured: Boolean
  schedule, specialGuests, socialLinks: JSONB
  createdAt, updatedAt: Timestamp
}

EventTicket {
  id: UUID (PK), eventId: UUID (FK → events)
  name: String(100), price: String(50), available: Integer
}

EventParticipant {
  id: UUID (PK), eventId+userId: FK [UNIQUE]
  joinedAt: Timestamp
}
```

### 3.6. Group (PostgreSQL)

```
Group {
  id: UUID (PK)
  name: String(100), username: String(50) [UNIQUE]
  logo, banner, description, website: String
  totalTitles, foundedYear: Integer
  status: Enum [ACTIVE, INACTIVE, HIATUS, ARCHIVED]
  genres, focusTags: JSONB []
  rating: Double, popularity: Integer
}

GroupMember {
  id: UUID, groupId+userId: FK [UNIQUE]
  role: Enum [OWNER, MODERATOR, TRANSLATOR, MEMBER]
  joinedAt: Timestamp
}

GroupWork {
  id: UUID, groupId: FK
  titleId: String [ref MongoDB], title, cover: String
  chapters: Integer
  status: Enum [ONGOING, HIATUS, COMPLETED]
  genres: JSONB [], updatedAt: Timestamp
}
```

### 3.7. Library (PostgreSQL)

```
SavedManga {
  id: UUID (PK)
  userId: UUID (FK → users)
  titleId: String [ref MongoDB, desnormalizado]
  name, cover, type: String [cache para performance]
  list: Enum [READING, COMPLETED, ON_HOLD, DROPPED, PLANNING]
  savedAt: Timestamp
  UNIQUE: (userId, titleId)
}
```

### 3.8. Rating (MongoDB — coleção `ratings`)

```
MangaRating {
  id: String, titleId: String [Indexed], userId: String [Indexed]
  userName: String, stars: Double, comment: String
  categoryRatings: Map<String, Double> {fun, art, storyline, ...}
  createdAt: Timestamp
  Compound UNIQUE Index: (titleId, userId)
}
```

### 3.9. News (MongoDB — coleção `news`)

```
NewsItem {
  id: String
  title: String [Full-text, weight=10]
  subtitle, excerpt: String [excerpt weight=3]
  content: List<String>, coverImage: String, gallery: List<String>
  source, sourceLogo: String
  author: Embedded {name, avatar, bio, link}
  category: Enum
  reactions: Map<ReactionType, Integer> [LIKE, LOVE, HAHA, WOW, SAD, ANGRY]
  publishedAt, createdAt, updatedAt: Timestamp
}
```

### 3.10. Category / Tag (PostgreSQL)

```
Tag {
  id: Long (IDENTITY PK)
  label: String(60) [UNIQUE]
}
```

### 3.11. Store (PostgreSQL)

```
Store {
  id: UUID (PK)
  name: String(100), logo, icon, description: String
  website: String [required]
  availability: Enum [AVAILABLE, COMING_SOON, OUT_OF_STOCK]
  rating: Double, features: JSONB []
}

StoreTitle {
  id: UUID (PK)
  storeId: UUID (FK → stores), titleId: String [ref MongoDB]
  url: String(500)
  UNIQUE: (storeId, titleId)
}
```

---

## 4. Camada de Aplicação (70 Use Cases)

### Organização por Domínio

| Domínio | Use Cases | Descrição |
|---------|-----------|-----------|
| **Auth** | 6 | SignIn, SignUp, RefreshToken, GetCurrentUser, ForgotPassword, ResetPassword |
| **Manga** | 7 | GetTitles, GetTitleById, SearchTitles, GetTitlesByGenre, FilterTitles, GetChaptersByTitle, GetChapterByNumber |
| **Comment** | 6 | GetCommentsByTitle, CreateComment, UpdateComment, DeleteComment, ReactToComment, GetUserReactions |
| **Library** | 6 | GetUserLibrary, SaveToLibrary, ChangeReadingList, RemoveFromLibrary, GetLibrary, GetLibraryCounts |
| **Forum** | 7 | GetForumTopics, GetForumTopicById, GetForumTopicsByCategory, CreateForumTopic, CreateForumReply, UpdateForumTopic, DeleteForumTopic |
| **Group** | 10 | GetGroups, GetGroupById, GetGroupByUsername, GetGroupsByTitleId, CreateGroup, UpdateGroup, JoinGroup, LeaveGroup, AddWorkToGroup, RemoveWorkFromGroup |
| **Event** | 3 | GetEvents, GetEventById, GetEventsByStatus |
| **News** | 4 | GetNews, GetNewsById, GetNewsByCategory, SearchNews |
| **Rating** | 6 | GetRatingsByTitle, GetRatingAverage, SubmitRating, UpdateRating, DeleteRating, GetUserRatings |
| **Category** | 3 | GetTags, GetTagById, SearchTags |
| **Store** | 3 | GetStores, GetStoreById, GetStoresByTitleId |
| **User** | 9 | GetUserProfile, UpdateUserProfile, GetEnrichedProfile, AddRecommendation, RemoveRecommendation, ReorderRecommendations, RecordViewHistory, UpdatePrivacySettings, GetUserComments |

### Port Interfaces

Cada domínio define ports (interfaces) na camada de aplicação que são implementados pela camada de infraestrutura:

- **TokenPort**: Geração e validação de JWT
- **Repository Ports**: CRUD para cada domínio (ex: `TitleRepositoryPort`, `CommentRepositoryPort`)
- **EmailPort**: Envio de emails (forgot password, notificações)
- **EventPublisherPort**: Publicação de eventos assíncronos

---

## 5. Camada de Infraestrutura

### 5.1. Persistência

#### PostgreSQL (JPA + Flyway)

**Repositórios**:
- `UserJpaRepository`
- `TagJpaRepository`
- `StoreJpaRepository`
- `LibraryJpaRepository`
- `GroupJpaRepository` (+ GroupMember, GroupWork)
- `ForumTopicJpaRepository` (+ ForumReply)
- `EventJpaRepository` (+ EventTicket, EventParticipant)

**Configuração JPA**:
- `hibernate.ddl-auto: validate` (validação do schema apenas)
- Dialect: PostgreSQLDialect
- `open-in-view: false` (eager loading explícito)

**Migrações Flyway (4)**:
- `V1__initial_schema.sql`: 14 tabelas com FKs, indexes e constraints
- `V2__create_store_titles.sql`: Tabela junction store-title (idempotente)
- `V3__add_library_user_list_index.sql`: Índice composto (user_id, list) para filtragem de biblioteca
- `V4__user_profile_enhancements.sql`: Tabela user_recommendations + campos bannerUrl, commentVisibility, viewHistoryVisibility em users

#### MongoDB (Spring Data + Mongock)

**Repositórios**:
- `TitleMongoRepository`
- `CommentMongoRepository`
- `NewsMongoRepository`
- `RatingMongoRepository`
- `ViewHistoryMongoRepository`

**Migrações Mongock (3)**:
- `V001CreateIndexes.java`: Indexes para Title, Comment, MangaRating
- `V002CreateViewHistoryIndexes.java`: Indexes para ViewHistory
- `V003CreateCommentReactionIndexes.java`: Compound indexes para CommentReaction

**Configuração**:
- URI: `mongodb://localhost:27017/mangareader` (dev)
- Auto-index-creation: desabilitado (manual via migrations)
- Transações desabilitadas

### 5.2. Segurança

**SecurityConfig**:
- Sessão: STATELESS (sem sessão no servidor)
- CSRF: Desabilitado (API stateless com JSON)
- CORS: Configuração via `CorsConfig`
- Filter chain: `RateLimitFilter` → `JwtAuthenticationFilter`

**JWT Token Provider**:
- Algoritmo: HMAC-SHA256 (HS256)
- Access Token: 15 minutos (configurável)
- Refresh Token: 7 dias (configurável)
- Claims: subject (userId), email, role

**Password**: BCryptPasswordEncoder (strength padrão)

**Endpoints Públicos**:
```
POST /api/auth/**
GET  /api/titles/**
GET  /api/comments/**
GET  /api/ratings/title/**
GET  /api/groups/**
GET  /api/news/**
GET  /api/events/**
GET  /api/forum/**
GET  /api/tags/**
GET  /api/stores/**
GET  /api/users/{id}
GET  /swagger-ui/**, /api-docs/**
GET  /actuator/health
```

**Endpoints Protegidos**: Todos os demais (profile, library, CRUD de comentários, ratings, etc.)

**Rate Limiting**: Bucket4j integrado via `RateLimitFilter`

### 5.3. Email

| Adaptador | Ambiente | Comportamento |
|-----------|----------|--------------|
| `SmtpEmailAdapter` | Produção | Envio via SMTP real |
| `ConsoleEmailAdapter` | Desenvolvimento | Log no console |
| `NoopEmailAdapter` | Testes | Sem operação |

**Configuração Dev**: localhost:1025, sem autenticação (MailHog/MailPit)

### 5.4. Mensageria (RabbitMQ)

- **Publisher**: `RabbitEventPublisher` (produção) / `NoopEventPublisher` (testes)
- **Consumers**: Event consumers para processamento assíncrono
- **Config Dev**: localhost:5672, user: manga, pwd: manga_secret
- **Management UI**: localhost:15672

### 5.5. Cache (Redis)

- Tipo: Redis via Spring Cache
- TTL: 5 minutos (300000ms)
- Cache null values: desabilitado
- Política de evicção: allkeys-lru
- Max memória: 128mb

### 5.6. Seed Data

- **Classe**: `DataSeeder` em `infrastructure/seed/`
- Inicializa banco com dados de exemplo no startup da aplicação

---

## 6. Camada de Apresentação — REST Endpoints

### 6.1. Auth Controller (`/api/auth`)

| Método | Endpoint | Acesso | Descrição |
|--------|---------|--------|-----------|
| POST | `/api/auth/sign-in` | Público | Login |
| POST | `/api/auth/sign-up` | Público | Cadastro |
| POST | `/api/auth/refresh` | Público | Refresh token |
| GET | `/api/auth/me` | Protegido | Usuário atual |
| POST | `/api/auth/forgot-password` | Público | Solicitar reset |
| POST | `/api/auth/reset-password` | Público | Resetar senha |

**Response**: `AuthResponse` — accessToken, refreshToken, userId, name, email, role, photoUrl

### 6.2. User Controller (`/api/users`)

| Método | Endpoint | Acesso | Descrição |
|--------|---------|--------|-----------|
| GET | `/api/users/{id}` | Público | Perfil público |
| GET | `/api/users/{id}/profile` | Público | Perfil enriquecido (stats, recommendations) |
| GET | `/api/users/{id}/comments` | Público | Comentários do usuário |
| GET | `/api/users/{id}/history` | Público | Histórico de visualização |
| GET | `/api/users/me` | Protegido | Usuário atual |
| PATCH | `/api/users/me` | Protegido | Atualizar perfil |
| POST | `/api/users/me/recommendations` | Protegido | Adicionar recomendação |
| DELETE | `/api/users/me/recommendations/{titleId}` | Protegido | Remover recomendação |
| PUT | `/api/users/me/recommendations/reorder` | Protegido | Reordenar recomendações |
| PUT | `/api/users/me/privacy` | Protegido | Configurações de privacidade |

### 6.3. Title Controller (`/api/titles`)

| Método | Endpoint | Acesso | Params |
|--------|---------|--------|--------|
| GET | `/api/titles` | Público | page, size, sort, direction |
| GET | `/api/titles/{id}` | Público | — |
| GET | `/api/titles/search` | Público | q |
| GET | `/api/titles/genre/{genre}` | Público | page, size |
| GET | `/api/titles/filter` | Público | genres, sort, direction |

### 6.4. Chapter Controller (`/api/titles/{titleId}/chapters`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/titles/{titleId}/chapters` | Público |
| GET | `/api/titles/{titleId}/chapters/{number}` | Público |

### 6.5. Tag Controller (`/api/tags`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/tags` | Público |
| GET | `/api/tags/{id}` | Público |
| GET | `/api/tags/search` | Público |

### 6.6. Library Controller (`/api/library`) — Todos Protegidos

| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/library` | Listar biblioteca |
| POST | `/api/library` | Salvar na biblioteca |
| PATCH | `/api/library/{titleId}` | Mudar lista |
| DELETE | `/api/library/{titleId}` | Remover |

### 6.7. Comment Controller (`/api/comments`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/comments/title/{titleId}` | Público |
| POST | `/api/comments` | Protegido |
| PUT | `/api/comments/{id}` | Protegido |
| DELETE | `/api/comments/{id}` | Protegido |
| POST | `/api/comments/{id}/react` | Protegido |

### 6.8. Forum Controller (`/api/forum`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/forum` | Público |
| GET | `/api/forum/{id}` | Público |
| GET | `/api/forum/category/{category}` | Público |
| GET | `/api/forum/categories` | Público |
| POST | `/api/forum` | Protegido |
| POST | `/api/forum/{id}/reply` | Protegido |
| PUT | `/api/forum/{id}` | Protegido |
| DELETE | `/api/forum/{id}` | Protegido |

### 6.9. Group Controller (`/api/groups`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/groups` | Público |
| GET | `/api/groups/{id}` | Público |
| GET | `/api/groups/username/{username}` | Público |
| GET | `/api/groups/title/{titleId}` | Público |
| POST | `/api/groups` | Protegido |
| PUT | `/api/groups/{id}` | Protegido |
| POST | `/api/groups/{id}/join` | Protegido |
| POST | `/api/groups/{id}/leave` | Protegido |
| POST | `/api/groups/{id}/works` | Protegido |
| DELETE | `/api/groups/{id}/works/{titleId}` | Protegido |

### 6.10. Event Controller (`/api/events`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/events` | Público |
| GET | `/api/events/{id}` | Público |
| GET | `/api/events/status/{status}` | Público |

### 6.11. News Controller (`/api/news`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/news` | Público |
| GET | `/api/news/{id}` | Público |
| GET | `/api/news/category/{category}` | Público |
| GET | `/api/news/search` | Público |

### 6.12. Rating Controller (`/api/ratings`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/ratings/title/{titleId}` | Público |
| GET | `/api/ratings/title/{titleId}/average` | Público |
| POST | `/api/ratings` | Protegido |
| PUT | `/api/ratings/{id}` | Protegido |
| DELETE | `/api/ratings/{id}` | Protegido |
| GET | `/api/ratings/user/me` | Protegido |

### 6.13. Store Controller (`/api/stores`)

| Método | Endpoint | Acesso |
|--------|---------|--------|
| GET | `/api/stores` | Público |
| GET | `/api/stores/{id}` | Público |
| GET | `/api/stores/title/{titleId}` | Público |

---

## 7. Schema de Banco de Dados

### 7.1. PostgreSQL (15 tabelas)

```
┌─────────────────────────────┐
│      TABELAS CORE (7)       │
├─────────────────────────────┤
│ users                       │
│ tags                        │
│ stores                      │
│ groups                      │
│ events                      │
│ forum_topics                │
│ user_libraries              │
├─────────────────────────────┤
│   TABELAS JUNCTION (8)      │
├─────────────────────────────┤
│ user_social_links (→users)  │
│ user_recommendations (→users)│
│ forum_replies (→topics,users)│
│ event_tickets (→events)     │
│ event_participants (→events,users)│
│ group_members (→groups,users)│
│ group_works (→groups)       │
│ store_titles (→stores)      │
└─────────────────────────────┘
```

**Referências Cross-Database**: `user_libraries.title_id`, `group_works.title_id`, `store_titles.title_id` → referem ObjectIds do MongoDB (sem FK, integridade por aplicação).

### 7.2. MongoDB (6 coleções)

| Coleção | Indexes |
|---------|---------|
| `titles` | Text(name:10, synopsis:3, author:5), idx_genres, idx_popularity |
| `comments` | idx_titleId, idx_parentCommentId, idx_userId |
| `news` | Text(title:10, excerpt:3) |
| `ratings` | idx_titleId, idx_userId, Compound UNIQUE(titleId, userId) |
| `view_history` | idx_userId, idx_viewedAt, Compound(userId, titleId) |
| `comment_reactions` | Compound(commentId, userId), idx_commentId |

---

## 8. Configuração

### 8.1. Desenvolvimento (`application.yml`)

```yaml
server.port: 8080
spring.docker.compose.enabled: true  # Start/stop automático
jpa.hibernate.ddl-auto: validate
flyway.enabled: true
mongodb.uri: mongodb://localhost:27017/mangareader
redis: localhost:6379
rabbitmq: localhost:5672 (manga/manga_secret)
cache.redis.ttl: 300000 (5 min)
mail: localhost:1025 (sem auth)
jwt.secret: manga-reader-dev-secret-key (256+ bits)
jwt.access-token-expiration: 900000 (15 min)
jwt.refresh-token-expiration: 604800000 (7 dias)
cors.allowed-origins: http://localhost:5173
swagger-ui.path: /swagger-ui
actuator: health, info, metrics
```

### 8.2. Produção (`application-prod.yml`)

Todas as configurações via variáveis de ambiente:

```yaml
DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD
MONGODB_URI
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USERNAME, RABBITMQ_PASSWORD
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
JWT_SECRET
CORS_ALLOWED_ORIGINS
APP_BASE_URL
```

HikariCP: max-pool-size=15, minimum-idle=5

### 8.3. Testes (`application-test.yml`)

Perfil separado para testes com configurações específicas.

### 8.4. Docker Compose (Desenvolvimento)

| Serviço | Imagem | Porta |
|---------|--------|-------|
| PostgreSQL | postgres:17-alpine | 5432 |
| MongoDB | mongo:8.0 | 27017 |
| RabbitMQ | rabbitmq:4-management-alpine | 5672, 15672 |
| Redis | redis:7-alpine | 6379 |

### 8.5. Dockerfile (Multi-stage)

```
Stage 1: maven:3.9-eclipse-temurin-23-alpine (build)
Stage 2: eclipse-temurin:23-jre-alpine (runtime)
  - Non-root user (appuser)
  - HEALTHCHECK: /actuator/health
```

---

## 9. Tratamento de Erros

### Hierarquia de Exceções

```
├─ ResourceNotFoundException (404)
├─ DuplicateResourceException (409)
├─ BusinessRuleException (400)
└─ ValidationException → GlobalExceptionHandler
```

### Formatos de Response

```java
// Sucesso
ApiResponse<T> {
  success: Boolean, data: T, message: String?
}

// Paginação
PageResponse<T> {
  content: List<T>, pageNumber, pageSize, totalElements, totalPages, hasNext
}

// Erro
ApiErrorResponse {
  timestamp, status, error, message, path
}

// Validação
ValidationErrorResponse {
  timestamp, status, errors: Map<String, String>
}
```

---

## 10. Documentação da API

- **Ferramenta**: Springdoc OpenAPI 2.8.4
- **Swagger UI**: `http://localhost:8080/swagger-ui`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`
- Endpoints descobertos automaticamente via annotations
- Ordenação: por método HTTP e tags alfabéticas

---

## 11. Cobertura de Testes

### Estado Atual: Completo — 727 testes, 0 failures

| Camada | Arquivos | Testes | Abordagem |
|--------|:--------:|:------:|-----------|
| Domain | 30 | 192 | JUnit 5 puro (entidades, sub-entities, VOs, enums) |
| Application | 70 | 245 | Mockito mocks dos ports |
| Presentation | 13 | 133 | @WebMvcTest + MockMvc + @MockitoBean TokenPort |
| Infrastructure JPA | 7 | 72 | @DataJpaTest + H2 in-memory |
| Infrastructure MongoDB | 4 | 51 | @DataMongoTest + TestContainers (mongo:8.0) |
| Infrastructure Security | 1 | 17 | JwtTokenProvider unitário |
| Security E2E | 1 | 16 | @SpringBootTest + fluxo Auth completo |
| Root | 1 | 1 | @SpringBootTest smoke test |
| **Total** | **127** | **727** | **Build verde** |

---

## 12. Pontos Fortes

1. **Clean Architecture** bem implementada com separação clara de responsabilidades
2. **Estratégia multi-banco** (PostgreSQL + MongoDB) otimizada para cada tipo de dado
3. **Segurança robusta**: JWT stateless, BCrypt, CORS configurado, rate limiting
4. **Design RESTful**: Nomenclatura clara, verbos HTTP corretos, paginação consistente
5. **Extensibilidade**: Padrão de use cases permite adicionar funcionalidades facilmente
6. **Infrastructure as Code**: Docker Compose para dev, configuração por ambiente, multi-stage Dockerfile
7. **Documentação automática**: Swagger/OpenAPI integrado
8. **Adaptadores flexíveis**: Email (SMTP/Console/Noop), Messaging (Rabbit/Noop)

## 13. Lacunas Identificadas

1. **@Transactional**: ~23 use cases data-modifying sem `@Transactional` — risco de LazyInitializationException
2. **UserController**: Injeta repository ports diretamente (violação Clean Architecture)
3. **Referências cross-database**: PostgreSQL→MongoDB sem integridade referencial
4. **Seed data**: Documentação da estrutura de dados iniciais ausente
5. **Logging**: Logback configurado mas sem strategy definida para produção
6. **Monitoramento**: Actuator habilitado mas sem integração com ferramentas de observabilidade
7. **Rate limiting**: Configuração de limites específicos por endpoint não documentada
8. **N+1 Query risk**: GetEnrichedProfileUseCase faz múltiplas chamadas sequenciais a repositories
