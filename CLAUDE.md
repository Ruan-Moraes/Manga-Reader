# CLAUDE.md

## Project Overview

**Manga Reader** — plataforma para leitura de mangás, manhwas e manhuas. Monorepo com Spring Boot (backend) e React (frontend).

## Build & Run

### Backend (`/api/server/`)

```bash
mvn test                                        # Todos os testes (JUnit 5 + Mockito + H2 + TestContainers)
mvn test -Dtest=UserTest                        # Classe específica
mvn test -Dtest=UserTest#shouldInitialize...    # Método específico
mvn test -Dtest=**/domain/**/*Test              # Por camada (domain/application/presentation/infrastructure)
mvn package -DskipTests                         # Build JAR
mvn spring-boot:run                             # Iniciar (Docker Compose sobe automaticamente)
```

### Frontend (`/frontend-apps/manga-reader/`)

pnpm workspace (raiz `frontend-apps/`). Rodar por workspace com `--filter manga-reader`
ou `cd frontend-apps/manga-reader` + `npx`:

```bash
pnpm --filter manga-reader dev          # Dev server :5173 (proxy API → :8080)
pnpm --filter manga-reader build        # TypeScript check + production build
pnpm --filter manga-reader lint:fsd     # Boundary lint (steiger) — gate que importa, verde
npx tsc --noEmit                        # Type-check gate (rodar dentro do app)
npx vitest run --pool=forks             # Suíte completa (--pool=forks obrigatório neste sandbox)
```

> `npm run lint` (eslint+prettier) é **vermelho no baseline** repo-wide — não usar
> `format`/`--fix` para "corrigir" arquivos (colapsa o JSX expandido do projeto).
> Combinar o estilo dos vizinhos. `lint:fsd` (steiger) e `tsc --noEmit` são os gates.

### Infra

Docker Compose em `/api/docker-compose.yml`: PostgreSQL 17, MongoDB 8.0, RabbitMQ 4, Redis 7. Gerenciado automaticamente via `spring-boot-docker-compose`. Prod: `/api/docker-compose.prod.yml` (inclui serviço `app` com build em `./server`).

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
- **MapStruct**: mappers gerados como `@Component` (Spring beans) por padrão. Apenas mappers puros sem dependências externas podem ser `final class` estáticos. Mappers que injetam serviços (ex.: `DomainLabelService`) **devem** ser beans.
- **JWT Auth**: `JwtAuthenticationFilter` depende de `TokenPort` — todo `@WebMvcTest` **deve** mockar `TokenPort` via `@MockitoBean`
- **Paginação & usuário no controller (DT-23)**: **nunca** criar `buildPageable(...)` privado nem `extractUserId(Authentication)` no controller. Listagens recebem `@PageParams(defaultSort=..., defaultDirection=..., allow={...}, ignoreRequestSort=...) Pageable` (resolvido por `PageableArgumentResolver`, contrato de query `page/size/sort/direction`, whitelist via `SortValidator`); o id do usuário autenticado vem de `@CurrentUserId UUID userId` (`CurrentUserIdArgumentResolver`). Ambos registrados em `shared/web/PageableWebConfig`. `SpringDataWebAutoConfiguration` está **excluída** (não usar `sort=campo,dir` do Spring Data). `@WebMvcTest` que exercita esses endpoints **deve** `@Import(PageableWebConfig.class)`.
- **@Transactional**: use cases que modificam dados ou acessam lazy collections **devem** ter `@Transactional`. Read-only com lazy collections: `@Transactional(readOnly = true)`. Para todas as nuances de transação (propagação, rollback rules, anti-padrões, timeouts), consultar **ORM & Persistence Guidelines**.
- **I18n**: `I18nConfig` expõe `MessageSource` + `LocaleResolver` (Accept-Language) + `LocalValidatorFactoryBean`. Mensagens em `src/main/resources/messages/messages*.properties` (pt-BR default, en-US, es-ES). DTOs usam chaves: `@NotBlank(message = "{validation.email.required}")`. `SecurityExceptionHandler` e use cases de email resolvem via `messageSource.getMessage(key, null, LocaleContextHolder.getLocale())`. Frontend usa `react-i18next` com namespaces por feature em `src/i18n/locales/<lang>/<feature>.json` (ver `src/i18n/locales/README.md`).

### i18n Architecture — DB-backed Domain Labels

**Regra obrigatória**: Labels de entidades de negócio (status, categorias, tipos, tags, gêneros, moedas, classificações) devem ser armazenadas no banco com `LocalizedString` JSONB e resolvidas pelo backend conforme o `Accept-Language` do request.

**Quando usar `t('...')`**: apenas para textos estáticos de UI — botões, placeholders, mensagens fixas, alerts, validações, títulos de tela.

**Não usar `t('...')` para**: enums de negócio, dados dinâmicos, conteúdos administrativos, qualquer dado persistido.

**Padrão**: entidade `DomainLabel { type, value, labelI18n }` em PostgreSQL.
- Endpoint público: `GET /api/labels?type={type}` → `[{ value, label }]` (locale-resolved, cache 3 dias no frontend)
- Endpoint admin: `GET /api/labels/admin?type={type}` → `[{ value, labelI18n: Map }]` (todos os idiomas)
- Frontend: hook `useDomainLabels(type)` + queryKey `[QUERY_KEYS.DOMAIN_LABELS, type, i18n.language]`
- Mesmo padrão de `Tag` e `LocalizedMappingHelper.resolveOrFallback()`
- Mappers que retornam labels de negócio **devem** injetar `DomainLabelService` e usar `resolveLabel(type, value, fallback)`
- `@WebMvcTest` que importa mapper com `DomainLabelService` **deve** adicionar `@MockitoBean DomainLabelService domainLabelService`
- Novas entidades de negócio com labels exibíveis **devem** seguir esse padrão

**Tipos seed disponíveis**: `publication_status`, `news_category`, `event_type`, `event_status`, `event_timeline`, `currency`

### i18n Architecture — UI vs Conteúdo

Dois eixos separados, com modelos de armazenamento distintos:

- **UI language** (interface): **somente JSON do i18next + localStorage**. Não persistido no backend. Frontend define via `i18n.changeLanguage()` (chave `i18nextLng` no localStorage). O interceptor HTTP envia `Accept-Language: <i18n.language>`, então emails/validações/mensagens de erro do backend respeitam a UI atual via `AcceptHeaderLocaleResolver`.
- **Content language** (catálogo + UGC): persistido em `users.content_locales` (JSONB, BCP 47). Resolve `LocalizedString` (Title, News, Tag, Chapter) e filtra UGC (Comment, ForumTopic). Lista ordenada = cadeia de fallback.

**Backend**:
- `User.contentLocales: List<String>` (default `["pt-BR"]`); método `updateContentLocales` valida BCP 47.
- `LocaleResolutionService.currentContentLocales()` retorna a cadeia: autenticado → `user.contentLocales`; anônimo → parse de `Accept-Language`; sempre termina em `pt-BR`.
- `LocaleResolutionService.resolve(LocalizedString)` percorre a cadeia antes do fallback global. Mappers (`TitleMapper`, `NewsMapper`, `TagMapper`, `LocalizedMappingHelper`) herdam automaticamente.
- UGC: use cases públicos (`GetForumTopicsUseCase`, `GetForumTopicsByCategoryUseCase`, `GetCommentsByTitleUseCase`) usam `findByLanguageIn(currentContentLanguageTags(), ...)`. Admin cross-language toggle (`crossLanguage=true`) bypassa filtro.

**Endpoints**:
- `GET /api/users/me/content-locales` → `{ contentLocales: string[] }`
- `PATCH /api/users/me/content-locales` (body: `{ contentLocales }`; valida via `User.updateContentLocales`)

**Frontend**:
- Hook `useContentLocales(isLoggedIn)` (TanStack Query) — sync com backend somente para users autenticados.
- `LanguageSettings.tsx`: troca de UI lang só dispara `i18n.changeLanguage`; troca de content lang dispara mutation quando logado.

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

## ORM & Persistence Guidelines

### Princípio Geral

JPA/Hibernate é poderoso mas traiçoeiro. Toda interação com o ORM deve ser
**explícita, observável e previsível**. Comportamentos implícitos (lazy loading
fora de transaction, cascade não documentado, flush automático em meio a leituras)
são fonte primária de bugs em produção.

### Regra de Ouro: Transações Sempre Explícitas

Toda operação que toca o repositório **deve** rodar dentro de uma transação
demarcada. Use cases são o ponto correto para `@Transactional`:

| Cenário | Anotação |
|---------|----------|
| Leitura simples | `@Transactional(readOnly = true)` |
| Leitura com lazy collections acessadas no mapper | `@Transactional(readOnly = true)` + force init |
| Escrita | `@Transactional` (rollbackFor opcional para checked exceptions) |
| Operação longa (relatório, batch) | `@Transactional(readOnly = true, timeout = 30)` |
| Bloco independente que não deve rollback junto | `@Transactional(propagation = REQUIRES_NEW)` |

**Anti-padrões proibidos:**

- `@Transactional` em método `private`, `protected` ou `final` — proxy AOP não intercepta
- Auto-invocação: `this.metodoTransacional()` dentro da mesma classe **não abre transação**
- `@Transactional` em construtor ou método `static`
- Misturar leitura e escrita em método marcado como `readOnly = true` (lança exceção em runtime no PostgreSQL com Hibernate)
- Confiar no rollback automático para `Exception` checada — Spring só faz rollback para `RuntimeException` e `Error` por padrão; usar `@Transactional(rollbackFor = Exception.class)` quando necessário

### Detecção e Prevenção de N+1

**Definição rápida**: 1 query para buscar N entidades + N queries para buscar
cada relacionamento = N+1. Mata performance silenciosamente.

**Estratégia por caso:**

1. **Listagem com relacionamento `@ManyToOne`/`@OneToOne` necessário**: usar
   `JOIN FETCH` no `@Query` JPQL ou `EntityGraph`.

   ```java
   @Query("SELECT m FROM Manga m JOIN FETCH m.author WHERE m.status = :status")
   List<Manga> findActiveWithAuthor(@Param("status") Status status);
   ```

2. **Listagem com `@OneToMany`/`@ManyToMany`**: **nunca** `JOIN FETCH` direto
   junto com paginação (Hibernate aplica paginação em memória e gera warning
   `HHH000104`). Soluções:
    - `@EntityGraph` em duas etapas (buscar IDs paginados, depois buscar com fetch)
    - Padrão "two queries": primeira pagina, segunda hidrata coleções por ID `IN (...)`
    - DTO projection direto no `@Query` quando não precisa da entity

3. **Relacionamentos opcionais**: declarar `FetchType.LAZY` por padrão.
   `FetchType.EAGER` é proibido em entities — sempre decidir o fetch no caso de uso.

4. **Detecção em testes**: configurar `hibernate.generate_statistics=true` e
   asserções de contagem de queries em testes críticos de listagem. Alternativa:
   biblioteca `datasource-proxy` ou `Hypersistence Utils` para contar queries
   por teste.

5. **Detecção em produção**: logar SQL em ambiente dev/staging
   (`spring.jpa.properties.hibernate.format_sql=true`,
   `logging.level.org.hibernate.SQL=DEBUG`). **Nunca** em produção (custo de I/O).
   Em produção, usar APM (Micrometer + traços por query) ou
   `p6spy`/`datasource-proxy` com sampling.

### Projeções: Use a Menor Possível

Buscar entity completa quando o caso de uso só precisa de 3 campos é
desperdício de memória, rede e cache de primeiro nível. Hierarquia preferida:

1. **DTO projection via `@Query` JPQL constructor expression** — para casos
   transacionais com lógica de domínio mínima
2. **Spring Data Interface Projection** — para projeções simples sem lógica
3. **Entity completa** — apenas quando o caso de uso modifica o objeto ou
   precisa do agregado completo

```java
// Bom: projeção direta no banco
@Query("""
    SELECT new com.mangareader.application.manga.dto.MangaListItem(
        m.id, m.title, m.coverUrl, m.status
    )
    FROM Manga m WHERE m.status = :status
""")
Page<MangaListItem> listForCatalog(@Param("status") Status status, Pageable pageable);
```

### Paginação Obrigatória em Listagens

Todo endpoint de listagem **deve** receber `Pageable` e retornar
`Page<T>` ou `Slice<T>`. **Nunca** retornar `List<T>` de uma tabela que
pode crescer sem limite (já é regra do projeto via `PageResponse<T>`).

- Para volumes muito grandes ou rolagem infinita: preferir `Slice<T>`
  (não executa `COUNT(*)` adicional) ou **keyset pagination** (cursor-based) em
  vez de offset pagination, que degrada linearmente com o offset.
- `COUNT(*)` separado em queries pesadas: o próprio CLAUDE.md já cita o caso
  de `ListaControleFinanciamentoRepasse` — manter essa prática para reports
  custosos.

### Índices: Decisão de Design, Não Otimização Tardia

- Toda coluna usada em `WHERE`, `JOIN`, `ORDER BY` frequente deve ter índice
  avaliado **na criação da migration**, não depois.
- Índices compostos respeitam ordem das colunas (mais seletiva primeiro,
  considerando os padrões de query reais).
- Índices parciais (filtered) para flags com baixa cardinalidade
  (ex.: `WHERE deleted = false`) — suportados nativamente pelo PostgreSQL.
- Documentar índices criados em Flyway migrations com comentário explicando
  qual query os justifica.

### Batch Operations

Operações em massa **nunca** devem ser feitas em loop com `save()` individual.

```java
// Errado: 1000 inserts, 1000 flushes
items.forEach(repository::save);

// Certo: configurar hibernate.jdbc.batch_size + saveAll() + flush controlado
repository.saveAll(items); // habilita batch insert se configurado
```

**Configurações obrigatórias em `application.yml`:**

```yaml
spring.jpa.properties.hibernate:
  jdbc.batch_size: 50
  order_inserts: true
  order_updates: true
  batch_versioned_data: true
```

Para volumes acima de 10k registros: considerar `JdbcTemplate` com `batchUpdate`
diretamente, ou `COPY` no PostgreSQL via driver nativo.

### Cascade e orphanRemoval: Use Com Parcimônia

- `CascadeType.ALL` em agregados grandes é fonte comum de deletes/updates
  inesperados. Preferir cascade explícito (`PERSIST`, `MERGE`).
- `orphanRemoval = true` só faz sentido para composições verdadeiras
  (relação parte-todo). Para associações, gerenciar lifecycle manualmente.
- Documentar no JavaDoc da entity qualquer cascade não óbvio.

### Conexões e Pool

- HikariCP é o pool padrão do Spring Boot — não trocar sem motivo.
- Dimensionar `maximum-pool-size` considerando: workers da aplicação,
  conexões consumidas por requests concorrentes, limite do banco. Regra
  prática inicial: `pool_size = ((core_count * 2) + effective_spindle_count)`,
  ajustar com métricas reais.
- Monitorar via Micrometer: `hikaricp.connections.active`,
  `hikaricp.connections.pending`, `hikaricp.connections.timeout`.

### MongoDB (Spring Data Mongo)

Embora menos suscetível a N+1 que JPA, atenção a:

- **DBRef é proibido** — performance ruim e acoplamento desnecessário.
  Usar referência manual por ID ou embedding conforme padrão de acesso.
- **Embedding vs Reference**: embed quando dados são acessados juntos e
  raramente atualizados isoladamente; referenciar quando o documento
  embarcado pode crescer sem limite (ex.: comentários de um título).
- **Índices**: criar via `@Indexed`/`@CompoundIndex` ou Mongock migrations,
  nunca confiar em auto-criação em produção
  (`spring.data.mongodb.auto-index-creation=false`).
- **Projeções**: usar `@Query(fields = "{ ... }")` para limitar campos
  retornados em listagens grandes.

### Observabilidade Obrigatória

Toda mudança que toca persistência deve manter ou adicionar:

- Logs SQL em dev/staging (com `format_sql=true`)
- Métricas de pool de conexão expostas no Actuator
- Spans de tracing em queries críticas (Micrometer Tracing)
- Alertas em queries lentas (PostgreSQL `log_min_duration_statement`)

### Checklist Antes de Mergear Mudança em Repository/Use Case

1. Query gerada inspecionada (log SQL) — confirma que não há N+1
2. Há índice cobrindo as colunas filtradas? (verificar via `EXPLAIN ANALYZE`)
3. `@Transactional` aplicado no nível correto, com `readOnly` quando cabe
4. Lazy collections acessadas fora da transaction estão sendo inicializadas
   explicitamente ou fetched via `JOIN FETCH`/`EntityGraph`
5. Listagem usa `Pageable` e retorna `Page<T>` ou `Slice<T>`
6. Projeção é a mais enxuta possível para o caso de uso
7. Teste cobre tanto o caminho funcional quanto a contagem de queries
   (quando crítico)

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

### Imports
- **Sempre dar preferência a `import`** em vez de nome totalmente qualificado
  inline. Proibido referenciar tipos via FQN no corpo do código (ex.:
  `org.springframework.dao.DataAccessException e`, `new com.x.Foo()`,
  `java.util.UUID id`) — declarar o `import` no topo.
- Preferir **`import static`** para helpers/constantes usados de forma idiomática
  e repetida: asserts (`assertThat`), Mockito (`when`, `verify`, `any`),
  matchers MockMvc (`get`, `status`, `jsonPath`), `Aggregation.*` quando melhora
  legibilidade.
- Exceção única: conflito de nome entre dois tipos no mesmo arquivo — aí
  qualificar o menos usado.

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
| Hooks | `{entities,features}/{name}/model/__tests__/` | `renderHookWithProviders` + MSW handlers |
| Components | `{layer}/{slice}/ui/__tests__/` | `render` + `@testing-library/react` + MSW |

- **Stack**: Vitest (standalone `vitest.config.ts`) + @testing-library/react + MSW v2
- **vitest.config.ts é standalone** — NÃO estender `vite.config.ts` (importa `ROUTES` com `import.meta.env`, quebra em testes)
- **MSW handlers**: padrão `*/api/...` wildcard (baseURL pode ser vazio em testes)
- **QueryClient em testes**: sempre `retry: false` e `gcTime: 0` via `createTestQueryClient()` de `src/test/testUtils.tsx`
- **Isolamento de auth**: `localStorage.clear()` roda no `afterEach` (setupTests.ts)
- **Auth via Context**: `useAuth` lê o `AuthProvider` (`@features/auth`) — estado de sessão compartilhado entre Header/Footer/Login (sem isso o header não atualizava pós-login até refresh). `AuthProvider` está no provider tree em `main.tsx`. `renderWithProviders` e `createWrapper` (`src/test/`) já envolvem em `AuthProvider`; teste que mocka `@features/auth/api/authService` parcialmente **deve** stubar `getStoredSession` (ex.: `() => null`) pois o provider o consome no mount.
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

- **H2 vs PostgreSQL**: H2 não suporta JSONB — evitar `entityManager.clear()` + re-read em entities com colunas JSONB. H2 também não detecta problemas PostgreSQL-specific (arrays, partial indexes, JSONB operators). **Tech debt**: avaliar migração de testes JPA para TestContainers PostgreSQL — ver `docs/tech-debt.md`.
- **H2 collation**: collation ASCII difere do PostgreSQL — usar labels ASCII-only em dados de teste
- **Lombok booleans**: getter de `boolean highlighted` é `isHighlighted()`, não `getHighlighted()`
- **IDs de Title são strings Mongo (frontend)**: `Title.id` é `ObjectId` (string), **não** numérico. Não validar fetch de título com `validateId(Number(id))` — `Number("507f…")` é `NaN` e a query nunca carrega no reload. Usar `enabled: Boolean(id)` + fetch direto pela string (ver `useTitleFetch`). Teste de regressão em `useTitleFetch.test.tsx`.
- **Docker API version**: `docker-java.properties` em test resources define `api.version=1.44` para compatibilidade Docker 29+ com TestContainers 1.20.x
- **MongoDB indexes**: após `mongoTemplate.dropCollection()` no `@BeforeEach`, indexes compostos devem ser recriados manualmente via `IndexResolver`
- **Singleton TestContainers (DT-20/DT-22)**: `MongoTestContainerConfig` e `PostgresTestContainerConfig` mantêm o container como **singleton por JVM** (iniciado em bloco `static`, `stop()` no-op, startup timeout 120s). Evita restart por contexto Spring (cache LRU) que causava `DataAccessResourceFailure: Connection refused` intermitente. Não criar `@Bean static Container` gerido pelo ciclo do Spring.
- **Tag `testcontainers`**: todas as classes que sobem container (Mongo/Postgres) têm `@Tag("testcontainers")`. Rodar suíte leve sem Docker: `mvn test -Dtest.excludedGroups=testcontainers` (property `test.excludedGroups` no `pom.xml`, default vazio → CI roda tudo). Nova classe de teste com container **deve** levar o tag.
- **Mongock em teste**: Mongock é `@Profile("!test")` — `@DataMongoTest`/`@ActiveProfiles("test")` chamam ChangeUnits via `new V00X(...).execute()` direto. Validação pela orquestração real do Mongock (runner, lock, guarda de changelog) usa profile dedicado `migration-it` + app slim `@EnableMongock` e seed pré-contexto via `@DynamicPropertySource` (ver `V009MongockIntegrationTest`).

### Lazy Collections & Transactions

JPA `@OneToMany` usa `FetchType.LAZY` por padrão. Quando um use case retorna entity cujas lazy collections serão acessadas fora da transaction (ex.: no mapper do controller):
- Adicionar `@Transactional(readOnly = true)` ao método do use case
- Forçar inicialização dentro do método: `entity.getCollection().size()`

---

## Verification Checklist

Antes de considerar qualquer tarefa concluída:

1. `mvn test` passa com **0 failures, 0 errors**
2. `cd frontend-apps/manga-reader && npx tsc --noEmit` compila com **0 errors**
3. Todo requisito novo/alterado tem teste correspondente
4. Nenhum teste existente foi quebrado ou deletado sem justificativa
5. Commits pequenos e focados com mensagens claras
6. Branch names significativos
7. **[Nova tela]** i18n implementado — sem textos hardcoded, todas as chaves presentes em todos os idiomas suportados
8. **[Mudança em persistência]** Checklist de ORM aplicado (ver **ORM & Persistence Guidelines**)

---

## Documentation Policy

| Tipo de Mudança | Documentação Exigida |
|-----------------|---------------------|
| Nova feature/endpoint | Atualizar `README.md` (tabela endpoints), `CLAUDE.md` (patterns) |
| Novo use case/entity | Atualizar `README.md` (métricas), `CLAUDE.md` (domínios se aplicável) |
| Nova tela/página | Implementar i18n obrigatoriamente; documentar chaves em `locales/README.md` |
| Bug fix com lição aprendida | Atualizar `CLAUDE.md` (Known Test Limitations) |
| Mudança de arquitetura | Atualizar `CLAUDE.md` (Architecture/patterns) e `README.md` (§2) |
| Novo tech debt identificado | Adicionar em `docs/tech-debt.md` com prioridade e impacto |
| Tech debt resolvido | Remover de `docs/tech-debt.md`, atualizar `README.md` |
| Nova tarefa/dívida ou backlog de produto | Adicionar em `docs/tech-debt.md` |
| Tarefa/dívida concluída | Marcar resolvida em `docs/tech-debt.md` |
| Mudança de versão de dependência | Atualizar `README.md` (Stack) |
| Mudança na contagem de testes | Atualizar `README.md` |
| Adição/modificação de strings i18n | Atualizar todos os idiomas suportados (pt, en, es) em `locales/` |

---

## Source Layout

```
api/server/src/main/java/com/mangareader/
├── domain/{domain}/entity/            # Entities e VOs
├── application/{domain}/usecase/      # Use cases
├── application/{domain}/port/         # Port interfaces (in/out)
├── infrastructure/persistence/        # postgres/adapter/, mongo/adapter/
├── infrastructure/security/           # JWT, SecurityConfig, RateLimit
├── presentation/{domain}/controller/  # REST endpoints
├── presentation/{domain}/dto/         # Request/Response DTOs
├── presentation/{domain}/mapper/      # MapStruct mappers
└── shared/                            # Cross-cutting: configs, exceptions, constants

frontend-apps/manga-reader/src/
├── app/      # Router config + route guards (@app) — FSD app layer
├── pages/    # Route-level pages, 1 slice por rota (@pages) — FSD pages layer
├── widgets/  # Blocos compostos: header/, footer/, mobile-tab-bar/,
│             #   admin-panel/, layouts/ (shells) (@widgets) — FSD widgets layer
├── features/ # Interações/verbos: auth, admin, library, contact, comment (@features)
├── entities/ # Modelos de domínio/nouns: user, manga, news, … (@entities)
├── shared/   # Reusable components, HTTP client, types (@shared, @ui)
├── mock/     # Mock data (legacy — features usam API real)
└── styles/   # Global CSS + Tailwind
```

**Segmentos (FSD canônico)** — slices de `pages/widgets/features/entities` organizam
o código em segmentos canônicos: `ui/` (componentes), `api/` (chamadas de serviço),
`model/` (hooks, tipos, contexts, state), `lib/` (utils), `config/` (constantes).
`shared/` mantém nomes próprios por caminho de segmento (`@shared/service`, `@shared/component`, `@ui`).

**Mocks de runtime** — `src/mock/` (alias `@mock`, fora do FSD de propósito, steiger-ignored) é a
**fonte única** de dado-fake p/ telas ainda sem backend. Nova tela sem API ⇒ mock vai aqui, componente
importa `@mock`. Ao ligar o backend: deletar o mock do domínio e trocar pelo hook/service real.
Hoje mockados: forum-topic (`@mock/forumTopic`), profile (`@mock/userProfile`).

**Arquitetura frontend — Feature-Sliced Design (em migração)**

Camadas FSD com import unidirecional (camada superior importa inferior, nunca o contrário):
`app → pages → widgets → features → entities → shared`. Aliases: `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@ui`.

- **app**: só `router/` (PublicRoutes, ProtectedRoutes) + bootstrap em `main.tsx`. Sem páginas/widgets aqui.
- **features vs entities — regra para não errar a classificação**:
    - **entity = substantivo / modelo.** O que a app *é*. Contém: tipos (`model`),
      acesso a dados (`api`) e **exibição "burra"** do conceito (cards/átomos que só
      recebem props/callbacks). Ex.: `user`, `manga`, `rating`, `comment` (o
      comentário em si: types, service, `CommentUser`/`CommentContent`).
    - **feature = verbo / ação.** O que o usuário *faz* — uma interação completa que
      entrega valor; orquestra entities + UI da ação. Ex.: `auth` (logar), `library`
      (salvar), `comment` (compor/editar/responder/reagir: `CommentInput`,
      `CommentsList`, modais, hooks de CRUD/reactions/editor).
    - **Teste rápido**: o slice **é** algo (entity) ou **faz** algo (feature)?
    - **Regra dura**: feature pode importar entity; **entity NUNCA importa feature**
      (validado pelo steiger). Entity↔entity só via cross-import `@x` (ex.:
      `@entities/user/@x/comment`).
    - **Slice misto → dividir**, não mover inteiro: átomos de exibição + dados ficam
      na entity; input/modais/reactions/editor viram feature. **Ex. canônico**:
      `comment` foi dividido em `entities/comment` (modelo+exibição) + `features/comment`
      (interações) — ver DT-28. Nomes de slice podem coexistir nas duas camadas.
    - Hook que combina dados de entity + `useAuth`/estado de UI é **page hook**
      (ex.: `pages/event/useEvents.tsx`), não fica em `entities/`.
    - Entities (nouns): user, manga, chapter, rating, comment, category, label, news,
      event, group, store, forum. Features (verbos): auth, library, admin, contact, comment.
- **pages / widgets / features / entities**: cada slice expõe public API via `index.ts` (barrel). **Importar sempre da raiz do slice** (`@pages/home`, `@widgets/header`, `@features/auth`, `@entities/user`), nunca de arquivos internos — exceto `import()` dinâmico do router/`main.tsx` (code-splitting por página).
- **widgets**: slices coesos por bloco de UI. `layouts/` contém os shells de rota (RootLayout, ChapterLayout, PageShell) — esses compõem `@widgets/header|footer|mobile-tab-bar` (desvio pragmático widget→widget, permitido na config do steiger).

**Boundary lint**: `npm run lint:fsd` (steiger + `@feature-sliced/steiger-plugin`, config `steiger.config.ts`). Verde no escopo atual. Regras de trabalho adiado desligadas com nota (ver `steiger.config.ts` e DT-24).

**Estado FSD**: layers completas (`app→pages→widgets→features→entities→shared`), slices segmentados em `ui/api/model/lib/config`, lint verde. **Pendências** (ver `docs/tech-debt.md` DT-24): cross-import API (`@x`) p/ refs entity↔entity (hoje import direto, aceito); public API nos segmentos de `shared/` (`no-public-api-sidestep`, idiomático/deferido).