# CLAUDE.md

## Project Overview

**Manga Reader** — plataforma para leitura de mangás, manhwas e manhuas. Monorepo com Spring Boot (backend) e React (frontend).

## Build & Run

### Backend (`/backend/`)

```bash
mvn test                                        # Todos os testes (946, JUnit 5 + Mockito + H2 + TestContainers)
mvn test -Dtest=UserTest                        # Classe específica
mvn test -Dtest=UserTest#shouldInitialize...    # Método específico
mvn test -Dtest=**/domain/**/*Test              # Por camada (domain/application/presentation/infrastructure)
mvn package -DskipTests                         # Build JAR
mvn spring-boot:run                             # Iniciar (Docker Compose sobe automaticamente)
```

### Frontend (`/frontend/`)

```bash
npm run dev         # Dev server :5173 (proxy API → :8080)
npm run build       # TypeScript check + production build
npm run lint        # ESLint
npm run format      # Prettier
npm test            # Vitest
npm run test:watch  # Watch mode
```

### Infra

Docker Compose em `/backend/docker-compose.yml`: PostgreSQL 17, MongoDB 8.0, RabbitMQ 4, Redis 7. Gerenciado automaticamente via `spring-boot-docker-compose`.

---

## Architecture

**Clean Architecture — 4 camadas, dependência flui para dentro:**

```
presentation → application → domain ← infrastructure
```

- **presentation**: REST controllers, DTOs, MapStruct mappers
- **application**: use cases (cada um implementa uma Port interface)
- **domain**: entities, value objects, enums — zero dependência de framework
- **infrastructure**: persistence adapters, security, email, messaging

### 12 Domínios

Auth, User, Manga, Comment, Rating, Library, Group, News, Event, Forum, Category/Tag, Store — cada um com package próprio em todas as camadas.

### Dual Database

| DB | Tech | Responsável por |
|----|------|----------------|
| PostgreSQL | JPA/Hibernate + Flyway | users, groups, events, forum, library, stores, tags |
| MongoDB | Spring Data Mongo + Mongock | titles, chapters, comments, ratings, news |

### Key Patterns

- **Ports & Adapters**: use cases dependem de port interfaces; infrastructure implementa
- **MapStruct**: mappers estáticos `final class` para conversão DTO↔entity nos controllers
- **JWT Auth**: `JwtAuthenticationFilter` depende de `TokenPort` — todo `@WebMvcTest` **deve** mockar `TokenPort` via `@MockitoBean`
- **@Transactional**: use cases que modificam dados ou acessam lazy collections **devem** ter `@Transactional`. Read-only com lazy collections: `@Transactional(readOnly = true)`

### API Response Patterns

Todas as respostas da API seguem um dos dois padrões:

**Resposta simples** — `ApiResponse<T>`:
```json
{ "data": T, "success": true, "message": "...", "statusCode": 200 }
```
Frontend acessa: `response.data.data`

**Resposta paginada** — `ApiResponse<PageResponse<T>>`:
```json
{
  "data": {
    "content": [],
    "page": 0, "size": 20,
    "totalElements": 100, "totalPages": 5, "last": false
  },
  "success": true
}
```
Frontend acessa: `response.data.data.content` (ou `res.content` após extrair `data.data` no service)

**Regra**: Endpoints de listagem **devem** retornar `ApiResponse<PageResponse<T>>` com paginação. Endpoints de item único retornam `ApiResponse<T>` direto.

---

## Clean Code Guidelines

### Constantes sobre Magic Numbers
- Substituir valores hard-coded por constantes nomeadas com nomes descritivos
- Manter constantes no topo do arquivo ou em arquivo dedicado

### Nomes Significativos
- Variáveis, funções e classes devem revelar seu propósito
- Evitar abreviações, exceto as universalmente compreendidas

### Comentários Inteligentes
- Não comentar **o quê** o código faz — tornar o código autoexplicativo
- Comentar **por quê** algo é feito de determinada forma
- Documentar APIs, algoritmos complexos e side effects não óbvios

### Responsabilidade Única
- Cada função faz exatamente uma coisa, pequena e focada
- Se precisa de comentário para explicar o que faz, deve ser dividida

### DRY (Don't Repeat Yourself)
- Extrair código repetido em funções reutilizáveis
- Manter single sources of truth

### Encapsulamento
- Esconder detalhes de implementação, expor interfaces claras
- Mover condicionais aninhados para funções bem nomeadas

### Qualidade Contínua
- Refatorar continuamente; corrigir tech debt cedo
- Deixar o código mais limpo do que encontrou

### Mobile-First
- CSS: estilos base para mobile, media-queries para telas maiores (sm → md → lg)
- Tailwind: escrever classes base sem prefixo, adicionar `sm:`, `md:`, `lg:` para breakpoints maiores
- Admin sidebar: colapsável em mobile (`<md`), hamburger no header, overlay com backdrop
- Tabelas: `overflow-x-auto` + colunas opcionais com `hiddenOnMobile: true` (escondidas em `<sm`)
- Grids: `grid-cols-1` base, expandir com `sm:grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4`
- Textos longos (nomes, labels): usar `hidden sm:inline` para versões completas em mobile
- Breakpoints customizados: `mobile-sm` (320px), `mobile-md` (375px), `mobile-lg` (425px)

### Internationalization (i18n) — Obrigatório em Novas Telas
- **Toda tela nova** deve implementar suporte a i18n (português, inglês, espanhol, mínimo)
- **Nenhum texto hardcoded** em componentes — usar chaves de tradução
- **Padrão**: `i18n('chave.traducao')` ou `t('chave.traducao')` dependendo da biblioteca
- **Estrutura de arquivos**: `locales/{lang}.json` com namespaces por feature
- **Validação**: Verificar se todas as chaves estão presentes em todos os idiomas suportados
- **Exceções permitidas**: Labels de API, nomes próprios, códigos técnicos (mas com fallback i18n)
- **Datas, números, moedas**: Usar formatadores localizados (Intl API ou biblioteca i18n)

---

## Test Conventions

### Workflow Obrigatório (TDD-like)

1. Escrever/atualizar testes primeiro (red)
2. Implementar funcionalidade (green)
3. Rodar todos os testes após implementação

### Backend — Anotações por Camada

| Camada | Anotação | Estilo |
|--------|----------|--------|
| Domain | Nenhuma | JUnit 5 puro, sem Spring |
| Application | `@ExtendWith(MockitoExtension.class)` | Mockito mocks de ports |
| Presentation | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | MockMvc + `@MockitoBean TokenPort tokenPort` **obrigatório** |
| Infrastructure JPA | `@DataJpaTest` + `@ActiveProfiles("test")` | H2 in-memory |
| Infrastructure MongoDB | `@DataMongoTest` + `@ActiveProfiles("test")` + `@Import(MongoTestContainerConfig.class)` | TestContainers (mongo:8.0) |

### Frontend

| Tipo | Local | Estilo |
|------|-------|--------|
| Hooks | `feature/{name}/hook/__tests__/` | `renderHookWithProviders` + MSW handlers |
| Components | (pendente) | `render` + `@testing-library/react` + MSW |

- **Stack**: Vitest (standalone `vitest.config.ts`) + @testing-library/react + MSW v2
- **vitest.config.ts é standalone** — NÃO estender `vite.config.ts` (importa `ROUTES` com `import.meta.env`, quebra em testes)
- **MSW handlers**: padrão `*/api/...` wildcard (baseURL pode ser vazio em testes)
- **QueryClient em testes**: sempre `retry: false` e `gcTime: 0` via `createTestQueryClient()` de `src/test/testUtils.tsx`
- **Isolamento de auth**: `localStorage.clear()` roda no `afterEach` (setupTests.ts)
- **Toast mocking**: `vi.mock('@shared/service/util/toastService')`

### Cobertura Exigida por Tipo de Mudança

| Tipo de Mudança | Teste Exigido |
|-----------------|---------------|
| Nova entity/VO/enum | Teste de domain (JUnit 5 puro) |
| Novo use case | Teste de application (happy path + erros + edge cases) |
| Novo/modificado endpoint | Teste de controller (status codes, response shape, validação) |
| Novo método JPA repository | `@DataJpaTest` |
| Novo método MongoDB repository | `@DataMongoTest` + TestContainers |
| Bug fix | Teste de regressão que falha sem o fix |
| Novo hook frontend | Hook test com `renderHookWithProviders` + MSW |
| Novo componente frontend | Component test com `render` + @testing-library/react + MSW |

### Exemplos de Teste

**Domain** — JUnit 5 puro:
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

**Application** — Mockito:
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

**Presentation** — WebMvcTest:
```java
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private TokenPort tokenPort;
    @MockitoBean private GetUserProfileUseCase useCase;

    @Test
    void deveRetornar200ComPerfilPublico() throws Exception {
        when(useCase.execute(any())).thenReturn(buildUser());
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test User"));
    }
}
```

### Known Test Limitations

- **H2 vs PostgreSQL**: H2 não suporta JSONB — evitar `entityManager.clear()` + re-read em entities com colunas JSONB
- **H2 collation**: collation ASCII difere do PostgreSQL — usar labels ASCII-only em dados de teste
- **Lombok booleans**: getter de `boolean highlighted` é `isHighlighted()`, não `getHighlighted()`
- **Docker API version**: `docker-java.properties` em test resources define `api.version=1.44` para compatibilidade Docker 29+ com TestContainers 1.20.x
- **MongoDB indexes**: após `mongoTemplate.dropCollection()` no `@BeforeEach`, indexes compostos devem ser recriados manualmente via `IndexResolver`

### Lazy Collections & Transactions

JPA `@OneToMany` usa `FetchType.LAZY` por padrão. Quando um use case retorna entity cujas lazy collections serão acessadas fora da transaction (ex.: no mapper do controller):
- Adicionar `@Transactional(readOnly = true)` ao método do use case
- Forçar inicialização dentro do método: `entity.getCollection().size()`

---

## Verification Checklist

Antes de considerar qualquer tarefa concluída:

1. `mvn test` passa com **0 failures, 0 errors**
2. `cd frontend && npx tsc --noEmit` compila com **0 errors**
3. Todo requisito novo/alterado tem teste correspondente
4. Nenhum teste existente foi quebrado ou deletado sem justificativa
5. Commits pequenos e focados com mensagens claras
6. Branch names significativos
7. **[Nova tela]** i18n implementado — sem textos hardcoded, todas as chaves presentes em todos os idiomas suportados

---

## Documentation Policy

| Tipo de Mudança | Documentação Exigida |
|-----------------|---------------------|
| Nova feature/endpoint | Atualizar `README.md` (tabela endpoints), `CLAUDE.md` (patterns) |
| Novo use case/entity | Atualizar `README.md` (métricas), `CLAUDE.md` (domínios se aplicável) |
| Nova tela/página | Implementar i18n obrigatoriamente; documentar chaves em `locales/README.md` |
| Bug fix com lição aprendida | Atualizar `CLAUDE.md` (Known Test Limitations) |
| Mudança de arquitetura | Atualizar `docs/overview.md`, `docs/backend-analysis.md` ou `docs/frontend-analysis.md` |
| Novo tech debt identificado | Adicionar em `docs/tech-debt.md` com prioridade e impacto |
| Tech debt resolvido | Remover de `docs/tech-debt.md`, atualizar `README.md` |
| Nova tarefa pendente | Adicionar em `docs/pending-tasks.md` |
| Tarefa concluída | Remover de `docs/pending-tasks.md` |
| Mudança de versão de dependência | Atualizar `README.md` (Stack), `docs/overview.md` |
| Mudança na contagem de testes | Atualizar `README.md` e `CLAUDE.md` |
| Adição/modificação de strings i18n | Atualizar todos os idiomas suportados (pt, en, es) em `locales/` |

---

## Source Layout

```
backend/src/main/java/com/mangareader/
├── domain/{domain}/entity/            # Entities e VOs
├── application/{domain}/usecase/      # Use cases
├── application/{domain}/port/         # Port interfaces (in/out)
├── infrastructure/persistence/        # postgres/adapter/, mongo/adapter/
├── infrastructure/security/           # JWT, SecurityConfig, RateLimit
├── presentation/{domain}/controller/  # REST endpoints
├── presentation/{domain}/dto/         # Request/Response DTOs
├── presentation/{domain}/mapper/      # MapStruct mappers
└── shared/                            # Cross-cutting: configs, exceptions, constants

frontend/src/
├── app/      # Layouts, router, route guards
├── feature/  # 13 feature modules (component/, hook/, service/, type/)
├── shared/   # Reusable components (~37), HTTP client, types
├── mock/     # Mock data (legacy — features usam API real)
└── style/    # Global CSS + Tailwind
```