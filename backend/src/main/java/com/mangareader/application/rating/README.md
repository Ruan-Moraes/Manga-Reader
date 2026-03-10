# Plano de Testes — Application / Rating

> Módulo de avaliações de mangás. 6 use cases + 1 port. MongoDB com cache e eventos RabbitMQ.

---

## 1. SubmitRatingUseCase

### Contexto
Submete ou atualiza (upsert) a avaliação de um usuário para um título. Se já existe rating do user para o titleId, atualiza; senão, cria novo.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findByTitleIdAndUserId()`, `save()` |
| `UserRepositoryPort` | Port | `findById()` |
| `EventPublisherPort` | Port | `publish("rating.submitted", RatingEvent)` |

### Input
```java
record SubmitRatingInput(String titleId, UUID userId, double stars, String comment, Map<String, Double> categoryRatings)
```

### Output
```java
MangaRating (entidade salva)
```

### Cache
```java
@CacheEvict(value = CacheNames.RATING_AVERAGE, key = "#input.titleId()")
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Primeiro rating (create) | `findByTitleIdAndUserId` retorna empty → cria novo MangaRating com builder, seta stars/comment/userName, salva |
| 2 | Rating existente (update/upsert) | `findByTitleIdAndUserId` retorna existente → atualiza stars/comment/userName no existente, salva |
| 3 | categoryRatings fornecido | Seta `rating.setCategoryRatings(input.categoryRatings())` |
| 4 | categoryRatings null | **Não** seta categoryRatings — mantém valor anterior (cenário upsert) |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", input.userId())` | 404 |

### Regras de Negócio
- **Upsert**: sempre atualiza `userName` com `user.getName()` (denormalização)
- **Cache evict**: invalida cache de média para o `titleId` específico
- **Evento**: publica `RatingEvent(titleId, userId)` com routing key `"rating.submitted"` **após** save
- O `titleId` não é validado contra MongoDB — **[HIPÓTESE]** pode criar rating para título inexistente

### Observações para Testes
- Testar cenário upsert: mock `findByTitleIdAndUserId` retornando `Optional.of(existingRating)` vs `Optional.empty()`
- Verificar que `eventPublisher.publish()` é chamado com routing key exata `"rating.submitted"`
- Verificar que o cache evict acontece (teste de integração com `@Cacheable`)
- Mock `categoryRatings` como null para provar que não sobrescreve valor anterior no upsert
- Nenhuma validação de range de `stars` (ex: 0-5) no use case

---

## 2. UpdateRatingUseCase

### Contexto
Atualiza uma avaliação existente. Verifica ownership (somente o autor pode editar).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findById()`, `save()` |
| `EventPublisherPort` | Port | `publish("rating.updated", RatingEvent)` |

### Input
```java
record UpdateRatingInput(String ratingId, UUID userId, Double stars, String comment, Map<String, Double> categoryRatings)
```
> Nota: `stars` é `Double` (wrapper) — pode ser null (atualização parcial)

### Cache
```java
@CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
```
> Diferente do Submit que evicta por key — aqui evicta **todas** as entries

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualização completa | Seta stars, comment e categoryRatings, salva, publica evento |
| 2 | Atualização parcial (só comment) | Apenas `comment != null` → seta comment, stars e categoryRatings permanecem |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Rating não encontrado | `ResourceNotFoundException("Rating", "id", input.ratingId())` | 404 |
| 2 | User não é o autor | `BusinessRuleException("Você só pode editar suas próprias avaliações", 403)` | 403 |

### Regras de Negócio
- **Ownership check**: compara `rating.getUserId()` com `input.userId().toString()`
- **Atualização parcial**: cada campo só é setado se `!= null`
- **Cache allEntries=true** — **[HIPÓTESE]** isso é mais agressivo que o necessário; poderia evictar só o titleId
- Evento publicado com routing key `"rating.updated"`

### Observações para Testes
- Verificar que campos null **não** sobrescrevem valores existentes
- Testar ownership com userId diferente do rating.userId
- Verificar mensagem exata em pt-BR: `"Você só pode editar suas próprias avaliações"`

---

## 3. DeleteRatingUseCase

### Contexto
Exclui uma avaliação. Somente o autor pode excluir.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findById()`, `deleteById()` |
| `EventPublisherPort` | Port | `publish("rating.deleted", RatingEvent)` |

### Input
```java
String ratingId, UUID userId
```

### Cache
```java
@CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Exclusão com sucesso | Busca rating, verifica ownership, deleta, publica evento |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Rating não encontrado | `ResourceNotFoundException("Rating", "id", ratingId)` | 404 |
| 2 | User não é o autor | `BusinessRuleException("Você só pode excluir suas próprias avaliações.", 403)` | 403 |

### Regras de Negócio
- Publica evento **após** `deleteById()` com routing key `"rating.deleted"`
- Ownership: mesma lógica de `UpdateRatingUseCase`
- **Nota**: mensagem do delete tem ponto final, mensagem do update não — inconsistência

### Observações para Testes
- Verificar que `deleteById` é chamado **antes** de `publish`
- Comparar mensagem de erro com/sem ponto final entre Update e Delete

---

## 4. GetRatingsByTitleUseCase

### Contexto
Retorna todas as avaliações de um título com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findByTitleId(titleId, pageable)` |

### Input
```java
String titleId, Pageable pageable
```

### Output
```java
Page<MangaRating>
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Ratings existem | Retorna página de ratings |
| 2 | Nenhum rating | Retorna página vazia |

### Regras de Negócio
- **Sem cache** — consulta direta ao repositório
- Não lança exceção se titleId não existe — retorna lista vazia
- Paginação delegada ao Spring Data

### Observações para Testes
- Caso trivial — apenas delega para o repositório
- Pode ser testado junto do port em teste de integração

---

## 5. GetRatingAverageUseCase

### Contexto
Calcula a média de estrelas e a contagem de avaliações de um título. Resultado cacheado.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findByTitleId(titleId)` — retorna `List<MangaRating>` (sem page) |

### Input
```java
String titleId
```

### Output
```java
record RatingAverage(double average, long count)
```

### Cache
```java
@Cacheable(value = CacheNames.RATING_AVERAGE, key = "#titleId")
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Ratings existem | Calcula média com `stream().mapToDouble().average()`, arredonda para 1 casa decimal, retorna com count |
| 2 | Nenhum rating | Retorna `RatingAverage(0.0, 0)` |

### Regras de Negócio
- **Arredondamento**: `Math.round(avg * 10.0) / 10.0` — 1 casa decimal
- Carrega **todos** os ratings do título em memória para calcular — pode ser custoso para títulos populares
- **[HIPÓTESE]** Para performance, poderia usar query de aggregation no MongoDB ao invés de carregar tudo

### Observações para Testes
- Testar arredondamento: ex. stars=[4.3, 4.7] → avg = 4.5
- Testar cenário vazio: retorna (0.0, 0)
- Verificar que o cache funciona (segundo call não invoca repo)
- Verificar que SubmitRating/UpdateRating/DeleteRating evictam esse cache

---

## 6. GetUserRatingsUseCase

### Contexto
Retorna todas as avaliações feitas por um usuário (tela "Minhas Avaliações") com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RatingRepositoryPort` | Port | `findByUserId(userId, pageable)` |

### Input
```java
UUID userId, Pageable pageable
```

### Output
```java
Page<MangaRating>
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | User tem ratings | Retorna página |
| 2 | User sem ratings | Retorna página vazia |

### Regras de Negócio
- Converte `userId.toString()` antes de passar ao repositório (MongoDB armazena como String)
- **Sem cache, sem ownership check** — qualquer autenticado pode consultar? Depende do controller

### Observações para Testes
- Verificar conversão UUID → String na chamada do port

---

## RatingRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno |
|--------|-----------|---------|
| `findByTitleId` | `String titleId` | `List<MangaRating>` |
| `findByTitleIdAndUserId` | `String titleId, String userId` | `Optional<MangaRating>` |
| `findById` | `String id` | `Optional<MangaRating>` |
| `findByUserId` | `String userId` | `List<MangaRating>` |
| `save` | `MangaRating rating` | `MangaRating` |
| `deleteById` | `String id` | `void` |
| `countByTitleId` | `String titleId` | `long` |
| `findByTitleId` | `String titleId, Pageable` | `Page<MangaRating>` |
| `findByUserId` | `String userId, Pageable` | `Page<MangaRating>` |

### Observações
- `countByTitleId` existe no port mas **não é usado** por nenhum use case — `GetRatingAverageUseCase` faz `.size()` na lista
- Métodos sobrecarregados: `findByTitleId` e `findByUserId` com e sem Pageable

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache | Evento |
|----------|-------------------|----------------|----------------|-------|--------|
| SubmitRatingUseCase | RatingRepoPort, UserRepoPort, EventPublisher | 4 | 1 | Evict (key) | rating.submitted |
| UpdateRatingUseCase | RatingRepoPort, EventPublisher | 2 | 2 | Evict (all) | rating.updated |
| DeleteRatingUseCase | RatingRepoPort, EventPublisher | 1 | 2 | Evict (all) | rating.deleted |
| GetRatingsByTitleUseCase | RatingRepoPort | 2 | 0 | ❌ | ❌ |
| GetRatingAverageUseCase | RatingRepoPort | 2 | 0 | Cacheable | ❌ |
| GetUserRatingsUseCase | RatingRepoPort | 2 | 0 | ❌ | ❌ |

## Status: 🔲 Não Implementado
