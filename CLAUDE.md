# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manga Reader — a platform for reading mangás, manhwas, and manhuas. Monorepo with a Spring Boot backend and React frontend.

## Build & Development Commands

### Backend (from `/backend/`)

```bash
# Run all tests (727 tests, JUnit 5 + Mockito + H2 + TestContainers)
mvn test

# Run a single test class
mvn test -Dtest=UserTest

# Run a single test method
mvn test -Dtest=UserTest#shouldInitializeDefaultValuesWhenUsingBuilder

# Run tests by layer
mvn test -Dtest=**/domain/**/*Test
mvn test -Dtest=**/application/**/*Test
mvn test -Dtest=**/presentation/**/*Test
mvn test -Dtest=**/infrastructure/**/*Test

# Build JAR (skipping tests)
mvn package -DskipTests

# Start application (Docker Compose services auto-start)
mvn spring-boot:run
```

### Frontend (from `/frontend/`)

```bash
npm run dev        # Dev server on :5173 (proxies API to :8080)
npm run build      # TypeScript check + production build
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Run all tests (Vitest)
npm run test:watch # Watch mode
```

### Infrastructure

Docker Compose in `/backend/docker-compose.yml` provides PostgreSQL 17, MongoDB 8.0, RabbitMQ 4, and Redis 7. Spring Boot auto-manages these containers via `spring-boot-docker-compose`.

## Architecture

**Clean Architecture with 4 layers** — dependency flows inward:

```
presentation (REST controllers + DTOs + MapStruct mappers)
      ↓
application (use cases — each implements a Port interface)
      ↓
domain (entities, value objects, enums — no framework dependencies)
      ↑
infrastructure (persistence adapters, security, email, messaging)
```

### 12 Business Domains

Auth, User, Manga (titles/chapters), Comment, Rating, Library, Group, News, Event, Forum, Category/Tag, Store — each domain has its own package in every layer.

### Dual Database

- **PostgreSQL** (JPA/Hibernate + Flyway migrations): users, groups, events, forum, library, stores, tags
- **MongoDB** (Spring Data Mongo + Mongock migrations): titles, chapters, comments, ratings, news

### Key Patterns

- **Ports & Adapters**: use cases depend on port interfaces; infrastructure implements them
- **MapStruct**: static final-class mappers for DTO↔entity conversion in controllers
- **JWT Auth**: `JwtAuthenticationFilter` depends on `TokenPort` — all `@WebMvcTest` tests must mock `TokenPort` via `@MockitoBean`
- **Test profile**: `application-test.yml` uses H2 in-memory (Flyway disabled, ddl-auto: create-drop)
- **@Transactional**: All data-modifying use cases that access lazy-loaded collections or perform multi-repository operations **must** have `@Transactional`. Read-only use cases accessing lazy collections must have `@Transactional(readOnly = true)`

## Test Conventions

### Backend

| Layer | Annotation | Style |
|-------|-----------|-------|
| Domain | None | Pure JUnit 5, no Spring |
| Application | `@ExtendWith(MockitoExtension.class)` | Mockito mocks of ports |
| Presentation | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | MockMvc + `@MockitoBean TokenPort tokenPort` required |
| Infrastructure JPA | `@DataJpaTest` + `@ActiveProfiles("test")` | H2 in-memory DB |
| Infrastructure MongoDB | `@DataMongoTest` + `@ActiveProfiles("test")` + `@Import(MongoTestContainerConfig.class)` | TestContainers (mongo:8.0) |

### Frontend

| Type | Location | Style |
|------|----------|-------|
| Hooks | `feature/{name}/hook/__tests__/` | `renderHook` / `renderHookWithProviders` + MSW handlers |
| Components | (pending) | `render` + `@testing-library/react` + MSW |

- **Stack**: Vitest (standalone `vitest.config.ts`) + @testing-library/react + MSW v2
- **vitest.config.ts is standalone** — must NOT extend `vite.config.ts` because it imports `ROUTES` which uses `import.meta.env` (breaks in test context)
- **MSW handlers**: Use `*/api/...` wildcard pattern (baseURL may be empty in tests)
- **QueryClient in tests**: Always use `retry: false` and `gcTime: 0` via `createTestQueryClient()` from `src/test/testUtils.tsx`
- **Auth state isolation**: `localStorage.clear()` runs in `afterEach` (setupTests.ts) to prevent session leakage
- **Toast mocking**: For hooks using `toastService`, mock via `vi.mock('@shared/service/util/toastService')`

### Known Test Limitations

- **H2 vs PostgreSQL**: H2 doesn't support JSONB — avoid `entityManager.clear()` + re-read on entities with JSONB columns
- **H2 collation**: ASCII collation differs from PostgreSQL — use ASCII-only labels in test data
- **Lombok booleans**: getter for `boolean highlighted` is `isHighlighted()`, not `getHighlighted()`
- **Docker API version**: `docker-java.properties` in test resources sets `api.version=1.44` for Docker 29+ compatibility with TestContainers 1.20.x
- **MongoDB indexes**: After `mongoTemplate.dropCollection()` in `@BeforeEach`, compound indexes (e.g., MangaRating unique titleId+userId) must be re-created manually via `IndexResolver`

## Development Policy (Backend)

For any new feature, integration, or code change, follow TDD-like workflow:

1. Write/update tests first (red)
2. Implement the functionality (green)
3. Run all tests after implementation

## Acceptance Criteria & Tests (Mandatory)

Every code change **must** include corresponding tests. No feature is considered complete without them.

### Requirements Validation

Before implementing, verify:
- All specifications are understood (read this file + relevant domain code)
- Identify which files need creation/modification
- Map each requirement to at least one test case

### Test Coverage Rules

| Change Type | Required Tests |
|-------------|---------------|
| New entity / VO / enum | Domain-layer unit test (pure JUnit 5) |
| New use case | Application-layer test (`@ExtendWith(MockitoExtension.class)`) with happy path, error cases, and edge cases |
| New/modified endpoint | Controller test (`@WebMvcTest`) covering status codes, response shape, and validation |
| New JPA repository method | `@DataJpaTest` integration test |
| New MongoDB repository method | `@DataMongoTest` + TestContainers integration test |
| Bug fix | Regression test that fails without the fix |
| New frontend hook | Hook test with `renderHookWithProviders` + MSW handlers |
| New frontend component | Component test with `render` + `@testing-library/react` + MSW |

### Test Structure (Examples)

**Domain test** — pure JUnit 5, no Spring:
```java
@DisplayName("UserRecommendation")
class UserRecommendationTest {
    @Test
    @DisplayName("Deve inicializar position com 0 via @Builder.Default")
    void deveInicializarPositionComZero() {
        var rec = UserRecommendation.builder().titleId("t1").titleName("Title").build();
        assertThat(rec.getPosition()).isZero();
    }
}
```

**Application test** — Mockito mocks of ports:
```java
@ExtendWith(MockitoExtension.class)
@DisplayName("AddRecommendationUseCase")
class AddRecommendationUseCaseTest {
    @Mock private UserRepositoryPort userRepository;
    @Mock private RecommendationRepositoryPort recommendationRepository;
    @Mock private TitleRepositoryPort titleRepository;
    @InjectMocks private AddRecommendationUseCase useCase;

    @Test
    @DisplayName("Deve lançar exceção quando limite de 10 recomendações é atingido")
    void deveLancarExcecaoQuandoLimiteAtingido() {
        when(userRepository.findById(any())).thenReturn(Optional.of(user));
        when(recommendationRepository.findByUserIdAndTitleId(any(), any())).thenReturn(Optional.empty());
        when(recommendationRepository.countByUserId(any())).thenReturn(10L);

        assertThatThrownBy(() -> useCase.execute(userId, "title-11"))
                .isInstanceOf(IllegalStateException.class);
    }
}
```

**Presentation test** — `@WebMvcTest` + MockMvc:
```java
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private TokenPort tokenPort;           // Always required
    @MockitoBean private GetUserProfileUseCase useCase;  // Mock each injected use case

    @Test
    void deveRetornar200ComPerfilPublico() throws Exception {
        when(useCase.execute(any())).thenReturn(buildUser());
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test User"));
    }
}
```

### Verification Checklist

Before considering any task done:
1. `mvn test` passes with **0 failures, 0 errors**
2. `cd frontend && npx tsc --noEmit` compiles with **0 errors**
3. Every new/changed requirement has a corresponding test
4. No existing tests were broken or deleted without justification

### Lazy Collections & Transactions

JPA `@OneToMany` associations use `FetchType.LAZY` by default. When a use case returns an entity whose lazy collections will be accessed outside the transaction (e.g., in a controller mapper):
- Add `@Transactional(readOnly = true)` to the use case method
- Force initialization inside the method: `entity.getCollection().size()`

## Source Layout

```
backend/src/main/java/com/mangareader/
├── domain/{domain}/entity/          # Entities and VOs
├── application/{domain}/usecase/    # Use cases
├── application/{domain}/port/       # Port interfaces (in/out)
├── infrastructure/persistence/      # postgres/adapter/, mongo/adapter/
├── infrastructure/security/         # JWT, SecurityConfig, RateLimit
├── presentation/{domain}/controller/ # REST endpoints
├── presentation/{domain}/dto/       # Request/Response DTOs
├── presentation/{domain}/mapper/    # MapStruct mappers
└── shared/                          # Cross-cutting: configs, exceptions, constants

frontend/src/
├── app/          # Layouts, router, route guards
├── feature/      # 13 feature modules (component/, hook/, service/, type/)
├── shared/       # Reusable components (~37), HTTP client, types
├── mock/         # Mock data (legacy — all features now use real API)
└── style/        # Global CSS + Tailwind
```

## Documentation Policy

Every code change **must** include corresponding documentation updates. No feature is considered complete without updated docs.

| Change Type | Required Documentation |
|-------------|----------------------|
| New feature / endpoint | Update `README.md` (endpoints table), `CLAUDE.md` (patterns/conventions) |
| New use case / entity | Update `README.md` (metrics), `CLAUDE.md` (domain list if applicable) |
| Bug fix with lesson learned | Update `CLAUDE.md` (Known Test Limitations or equivalent section) |
| Architecture change | Update `docs/overview.md`, `docs/backend-analysis.md` or `docs/frontend-analysis.md` |
| New tech debt identified | Add to `docs/tech-debt.md` with priority and impact |
| Tech debt resolved | Remove from `docs/tech-debt.md`, update `README.md` |
| New pending task | Add to `docs/pending-tasks.md` |
| Task completed | Remove from `docs/pending-tasks.md` |
| Dependency version change | Update `README.md` (Stack table), `docs/overview.md` |
| Test count change | Update `README.md` and `CLAUDE.md` test counts |

### Documentation Verification Checklist

Before considering any task done:
1. `README.md` metrics match current state (test count, use case count, endpoint count)
2. `CLAUDE.md` conventions reflect any new patterns introduced
3. `docs/tech-debt.md` has no resolved items still listed
4. `docs/pending-tasks.md` has no completed tasks still listed
