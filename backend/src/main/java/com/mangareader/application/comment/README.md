# Plano de Testes — Application / Comment

> Módulo de comentários de títulos. 5 use cases + 1 port. MongoDB. Sem cache, sem eventos.

---

## 1. CreateCommentUseCase

### Contexto
Cria um comentário novo — pode ser root (sem parentCommentId) ou resposta (com parentCommentId).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CommentRepositoryPort` | Port | `findById()` (validar pai), `save()` |
| `UserRepositoryPort` | Port | `findById()` |

### Input
```java
record CreateCommentInput(String titleId, String textContent, String imageContent, String parentCommentId, UUID userId)
```

### Output
```java
Comment (entidade salva)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Comentário root | `parentCommentId == null` → cria sem validação de pai |
| 2 | Resposta (reply) | `parentCommentId != null` → verifica se pai existe, depois cria |
| 3 | Denormalização de user | Copia `user.getName()` → `userName`, `user.getPhotoUrl()` → `userPhoto` |
| 4 | Defaults explícitos | `isHighlighted=false`, `wasEdited=false`, `likeCount=0`, `dislikeCount=0` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", input.userId())` | 404 |
| 2 | Parent comment não existe | `ResourceNotFoundException("Comment", "id", input.parentCommentId())` | 404 |

### Regras de Negócio
- **Denormalização**: `userName` e `userPhoto` vêm do User — se o user mudar nome/foto, comentários antigos ficam desatualizados (atualizado via `UserDenormalizationConsumer`)
- `imageContent` é opcional — pode ser null
- Não valida se `titleId` existe (MongoDB) — **[HIPÓTESE]** pode criar comentário para título inexistente
- Não verifica profundidade de respostas (reply de reply é possível?)

### Observações para Testes
- Testar com `parentCommentId = null` e `parentCommentId = "id-valido"`
- Mock `commentRepository.findById(parentId)` → `Optional.empty()` para reply com pai inexistente
- Verificar todos os 4 campos default no builder
- Verificar que `userId` é armazenado como `input.userId().toString()` (UUID → String)

---

## 2. UpdateCommentUseCase

### Contexto
Atualiza o texto de um comentário existente. Somente o autor pode editar.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CommentRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
record UpdateCommentInput(String commentId, String textContent, UUID userId)
```

### Output
```java
Comment (entidade atualizada)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Edição com sucesso | Seta `textContent`, marca `wasEdited = true`, salva |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Comment não encontrado | `ResourceNotFoundException("Comment", "id", input.commentId())` | 404 |
| 2 | User não é o autor | `BusinessRuleException("Você só pode editar seus próprios comentários.", 403)` | 403 |

### Regras de Negócio
- **wasEdited = true** — marcado permanentemente, não volta para false
- Ownership: `comment.getUserId().equals(input.userId().toString())`
- Apenas `textContent` é atualizável — `imageContent` não pode ser alterado
- **Não** atualiza `userName` ou `userPhoto` — se o user mudou de nome, o comentário mantém o nome antigo

### Observações para Testes
- Verificar que `wasEdited` é setado para `true`
- Verificar que `imageContent` permanece inalterado
- Testar ownership com UUID diferente

---

## 3. DeleteCommentUseCase

### Contexto
Exclui um comentário. Somente o autor pode excluir.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CommentRepositoryPort` | Port | `findById()`, `deleteById()` |

### Input
```java
String commentId, UUID userId
```

### Output
```java
void
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Exclusão com sucesso | Verifica ownership, deleta |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Comment não encontrado | `ResourceNotFoundException("Comment", "id", commentId)` | 404 |
| 2 | User não é o autor | `BusinessRuleException("Você só pode excluir seus próprios comentários.", 403)` | 403 |

### Regras de Negócio
- **Não** deleta respostas (filhos) do comentário — ficam órfãs
- **[HIPÓTESE]** Deve-se considerar deleção em cascata para respostas? Atualmente não existe

### Observações para Testes
- Verificar que `deleteById` é chamado com o `commentId`
- Testar cenário de comentário com respostas — as respostas continuam existindo?

---

## 4. GetCommentsByTitleUseCase

### Contexto
Retorna os comentários de um título com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CommentRepositoryPort` | Port | `findByTitleId(titleId, pageable)` |

### Input
```java
String titleId, Pageable pageable
```

### Output
```java
Page<Comment>
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Comentários existem | Retorna página com root + replies (todos misturados) |
| 2 | Nenhum comentário | Retorna página vazia |

### Regras de Negócio
- Retorna **todos** os comentários (root + replies) — a separação root/reply é feita no frontend via `parentCommentId`
- Sem cache
- Não lança exceção se titleId não existe

### Observações para Testes
- Caso trivial de delegação ao repositório
- O port também tem `findByTitleIdAndParentCommentIdIsNull` e `findByParentCommentId` — mas **não são usados** por nenhum use case

---

## 5. ReactToCommentUseCase

### Contexto
Incrementa like ou dislike de um comentário.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CommentRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
String commentId, ReactionType type  // enum { LIKE, DISLIKE }
```

### Output
```java
Comment (atualizado)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Like | `likeCount` incrementa em 1 |
| 2 | Dislike | `dislikeCount` incrementa em 1 |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Comment não encontrado | `ResourceNotFoundException("Comment", "id", commentId)` | 404 |

### Regras de Negócio
- **Sem controle de duplicatas** — o mesmo user pode dar like infinitamente
- **Sem autenticação** — não recebe userId como parâmetro
- **Sem toggle** — não é possível remover like/dislike
- Incremento é simples: `getCount() + 1`

### Observações para Testes
- **[HIPÓTESE-CRÍTICA]** Ausência de controle de duplicatas é intencional ou bug? Testar chamando `execute()` múltiplas vezes e verificar que incrementa a cada vez
- Testar os dois branches do switch: LIKE e DISLIKE
- O enum `ReactionType` está definido **dentro** do use case (inner enum)

---

## CommentRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findByTitleId` | `String titleId` | `List<Comment>` | — |
| `findByTitleIdAndParentCommentIdIsNull` | `String titleId` | `List<Comment>` | — |
| `findByParentCommentId` | `String parentCommentId` | `List<Comment>` | — |
| `findById` | `String id` | `Optional<Comment>` | Create, Update, Delete, React |
| `save` | `Comment comment` | `Comment` | Create, Update, React |
| `deleteById` | `String id` | `void` | Delete |
| `findByTitleId` | `String titleId, Pageable` | `Page<Comment>` | GetByTitle |

### Observações
- `findByTitleIdAndParentCommentIdIsNull` e `findByParentCommentId` existem no port mas **não são usados** por nenhum use case
- Mesma entidade usada para root comments e replies — diferenciados pelo campo `parentCommentId`

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache | Evento |
|----------|-------------------|----------------|----------------|-------|--------|
| CreateCommentUseCase | CommentRepoPort, UserRepoPort | 4 | 2 | ❌ | ❌ |
| UpdateCommentUseCase | CommentRepoPort | 1 | 2 | ❌ | ❌ |
| DeleteCommentUseCase | CommentRepoPort | 1 | 2 | ❌ | ❌ |
| GetCommentsByTitleUseCase | CommentRepoPort | 2 | 0 | ❌ | ❌ |
| ReactToCommentUseCase | CommentRepoPort | 2 | 1 | ❌ | ❌ |

## Status: 🔲 Não Implementado
