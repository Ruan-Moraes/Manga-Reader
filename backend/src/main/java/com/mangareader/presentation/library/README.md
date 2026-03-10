# Plano de Testes — Presentation / Library

> Controller da biblioteca pessoal (`LibraryController`). 4 endpoints em `/api/library/`. **Todos requerem autenticação.** DTOs com Bean Validation.

---

## 1. LibraryController

### Contexto
Controller REST da biblioteca do usuário. CRUD de mangás salvos com lista de leitura (Lendo, Quero Ler, Concluído).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetUserLibraryUseCase` | Use Case | Biblioteca paginada do usuário |
| `SaveToLibraryUseCase` | Use Case | Salvar título na biblioteca |
| `ChangeReadingListUseCase` | Use Case | Alterar lista de leitura |
| `RemoveFromLibraryUseCase` | Use Case | Remover título da biblioteca |

### Base Path
```
/api/library
```

---

### 1.1 GET /api/library

#### Input
- `Authentication auth` (requerido)
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "savedAt") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<SavedMangaResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Biblioteca com itens | 200 + página de `SavedMangaResponse` |
| 2 | Biblioteca vazia | 200 + página vazia |
| 3 | Ordenação por nome asc | `sort=name&direction=asc` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- Default sort `"savedAt"` desc — mais recentes primeiro
- `extractUserId(auth)` → `(UUID) auth.getPrincipal()`

---

### 1.2 POST /api/library

#### Input
```java
record SaveToLibraryRequest(
    @NotBlank(message = "ID do título é obrigatório.") String titleId,
    @NotNull(message = "Tipo de lista é obrigatório.") String list
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<SavedMangaResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Salvar com lista "Lendo" | 201 + `SavedMangaResponse` com `list: "Lendo"` |
| 2 | Salvar com lista "Quero Ler" | 201 + lista correspondente |
| 3 | Salvar com lista "Concluído" | 201 + lista correspondente |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | titleId em branco | `@NotBlank` | 400 + `fieldErrors.titleId` |
| 2 | list null | `@NotNull` | 400 + `fieldErrors.list` |
| 3 | Título já na biblioteca | Use case → `DuplicateResourceException` | 409 |
| 4 | Lista inválida | `parseReadingList()` → `IllegalArgumentException` | 500 [HIPÓTESE] — não tratado pelo handler |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **`parseReadingList()`** no controller: converte String → `ReadingListType` enum
  - `"Lendo"` → `LENDO`
  - `"Quero Ler"` → `QUERO_LER`
  - `"Concluído"` → `CONCLUIDO`
  - Qualquer outro → `ReadingListType.valueOf(list)` (fallback — aceita nomes do enum como `"LENDO"`)
- Se `list` não é nenhum dos valores conhecidos → `IllegalArgumentException` → cai no handler genérico 500
- **Testar ambos os formatos**: display name ("Lendo") e enum name ("LENDO")

---

### 1.3 PATCH /api/library/{titleId}

#### Input
```java
record ChangeListRequest(
    @NotNull(message = "Nova lista é obrigatória.") String list
)
```
- `@PathVariable String titleId`
- `Authentication auth`

#### Output
```java
// HTTP 200
ApiResponse<SavedMangaResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Mudar de "Lendo" para "Concluído" | 200 + `SavedMangaResponse` com nova lista |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | list null | `@NotNull` | 400 |
| 2 | Título não na biblioteca | Use case → `ResourceNotFoundException` | 404 |
| 3 | Lista inválida | `parseReadingList()` → exception | 500 |
| 4 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **PATCH** (não PUT) — `@PatchMapping("/{titleId}")`
- Mesma lógica `parseReadingList()` do POST

---

### 1.4 DELETE /api/library/{titleId}

#### Input
- `@PathVariable String titleId`
- `Authentication auth`

#### Output
```java
// HTTP 204 No Content
ResponseEntity<Void>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Remove com sucesso | 204 + body vazio |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Título não na biblioteca | Use case → exception | 404 [HIPÓTESE] |
| 2 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **Sem `ApiResponse` wrapper**
- `removeFromLibraryUseCase.execute(userId, titleId)` — 2 params

---

## 2. SavedMangaResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record SavedMangaResponse(String titleId, String name, String cover, String type, String list, String savedAt)
```

### Observações para Testes
- `list` é o display name do enum: `"Lendo"`, `"Quero Ler"`, `"Concluído"` — via `saved.getList().getDisplayName()`
- `savedAt` formatado com `ISO_LOCAL_DATE_TIME`
- `cover` e `type` podem ser null → omitidos

---

## 3. LibraryMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(SavedManga)` | Entidade | `SavedMangaResponse` (ou `null`) |
| `toResponseList(List<SavedManga>)` | Lista | `List<SavedMangaResponse>` (ou `emptyList`) |

### Observações para Testes
- `saved.getList().getDisplayName()` — converte enum para display name legível
- `toResponse(null)` → `null`
- Data via `DateTimeFormatter.ISO_LOCAL_DATE_TIME`

---

## Status: PENDENTE
