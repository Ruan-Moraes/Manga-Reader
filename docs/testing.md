# Test Conventions

Convenções de teste (backend + frontend), cobertura exigida e limitações
conhecidas. Ler antes de escrever/alterar testes. Referenciado por `CLAUDE.md`.

### Workflow Obrigatório (TDD-like)

1. Escrever/atualizar testes primeiro (red)
2. Implementar funcionalidade (green)
3. Rodar todos os testes após implementação

### Backend — Anotações por Camada

| Camada                 | Anotação                                                                                 | Estilo                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Domain                 | Nenhuma                                                                                  | JUnit 5 puro, sem Spring                                     |
| Application            | `@ExtendWith(MockitoExtension.class)`                                                    | Mockito mocks de ports                                       |
| Presentation           | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)`                                | MockMvc + `@MockitoBean TokenPort tokenPort` **obrigatório** |
| Infrastructure JPA     | `@DataJpaTest` + `@ActiveProfiles("test")`                                               | H2 in-memory                                                 |
| Infrastructure MongoDB | `@DataMongoTest` + `@ActiveProfiles("test")` + `@Import(MongoTestContainerConfig.class)` | TestContainers (mongo:8.0)                                   |

### Frontend

| Tipo       | Local                                         | Estilo                                    |
| ---------- | --------------------------------------------- | ----------------------------------------- |
| Hooks      | `{entities,features}/{name}/model/__tests__/` | `renderHookWithProviders` + MSW handlers  |
| Components | `{layer}/{slice}/ui/__tests__/`               | `render` + `@testing-library/react` + MSW |

- **Stack**: Vitest (standalone `vitest.config.ts`) + @testing-library/react + MSW v2
- **vitest.config.ts é standalone** — NÃO estender `vite.config.ts` (importa `ROUTES` com `import.meta.env`, quebra em testes)
- **MSW handlers**: padrão `*/api/...` wildcard (baseURL pode ser vazio em testes)
- **QueryClient em testes**: sempre `retry: false` e `gcTime: 0` via `createTestQueryClient()` de `src/test/testUtils.tsx`
- **Isolamento de auth**: `localStorage.clear()` roda no `afterEach` (setupTests.ts)
- **Auth via Context**: `useAuth` lê o `AuthProvider` (`@features/auth`) — estado de sessão compartilhado entre Header/Footer/Login (sem isso o header não atualizava pós-login até refresh). `AuthProvider` está no provider tree em `main.tsx`. `renderWithProviders` e `createWrapper` (`src/test/`) já envolvem em `AuthProvider`; teste que mocka `@features/auth/api/authService` parcialmente **deve** stubar `getStoredSession` (ex.: `() => null`) pois o provider o consome no mount.
- **Toast mocking**: `vi.mock('@shared/service/util/toastService')`

### Cobertura Exigida por Tipo de Mudança

| Tipo de Mudança                | Teste Exigido                                                 |
| ------------------------------ | ------------------------------------------------------------- |
| Nova entity/VO/enum            | Teste de domain (JUnit 5 puro)                                |
| Novo use case                  | Teste de application (happy path + erros + edge cases)        |
| Novo/modificado endpoint       | Teste de controller (status codes, response shape, validação) |
| Novo método JPA repository     | `@DataJpaTest`                                                |
| Novo método MongoDB repository | `@DataMongoTest` + TestContainers                             |
| Bug fix                        | Teste de regressão que falha sem o fix                        |
| Novo hook frontend             | Hook test com `renderHookWithProviders` + MSW                 |
| Novo componente frontend       | Component test com `render` + @testing-library/react + MSW    |

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

Em renderização multilíngue, manifesto que preserva texto completo pode vir
de fallback sem glyph desenhado. Separar testes dos limites/overflow de
controles que exigem `overflow=false`, texto íntegro e imagem modificada.
Registrar fixture/idioma/formato/dimensões reais e não extrapolar uma PNG
com texto ASCII para todos os formatos, scripts ou consumo do pipeline.

Quando um adapter supervisionado pode retornar timeout antes de sua operação
privada terminar, testar também a vida útil da entrada emprestada: o chamador
pode removê-la imediatamente após retorno. Processo tardio só deve acessar
snapshot próprio limitado/hash, retido até terminação e cleanup. Conferir
capacidade busy antes da limpeza e uma página seguinte depois; não confundir
suspensão artificial de processo com diagnóstico de travamento do codec.

Em supervisores com claims concorrentes, quiescência de uma instância não prova
que ela venceu o claim. Testar cliente perdedor já encerrado enquanto o vencedor
continua ativo, e claim persistido com confirmação perdida: nenhum deles pode
receber posse por simples `settled=true`. Reter a capacidade também na vida útil
inteira dos request iterators/response bodies, inclusive entre um chunk resolvido
e cancelamento pendente. Expiração da admissão raiz deve impedir novos POSTs,
mesmo quando o gate de uma etapa tenha prazo maior; cleanup usa autoridade própria.

Em APIs de infraestrutura assíncronas, exercitar respostas de mutação em
`PENDING/RUNNING`, não apenas `DONE` imediato. Acompanhar somente a mesma
operação com GET limitado por prazo e cancelamento, conservando requestId,
recurso e identidade da operação. Asserir uma única mutação, inclusive com
confirmação perdida. Ausência do recurso não substitui recibo terminal;
erro ou espera esgotada exige recuperação explícita, não reenvio da criação.

Quando há autorização persistida antes de POST, distinguir claim, grant e
operação observada. Testar a disputa entre selar e gastar o grant, cancelamento
ou ACK perdido depois de gastar e ausência de segunda chamada. NOT_SENT só pode
ser derivado de protocolo que impeça o POST sem grant, na mesma fotografia CAS
selada; ausência de campo novo em journal legado não é prova de ausência de envio.
Rejeição HTTP e operação terminal não devem ser inventadas para liberar cleanup.

Em preflights compostos, medir os orçamentos aninhados e distinguir preparação
de envio: um prazo curto de transporte pode estar incluindo várias leituras e
admissões sequenciais. Comparar controle e latência sintética com timers
instrumentados, sem aumentá-los para obter verde. Lotes de GETs independentes
devem manter limite de concorrência, validar todos os resultados e reter a
capacidade até os irmãos iniciados terminarem. Não confundir estado de um
produtor que já entregou o recurso com o store autoritativo, nem retirar filtros
de operações das fixtures. Cancelamento pode retirar recursos e ainda perder
o ACK no observador; não fabricar confirmação para satisfazer uma expectativa.

Em jobs com chamadas cobradas, testar separadamente falha anterior à reserva e
falha de quem possui a etapa `RUNNING`: uma reentrega não pode encerrar a chamada
de outra entrega. Usar barreiras/latches, locks reais e provider falso para
exercitar também cancelamento entre leitura e gravação. Confirmação perdida
de commit deve verificar chave/hash persistidos, inclusive quando o estado do
job já avançou; não assumir que o estado intermediário ainda será observado.

Uma leitura MVCC anterior à conclusão de commit também não prova rollback.
Manter a transação concorrente aberta após gravar os vínculos, observar a espera
real de lock no PostgreSQL e testar finais de commit/rollback antes de autorizar
descarte de uploads. Falha de lock ou releitura preserva objetos ambíguos;
nenhum retry de provider decorre dessa reconciliação.

No cleanup, falha de um objeto não pode impedir a tentativa dos demais objetos
autorizados do mesmo claim. Testar ACK, lote e limpeza imediata com storage fora
de transação, ausência de confirmação parcial, prazo de retry persistido e
preservação de objetos de jobs ativos. Uma nova tentativa pode repetir deletes
idempotentes, mas nunca chamada ao provider nem remoção fora das referências
autorizadas. Diferenciar esses testes do purge por idade do bucket.

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
