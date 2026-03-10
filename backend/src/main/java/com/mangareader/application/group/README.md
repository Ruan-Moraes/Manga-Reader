# Plano de Testes — Application / Group

> Módulo de grupos de tradução. 10 use cases + 1 port. PostgreSQL. O módulo mais complexo em lógica de negócio.

---

## 1. CreateGroupUseCase

### Contexto
Cria um novo grupo de tradução. O criador se torna líder automaticamente.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `existsByUsername()`, `save()` |
| `UserRepositoryPort` | Port | `findById()` |

### Input
```java
record CreateGroupInput(UUID userId, String name, String username, String description, String logo, String banner, String website, Integer foundedYear)
```

### Output
```java
Group (entidade salva com membro líder)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Criação com sucesso | Verifica username único, busca user, cria Group + GroupMember (LIDER), salva |
| 2 | Creator vira líder | GroupMember criado com `role=LIDER`, `user=creator` |
| 3 | Status default | `status=ACTIVE` setado no builder |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Username já existe | `DuplicateResourceException("Group", "username", username)` | 409 |
| 2 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- `username` é unique — validado no use case (não apenas no DB)
- O criador é automaticamente adicionado como `LIDER`
- `group.getMembers()` é acessado antes do save (Lombok auto-inicializa ArrayList)

### Observações para Testes
- Verificar que o grupo salvo contém exatamente 1 membro com role LIDER
- Testar que `status` é ACTIVE independente do input

---

## 2. GetGroupByIdUseCase

### Contexto
Retorna um grupo pelo ID.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", id)` | 404 |

---

## 3. GetGroupByUsernameUseCase

### Contexto
Retorna um grupo pelo username (slug).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findByUsername()` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Username não encontrado | `ResourceNotFoundException("Group", "username", username)` | 404 |

---

## 4. GetGroupsUseCase

### Contexto
Retorna todos os grupos com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findAll(pageable)` |

---

## 5. GetGroupsByTitleIdUseCase

### Contexto
Busca grupos que traduzem um determinado título (titleId do MongoDB).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findByTitleId(titleId)` |

### Input / Output
- **Input**: `String titleId`
- **Output**: `List<Group>`

### Regras de Negócio
- Retorna lista — pode ser vazia se nenhum grupo traduz o título
- **Cross-DB reference**: titleId vem do MongoDB, varre GroupWork.titleId no PostgreSQL

---

## 6. JoinGroupUseCase

### Contexto
Adiciona um membro a um grupo existente.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()`, `save()` |
| `UserRepositoryPort` | Port | `findById()` |

### Input
```java
record JoinGroupInput(UUID groupId, UUID userId, GroupRole role)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Join com sucesso | Busca grupo, busca user, cria GroupMember, adiciona à lista, salva |
| 2 | Role null | Default para `GroupRole.TRADUTOR` |
| 3 | Role informado | Usa o role fornecido |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", groupId)` | 404 |
| 2 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |
| 3 | Já é membro | `BusinessRuleException("Usuário já é membro deste grupo.", 409)` | 409 |

### Regras de Negócio
- Verifica membership via `stream().anyMatch(m -> m.getUser().getId().equals(userId))`
- Default role: `TRADUTOR` se null
- **Não** verifica se o grupo está ACTIVE — pode entrar em grupo SUSPENDED/INACTIVE

### Observações para Testes
- Testar com `role = null` → TRADUTOR
- Testar com `role = EDITOR` → EDITOR
- Testar membership duplicada com mock de grupo que já tem o user como membro

---

## 7. LeaveGroupUseCase

### Contexto
Remove o usuário autenticado de um grupo. Líder não pode sair sem transferir liderança.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
UUID groupId, UUID userId
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Membro sai com sucesso | Encontra member, verifica que NÃO é líder, remove da lista, salva |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", groupId)` | 404 |
| 2 | Não é membro | `BusinessRuleException("Você não é membro deste grupo", 400)` | 400 |
| 3 | É líder | `BusinessRuleException("O líder não pode sair do grupo. Transfira a liderança antes.", 400)` | 400 |

### Regras de Negócio
- O **líder nunca pode sair** — deve transferir liderança primeiro
- Busca member via `stream().filter().findFirst()`
- `group.getMembers().remove(member)` — depende de `equals` funcionar corretamente

### Observações para Testes
- Testar com user que é LIDER → deve lançar exceção
- Testar com user que é TRADUTOR → deve remover com sucesso
- **[HIPÓTESE]** `remove()` depende de `equals/hashCode` do `GroupMember` — se não implementado, pode falhar silenciosamente

---

## 8. UpdateGroupUseCase

### Contexto
Atualiza informações de um grupo. Somente o líder pode editar.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
record UpdateGroupInput(UUID groupId, UUID userId, String name, String description, String logo, String banner, String website)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualização completa | Verifica leadership, seta todos os campos não-null, salva |
| 2 | Atualização parcial | Apenas campos não-null são setados |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", groupId)` | 404 |
| 2 | User não é líder | `BusinessRuleException("Somente o líder pode editar o grupo", 403)` | 403 |

### Regras de Negócio
- **Leadership check**: `stream().anyMatch(m -> m.getUser().getId().equals(userId) && m.getRole() == GroupRole.LIDER)`
- Campos atualizáveis: name, description, logo, banner, website
- `username` **não é atualizável** — não aparece no input
- `foundedYear`, `status`, `genres`, `focusTags` também **não** são atualizáveis por este UC

### Observações para Testes
- Testar atualização parcial: apenas `name` → demais permanecem
- Testar com user que é membro mas não líder → 403

---

## 9. AddWorkToGroupUseCase

### Contexto
Adiciona uma obra (título) ao portfólio de trabalhos traduzidos do grupo. Qualquer membro pode adicionar.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
record AddWorkInput(UUID groupId, UUID userId, String titleId, String title, String cover, int chapters, String status, List<String> genres)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Adição com sucesso | Verifica membership, verifica duplicata, cria GroupWork, adiciona à lista, incrementa `totalTitles`, salva |
| 2 | Status null | Default para `GroupWorkStatus.ONGOING` |
| 3 | Status inválido | Default para `GroupWorkStatus.ONGOING` (catch IllegalArgumentException) |
| 4 | Genres null | Default para `List.of()` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", groupId)` | 404 |
| 2 | Não é membro | `BusinessRuleException("Você precisa ser membro do grupo para adicionar obras", 403)` | 403 |
| 3 | Título já no portfólio | `BusinessRuleException("Este título já está no portfólio do grupo", 409)` | 409 |

### Regras de Negócio
- **Qualquer membro** pode adicionar (não apenas líder)
- Duplicata verificada por `titleId` via stream
- `status` é parseado de String para enum via `valueOf(status.toUpperCase())`
- `totalTitles` incrementado manualmente: `group.setTotalTitles(group.getTotalTitles() + 1)`
- **[HIPÓTESE]** `totalTitles` pode desincronizar com `translatedWorks.size()` se manipulado externamente

### Observações para Testes
- Testar parse de status: "ongoing" → ONGOING, "xyz" → ONGOING (fallback), null → ONGOING
- Testar que `totalTitles` incrementa
- Testar duplicata de titleId

---

## 10. RemoveWorkFromGroupUseCase

### Contexto
Remove uma obra do portfólio. Somente o líder pode remover.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GroupRepositoryPort` | Port | `findById()`, `save()` |

### Input
```java
UUID groupId, UUID userId, String titleId
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Remoção com sucesso | Verifica leadership, encontra work por titleId, remove da lista, decrementa `totalTitles` (min 0), salva |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Grupo não encontrado | `ResourceNotFoundException("Group", "id", groupId)` | 404 |
| 2 | User não é líder | `BusinessRuleException("Somente o líder pode remover obras do grupo", 403)` | 403 |
| 3 | Work não encontrado | `ResourceNotFoundException("GroupWork", "titleId", titleId)` | 404 |

### Regras de Negócio
- **Somente líder** pode remover (diferente de AddWork que aceita qualquer membro)
- `Math.max(0, getTotalTitles() - 1)` — protege contra negativo
- Busca work via `stream().filter(w -> w.getTitleId().equals(titleId))`

### Observações para Testes
- Testar com membro não-líder → 403
- Testar remoção que levaria totalTitles a -1 → fica 0
- **[HIPÓTESE]** `remove(work)` depende de `equals/hashCode` do `GroupWork`

---

## GroupRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<Group>` | — |
| `findById` | `UUID id` | `Optional<Group>` | GetById, Join, Leave, Update, AddWork, RemoveWork |
| `findByUsername` | `String username` | `Optional<Group>` | GetByUsername |
| `existsByUsername` | `String username` | `boolean` | Create |
| `save` | `Group group` | `Group` | Create, Join, Leave, Update, AddWork, RemoveWork |
| `deleteById` | `UUID id` | `void` | — |
| `findByTitleId` | `String titleId` | `List<Group>` | GetByTitleId |
| `findAll` | `Pageable` | `Page<Group>` | GetGroups |

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Complexidade |
|----------|-------------------|----------------|----------------|-------------|
| CreateGroupUseCase | GroupRepoPort, UserRepoPort | 3 | 2 | Média |
| GetGroupByIdUseCase | GroupRepoPort | 1 | 1 | Baixa |
| GetGroupByUsernameUseCase | GroupRepoPort | 1 | 1 | Baixa |
| GetGroupsUseCase | GroupRepoPort | 2 | 0 | Baixa |
| GetGroupsByTitleIdUseCase | GroupRepoPort | 2 | 0 | Baixa |
| JoinGroupUseCase | GroupRepoPort, UserRepoPort | 3 | 3 | Média |
| LeaveGroupUseCase | GroupRepoPort | 1 | 3 | Média |
| UpdateGroupUseCase | GroupRepoPort | 2 | 2 | Média |
| AddWorkToGroupUseCase | GroupRepoPort | 4 | 3 | **Alta** |
| RemoveWorkFromGroupUseCase | GroupRepoPort | 1 | 3 | Média |

## Status: 🔲 Não Implementado
