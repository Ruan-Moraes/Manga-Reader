# Manga Reader — Backend Architecture

> Documento de arquitetura do backend para o projeto **Manga Reader**.
> Projetado como referência de alto nível para guiar a implementação, sem detalhar rotas ou endpoints específicos.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Decisões Arquiteturais](#2-decisões-arquiteturais)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Arquitetura Limpa — Estrutura de Camadas](#4-arquitetura-limpa--estrutura-de-camadas)
5. [Modelagem de Dados — Dual Database](#5-modelagem-de-dados--dual-database)
6. [Mensageria e Processamento Assíncrono](#6-mensageria-e-processamento-assíncrono)
7. [Autenticação e Autorização](#7-autenticação-e-autorização)
8. [Estratégia de Cache](#8-estratégia-de-cache)
9. [Estrutura de Diretórios do Projeto](#9-estrutura-de-diretórios-do-projeto)
10. [Plano de Migração: Mocks → API Real](#10-plano-de-migração-mocks--api-real)
11. [Estratégia de Seed e Dados Iniciais](#11-estratégia-de-seed-e-dados-iniciais)
12. [Infraestrutura e Deploy](#12-infraestrutura-e-deploy)
13. [Observabilidade](#13-observabilidade)
14. [Fases de Implementação](#14-fases-de-implementação)

---

## 1. Visão Geral

O Manga Reader é uma plataforma de leitura de mangás cujo frontend (React 19 + TypeScript) já está funcional consumindo dados mock. O backend será construído do zero em **Java/Spring Boot**, servindo como API REST única para todas as features do frontend.

### Domínios identificados no frontend

| Domínio        | Entidades Principais                             | Complexidade |
| -------------- | ------------------------------------------------ | ------------ |
| **Manga**      | Title, Chapter, Pages                            | Alta         |
| **User**       | User, Profile, SocialLinks, Statistics           | Média        |
| **Auth**       | Credentials, Token, PasswordReset                | Média        |
| **Comment**    | CommentData, CommentTree (parent/child)          | Média        |
| **Rating**     | MangaRating, CategoryRatings (6 categorias)      | Média        |
| **Group**      | Group, GroupMember, GroupWork                     | Alta         |
| **Library**    | UserSavedLibrary, SavedMangaItem, ReadingList    | Baixa        |
| **Category**   | Tag, Sort, PublicationStatus, AdultContent        | Baixa        |
| **Event**      | EventData, Tickets, EventComments, Schedule       | Alta         |
| **Forum**      | ForumTopic, ForumReply, ForumAuthor               | Alta         |
| **News**       | NewsItem, NewsAuthor, NewsComment, NewsReaction    | Média        |
| **Store**      | Store, TitleStoreMapping                          | Baixa        |

### Princípios norteadores

- **Arquitetura Limpa**: Regras de negócio isoladas de frameworks e infraestrutura
- **Economia**: Priorizar soluções que minimizem custo de infraestrutura (single-instance para começar, escalar sob demanda)
- **Performance**: Leitura intensa (90%+ reads) — cache agressivo, queries otimizadas, paginação obrigatória
- **Evolução incremental**: Iniciar como monolito modular, com fronteiras claras para extração futura de microsserviços se necessário

---

## 2. Decisões Arquiteturais

### 2.1 Monolito Modular vs. Microsserviços

**Decisão: Monolito modular.**

Uma plataforma de leitura de mangás em fase inicial não justifica a complexidade operacional de microsserviços. O monolito modular oferece:

- Deploy simples (um artefato JAR)
- Comunicação in-process entre módulos (sem latência de rede)
- Custo operacional mínimo (uma instância, um banco)
- Fronteiras claras entre módulos via packages Java, permitindo extração futura

Cada domínio será um **módulo autocontido** dentro do monolito, com interfaces bem definidas entre eles.

### 2.2 PostgreSQL + MongoDB (Dual Database)

**Decisão: Dados relacionais no PostgreSQL, dados de catálogo/conteúdo no MongoDB.**

| Banco        | Responsabilidade                                                                                        | Justificativa                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **PostgreSQL** | Users, Auth, Groups, Library, Events, Forum, Store, relacionamentos N:N (user↔manga, group↔title)     | Integridade referencial, transações ACID, JOINs complexos (ex: "mangás na biblioteca do user") |
| **MongoDB**   | Catálogo de mangás (Title + Chapters), Ratings/Reviews, Comments, News, conteúdo textual rico           | Schema flexível (gêneros, tags variáveis), documentos aninhados (chapters dentro de title), alta velocidade de leitura, escalabilidade horizontal de reads |

**Regra de ouro**: Se a entidade tem **relacionamentos fortes e transações críticas** → PostgreSQL. Se é **conteúdo rico, leitura intensa e schema variável** → MongoDB.

### 2.3 RabbitMQ para Mensageria

**Decisão: RabbitMQ (não Kafka).**

| Critério                | RabbitMQ                        | Kafka                                   |
| ----------------------- | ------------------------------- | --------------------------------------- |
| Complexidade operacional | Baixa                           | Alta (ZooKeeper/KRaft, partições)       |
| Custo (single node)     | ~256MB RAM                      | ~1GB+ RAM mínimo                        |
| Caso de uso primário    | Task queues, pub/sub simples    | Event streaming, alta throughput         |
| Fit para Manga Reader   | ✅ Perfeito                     | Overkill para o volume esperado          |

O Manga Reader não precisa de event replay nem throughput massivo. RabbitMQ cobre todos os cenários assíncronos com menor custo e complexidade.

### 2.4 API REST (não GraphQL)

**Decisão: REST com JSON.**

O frontend já possui uma camada HTTP completa (Axios + interceptors) configurada para REST. A migração de mocks será mais simples mantendo REST. GraphQL seria prematuro para o tamanho atual do projeto.

---

## 3. Stack Tecnológica

### Core

| Tecnologia               | Versão    | Papel                                                        |
| ------------------------- | --------- | ------------------------------------------------------------ |
| **Java**                  | 21 (LTS)  | Linguagem principal, records, pattern matching, virtual threads |
| **Spring Boot**           | 3.4.x     | Framework principal, auto-configuration                       |
| **Spring Web MVC**        | —         | Camada REST (controllers)                                     |
| **Spring Data JPA**       | —         | Acesso a dados PostgreSQL (Hibernate 6)                       |
| **Spring Data MongoDB**   | —         | Acesso a dados MongoDB                                        |
| **Spring Security**       | 6.x       | Autenticação/autorização (JWT stateless)                      |
| **Spring AMQP**           | —         | Integração com RabbitMQ                                       |
| **Spring Validation**     | —         | Validação de DTOs via Bean Validation (Jakarta)               |

### Infraestrutura

| Tecnologia               | Papel                                                           |
| ------------------------- | --------------------------------------------------------------- |
| **PostgreSQL**            | Banco relacional principal                                       |
| **MongoDB**               | Banco de documentos (catálogo, reviews, comments, news)          |
| **RabbitMQ**              | Mensageria assíncrona                                            |
| **Redis**                 | Cache distribuído (sessões, hot data, rate limiting)             |
| **Docker + Compose**      | Containerização local e CI                                       |

### Ferramentas de Desenvolvimento

| Tecnologia               | Papel                                                           |
| ------------------------- | --------------------------------------------------------------- |
| **Maven**                 | Build e gerenciamento de dependências                            |
| **Flyway**                | Migrations do PostgreSQL (versionamento de schema)               |
| **Mongock**               | Migrations do MongoDB (changelogs versionados)                   |
| **MapStruct**             | Mapeamento Entity ↔ DTO (compile-time, zero reflection)         |
| **Lombok**                | Redução de boilerplate (opcional, preferir Java Records)         |
| **SpringDoc OpenAPI**     | Documentação automática da API (Swagger UI)                      |
| **Testcontainers**        | Testes de integração com containers reais                        |
| **JUnit 5 + Mockito**     | Testes unitários e mocks                                         |

### Por que essas escolhas são econômicas

1. **Java 21 Virtual Threads**: Substitui WebFlux reativo sem complexidade — mesmo throughput com código imperativo simples
2. **Redis como cache**: Evita queries repetidas ao banco (90%+ do tráfego é leitura)
3. **MapStruct**: Mapeamento em compile-time, zero overhead em runtime (vs reflection-based como ModelMapper)
4. **Single JAR deploy**: Uma instância Spring Boot serve tudo — sem overhead de service mesh

---

## 4. Arquitetura Limpa — Estrutura de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                              │
│  Controllers ─ DTOs (Request/Response) ─ Exception Handlers      │
│  Converte HTTP ↔ Use Cases, validação de entrada                 │
├─────────────────────────────────────────────────────────────────┤
│                        APPLICATION                               │
│  Use Cases ─ Port Interfaces ─ Application Services              │
│  Orquestra fluxos de negócio, não contém regras de domínio       │
├─────────────────────────────────────────────────────────────────┤
│                          DOMAIN                                  │
│  Entities ─ Value Objects ─ Domain Services ─ Domain Events      │
│  Regras de negócio puras, ZERO dependências externas             │
├─────────────────────────────────────────────────────────────────┤
│                       INFRASTRUCTURE                             │
│  JPA Repos ─ Mongo Repos ─ RabbitMQ ─ Redis ─ External APIs     │
│  Implementa as Port Interfaces definidas em Application          │
└─────────────────────────────────────────────────────────────────┘
```

### Regra de Dependência

As dependências apontam **sempre para dentro**:

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain** não importa nada de fora (nem Spring, nem JPA, nem MongoDB)
- **Application** define interfaces (Ports) que Infrastructure implementa
- **Presentation** só conhece Use Cases e DTOs
- **Infrastructure** implementa os Ports usando frameworks concretos

### Fluxo de uma requisição típica

```
HTTP Request
  → Controller (Presentation)
    → valida DTO de entrada
    → chama Use Case (Application)
      → executa regras via Domain Entities/Services
      → chama Port Interface (ex: TitleRepository)
        → Infrastructure resolve (JPA ou Mongo)
    → retorna DTO de saída
  → HTTP Response
```

---

## 5. Modelagem de Dados — Dual Database

### 5.1 PostgreSQL (Relacional)

Entidades com relacionamentos fortes e transações críticas:

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users     │────<│  user_libraries  │>────│   titles    │
│              │     │  (savedAt, list) │     │  (id, name) │
│ id (PK)      │     └──────────────────┘     │  ↑ ref only │
│ name         │                               └─────────────┘
│ email        │     ┌──────────────────┐
│ password_hash│────<│ user_social_links│
│ bio          │     └──────────────────┘
│ photo_url    │
│ role         │     ┌──────────────────┐     ┌─────────────┐
│ created_at   │────<│  group_members   │>────│   groups    │
└──────────────┘     │  (role, joinedAt)│     │             │
                     └──────────────────┘     │ id (PK)     │
                                              │ name        │
┌──────────────┐     ┌──────────────────┐     │ status      │
│    events    │────<│ event_participants│>───→│ focus_tags  │
│              │     └──────────────────┘     │ rating      │
│ id (PK)      │     ┌──────────────────┐     └─────────────┘
│ title        │────<│  event_tickets   │
│ description  │     └──────────────────┘     ┌─────────────┐
│ start_date   │                              │   stores    │
│ end_date     │     ┌──────────────────┐     │             │
│ location(JSON)│    │  group_titles    │     │ id (PK)     │
│ organizer_id │     │  (N:N junction)  │     │ name        │
└──────────────┘     └──────────────────┘     │ website     │
                                              └─────────────┘
┌──────────────┐     ┌──────────────────┐
│ forum_topics │────<│  forum_replies   │
│              │     │                  │
│ id (PK)      │     │ id (PK)         │
│ author_id(FK)│     │ topic_id (FK)   │
│ category     │     │ author_id (FK)  │
│ title        │     │ content         │
│ is_pinned    │     │ is_best_answer  │
│ is_locked    │     └──────────────────┘
└──────────────┘
```

**Tabelas PostgreSQL (resumo)**:
- `users` — perfil, credenciais, roles
- `user_libraries` — relação user↔title com lista de leitura (Lendo/Quero Ler/Concluído)
- `user_social_links` — links de redes sociais do user
- `groups` — grupos de tradução
- `group_members` — relação user↔group com role
- `group_titles` — relação group↔title (quais mangás o grupo traduz)
- `events` — eventos com location como JSONB
- `event_participants` — relação user↔event
- `event_tickets` — tipos de ingresso
- `forum_topics` — tópicos do fórum
- `forum_replies` — respostas a tópicos
- `stores` — lojas parceiras
- `store_titles` — relação store↔title

### 5.2 MongoDB (Documentos)

Entidades com schema flexível e leitura intensa:

```javascript
// Collection: titles
{
  _id: "1",
  type: "Mangá",                           // Mangá | Manhwa | Manhua | Webtoon
  name: "Reino de Aço",
  cover: "https://...",
  synopsis: "No coração de um império...",
  genres: ["Ação", "Fantasia", "Aventura"], // Array flexível
  author: "Takeshi Yamamoto",
  artist: "Takeshi Yamamoto",
  publisher: "Panini",
  popularity: 98,
  score: 9.2,
  chapters: [                               // Embedded — sempre lidos junto
    {
      number: "1",
      title: "O Despertar da Forja",
      releaseDate: ISODate("2025-06-10"),
      pages: 42
    }
  ],
  createdAt: ISODate("2025-06-10"),
  updatedAt: ISODate("2025-07-29")
}

// Collection: ratings
{
  _id: ObjectId(),
  titleId: "1",                             // Referência ao title
  userId: "user-1",                         // Referência ao user (PostgreSQL)
  userName: "Leitor Demo",                  // Desnormalizado para leitura rápida
  stars: 4.5,
  comment: "Excelente mangá...",
  categoryRatings: {                        // Schema flexível — categorias podem mudar
    "fun": 4.5,
    "art": 5.0,
    "storyline": 4.0,
    "characters": 4.5,
    "originality": 3.5,
    "pacing": 4.0
  },
  createdAt: ISODate("2025-07-15")
}

// Collection: comments
{
  _id: "c-1-001",
  titleId: "1",
  parentCommentId: null,                    // null = root, "c-1-xxx" = reply
  userId: "user-1",
  userName: "Leitor Demo",                  // Desnormalizado
  userPhoto: "https://...",                 // Desnormalizado
  isHighlighted: false,
  wasEdited: false,
  textContent: "Que capítulo incrível!",
  imageContent: null,
  likeCount: 12,
  dislikeCount: 1,
  createdAt: ISODate("2025-07-20")
}

// Collection: news
{
  _id: "news-1",
  title: "Novo capítulo de...",
  subtitle: "...",
  excerpt: "...",
  content: ["parágrafo 1", "parágrafo 2"],  // Array de blocos de texto
  coverImage: "https://...",
  gallery: ["url1", "url2"],
  category: "Lançamentos",
  tags: ["shonen", "ação"],
  author: {                                  // Embedded — autor é parte da notícia
    id: "author-1",
    name: "Redação MR",
    avatar: "...",
    role: "Editor"
  },
  reactions: { like: 42, excited: 18, sad: 3, surprised: 7 },
  comments: [],                              // Pode ser embedded ou ref separada
  publishedAt: ISODate("2025-08-01"),
  readTime: 5,
  views: 1200,
  trendingScore: 85
}
```

### 5.3 Estratégia de referência cruzada (Cross-DB)

Quando uma entidade no MongoDB referencia uma entidade no PostgreSQL (ex: `userId` em um rating):

1. **Armazenar o ID** como string no documento MongoDB
2. **Desnormalizar campos de leitura** (userName, userPhoto) no documento para evitar JOINs cross-database
3. **Atualizar via mensageria**: Quando um user muda de nome/foto, publicar evento `UserProfileUpdated` no RabbitMQ → consumer atualiza os documentos MongoDB que referenciam aquele user

```
[PostgreSQL: users]  ──evento──>  [RabbitMQ]  ──consume──>  [MongoDB: ratings, comments]
   UPDATE name                   UserProfileUpdated           UPDATE userName WHERE userId=X
```

---

## 6. Mensageria e Processamento Assíncrono

### 6.1 Casos de uso para RabbitMQ

| Fila / Exchange              | Producer                  | Consumer                        | Propósito                                                    |
| ---------------------------- | ------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `rating.submitted`           | Rating Use Case           | Score Aggregation Worker        | Recalcular score médio do title sem bloquear o request        |
| `comment.created`            | Comment Use Case          | Notification Worker             | Notificar autores/seguidores de novos comentários             |
| `user.profile.updated`       | User Use Case             | Denormalization Worker          | Atualizar userName/userPhoto desnormalizados em MongoDB       |
| `chapter.published`          | Chapter Use Case          | Notification + Cache Worker     | Notificar seguidores, invalidar cache do title                |
| `library.updated`            | Library Use Case          | Popularity Worker               | Recalcular popularidade do title                              |
| `view.tracked`               | View Middleware            | Analytics Worker                | Contabilizar views sem impactar latência                      |
| `email.send`                 | Auth Use Case             | Email Worker                    | Enviar emails de recuperação de senha (async, retry)          |

### 6.2 Topologia RabbitMQ

```
                    ┌─────────────────────┐
                    │   Topic Exchange     │
                    │  "manga.events"      │
                    └─────┬───────┬───────┘
                          │       │
            routing key:  │       │  routing key:
          "rating.#"      │       │  "user.profile.#"
                          ▼       ▼
                   ┌──────────┐ ┌──────────────────┐
                   │  Queue   │ │      Queue        │
                   │ score-   │ │ denormalization-  │
                   │ aggreg.  │ │ worker            │
                   └──────────┘ └──────────────────┘
```

**Configuração**: Um **Topic Exchange** principal (`manga.events`) com routing keys hierárquicas. Isso permite adicionar novos consumers sem modificar producers.

### 6.3 Garantias

- **Durabilidade**: Filas e mensagens persistentes (sobrevivem restart do RabbitMQ)
- **Acknowledgment manual**: Consumer confirma após processar com sucesso
- **Dead Letter Queue (DLQ)**: Mensagens que falharam 3x vão para DLQ para análise
- **Idempotência**: Consumers devem ser idempotentes (processar a mesma mensagem 2x produz o mesmo resultado)

---

## 7. Autenticação e Autorização

### 7.1 Fluxo JWT Stateless

O frontend já implementa interceptação de token Bearer via Axios. O backend deve emitir e validar JWTs:

```
1. POST /auth/sign-in  { email, password }
   → Valida credenciais
   → Gera Access Token (JWT, 15min) + Refresh Token (opaque, 7d no Redis)
   → Retorna { user, accessToken, refreshToken }

2. Requests subsequentes
   → Frontend envia "Authorization: Bearer <accessToken>"
   → Spring Security filter valida JWT
   → Extrai userId e roles do token

3. POST /auth/refresh  { refreshToken }
   → Valida refresh token no Redis
   → Gera novo access token
   → Retorna { accessToken }

4. POST /auth/sign-out
   → Invalida refresh token no Redis
   → Frontend remove do localStorage
```

### 7.2 Roles e Permissões

Baseado nas entidades do frontend:

| Role          | Permissões                                                       |
| ------------- | ---------------------------------------------------------------- |
| `READER`      | Ler tudo, comentar, avaliar, gerenciar biblioteca, participar de eventos |
| `MODERATOR`   | Reader + moderar comentários, destacar comentários, editar fórum |
| `GROUP_LEADER`| Reader + gerenciar grupo, publicar capítulos                     |
| `ADMIN`       | Tudo + gerenciar users/roles, publicar news, criar events        |

### 7.3 Configuração Spring Security

```
SecurityFilterChain:
  - /auth/** → permitAll
  - /titles/**, /chapters/**, /news/**, /events/** (GET) → permitAll
  - /comments/**, /ratings/**, /library/** → authenticated
  - /admin/** → hasRole(ADMIN)
  - /groups/**/publish → hasRole(GROUP_LEADER)
```

---

## 8. Estratégia de Cache

### 8.1 Camadas de cache

```
┌───────────┐     ┌───────────┐     ┌───────────────┐     ┌──────────┐
│  Browser   │────>│   Redis    │────>│  PostgreSQL /  │     │ RabbitMQ │
│  (HTTP     │     │  (L2)      │     │  MongoDB (L3)  │<────│ (inval.) │
│  Cache-    │     │  TTL-based │     │                │     └──────────┘
│  Control)  │     └───────────┘     └───────────────┘
└───────────┘
```

### 8.2 Políticas por domínio

| Recurso                | Cache TTL     | Estratégia de Invalidação                    |
| ---------------------- | ------------- | -------------------------------------------- |
| Lista de títulos       | 5 minutos     | Evento `chapter.published` invalida           |
| Detalhes de um título  | 10 minutos    | Evento `chapter.published` invalida por ID    |
| Capítulos de um título | 30 minutos    | Evento `chapter.published` invalida por titleId|
| Comentários            | 30 segundos   | Write-through (atualiza cache no write)       |
| Ratings/Score médio    | 2 minutos     | Evento `rating.submitted` recalcula            |
| Tags/Gêneros           | 1 hora        | Raramente muda, invalidação manual            |
| News list              | 3 minutos     | TTL curto é suficiente                         |
| User profile           | 5 minutos     | Evento `user.profile.updated` invalida         |

### 8.3 Implementação

- **Spring Cache Abstraction** com `@Cacheable`, `@CacheEvict`, `@CachePut`
- **Redis** como cache store via `spring-boot-starter-data-redis`
- **Cache-Control headers** para responses públicas (títulos, news)
- **ETag/If-None-Match** para detalhes de título (304 Not Modified)

---

## 9. Estrutura de Diretórios do Projeto

```
backend/
├── pom.xml                                     # Maven parent
├── docker-compose.yml                          # PostgreSQL + MongoDB + RabbitMQ + Redis
├── Dockerfile
├── README.md
│
└── src/
    ├── main/
    │   ├── java/com/mangareader/
    │   │   │
    │   │   ├── MangaReaderApplication.java     # @SpringBootApplication
    │   │   │
    │   │   ├── domain/                         # 🟢 DOMAIN (zero dependências externas)
    │   │   │   ├── manga/
    │   │   │   │   ├── entity/
    │   │   │   │   │   ├── Title.java          # Entidade de domínio (POJO puro)
    │   │   │   │   │   └── Chapter.java
    │   │   │   │   ├── valueobject/
    │   │   │   │   │   ├── Genre.java
    │   │   │   │   │   └── Score.java
    │   │   │   │   └── service/
    │   │   │   │       └── ScoreCalculator.java # Regra: calcular score médio
    │   │   │   │
    │   │   │   ├── user/
    │   │   │   │   ├── entity/
    │   │   │   │   │   └── User.java
    │   │   │   │   └── valueobject/
    │   │   │   │       └── UserRole.java       # Enum: READER, MODERATOR, ADMIN...
    │   │   │   │
    │   │   │   ├── rating/
    │   │   │   │   ├── entity/
    │   │   │   │   │   └── MangaRating.java
    │   │   │   │   └── valueobject/
    │   │   │   │       └── CategoryRatings.java
    │   │   │   │
    │   │   │   ├── comment/
    │   │   │   │   └── entity/
    │   │   │   │       └── Comment.java
    │   │   │   │
    │   │   │   ├── group/
    │   │   │   │   ├── entity/
    │   │   │   │   │   ├── Group.java
    │   │   │   │   │   ├── GroupMember.java
    │   │   │   │   │   └── GroupWork.java
    │   │   │   │   └── valueobject/
    │   │   │   │       ├── GroupStatus.java
    │   │   │   │       └── GroupRole.java
    │   │   │   │
    │   │   │   ├── library/
    │   │   │   │   ├── entity/
    │   │   │   │   │   └── SavedManga.java
    │   │   │   │   └── valueobject/
    │   │   │   │       └── ReadingListType.java
    │   │   │   │
    │   │   │   ├── event/
    │   │   │   │   ├── entity/
    │   │   │   │   │   └── Event.java
    │   │   │   │   └── valueobject/
    │   │   │   │       ├── EventStatus.java
    │   │   │   │       └── EventType.java
    │   │   │   │
    │   │   │   ├── forum/
    │   │   │   │   ├── entity/
    │   │   │   │   │   ├── ForumTopic.java
    │   │   │   │   │   └── ForumReply.java
    │   │   │   │   └── valueobject/
    │   │   │   │       └── ForumCategory.java
    │   │   │   │
    │   │   │   ├── news/
    │   │   │   │   └── entity/
    │   │   │   │       └── NewsItem.java
    │   │   │   │
    │   │   │   └── store/
    │   │   │       └── entity/
    │   │   │           └── Store.java
    │   │   │
    │   │   ├── application/                    # 🟡 APPLICATION (Use Cases + Ports)
    │   │   │   ├── manga/
    │   │   │   │   ├── usecase/
    │   │   │   │   │   ├── GetTitlesUseCase.java
    │   │   │   │   │   ├── GetTitleByIdUseCase.java
    │   │   │   │   │   └── SearchTitlesUseCase.java
    │   │   │   │   └── port/
    │   │   │   │       └── TitleRepositoryPort.java   # Interface
    │   │   │   │
    │   │   │   ├── rating/
    │   │   │   │   ├── usecase/
    │   │   │   │   │   ├── SubmitRatingUseCase.java
    │   │   │   │   │   └── GetRatingsUseCase.java
    │   │   │   │   └── port/
    │   │   │   │       ├── RatingRepositoryPort.java
    │   │   │   │       └── RatingEventPort.java       # Interface para publicar eventos
    │   │   │   │
    │   │   │   ├── comment/
    │   │   │   │   ├── usecase/
    │   │   │   │   │   ├── CreateCommentUseCase.java
    │   │   │   │   │   ├── DeleteCommentUseCase.java
    │   │   │   │   │   └── GetCommentsUseCase.java
    │   │   │   │   └── port/
    │   │   │   │       └── CommentRepositoryPort.java
    │   │   │   │
    │   │   │   ├── auth/
    │   │   │   │   ├── usecase/
    │   │   │   │   │   ├── SignInUseCase.java
    │   │   │   │   │   ├── SignUpUseCase.java
    │   │   │   │   │   ├── RefreshTokenUseCase.java
    │   │   │   │   │   └── ResetPasswordUseCase.java
    │   │   │   │   └── port/
    │   │   │   │       ├── UserRepositoryPort.java
    │   │   │   │       ├── TokenPort.java
    │   │   │   │       └── EmailPort.java
    │   │   │   │
    │   │   │   └── ...                         # library, group, event, forum, news, store
    │   │   │
    │   │   ├── infrastructure/                 # 🔴 INFRASTRUCTURE (implementações)
    │   │   │   ├── persistence/
    │   │   │   │   ├── postgres/
    │   │   │   │   │   ├── entity/             # @Entity JPA (UserJpaEntity, GroupJpaEntity...)
    │   │   │   │   │   ├── repository/         # Spring Data JPA interfaces
    │   │   │   │   │   └── adapter/            # Implementa Ports, converte JPA ↔ Domain
    │   │   │   │   │
    │   │   │   │   └── mongo/
    │   │   │   │       ├── document/           # @Document Mongo (TitleDocument, RatingDocument...)
    │   │   │   │       ├── repository/         # Spring Data MongoDB interfaces
    │   │   │   │       └── adapter/            # Implementa Ports, converte Document ↔ Domain
    │   │   │   │
    │   │   │   ├── messaging/
    │   │   │   │   ├── config/
    │   │   │   │   │   └── RabbitMQConfig.java # Exchanges, queues, bindings
    │   │   │   │   ├── publisher/
    │   │   │   │   │   └── RabbitEventPublisher.java  # Implementa EventPorts
    │   │   │   │   └── consumer/
    │   │   │   │       ├── ScoreAggregationConsumer.java
    │   │   │   │       ├── DenormalizationConsumer.java
    │   │   │   │       └── NotificationConsumer.java
    │   │   │   │
    │   │   │   ├── cache/
    │   │   │   │   └── config/
    │   │   │   │       └── RedisCacheConfig.java
    │   │   │   │
    │   │   │   ├── security/
    │   │   │   │   ├── config/
    │   │   │   │   │   └── SecurityConfig.java
    │   │   │   │   ├── jwt/
    │   │   │   │   │   ├── JwtTokenProvider.java
    │   │   │   │   │   └── JwtAuthenticationFilter.java
    │   │   │   │   └── adapter/
    │   │   │   │       └── TokenAdapter.java   # Implementa TokenPort
    │   │   │   │
    │   │   │   ├── email/
    │   │   │   │   └── adapter/
    │   │   │   │       └── EmailAdapter.java   # Implementa EmailPort (via RabbitMQ)
    │   │   │   │
    │   │   │   └── seed/
    │   │   │       ├── DataSeeder.java         # CommandLineRunner
    │   │   │       ├── PostgresSeeder.java     # Seed users, groups, events, forum...
    │   │   │       └── MongoSeeder.java        # Seed titles, ratings, comments, news...
    │   │   │
    │   │   ├── presentation/                   # 🔵 PRESENTATION (Controllers + DTOs)
    │   │   │   ├── manga/
    │   │   │   │   ├── controller/
    │   │   │   │   │   └── TitleController.java
    │   │   │   │   └── dto/
    │   │   │   │       ├── TitleResponse.java
    │   │   │   │       ├── TitleSummaryResponse.java
    │   │   │   │       └── TitleSearchRequest.java
    │   │   │   │
    │   │   │   ├── auth/
    │   │   │   │   ├── controller/
    │   │   │   │   │   └── AuthController.java
    │   │   │   │   └── dto/
    │   │   │   │       ├── SignInRequest.java
    │   │   │   │       ├── SignUpRequest.java
    │   │   │   │       └── AuthResponse.java
    │   │   │   │
    │   │   │   ├── rating/
    │   │   │   │   ├── controller/
    │   │   │   │   │   └── RatingController.java
    │   │   │   │   └── dto/
    │   │   │   │       ├── SubmitRatingRequest.java
    │   │   │   │       └── RatingResponse.java
    │   │   │   │
    │   │   │   └── ...                         # comment, group, library, event, forum, news, store
    │   │   │
    │   │   └── shared/                         # Corte transversal
    │   │       ├── dto/
    │   │       │   ├── PageResponse.java       # Wrapper de paginação genérico
    │   │       │   └── ApiErrorResponse.java   # Compatível com frontend ApiErrorResponse
    │   │       ├── exception/
    │   │       │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
    │   │       │   ├── ResourceNotFoundException.java
    │   │       │   └── BusinessRuleException.java
    │   │       └── config/
    │   │           ├── CorsConfig.java
    │   │           └── OpenApiConfig.java
    │   │
    │   └── resources/
    │       ├── application.yml                 # Config principal
    │       ├── application-dev.yml             # Profile dev (Docker local)
    │       ├── application-prod.yml            # Profile prod
    │       └── db/migration/                   # Flyway migrations
    │           ├── V001__create_users_table.sql
    │           ├── V002__create_groups_table.sql
    │           └── ...
    │
    └── test/
        ├── java/com/mangareader/
        │   ├── domain/                         # Testes unitários (puro Java, sem Spring)
        │   ├── application/                    # Testes unitários com Mockito
        │   ├── infrastructure/                 # Testes de integração com Testcontainers
        │   └── presentation/                   # Testes de controllers com MockMvc
        └── resources/
            └── application-test.yml
```

---

## 10. Plano de Migração: Mocks → API Real

### 10.1 Análise do estado atual do frontend

O frontend possui uma **infraestrutura HTTP completa e não utilizada**:

- `httpClient.ts` — Axios client com `VITE_API_BASE_URL`, interceptors, auth headers
- `httpInterceptors.ts` — Normalização `ApiResponse<T>`, tratamento de erros, toast automático
- `httpTypes.ts` — Types `ApiResponse<T>`, `ApiErrorResponse`, `HttpClientConfig`

**Nenhum service usa o client HTTP.** Todos importam `simulateDelay` de `mockApi.ts` e leem arrays mock.

### 10.2 Estratégia de migração: Feature Flag + Service Swap

A migração deve ser **gradual, por feature**, sem big-bang:

```typescript
// ANTES (mock):
import { simulateDelay } from '@shared/service/mockApi';
import { mockTitles } from '@mock/data/titles';

export const getTitles = async (): Promise<Title[]> => {
    await simulateDelay();
    return mockTitles;
};

// DEPOIS (API real):
import { api } from '@shared/service/http';

export const getTitles = async (): Promise<Title[]> => {
    const response = await api.get<Title[]>('/titles');
    return response.data.data;
};
```

**Ponto de troca único**: Cada `*Service.ts` é o único arquivo que precisa mudar por feature. Hooks e componentes permanecem intactos.

### 10.3 Ordem de migração recomendada

| Fase | Feature         | Justificativa                                               |
| ---- | --------------- | ----------------------------------------------------------- |
| 1    | **Auth**        | Base para tudo — sem auth real, não há user identity         |
| 2    | **Manga/Title** | Core do produto — listagem, busca, detalhes                  |
| 3    | **Chapter**     | Complemento direto de Title                                  |
| 4    | **Comment**     | Já usa `useMutation` do react-query (mais próximo de real)   |
| 5    | **Rating**      | Depende de auth + title existirem                            |
| 6    | **Library**     | Depende de auth + title                                      |
| 7    | **Group**       | Módulo independente, menor prioridade                        |
| 8    | **Category**    | Tags/filtros (pode ser lazy, dados quase estáticos)          |
| 9    | **News**        | Módulo editorial independente                                |
| 10   | **Event**       | Módulo independente                                          |
| 11   | **Forum**       | Módulo independente                                          |
| 12   | **Store**       | Módulo mais simples, menor prioridade                        |

### 10.4 Ajustes necessários no frontend

1. **Atualizar `.env`**:
   ```dotenv
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   ```

2. **Atualizar `API_URLS.ts`** com paths por domínio:
   ```typescript
   export const API_URLS = {
       BASE_URL: BASE,
       TITLES: `${BASE}/titles`,
       COMMENTS: `${BASE}/comments`,
       RATINGS: `${BASE}/ratings`,
       AUTH: `${BASE}/auth`,
       // ...
   } as const;
   ```

3. **Padronizar response format** — O backend deve retornar:
   ```json
   {
     "data": { ... },
     "success": true,
     "message": "optional",
     "statusCode": 200
   }
   ```
   Isso é compatível com o `ApiResponse<T>` já definido em `httpTypes.ts` e com a normalização feita em `onResponseSuccess` do interceptor.

4. **Migrar hooks de Rating** para react-query (atualmente usam `useState`/`useEffect` raw)

5. **Remover imports de `@mock/`** conforme cada service for migrado

---

## 11. Estratégia de Seed e Dados Iniciais

### 11.1 Abordagem: CommandLineRunner + Profiles

```java
@Component
@Profile("dev")  // Só executa em ambiente de desenvolvimento
public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        if (isDatabaseEmpty()) {
            postgresSeeder.seed();  // Users, Groups, Events, Forum, Stores
            mongoSeeder.seed();     // Titles, Ratings, Comments, News
        }
    }
}
```

### 11.2 Fonte dos dados de seed

Os **mocks do frontend são a fonte canônica**. O seed deve replicar exatamente os mesmos dados:

| Mock File Frontend    | Seeds Into         | Database   | Volume          |
| --------------------- | ------------------ | ---------- | --------------- |
| `users.ts`            | `users` table      | PostgreSQL | 15 users        |
| `titles.ts`           | `titles` collection| MongoDB    | 16 títulos      |
| `comments.ts`         | `comments` coll.   | MongoDB    | ~50 comentários |
| `ratings.ts`          | `ratings` coll.    | MongoDB    | ~80 ratings     |
| `groups.ts`           | `groups` table     | PostgreSQL | 8 grupos        |
| `events.ts`           | `events` table     | PostgreSQL | Variável        |
| `forums.ts`           | `forum_topics`     | PostgreSQL | Variável        |
| `news.ts`             | `news` coll.       | MongoDB    | Variável        |
| `stores.ts`           | `stores` table     | PostgreSQL | ~6 lojas        |
| `library.ts`          | `user_libraries`   | PostgreSQL | Variável        |
| `tags.ts`             | `tags` table       | PostgreSQL | ~35 tags        |

### 11.3 Formato do seed

Dois caminhos complementares:

**A. JSON Resources** (recomendado para início):
```
src/main/resources/seed/
├── users.json          # Exportado dos mocks do frontend
├── titles.json
├── comments.json
├── ratings.json
├── groups.json
├── events.json
├── news.json
├── stores.json
└── tags.json
```

O seeder lê os JSONs e persiste via repositories. Vantagem: fácil de atualizar conforme mocks evoluem.

**B. Flyway + Mongock migrations** (recomendado para produção):
```sql
-- V100__seed_users.sql (Flyway)
INSERT INTO users (id, name, email, password_hash, role) VALUES
('user-1', 'Leitor Demo', 'demo@manga.com', '$2a$10$...', 'READER'),
('user-2', 'Sakura Tanaka', 'sakura@manga.com', '$2a$10$...', 'READER');
```

```java
// SeedTitlesMigration.java (Mongock)
@ChangeUnit(id = "seed-titles-001", order = "001")
public class SeedTitlesMigration {
    @Execution
    public void execute(MongoTemplate mongo) {
        // Insert titles from JSON resource
    }
}
```

### 11.4 IDs consistentes

**Decisão crítica**: Manter os mesmos IDs do frontend nos dados de seed.

Os mocks usam IDs como `"1"`, `"user-1"`, `"group-1"`. O seed deve preservar esses IDs para que:
- Links e referências no frontend continuem funcionando
- Testes e debugging sejam mais fáceis
- A migração seja incremental (mock e API real podem coexistir temporariamente)

---

## 12. Infraestrutura e Deploy

### 12.1 Desenvolvimento local (Docker Compose)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: mangareader
      POSTGRES_USER: manga
      POSTGRES_PASSWORD: manga_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:8.0
    ports: ["27017:27017"]
    environment:
      MONGO_INITDB_DATABASE: mangareader
    volumes:
      - mongo_data:/data/db

  rabbitmq:
    image: rabbitmq:4-management-alpine
    ports:
      - "5672:5672"     # AMQP
      - "15672:15672"   # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: manga
      RABBITMQ_DEFAULT_PASS: manga_secret

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru

volumes:
  postgres_data:
  mongo_data:
```

### 12.2 Produção — Opções econômicas

| Opção                    | Custo Estimado    | Prós                                      | Contras                            |
| ------------------------ | ----------------- | ----------------------------------------- | ---------------------------------- |
| **Railway.app**          | $5-20/mês          | Deploy simples, PostgreSQL + Redis incluso | MongoDB como add-on (custo extra)  |
| **Render.com**           | $7-25/mês          | Free tier generoso, auto-deploy           | Cold starts no free tier           |
| **Oracle Cloud Free**    | $0 (always free)   | 4 ARM CPUs, 24GB RAM, PostgreSQL grátis   | Setup manual, sem MongoDB nativo   |
| **Fly.io**               | $5-15/mês          | Edge deploy, boa DX                       | Pricing pode surpreender           |
| **VPS (Hetzner/Contabo)**| €4-10/mês          | Controle total, custo previsível          | Manutenção manual                  |

**Recomendação para início**: **Railway.app** ou **Render.com** para foco máximo no código. Migrar para VPS quando a economia justificar a complexidade operacional.

### 12.3 MongoDB econômico

- **MongoDB Atlas Free Tier**: 512MB, cluster M0 — suficiente para início
- Alternativa: Rodar MongoDB no mesmo VPS via Docker

---

## 13. Observabilidade

### 13.1 Stack mínima e econômica

| Ferramenta                | Propósito                         | Custo      |
| ------------------------- | --------------------------------- | ---------- |
| **Spring Boot Actuator**  | Health checks, métricas básicas   | Incluso    |
| **SLF4J + Logback**       | Logging estruturado               | Incluso    |
| **Micrometer + Prometheus** | Métricas (JVM, HTTP, custom)    | Gratuito   |
| **Grafana Cloud Free**    | Dashboards (50GB logs/mês grátis) | $0         |

### 13.2 O que monitorar

- **Health**: PostgreSQL, MongoDB, RabbitMQ, Redis connectivity
- **Latência**: P50, P95, P99 por endpoint
- **Throughput**: requests/segundo por domínio
- **Erros**: Taxa de 4xx/5xx, exceções por tipo
- **Business**: Ratings submetidos/dia, comentários/dia, novos users/dia
- **Infra**: Tamanho das filas RabbitMQ, hit rate do Redis cache

---

## 14. Fases de Implementação

### Fase 0 — Foundation (1-2 semanas)

- [ ] Scaffold projeto Spring Boot 3.4 com Maven
- [ ] Configurar Docker Compose (PostgreSQL + MongoDB + RabbitMQ + Redis)
- [ ] Estruturar packages seguindo Clean Architecture
- [ ] Configurar Flyway + Mongock
- [ ] Configurar Spring Security + JWT básico
- [ ] Implementar `GlobalExceptionHandler` com `ApiResponse<T>` compatível com o frontend
- [ ] Configurar CORS para `http://localhost:5173` (Vite dev server)
- [ ] Configurar SpringDoc OpenAPI (Swagger UI)

### Fase 1 — Core: Auth + Manga (2-3 semanas)

- [ ] Domínio User + Auth (SignIn, SignUp, Refresh, ResetPassword)
- [ ] Domínio Title (CRUD completo + busca + filtros)
- [ ] Domínio Chapter (listar por title, buscar por número)
- [ ] Seed: Users (PostgreSQL) + Titles com Chapters (MongoDB)
- [ ] **Frontend**: Migrar `authService.ts` e `titleService.ts` para `api` HTTP client
- [ ] Testes de integração com Testcontainers

### Fase 2 — Interação: Comments + Ratings (2 semanas)

- [ ] Domínio Comment (CRUD + árvore de respostas + likes/dislikes)
- [ ] Domínio Rating (submit com categoryRatings + aggregated scores)
- [ ] RabbitMQ: `rating.submitted` → score aggregation worker
- [ ] Redis cache para scores médios e comentários
- [ ] Seed: Comments + Ratings (MongoDB)
- [ ] **Frontend**: Migrar `commentService.ts` e `ratingService.ts`

### Fase 3 — Biblioteca + Grupos (2 semanas)

- [ ] Domínio Library (salvar/remover/mudar lista de leitura)
- [ ] Domínio Group (CRUD + membros + works traduzidos)
- [ ] RabbitMQ: `user.profile.updated` → desnormalização MongoDB
- [ ] Seed: Library + Groups (PostgreSQL)
- [ ] **Frontend**: Migrar `libraryService.ts` e `groupService.ts`

### Fase 4 — Content: News + Events + Forum (2-3 semanas)

- [ ] Domínio News (CRUD + filtros + reactions)
- [ ] Domínio Event (CRUD + participação + tickets)
- [ ] Domínio Forum (tópicos + replies + categorias + paginação)
- [ ] Seed: News (MongoDB) + Events + Forum (PostgreSQL)
- [ ] **Frontend**: Migrar `newsService.ts`, `eventService.ts`, `forumService.ts`

### Fase 5 — Polish + Category + Store (1-2 semanas)

- [ ] Domínio Category (tags, filtros, busca avançada)
- [ ] Domínio Store (listagem + mapping por title)
- [ ] Performance tuning (Redis cache, query optimization, N+1 detection)
- [ ] **Frontend**: Migrar services restantes, remover `@mock/` imports
- [ ] **Frontend**: Migrar hooks de Rating para react-query
- [ ] Remover `mockApi.ts` e todo o diretório `mock/` quando 100% migrado

### Fase 6 — Produção (1 semana)

- [ ] Containerizar aplicação (Dockerfile multi-stage)
- [ ] Configurar profiles `dev` / `prod`
- [ ] Deploy em plataforma escolhida
- [ ] Configurar monitoramento (Actuator + Prometheus + Grafana)
- [ ] Configurar HTTPS + domínio
- [ ] Smoke tests em produção

---

## Resumo das Decisões Arquiteturais

| Decisão                      | Escolha                    | Motivo Principal                              |
| ---------------------------- | -------------------------- | --------------------------------------------- |
| Estilo arquitetural          | Monolito modular           | Simplicidade e economia                       |
| Linguagem                    | Java 21 LTS               | Virtual threads, records, ecossistema maduro   |
| Framework                    | Spring Boot 3.4            | Produtividade + Spring Data dual DB            |
| Banco relacional             | PostgreSQL 17              | Robusto, gratuito, JSONB quando necessário     |
| Banco documental             | MongoDB 8.0               | Schema flexível, reads rápidos, embedded docs  |
| Mensageria                   | RabbitMQ 4                | Leve, barato, suficiente para o volume         |
| Cache                        | Redis 7                   | Velocidade, TTL nativo, rate limiting          |
| Auth                         | JWT stateless + Redis      | Compatível com frontend existente              |
| Migrations (SQL)             | Flyway                    | Padrão de mercado, versionamento seguro        |
| Migrations (NoSQL)           | Mongock                   | Mesmo conceito de Flyway para MongoDB          |
| Mapeamento DTO               | MapStruct                 | Zero reflection, compile-time                  |
| API Documentation            | SpringDoc OpenAPI          | Swagger UI automático                          |
| Testes de integração         | Testcontainers            | Containers reais, fidedignidade                |
| Build                        | Maven                     | Ecossistema Spring, CI/CD compatibility        |
| Containerização              | Docker + Compose           | Ambiente reproduzível                          |

---

> **Nota**: Este documento é um guia de alto nível. Detalhes de endpoints, payloads e regras de negócio específicas serão definidos durante a implementação de cada fase.
