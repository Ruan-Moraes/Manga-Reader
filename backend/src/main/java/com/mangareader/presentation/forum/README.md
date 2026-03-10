# Plano de Testes — Presentation / Forum

> Controller do fórum (`ForumController`). 8 endpoints em `/api/forum/`. GET públicos; POST/PUT/DELETE requerem autenticação. DTOs com Bean Validation. Mapper com sub-objetos (author, replies).

---

## 1. ForumController

### Contexto
Controller REST do fórum da comunidade. Suporta tópicos, replies e categorias.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetForumTopicsUseCase` | Use Case | Listagem paginada |
| `GetForumTopicByIdUseCase` | Use Case | Detalhe com replies |
| `GetForumTopicsByCategoryUseCase` | Use Case | Filtro por categoria |
| `CreateForumTopicUseCase` | Use Case | Criar tópico |
| `CreateForumReplyUseCase` | Use Case | Responder tópico |
| `UpdateForumTopicUseCase` | Use Case | Atualizar tópico (autor) |
| `DeleteForumTopicUseCase` | Use Case | Excluir tópico (autor) |

### Base Path
```
/api/forum
```

---

### 1.1 GET /api/forum

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "10") int size` — **default 10** (não 20)
- `@RequestParam(defaultValue = "createdAt") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<ForumTopicResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Tópicos existem | 200 + página de `ForumTopicResponse` |
| 2 | Sem tópicos | 200 + página vazia |

#### Observações para Testes
- **Size padrão 10** (diferente de todos os outros controllers que usam 20)

---

### 1.2 GET /api/forum/{id}

#### Input
- `@PathVariable UUID id`

#### Output
```java
// HTTP 200
ApiResponse<ForumTopicResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Tópico encontrado | 200 + `ForumTopicResponse` completo (author, replies, tags) |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Tópico não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não UUID) | `MethodArgumentTypeMismatchException` | 400 |

---

### 1.3 GET /api/forum/category/{category}

#### Input
- `@PathVariable String category`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "10") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<ForumTopicResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Categoria com tópicos | 200 + página filtrada |
| 2 | Categoria sem tópicos | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Categoria inválida | `parseCategory()` → `IllegalArgumentException` | 500 (handler genérico) [HIPÓTESE] |

#### Observações para Testes
- `parseCategory()` aceita `displayName` (case-insensitive) ou `name()` do enum
- Sort fixo `"createdAt"` desc — não customizável
- Se categoria inválida → `IllegalArgumentException` **não está tratada** no `GlobalExceptionHandler` → 500

---

### 1.4 POST /api/forum

#### Input
```java
record CreateTopicRequest(
    @NotBlank(message = "Título é obrigatório.") @Size(max = 300) String title,
    @NotBlank(message = "Conteúdo é obrigatório.") @Size(max = 10000) String content,
    @NotNull(message = "Categoria é obrigatória.") @Size(max = 100) String category,
    List<String> tags
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<ForumTopicResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Criar tópico | 201 + `ForumTopicResponse` — autor populado |
| 2 | Criar com tags | `tags` incluídas no tópico |
| 3 | Criar sem tags | `tags` null → aceito |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Título em branco | `@NotBlank` | 400 |
| 2 | Título > 300 chars | `@Size(max=300)` | 400 |
| 3 | Conteúdo em branco | `@NotBlank` | 400 |
| 4 | Conteúdo > 10000 chars | `@Size(max=10000)` | 400 |
| 5 | Categoria null | `@NotNull` | 400 |
| 6 | Categoria inválida | `parseCategory()` → exception | 500 |
| 7 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `parseCategory()` é chamada **antes** do use case — falha antes da lógica de negócio
- `tags` sem validação — lista livre

---

### 1.5 POST /api/forum/{id}/replies

#### Input
```java
record CreateReplyRequest(
    @NotBlank(message = "Conteúdo da resposta é obrigatório.") @Size(max = 10000) String content
)
```
- `@PathVariable UUID id`
- `Authentication auth`

#### Output
```java
// HTTP 201 Created
ApiResponse<ForumTopicResponse>
// Retorna o tópico completo (com a nova reply)
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Reply com sucesso | 201 + tópico com nova reply adicionada |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Conteúdo em branco | `@NotBlank` | 400 |
| 2 | Conteúdo > 10000 chars | `@Size(max=10000)` | 400 |
| 3 | Tópico não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 4 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- Retorna **o tópico inteiro** (não apenas a reply)
- `CreateReplyInput(topicId, userId, content)` — 3 params
- Tópicos locked **podem** receber replies [HIPÓTESE documentada no Application]

---

### 1.6 PUT /api/forum/{id}

#### Input
```java
record UpdateTopicRequest(
    @Size(max = 300) String title,
    @Size(max = 10000) String content,
    @Size(max = 100) String category,
    List<String> tags
)
```
- `Authentication auth`

#### Output
```java
// HTTP 200
ApiResponse<ForumTopicResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualizar título | 200 + tópico atualizado |
| 2 | Atualizar parcial | Apenas `content` — outros null ignorados |
| 3 | Mudar categoria | `category` preenchido → `parseCategory()` → novo enum |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Título > 300 chars | `@Size(max=300)` | 400 |
| 2 | Tópico locked | Use case → `BusinessRuleException` | 422 |
| 3 | Não é o autor | Use case → `BusinessRuleException` | 403 |
| 4 | Categoria inválida | `parseCategory()` → exception | 500 |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `category` é tratado no controller: se `null` → `null` passado ao use case; se preenchido → `parseCategory()`
- PATCH semântico via PUT — campos nulos ignorados

---

### 1.7 DELETE /api/forum/{id}

#### Input
- `@PathVariable UUID id`
- `Authentication auth`

#### Output
```java
// HTTP 204 No Content
ResponseEntity<Void>
```

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Tópico não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | Não é o autor | Use case → `BusinessRuleException` | 403 |
| 3 | Sem autenticação | Spring Security | 401 |

---

### 1.8 GET /api/forum/categories

#### Input
- Nenhum

#### Output
```java
// HTTP 200
ApiResponse<List<ForumCategoryResponse>>
// ForumCategoryResponse: record(String name, String displayName)
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Listar categorias | 200 + lista de `{ name, displayName }` para todos os valores de `ForumCategory` enum |

#### Observações para Testes
- **Não usa use case** — lê diretamente do enum `ForumCategory.values()`
- `name` = nome do enum, `displayName` = via `getDisplayName()`
- Endpoint estático — sempre retorna mesmos dados

---

## 2. ForumTopicResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record ForumTopicResponse(
    String id, String title, String content, ForumAuthorResponse author,
    String category, List<String> tags, String createdAt, String lastActivityAt,
    int viewCount, int replyCount, int likeCount,
    boolean isPinned, boolean isLocked, boolean isSolved,
    List<ForumReplyResponse> replies
)
```

### DTOs Aninhados
```java
record ForumAuthorResponse(String id, String name, String avatar, String role, int postCount, String joinedAt)
record ForumReplyResponse(String id, ForumAuthorResponse author, String content, String createdAt, int likes, boolean isEdited, boolean isBestAnswer)
record ForumCategoryResponse(String name, String displayName)
```

### Observações para Testes
- `author.role` é mapeado: `ADMIN → "admin"`, `MODERATOR → "moderator"`, outros → `"member"`
- `author.postCount` é **sempre 0** — hardcoded no mapper (implementação futura)
- `author.joinedAt` usa `ISO_LOCAL_DATE` (só data, sem hora)
- `category` usa `getDisplayName()` — display name, não enum name

---

## 3. ForumMapper

### Observações para Testes
- `mapAuthor(null)` → `null`
- `mapReplies(null)` → `emptyList`
- `toResponse(null)` → `null`
- Data via `DateTimeFormatter.ISO_LOCAL_DATE_TIME` para tópico/reply, `ISO_LOCAL_DATE` para author
- `author.postCount` = 0 fixo — mock não necessário mas documentar como limitação
- Acessa `topic.getAuthor()` e `reply.getAuthor()` — se `User` for null → `ForumAuthorResponse` null (não NPE)

---

## Status: PENDENTE
