# Plano de Testes — Presentation / Store

> Controller de lojas parceiras (`StoreController`). 3 endpoints em `/api/stores/`. Todos públicos (GET). DTO simples. Mapper estático. Sem Swagger annotations.

---

## 1. StoreController

### Contexto
Controller REST read-only para lojas parceiras. Minimalista — sem `@Tag`, `@Operation` do Swagger.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetStoresUseCase` | Use Case | Listagem paginada |
| `GetStoreByIdUseCase` | Use Case | Detalhe por UUID |
| `GetStoresByTitleIdUseCase` | Use Case | Lojas que vendem um título |

### Base Path
```
/api/stores
```

---

### 1.1 GET /api/stores

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "name") String sort`
- `@RequestParam(defaultValue = "asc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<StoreResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Lojas existem | 200 + página de `StoreResponse` |
| 2 | Sem lojas | 200 + página vazia |

#### Observações para Testes
- Default sort `"name"` asc — ordem alfabética

---

### 1.2 GET /api/stores/{id}

#### Input
- `@PathVariable UUID id`

#### Output
```java
// HTTP 200
ApiResponse<StoreResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Loja encontrada | 200 + `StoreResponse` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Loja não encontrada | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não UUID) | `MethodArgumentTypeMismatchException` | 400 + `VALIDATION_TYPE_MISMATCH` |

---

### 1.3 GET /api/stores/title/{titleId}

#### Input
- `@PathVariable String titleId`

#### Output
```java
// HTTP 200
ApiResponse<List<StoreResponse>>
// NÃO paginado — lista completa
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com lojas | 200 + `List<StoreResponse>` |
| 2 | Título sem lojas | 200 + lista vazia |

#### Observações para Testes
- **Retorna `List` direto** — sem `PageResponse`
- Usa `StoreMapper.toResponseList()`

---

## 2. StoreResponse (DTO)

### Estrutura
```java
record StoreResponse(
    String id, String name, String logo, String icon, String description,
    String website, String availability, Double rating, List<String> features
)
```

### Observações para Testes
- **Sem `@JsonInclude(NON_NULL)`** — diferente da maioria dos DTOs — campos null aparecem como `null` no JSON
- `rating` é `Double` (wrapper) — pode ser null
- `availability` é `store.getAvailability().name().toLowerCase()` — enum convertido (ex: `"disponivel"`)
- `features` é `List<String>` — pode ser null ou vazia

---

## 3. StoreMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(Store)` | Entidade | `StoreResponse` |
| `toResponseList(List<Store>)` | Lista | `List<StoreResponse>` |

### Observações para Testes
- **Sem null-check** em `toResponse()` — `store` null → NPE
- **Sem null-check** em `toResponseList()` — lista null → NPE
- `availability` com null-check: `store.getAvailability() != null ? ... : null`
- `id` é `store.getId().toString()` — UUID → String
- Mapeamento direto sem formatação de datas

---

## Status: PENDENTE
