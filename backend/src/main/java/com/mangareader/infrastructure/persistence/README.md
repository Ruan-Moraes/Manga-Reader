# Plano de Testes — Infrastructure / Persistence

> Camada de persistência: 7 adapters PostgreSQL + 4 adapters MongoDB + 11 Spring Data repositories.

---

## Padrão Geral

Todos os adapters seguem o mesmo padrão:
1. Implementam o port da camada de application (ex: `UserRepositoryPort`)
2. São anotados com `@Component` ou `@Service`
3. Delegam para Spring Data repository (JPA ou MongoDB)
4. A maioria dos métodos é 1:1 (adapter method → repository method)

### Estratégia de Testes
- **Teste de integração** com banco real (ou H2/TestContainers): validar queries, paginação, constraints
- **Testes unitários** dos adapters geralmente são de baixo valor (testam delegação)
- Foco nos métodos com queries customizadas (`@Query`)

---

## PostgreSQL Adapters (7)

### 1. UserRepositoryAdapter → UserJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findById(UUID)` | PK lookup | — |
| `findByEmail(String)` | `findByEmail` (derived) | — |
| `existsByEmail(String)` | `existsByEmail` (derived) | — |
| `save(User)` | JPA save (merge/persist) | — |
| `deleteById(UUID)` | PK delete | — |

**Testes prioritários**:
- `findByEmail` com email existente e inexistente
- `existsByEmail` verdadeiro/falso
- `save` com `@CreationTimestamp` — verificar que `createdAt` é preenchido
- Constraint unique em `email` — teste de duplicata

### 2. LibraryRepositoryAdapter → LibraryJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByUserId(UUID)` | Derived | — |
| `findByUserIdAndList(UUID, ReadingListType)` | Derived | — |
| `findByUserIdAndTitleId(UUID, String)` | Derived | — |
| `save(SavedManga)` | JPA save | — |
| `deleteByUserIdAndTitleId(UUID, String)` | Derived + `@Transactional` | — |
| `findByUserId(UUID, Pageable)` | Derived paginated | — |

**Testes prioritários**:
- `UniqueConstraint(user_id, title_id)` — insert duplicata
- `deleteByUserIdAndTitleId` — verificar que deleta por composta (não por PK)
- Cross-DB: `titleId` é String referenciando MongoDB — integridade não garantida

### 3. GroupRepositoryAdapter → GroupJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByUsername(String)` | Derived | unique constraint |
| `existsByUsername(String)` | Derived | — |
| `findByTitleId(String)` | `@Query` JOIN com `translatedWorks` | **Query JPQL customizada** |
| `findAll(Pageable)` | JpaRepository | — |

**Testes prioritários**:
- `@Query("SELECT g FROM Group g JOIN g.translatedWorks w WHERE w.titleId = :titleId")` — testar com e sem works
- `existsByUsername` — case sensitivity
- Cascade de `members` e `translatedWorks` — inserir/deletar com orphanRemoval

### 4. ForumRepositoryAdapter → ForumTopicJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByCategory(ForumCategory, Pageable)` | Derived | — |
| `searchByTitle(String, Pageable)` | `findByTitleContainingIgnoreCase` | — |

**Testes prioritários**:
- `orphanRemoval=true` nas replies — deletar tópico deve deletar replies
- `searchByTitle` case-insensitive

### 5. EventRepositoryAdapter → EventJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByStatus(EventStatus)` | Derived | — |
| `findAll()` | `findAllByOrderByStartDateDesc()` | **Ordenado por startDate desc** |

**Testes prioritários**:
- Ordenação por `startDate` desc
- Filter por `EventStatus` enum

### 6. StoreRepositoryAdapter → StoreJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByTitleId(String)` | `@Query` JOIN com `titles` | **Query JPQL customizada** |

**Testes prioritários**:
- `@Query("SELECT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId")` — testar com e sem titles

### 7. TagRepositoryAdapter → TagJpaRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByLabelContainingIgnoreCase(String)` | Derived | — |
| `findAll()` | `findAllByOrderByLabelAsc()` | **Ordenado alfabeticamente** |

**Testes prioritários**:
- Ordenação alfabética
- ILIKE com acentos: "ação" vs "Ação"
- Constraint unique em `label`

---

## MongoDB Adapters (4)

### 1. TitleRepositoryAdapter → TitleMongoRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByGenresContaining(String)` | Derived | Busca em array |
| `searchByName(String)` | `findByNameContainingIgnoreCase` | Regex no MongoDB |
| `findByGenresContainingAll(List<String>)` | `@Query("{'genres': {$all: ?0}}")` | **Query MongoDB nativa** |

**Testes prioritários**:
- `$all` operator — título com genres=["Ação", "Drama"], query=["Ação", "Drama"] → encontra; query=["Ação", "Romance"] → não encontra
- `searchByName` case-insensitive com regex
- TextIndex com weights: verificar que `name` tem mais relevância que `synopsis`

### 2. RatingRepositoryAdapter → RatingMongoRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByTitleId(String)` | Derived | — |
| `findByTitleIdAndUserId(String, String)` | Derived | Compound index unique |
| `findByUserId(String)` | Derived | — |
| `countByTitleId(String)` | Derived | — |

**Testes prioritários**:
- `@CompoundIndex(name="title_user_idx", def="{'titleId':1, 'userId':1}", unique=true)` — insert duplicata
- `countByTitleId` vs `findByTitleId().size()` — devem ser consistentes

### 3. CommentRepositoryAdapter → CommentMongoRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByTitleId(String)` | Derived | — |
| `findByTitleIdAndParentCommentIdIsNull(String)` | Derived | Apenas root comments |
| `findByParentCommentId(String)` | Derived | Apenas replies |

**Testes prioritários**:
- Root vs reply: `parentCommentId` null vs filled
- Paginação por titleId

### 4. NewsRepositoryAdapter → NewsMongoRepository

| Método | Query | Observações |
|--------|-------|-------------|
| `findByCategory(NewsCategory)` | Derived | — |
| `searchByTitle(String)` | `findByTitleContainingIgnoreCase` | Regex |
| `findByIsFeaturedTrue()` | Derived | Não usado em UC |

**Testes prioritários**:
- `findByIsFeaturedTrue()` — existe no repo mas não é usado por nenhum UC
- Paginação com sort por data

---

## Consultas JPQL/MongoDB Customizadas (Query Críticas)

| Repository | Query | Tipo |
|---|---|---|
| GroupJpaRepository | `SELECT g FROM Group g JOIN g.translatedWorks w WHERE w.titleId = :titleId` | JPQL |
| StoreJpaRepository | `SELECT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId` | JPQL |
| TitleMongoRepository | `{'genres': {$all: ?0}}` | MongoDB Native |

Essas queries devem ser testadas com dados reais (integração) para validar corretude.

---

## Constraints e Indexes a Testar

| Entidade | Constraint | Tipo |
|---|---|---|
| User | `email` unique | PostgreSQL |
| Tag | `label` unique (max 60) | PostgreSQL |
| Group | `username` unique | PostgreSQL |
| SavedManga | `(user_id, title_id)` unique | PostgreSQL |
| GroupMember | `(group_id, user_id)` unique | PostgreSQL |
| MangaRating | `(titleId, userId)` compound unique | MongoDB |
| Title | TextIndex `(name:10, author:5, synopsis:3)` | MongoDB |

---

## Matriz de Cobertura

| Adapter | Port | Queries Customizadas | Constraints | Prioridade |
|---------|------|---------------------|-------------|------------|
| UserRepositoryAdapter | UserRepositoryPort | 0 | email unique | Alta |
| LibraryRepositoryAdapter | LibraryRepositoryPort | 0 | (user_id, title_id) unique | Alta |
| GroupRepositoryAdapter | GroupRepositoryPort | 1 (findByTitleId) | username unique | Alta |
| ForumRepositoryAdapter | ForumRepositoryPort | 0 | — | Média |
| EventRepositoryAdapter | EventRepositoryPort | 0 | — | Baixa |
| StoreRepositoryAdapter | StoreRepositoryPort | 1 (findByTitleId) | — | Média |
| TagRepositoryAdapter | TagRepositoryPort | 0 | label unique | Média |
| TitleRepositoryAdapter | TitleRepositoryPort | 1 ($all genres) | TextIndex | **Alta** |
| RatingRepositoryAdapter | RatingRepositoryPort | 0 | compound unique | **Alta** |
| CommentRepositoryAdapter | CommentRepositoryPort | 0 | — | Média |
| NewsRepositoryAdapter | NewsRepositoryPort | 0 | — | Baixa |

## Status: 🔲 Não Implementado
