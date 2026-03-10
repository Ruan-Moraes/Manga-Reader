# Plano de Testes — Presentation / Category (Tag)

> Controller de tags/gêneros (`TagController`). 3 endpoints em `/api/tags/`. Todos públicos (GET). DTO simples. Mapper estático.

---

## 1. TagController

### Contexto
Controller REST read-only para tags (gêneros de mangá). Sem autenticação, sem Swagger `@Tag`/`@Operation` (minimalista).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetTagsUseCase` | Use Case | Listagem paginada |
| `GetTagByIdUseCase` | Use Case | Detalhe por ID (cached) |
| `SearchTagsUseCase` | Use Case | Busca por label |

### Base Path
```
/api/tags
```

---

### 1.1 GET /api/tags

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "label") String sort`
- `@RequestParam(defaultValue = "asc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TagResponse>>
// TagResponse: record(Long value, String label)
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Tags existem | 200 + página de `TagResponse` com `value` (id) e `label` |
| 2 | Sem tags | 200 + página vazia |
| 3 | Ordenação by label desc | `sort=label&direction=desc` |

#### Observações para Testes
- Default sort por `"label"` asc — ordem alfabética
- `TagResponse` usa `value` (não `id`) — compatível com frontend `Tag { value, label }`

---

### 1.2 GET /api/tags/{id}

#### Input
- `@PathVariable Long id`

#### Output
```java
// HTTP 200
ApiResponse<TagResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Tag encontrada | 200 + `TagResponse` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Tag não encontrada | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não Long) | `MethodArgumentTypeMismatchException` | 400 + `VALIDATION_TYPE_MISMATCH` |

#### Observações para Testes
- `@PathVariable Long id` — tipo `Long`, não `UUID` — diferente dos outros controllers
- Use case usa `@Cacheable`

---

### 1.3 GET /api/tags/search

#### Input
- `@RequestParam("q") String query` — **obrigatório** (sem defaultValue)
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TagResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Query com resultados | 200 + tags que contêm `q` no label |
| 2 | Query sem resultados | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Param `q` ausente | Spring MVC → `MissingServletRequestParameterException` | 400 [HIPÓTESE] |

#### Observações para Testes
- `q` é **obrigatório** — `@RequestParam("q")` sem `required = false` e sem defaultValue
- Se `q` ausente → Spring lança exceção — **não tratada no GlobalExceptionHandler** → 400 genérico [HIPÓTESE]
- Sort fixo `"label"` asc

---

## 2. TagResponse (DTO)

### Estrutura
```java
record TagResponse(Long value, String label)
```

### Observações para Testes
- Sem `@JsonInclude(NON_NULL)` — diferente dos outros DTOs
- `value` é `Long` (wrapper) — pode ser null em teoria, mas IDs de Tag são auto-generated
- DTO minimalista — apenas 2 campos

---

## 3. TagMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(Tag)` | Entidade | `TagResponse` |
| `toResponseList(List<Tag>)` | Lista | `List<TagResponse>` |

### Observações para Testes
- **Sem null-check** em `toResponse()` — diferente dos outros mappers, não testa `tag == null`
- Se `tag` é null → `NullPointerException`
- `toResponseList()` sem null-check na lista — `null.stream()` → NPE
- Mapeamento direto: `tag.getId()` → `value`, `tag.getLabel()` → `label`

---

## Status: PENDENTE
