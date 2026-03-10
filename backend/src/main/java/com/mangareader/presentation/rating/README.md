# Plano de Testes — Presentation / Rating

> Controller de avaliações (`RatingController`). 6 endpoints em `/api/ratings/`. DTOs com Bean Validation. Mapper estático. Respostas via `ApiResponse<>`.

---

## 1. RatingController

### Contexto
Controller REST para avaliações. GET de listagem e média são públicos; POST/PUT/DELETE requerem autenticação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetRatingsByTitleUseCase` | Use Case | Avaliações paginadas por título |
| `GetRatingAverageUseCase` | Use Case | Média + count por título (cached) |
| `GetUserRatingsUseCase` | Use Case | Avaliações do usuário logado |
| `SubmitRatingUseCase` | Use Case | Criar avaliação (upsert) |
| `UpdateRatingUseCase` | Use Case | Atualizar avaliação existente |
| `DeleteRatingUseCase` | Use Case | Excluir avaliação |

### Base Path
```
/api/ratings
```

---

### 1.1 GET /api/ratings/title/{titleId}

#### Input
- `@PathVariable String titleId`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "createdAt") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<RatingResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com avaliações | 200 + página de `RatingResponse` com `id, titleId, userName, stars, comment, categoryRatings, createdAt` |
| 2 | Título sem avaliações | 200 + página vazia (`content: [], totalElements: 0`) |
| 3 | Paginação custom | `page=2&size=5` respeitados no `Pageable` |
| 4 | Ordenação ascendente | `direction=asc` → `Sort.Direction.ASC` |

#### Observações para Testes
- Endpoint público — sem `Authentication`
- `buildPageable()` converte `direction` case-insensitive (`"asc"` ou `"ASC"`)
- `RatingMapper.toResponse()` retorna `null` se rating `null` — mas Page não deveria conter nulls

---

### 1.2 GET /api/ratings/title/{titleId}/average

#### Input
- `@PathVariable String titleId`

#### Output
```java
// HTTP 200
ApiResponse<RatingAverageResponse>
// RatingAverageResponse: record(double average, long count)
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com avaliações | 200 + `{ average: 4.5, count: 120 }` |
| 2 | Título sem avaliações | 200 + `{ average: 0.0, count: 0 }` [HIPÓTESE] |

#### Observações para Testes
- Endpoint público
- Use case usa `@Cacheable` — testar que controller não interfere no cache
- `RatingAverageResponse` é construído diretamente no controller: `new RatingAverageResponse(output.average(), output.count())`

---

### 1.3 GET /api/ratings/user

#### Input
- `Authentication auth` (requerido)
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<RatingResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Usuário com avaliações | 200 + página de avaliações do usuário |
| 2 | Usuário sem avaliações | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `extractUserId(auth)` → `(UUID) auth.getPrincipal()`
- Pageable com sort fixo `"createdAt"` e direction `"desc"` — valores default

---

### 1.4 POST /api/ratings

#### Input
```java
record SubmitRatingRequest(
    @NotBlank(message = "ID do título é obrigatório.") @Size(max = 100) String titleId,
    @Min(value = 1, message = "Nota mínima é 1.") @Max(value = 5, message = "Nota máxima é 5.") double stars,
    @Size(max = 2000, message = "Comentário deve ter no máximo 2000 caracteres.") String comment,
    Map<String, Double> categoryRatings
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<RatingResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Submit com sucesso | 201 + `ApiResponse.created(RatingResponse)` |
| 2 | Sem comment | `comment` null aceito (sem `@NotBlank`) |
| 3 | Sem categoryRatings | `categoryRatings` null aceito |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | titleId em branco | `@NotBlank` | 400 + `fieldErrors.titleId` |
| 2 | titleId > 100 chars | `@Size(max=100)` | 400 |
| 3 | stars = 0 | `@Min(1)` | 400 + `fieldErrors.stars` |
| 4 | stars = 6 | `@Max(5)` | 400 + `fieldErrors.stars` |
| 5 | comment > 2000 chars | `@Size(max=2000)` | 400 |
| 6 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `stars` é `double` (primitivo) — `@Min/@Max` funciona com wrappers via Bean Validation
- `categoryRatings` sem validação — aceita qualquer `Map<String, Double>`
- O input do use case é montado como `SubmitRatingInput(titleId, userId, stars, comment, categoryRatings)`

---

### 1.5 PUT /api/ratings/{id}

#### Input
```java
record UpdateRatingRequest(
    @Min(1) @Max(5) Double stars,       // nullable (PATCH semântico)
    @Size(max = 2000) String comment,   // nullable
    Map<String, Double> categoryRatings // nullable
)
```

#### Output
```java
// HTTP 200
ApiResponse<RatingResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualizar stars | 200 + avaliação atualizada |
| 2 | Atualizar apenas comment | `stars` e `categoryRatings` null — use case ignora |
| 3 | Atualizar tudo | Todos os campos preenchidos |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | stars = 0 | `@Min(1)` | 400 |
| 2 | stars = 10 | `@Max(5)` | 400 |
| 3 | Rating não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 4 | Não é o dono | Use case → `BusinessRuleException` | 403 |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `stars` é `Double` (wrapper, nullable) — diferente do Submit que usa `double` (primitivo)
- PATCH semântico via PUT — campos nulos são ignorados pelo use case
- `@PathVariable String id` — o ID do rating

---

### 1.6 DELETE /api/ratings/{id}

#### Input
- `@PathVariable String id`
- `Authentication auth`

#### Output
```java
// HTTP 204 No Content
ResponseEntity<Void>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Delete com sucesso | 204 + body vazio |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Rating não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | Não é o dono | Use case → `BusinessRuleException` | 403 |
| 3 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- Retorna `ResponseEntity.noContent().build()` — **sem `ApiResponse` wrapper**
- `deleteRatingUseCase.execute(id, extractUserId(auth))` — 2 params

---

## 2. RatingResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record RatingResponse(String id, String titleId, String userName, double stars, String comment, Map<String, Double> categoryRatings, String createdAt)
```

### Observações para Testes
- `stars` é `double` (primitivo) — sempre serializado, nunca null
- `comment` e `categoryRatings` podem ser null → omitidos no JSON
- `createdAt` formatado como `ISO_LOCAL_DATE_TIME`

---

## 3. RatingMapper

### Contexto
Mapper estático `MangaRating → RatingResponse`.

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(MangaRating)` | Entidade | `RatingResponse` (ou `null` se input null) |
| `toResponseList(List<MangaRating>)` | Lista | `List<RatingResponse>` (ou `emptyList` se null) |

### Observações para Testes
- `formatDate(null)` → `null`
- `toResponse(null)` → `null`
- `toResponseList(null)` → `Collections.emptyList()`
- Data formatada com `DateTimeFormatter.ISO_LOCAL_DATE_TIME`

---

## Status: PENDENTE
