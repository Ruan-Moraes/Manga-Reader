# Plano de Testes — Presentation / Group

> Controller de grupos de tradução (`GroupController`). 10 endpoints em `/api/groups/`. GET públicos; POST/PUT/DELETE requerem autenticação. DTOs com Bean Validation. Mapper complexo (members + works aninhados).

---

## 1. GroupController

### Contexto
Controller REST de grupos de tradução/scanlation. Suporta CRUD de grupo, gerência de membros e portfólio de obras.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetGroupsUseCase` | Use Case | Listagem paginada |
| `GetGroupByIdUseCase` | Use Case | Detalhe por UUID |
| `GetGroupByUsernameUseCase` | Use Case | Busca por username (slug) |
| `GetGroupsByTitleIdUseCase` | Use Case | Grupos que traduzem um título |
| `CreateGroupUseCase` | Use Case | Criar grupo (criador = líder) |
| `UpdateGroupUseCase` | Use Case | Atualizar info (somente líder) |
| `JoinGroupUseCase` | Use Case | Entrar como membro |
| `LeaveGroupUseCase` | Use Case | Sair do grupo |
| `AddWorkToGroupUseCase` | Use Case | Adicionar obra ao portfólio |
| `RemoveWorkFromGroupUseCase` | Use Case | Remover obra (líder) |

### Base Path
```
/api/groups
```

---

### 1.1 GET /api/groups

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "name") String sort`
- `@RequestParam(defaultValue = "asc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<GroupResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Grupos existem | 200 + página de `GroupResponse` |
| 2 | Sem grupos | 200 + página vazia |

---

### 1.2 GET /api/groups/{id}

#### Input
- `@PathVariable UUID id`

#### Output
```java
// HTTP 200
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Grupo encontrado | 200 + `GroupResponse` completo (members, translatedWorks) |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Grupo não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não UUID) | `MethodArgumentTypeMismatchException` | 400 + `VALIDATION_TYPE_MISMATCH` |

#### Observações para Testes
- `@PathVariable UUID id` — Spring converte automaticamente; UUID inválido → 400

---

### 1.3 GET /api/groups/username/{username}

#### Input
- `@PathVariable String username`

#### Output
```java
// HTTP 200
ApiResponse<GroupResponse>
```

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Username não encontrado | Use case → `ResourceNotFoundException` | 404 |

---

### 1.4 GET /api/groups/title/{titleId}

#### Input
- `@PathVariable String titleId`

#### Output
```java
// HTTP 200
ApiResponse<List<GroupResponse>>
// NÃO paginado — lista completa
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com grupos | 200 + `List<GroupResponse>` |
| 2 | Título sem grupos | 200 + lista vazia |

#### Observações para Testes
- **Retorna `List` direto** — sem `PageResponse`
- Usa `GroupMapper.toResponseList()`

---

### 1.5 POST /api/groups

#### Input
```java
record CreateGroupRequest(
    @NotBlank(message = "Nome do grupo é obrigatório.") @Size(max = 100) String name,
    @NotBlank(message = "Username do grupo é obrigatório.") @Size(max = 50) String username,
    String description, String logo, String banner, String website, Integer foundedYear
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Criar grupo | 201 + `GroupResponse` — criador aparece como membro LIDER |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Nome em branco | `@NotBlank` | 400 |
| 2 | Nome > 100 chars | `@Size(max=100)` | 400 |
| 3 | Username em branco | `@NotBlank` | 400 |
| 4 | Username > 50 chars | `@Size(max=50)` | 400 |
| 5 | Username duplicado | Use case → `DuplicateResourceException` | 409 |
| 6 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `foundedYear` é `Integer` (nullable) — sem validação de range
- `description`, `logo`, `banner`, `website` sem validação — campos opcionais livres
- O input monta com `extractUserId(auth)` como primeiro param

---

### 1.6 POST /api/groups/{id}/join

#### Input
- `@PathVariable UUID id`
- `Authentication auth`

#### Output
```java
// HTTP 200
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Entrar no grupo | 200 + `GroupResponse` com novo membro adicionado |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Grupo não encontrado | Use case → exception | 404 |
| 2 | Já é membro | Use case → `DuplicateResourceException` | 409 |
| 3 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- Role é fixo `GroupRole.TRADUTOR` — hard-coded no controller
- Não há opção de escolher role ao entrar

---

### 1.7 PUT /api/groups/{id}

#### Input
```java
record UpdateGroupRequest(
    @Size(min = 2, max = 100) String name,
    @Size(max = 2000) String description,
    String logo, String banner, String website
)
```
- `Authentication auth`

#### Output
```java
// HTTP 200
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualizar nome | 200 + grupo atualizado |
| 2 | Atualizar parcial | Apenas `description` — outros null ignorados |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Nome < 2 chars | `@Size(min=2)` | 400 |
| 2 | Nome > 100 chars | `@Size(max=100)` | 400 |
| 3 | Descrição > 2000 chars | `@Size(max=2000)` | 400 |
| 4 | Não é líder | Use case → `BusinessRuleException` | 403 |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- PATCH semântico via PUT — campos nulos ignorados pelo use case
- `@Size(min=2)` valida **se presente** — `null` passa (sem `@NotBlank`)

---

### 1.8 DELETE /api/groups/{id}/leave

#### Input
- `@PathVariable UUID id`
- `Authentication auth`

#### Output
```java
// HTTP 200
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Sair do grupo | 200 + `GroupResponse` sem o membro |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Não é membro | Use case → exception | 400/404 |
| 2 | Líder tenta sair | Use case → `BusinessRuleException` | 403/422 |
| 3 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- Método HTTP `DELETE` mas retorna `200` com body (não 204)
- Líder não pode sair — regra de negócio documentada no Application

---

### 1.9 POST /api/groups/{id}/works

#### Input
```java
record AddWorkRequest(
    @NotBlank(message = "ID do título é obrigatório") String titleId,
    @NotBlank(message = "Título da obra é obrigatório") @Size(max = 200) String title,
    String cover, int chapters, String status, List<String> genres
)
```
- `Authentication auth`

#### Output
```java
// HTTP 201 Created
ApiResponse<GroupResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Adicionar obra | 201 + `GroupResponse` com nova obra em `translatedWorks` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | titleId em branco | `@NotBlank` | 400 |
| 2 | title em branco | `@NotBlank` | 400 |
| 3 | title > 200 chars | `@Size(max=200)` | 400 |
| 4 | Não é membro | Use case → `BusinessRuleException` | 403 |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `chapters` é `int` (primitivo) — valor 0 aceito (sem `@Min`)
- `status`, `cover`, `genres` sem validação
- **Qualquer membro** pode adicionar obra (não apenas líder) — regra do use case

---

### 1.10 DELETE /api/groups/{id}/works/{titleId}

#### Input
- `@PathVariable UUID id`
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
| 1 | Remover obra | 204 + body vazio |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Não é líder | Use case → `BusinessRuleException` | 403 |
| 2 | Obra não encontrada | Use case → exception | 404 |
| 3 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **Somente líder** pode remover obra (diferente de adicionar, que qualquer membro pode)
- Sem `ApiResponse` wrapper

---

## 2. GroupResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record GroupResponse(
    String id, String name, String username, String logo, String banner,
    String description, String website, int totalTitles, Integer foundedYear,
    String platformJoinedAt, String status,
    List<GroupMemberResponse> members, List<String> genres,
    List<String> focusTags, double rating, int popularity,
    List<GroupWorkResponse> translatedWorks
)
```

### DTOs Aninhados
```java
record GroupMemberResponse(String id, String name, String avatar, String bio, String role, String joinedAt)
record GroupWorkResponse(String id, String title, String cover, int chapters, String status, int popularity, String updatedAt, List<String> genres)
```

### Observações para Testes
- `id` é `group.getId().toString()` — UUID → String
- `status` é `group.getStatus().name().toLowerCase()` (ex: `"ativo"`, `"inativo"`)
- `members.role` usa `getDisplayName()` do enum (ex: `"Líder"`, `"Tradutor"`)
- `members.avatar` = `user.getPhotoUrl()`
- `translatedWorks.status` = `w.getStatus().name().toLowerCase()`

---

## 3. GroupMapper

### Observações para Testes
- Usa `DateTimeFormatter.ISO_LOCAL_DATE` — **não** `ISO_LOCAL_DATE_TIME`
- `mapMembers(null)` → `emptyList`
- `mapWorks(null)` → `emptyList`
- Acessa `m.getUser()` nas members — se User for null, `NullPointerException` [HIPÓTESE]
- `toResponse(null)` → `null`

---

## Status: PENDENTE
