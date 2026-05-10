# Guia i18n — Convenções consolidadas (Fase B)

## Estado atual

Todo conteúdo traduzível usa **um único campo canônico** com tipo multilíngue. Sufixo `*I18n` extinto.

| Camada | Tipo do campo |
|---|---|
| Domain (entity) | `LocalizedString` ou `LocalizedStringList` |
| PostgreSQL | Coluna JSONB (`@JdbcTypeCode(SqlTypes.JSON)` + `@Convert(LocalizedStringJsonConverter.class)`) |
| MongoDB | Subdocumento (chave BCP 47 → valor); convertido por `LocalizedStringMongoConverters` |
| DTO admin | `Map<String, String>` (todos idiomas para edição) |
| DTO público | `String` resolvido pelo locale do request |
| Frontend admin | `LocalizedString` (`Record<string, string>`) |
| Frontend público | `string` |

## Receita: nova entidade traduzível

### 1. Domain entity

```java
@JdbcTypeCode(SqlTypes.JSON)
@Convert(converter = LocalizedStringJsonConverter.class)
@Column(name = "name", columnDefinition = "jsonb", nullable = false)
@Builder.Default
private LocalizedString name = LocalizedString.empty();
```

Mongo:
```java
@Builder.Default
private LocalizedString name = LocalizedString.empty();
```

### 2. DTOs

```java
// Public response
public record FooResponse(String id, String name, ...) {}

// Admin response
public record AdminFooResponse(String id, Map<String, String> name, ...) {}

// Admin request (Create/Update)
public record CreateFooRequest(
    @NotNull @RequiredLanguages Map<String, String> name,
    ...
) {}
```

`@RequiredLanguages` valida pt-BR não-branco.

### 3. Mapper

Público — usa `LocalizedMappingHelper` injetado:
```java
return new FooResponse(foo.getId(), i18n.toResolvedString(foo.getName()), ...);
```

Admin — mapper estático com `values()`:
```java
private static Map<String, String> values(LocalizedString s) {
    return s == null ? Map.of() : s.values();
}
```

### 4. Use case

```java
public Foo execute(Map<String, String> name, ...) {
    Foo foo = Foo.builder()
        .name(name == null || name.isEmpty() ? LocalizedString.empty() : LocalizedString.of(name))
        ...
        .build();
    return repo.save(foo);
}
```

### 5. Repository

**Não use derived queries** sobre campos JSONB / subdoc. Spring Data não consegue gerar queries para `LocalizedString`.

PostgreSQL — adapter faz **filtro/sort/pagination em memória**:
```java
public Page<Foo> searchByName(String query, Pageable pageable) {
    var lower = query.toLowerCase();
    var matches = repo.findAll().stream()
        .filter(f -> f.getName().values().values().stream()
            .anyMatch(v -> v.toLowerCase().contains(lower)))
        .toList();
    int from = (int) Math.min(pageable.getOffset(), matches.size());
    int to = Math.min(from + pageable.getPageSize(), matches.size());
    return new PageImpl<>(matches.subList(from, to), pageable, matches.size());
}
```

MongoDB — `mongoTemplate` regex sobre subcampos:
```java
private static Query buildNameSearchQuery(String query) {
    var regex = java.util.regex.Pattern.quote(query);
    var crit = new Criteria().orOperator(
        Criteria.where("name.pt-BR").regex(regex, "i"),
        Criteria.where("name.en-US").regex(regex, "i"),
        Criteria.where("name.es-ES").regex(regex, "i")
    );
    return new Query(crit);
}
```

### 6. Sort default no controller

JSONB / Mongo subdoc **não pode ser ORDER BY**. Default sort no controller deve ser `id` ou outra coluna escalar:
```java
@RequestParam(defaultValue = "id") String sort,
```

### 7. Frontend types

```typescript
export type AdminFoo = {
    id: string;
    name: LocalizedString;  // não name: string
    ...
};

export type CreateFooRequest = {
    name: LocalizedString;
    ...
};
```

### 8. Frontend modal/form

Estado: `useState<LocalizedString>({})`. Submit envia o map direto:
```tsx
const [name, setName] = useState<LocalizedString>({});
// ...
onSubmit({ name, ... });
```

### 9. Frontend list/display

Lê do `LocalizedString` direto, com fallback para pt-BR:
```tsx
{foo.name?.[lang] ?? foo.name?.['pt-BR'] ?? ''}
```

## Anti-padrões (não fazer)

- ❌ `private String name; private LocalizedString nameI18n;` — campos duplicados.
- ❌ `findByNameContainingIgnoreCase(String name)` derived query em campo JSONB.
- ❌ `Sort.by(Direction.ASC, "name")` em campo JSONB / subdoc.
- ❌ DTO admin com `Map<String, String> nameI18n` — usar nome canônico (`name`).
- ❌ `i18n.resolveOrFallback(field, legacy)` quando legacy = String — só DomainLabel ainda usa (fallback para slug).
- ❌ Frontend `name: string` em `Admin*` — admin sempre vê `LocalizedString`.

## MongoDB — converter obrigatório

`LocalizedString` no Mongo **só funciona** com converters customizados registrados:

```java
// MongoConfiguration (prod) e MongoTestContainerConfig (test) ambos:
@Override
public MongoCustomConversions customConversions() {
    return new MongoCustomConversions(List.of(
        new LocalizedStringMongoConverters.LocalizedStringWriter(),
        new LocalizedStringMongoConverters.LocalizedStringReader(),
        new LocalizedStringMongoConverters.LocalizedStringListWriter(),
        new LocalizedStringMongoConverters.LocalizedStringListReader()
    ));
}
```

Sem isso, Spring serializa `LocalizedString` como `{"values": {...}}` em vez do flat `{"pt-BR": "..."}` esperado pelas migrations.

## Migrations consolidadas

PostgreSQL:
- `V12` adicionou `*_i18n` JSONB (Fase A backfill).
- `V16` dropou colunas legadas (`tags.label`, `events.title/subtitle/description`, `groups.name/description`, `stores.name/description`, `subscription_plans.description/features`).
- `V17` renomeou `*_i18n` → canonical (`label_i18n` → `label`, etc).
- `V14`/`V15` já estavam ocupados por `create_domain_labels` e `subscription_plan_prices` antes do início da Fase B — daí a numeração V16/V17 para Phase B.

MongoDB (Mongock):
- `V004` adicionou subdocumentos `*I18n` em titles/news (Fase A).
- `V006` renomeou `nameI18n`→`name`, `synopsisI18n`→`synopsis`, `titleI18n`→`title`, `subtitleI18n`→`subtitle`, `excerptI18n`→`excerpt`, `contentI18n`→`content`. Idempotente.

## Decisões arquiteturais (Fase B)

- **Por que campo único canônico**: consistência ponta-a-ponta; nomes simples no domain refletem o conceito (`title`, não `titleI18n`).
- **Por que JSONB/subdoc embutido em vez de tabela separada**: zero-join nas queries de leitura; índice composto por subkey (`label.pt-BR`) cobre busca por idioma.
- **Por que in-memory filter para Postgres**: cardinalidade catálogos baixa (Tag <100, Group <1000, Event <500). Quando crescer, migrar para JSONB GIN + native query.
- **Por que regex Mongo sobre subkeys**: `mongoTemplate.find()` permite `Criteria.where("name.pt-BR").regex(...)`. Spring Data derived queries não suportam.
- **Por que `LocalizedMappingHelper.resolveOrFallback` mantido**: DomainLabel tem semântica diferente — fallback para slug enum (`label.getValue()`) quando label vazio.

## DomainLabel — exceção

`DomainLabel` (`tags`, `news_category`, `event_type`, `event_status`, `event_timeline`, `currency`) mantém `labelI18n` separado de `value` (slug enum). Não consolidar — value é a chave imutável; labelI18n é só apresentação.

## UGC — particionamento por idioma

Comments / ForumTopic / ForumReply / MangaRating ficam **fora da consolidação i18n de catálogo**. Mantêm campo `language: String` populado pelo backend a partir do `Accept-Language` ativo no momento do post.

Listagens públicas filtram por idioma do usuário; admin pode bypassar com `?language=all` em:
- `GET /api/comments/title/{titleId}?language=all`
- `GET /api/forum?language=all`
- `GET /api/forum/category/{category}?language=all`

`GetCommentsByTitleUseCase`, `GetForumTopicsUseCase` e `GetForumTopicsByCategoryUseCase` expõem overload `(input, pageable, crossLanguage)`. Default mantém partição.

## Erros comuns (Fase B+)

| Sintoma | Causa | Fix |
|---|---|---|
| Hibernate validation falha boot prod | Entity mapeia JSONB mas schema ainda tem coluna varchar | Aplicar V16 + V17 |
| `Found more than one migration with version N` | Colisão de versão Flyway | Renumerar nova migration; checar `ls db/migration` antes de criar |
| Mongo retorna `name: null` após save | Faltam `MongoCustomConversions` registradas | Registrar em `MongoConfiguration` + `MongoTestContainerConfig` |
| Spring Data query method NoSuchMethod | Derived query em campo JSONB | Migrar para in-memory ou `@Query` native |
| Frontend admin grava só pt-BR | Modal emite `name: string` em vez de Map | Submit `name: LocalizedString` direto |
| `expected: <null> but was: <>` em test no-args | `@Builder.Default` initializer aplicou em construtor padrão | Usar `assertTrue(field.isEmpty())` em vez de `assertNull` |
