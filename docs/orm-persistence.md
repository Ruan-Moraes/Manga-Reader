# ORM & Persistence Guidelines

Contrato de persistência do projeto. Ler antes de qualquer mudança que toque
repository/JPA/Mongo. Referenciado por `CLAUDE.md`.

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
