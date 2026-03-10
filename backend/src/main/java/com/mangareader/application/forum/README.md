# Plano de Testes — Application / Forum

> Módulo de fórum da comunidade. 7 use cases + 1 port. PostgreSQL com ForumTopic + ForumReply (orphanRemoval).

---

## 1. CreateForumTopicUseCase

### Contexto
Cria um novo tópico no fórum. Requer autenticação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `save()` |
| `UserJpaRepository` | **Infra direta** | `findById()` — **quebra Clean Architecture** |

### Input
```java
record CreateTopicInput(UUID userId, String title, String content, ForumCategory category, List<String> tags)
```

### Output
```java
ForumTopic (entidade salva)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Criação com sucesso | Busca user, cria ForumTopic com author, title, content, category, tags, salva |
| 2 | Tags null | Default para `new ArrayList<>()` |
| 3 | Defaults do builder | `isPinned=false`, `isLocked=false`, `isSolved=false`, `replyCount=0`, `viewCount=0` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- **[ALERTA ARQUITETURAL]** Usa `UserJpaRepository` diretamente ao invés de `UserRepositoryPort` — violação de Clean Architecture
- `author` é a entidade User (JPA `@ManyToOne`)

### Observações para Testes
- Mock de `UserJpaRepository` (não port) — implicação: testes ficam acoplados à implementação JPA
- Verificar defaults: isPinned=false, isLocked=false, isSolved=false

---

## 2. UpdateForumTopicUseCase

### Contexto
Atualiza um tópico existente. Somente o autor pode editar. Tópicos trancados não podem ser editados.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
record UpdateTopicInput(UUID topicId, UUID userId, String title, String content, ForumCategory category, List<String> tags)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualização completa | Verifica ownership, verifica não-travado, seta campos não-null, salva |
| 2 | Atualização parcial | Apenas campos não-null são atualizados |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Tópico não encontrado | `ResourceNotFoundException("ForumTopic", "id", topicId)` | 404 |
| 2 | User não é autor | `BusinessRuleException("Você só pode editar seus próprios tópicos", 403)` | 403 |
| 3 | Tópico trancado | `BusinessRuleException("Este tópico está trancado e não pode ser editado", 400)` | 400 |

### Regras de Negócio
- **Ownership check**: `topic.getAuthor().getId().equals(userId)` — compara IDs de User
- **Lock check**: `topic.isLocked()` — tópicos trancados são totalmente imutáveis
- Ordem de validação: ownership ANTES de lock check
- Campos atualizáveis: title, content, category, tags
- `isPinned`, `isLocked`, `isSolved` **não** são atualizáveis (admin only?)

### Observações para Testes
- Testar ownership check antes de lock check
- Testar tópico locked com author correto → 400 (não 403)
- Testar atualização de `category` com enum diferente

---

## 3. DeleteForumTopicUseCase

### Contexto
Remove um tópico do fórum. Somente o autor pode remover.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findById()`, `deleteById()` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Tópico não encontrado | `ResourceNotFoundException("ForumTopic", "id", topicId)` | 404 |
| 2 | User não é autor | `BusinessRuleException("Você só pode remover seus próprios tópicos", 403)` | 403 |

### Regras de Negócio
- **Não** verifica se está trancado — autor pode deletar tópico trancado
- Deleção em cascata das replies via `orphanRemoval=true` na entidade

### Observações para Testes
- Testar que autor pode deletar tópico trancado (diferente de update)
- Verificar cascada de replies (teste de integração)

---

## 4. GetForumTopicsUseCase

### Contexto
Retorna tópicos do fórum com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findAll(pageable)` |

---

## 5. GetForumTopicByIdUseCase

### Contexto
Busca um tópico pelo ID (com replies carregadas via EAGER/cascade).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findById(id)` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Tópico não encontrado | `ResourceNotFoundException("ForumTopic", "id", id)` | 404 |

---

## 6. GetForumTopicsByCategoryUseCase

### Contexto
Filtra tópicos por categoria com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findByCategory(category, pageable)` |

### Input / Output
- **Input**: `ForumCategory category, Pageable pageable`
- **Output**: `Page<ForumTopic>`

---

## 7. CreateForumReplyUseCase

### Contexto
Cria uma resposta em um tópico. Requer autenticação. Incrementa `replyCount`.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `ForumRepositoryPort` | Port | `findById()`, `save()` |
| `UserJpaRepository` | **Infra direta** | `findById()` — mesma quebra de Clean Architecture |

### Input
```java
record CreateReplyInput(UUID topicId, UUID userId, String content)
```

### Output
```java
ForumTopic (com reply adicionado)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Reply com sucesso | Busca topic, busca user, cria ForumReply, adiciona à lista, incrementa replyCount, salva topic |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Tópico não encontrado | `ResourceNotFoundException("ForumTopic", "id", topicId)` | 404 |
| 2 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- `replyCount` incrementado **manualmente**: `topic.setReplyCount(topic.getReplyCount() + 1)`
- **Não** verifica se o tópico está trancado — pode responder tópico locked
- **[HIPÓTESE]** Deveria verificar `isLocked` antes de permitir reply?
- Retorna o `ForumTopic` inteiro (com todas replies), não apenas a reply criada
- `ForumReply` defaults: `likes=0`, `isEdited=false`, `isBestAnswer=false`

### Observações para Testes
- Verificar que `replyCount` incrementa de N para N+1
- **[HIPÓTESE-CRÍTICA]** `replyCount` pode desincronizar com `replies.size()` se manipulado externamente
- Testar reply em tópico trancado — atualmente **permitido**
- **[ALERTA]** Mesma violação de Clean Architecture: `UserJpaRepository` ao invés de `UserRepositoryPort`

---

## ForumRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | `Pageable` | `Page<ForumTopic>` | GetTopics |
| `findById` | `UUID id` | `Optional<ForumTopic>` | GetById, Update, Delete, CreateReply |
| `findByCategory` | `ForumCategory, Pageable` | `Page<ForumTopic>` | GetByCategory |
| `searchByTitle` | `String query, Pageable` | `Page<ForumTopic>` | — (não usado por UC) |
| `save` | `ForumTopic` | `ForumTopic` | Create, Update, CreateReply |
| `deleteById` | `UUID id` | `void` | Delete |

### Observações
- `searchByTitle` existe no port mas **não é usado** por nenhum use case

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Complexidade |
|----------|-------------------|----------------|----------------|-------------|
| CreateForumTopicUseCase | ForumRepoPort, UserJpaRepo | 3 | 1 | Média |
| UpdateForumTopicUseCase | ForumRepoPort | 2 | 3 | Média |
| DeleteForumTopicUseCase | ForumRepoPort | 1 | 2 | Baixa |
| GetForumTopicsUseCase | ForumRepoPort | 2 | 0 | Baixa |
| GetForumTopicByIdUseCase | ForumRepoPort | 1 | 1 | Baixa |
| GetForumTopicsByCategoryUseCase | ForumRepoPort | 2 | 0 | Baixa |
| CreateForumReplyUseCase | ForumRepoPort, UserJpaRepo | 1 | 2 | Média |

### Alertas Arquiteturais
- `CreateForumTopicUseCase` e `CreateForumReplyUseCase` usam `UserJpaRepository` diretamente — violação de Clean Architecture. Devem ser refatorados para usar `UserRepositoryPort`.

## Status: 🔲 Não Implementado
