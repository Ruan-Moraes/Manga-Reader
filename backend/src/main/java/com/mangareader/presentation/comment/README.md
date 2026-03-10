# Plano de Testes — Presentation / Comment

> Controller de comentários (`CommentController`). 7 endpoints em `/api/comments/`. DTOs com Bean Validation. Mapper estático.

---

## 1. CommentController

### Contexto
Controller REST para comentários. GET (por título) é público; POST/PUT/DELETE e reações requerem autenticação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetCommentsByTitleUseCase` | Use Case | Comentários paginados por título |
| `CreateCommentUseCase` | Use Case | Criar comentário ou reply |
| `UpdateCommentUseCase` | Use Case | Editar texto de um comentário |
| `DeleteCommentUseCase` | Use Case | Excluir comentário |
| `ReactToCommentUseCase` | Use Case | Like/dislike em comentário |

### Base Path
```
/api/comments
```

---

### 1.1 GET /api/comments/title/{titleId}

#### Input
- `@PathVariable String titleId`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "createdAt") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<CommentResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com comentários | 200 + página de `CommentResponse` |
| 2 | Título sem comentários | 200 + página vazia |
| 3 | Paginação customizada | `page=1&size=10&sort=likeCount&direction=desc` |

#### Observações para Testes
- Endpoint público
- `result.map(CommentMapper::toResponse)` — mapeamento inline no Page

---

### 1.2 POST /api/comments

#### Input
```java
record CreateCommentRequest(
    @NotBlank(message = "ID do título é obrigatório.") @Size(max = 100) String titleId,
    @NotBlank(message = "Conteúdo do comentário é obrigatório.") @Size(max = 5000) String textContent,
    @Size(max = 2000, message = "URL da imagem deve ter no máximo 2000 caracteres.") String imageContent,
    @Size(max = 100) String parentCommentId
)
```

#### Output
```java
// HTTP 201 Created
ApiResponse<CommentResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Comentário raiz | 201 + `CommentResponse` — `parentCommentId` null |
| 2 | Reply a outro comentário | 201 + `CommentResponse` — `parentCommentId` preenchido |
| 3 | Comentário com imagem | `imageContent` preenchido |
| 4 | Comentário sem imagem | `imageContent` null — aceito |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | titleId em branco | `@NotBlank` | 400 + `fieldErrors.titleId` |
| 2 | textContent em branco | `@NotBlank` | 400 + `fieldErrors.textContent` |
| 3 | textContent > 5000 chars | `@Size(max=5000)` | 400 |
| 4 | imageContent > 2000 chars | `@Size(max=2000)` | 400 |
| 5 | parentCommentId inexistente | Use case → `ResourceNotFoundException` | 404 |
| 6 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `CreateCommentInput` monta com `extractUserId(auth)` como último param
- `parentCommentId` é opcional — sem `@NotBlank`

---

### 1.3 PUT /api/comments/{id}

#### Input
```java
record UpdateCommentRequest(
    @NotBlank(message = "Conteúdo do comentário é obrigatório.") @Size(max = 5000) String textContent
)
```

#### Output
```java
// HTTP 200
ApiResponse<CommentResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Update com sucesso | 200 + `CommentResponse` com `wasEdited = true` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | textContent em branco | `@NotBlank` | 400 |
| 2 | textContent > 5000 chars | `@Size(max=5000)` | 400 |
| 3 | Comentário não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 4 | Não é o autor | Use case → `BusinessRuleException` | 403 |
| 5 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- `UpdateCommentInput(id, textContent, userId)` — 3 params
- O use case seta `wasEdited = true` na entidade

---

### 1.4 DELETE /api/comments/{id}

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
| 1 | Comentário não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | Não é o autor | Use case → `BusinessRuleException` | 403 |
| 3 | Sem autenticação | Spring Security | 401 |

#### Observações para Testes
- **Sem `ApiResponse` wrapper** — retorna `ResponseEntity.noContent().build()`

---

### 1.5 POST /api/comments/{id}/like

#### Input
- `@PathVariable String id`
- Sem `Authentication` — **endpoint público** [HIPÓTESE-CRÍTICA]

#### Output
```java
// HTTP 200
ApiResponse<CommentResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Like com sucesso | 200 + `CommentResponse` com `likeCount` incrementado |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Comentário não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- **NÃO requer autenticação** no controller — sem param `Authentication`
- Chama `reactToCommentUseCase.execute(id, ReactionType.LIKE)`
- **Sem controle de duplicatas** — pode curtir infinitamente [HIPÓTESE-CRÍTICA documentada no Application]

---

### 1.6 POST /api/comments/{id}/dislike

#### Input
- `@PathVariable String id`
- Sem `Authentication` — **endpoint público** [HIPÓTESE-CRÍTICA]

#### Output
```java
// HTTP 200
ApiResponse<CommentResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Dislike com sucesso | 200 + `CommentResponse` com `dislikeCount` incrementado |

#### Observações para Testes
- Mesmo comportamento do `/like` — sem autenticação, sem controle de duplicatas
- `ReactionType.DISLIKE` passado ao use case

---

## 2. CommentResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record CommentResponse(
    String id, String titleId, String parentCommentId, String userId,
    String userName, String userPhoto, boolean isHighlighted, boolean wasEdited,
    String createdAt, String textContent, String imageContent,
    String likeCount, String dislikeCount
)
```

### Observações para Testes
- `likeCount` e `dislikeCount` são **String** (não int) — `String.valueOf(comment.getLikeCount())`
- `isHighlighted` e `wasEdited` são `boolean` (primitivo) — sempre serializados
- `parentCommentId`, `imageContent`, `userPhoto` podem ser null → omitidos

---

## 3. CommentMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(Comment)` | Entidade | `CommentResponse` (ou `null`) |
| `toResponseList(List<Comment>)` | Lista | `List<CommentResponse>` (ou `emptyList`) |

### Observações para Testes
- `likeCount`/`dislikeCount` convertidos via `String.valueOf()` — nunca null
- Data via `DateTimeFormatter.ISO_LOCAL_DATE_TIME`
- Null-safe: `toResponse(null)` → `null`, `toResponseList(null)` → `emptyList`

---

## Status: PENDENTE
