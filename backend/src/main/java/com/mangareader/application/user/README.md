# Plano de Testes — Application / User

> Módulo de perfil de usuário. 2 use cases + 1 port. PostgreSQL com evento RabbitMQ.

---

## 1. GetUserProfileUseCase

### Contexto
Retorna o perfil público de um usuário por ID.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `findById(userId)` |

### Input / Output
- **Input**: `UUID userId`
- **Output**: `User` (entidade completa)

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- Retorna a **entidade completa** — incluindo `passwordHash` e `socialLinks`
- **[HIPÓTESE]** O passwordHash pode ser exposto se o controller não filtrar — verificar serialização

### Observações para Testes
- Idêntico ao `GetCurrentUserUseCase` — a diferença é semântica (perfil público vs autenticado)
- Nota: aqui a exceção recebe `userId` (UUID), não `userId.toString()` (diferente do GetCurrentUserUseCase)

---

## 2. UpdateUserProfileUseCase

### Contexto
Atualiza o perfil do usuário autenticado. Publica evento para denormalização nos documentos MongoDB.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `UserRepositoryPort` | Port | `findById()`, `save()` |
| `EventPublisherPort` | Port | `publish("user.profile.updated", UserProfileUpdatedEvent)` |

### Input
```java
record UpdateProfileInput(UUID userId, String name, String bio, String photoUrl, List<SocialLinkInput> socialLinks)
record SocialLinkInput(String platform, String url)
```

### Output
```java
User (entidade atualizada)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Atualização completa | Seta name, bio, photoUrl, recria socialLinks, salva, publica evento |
| 2 | Atualização parcial | Apenas campos não-null são setados |
| 3 | SocialLinks update | Limpa lista existente (`clear()`), recria com novos links. orphanRemoval deleta antigos do DB |
| 4 | SocialLinks null | Não toca nos links existentes |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |

### Regras de Negócio
- **Campos atualizáveis**: name, bio, photoUrl, socialLinks
- **Campos imutáveis** (não no input): email, role, passwordHash, createdAt
- **orphanRemoval**: `user.getSocialLinks().clear()` → JPA deleta os links antigos do DB
- **Evento**: publica `UserProfileUpdatedEvent(userId, newName, newPhotoUrl)` após save
  - Consumido por `UserDenormalizationConsumer` para atualizar userName/userPhoto nos comments e ratings (MongoDB)
- Cada `SocialLinkInput` é convertido para `UserSocialLink` com back-reference `user(user)` obrigatória

### Observações para Testes
- Testar `socialLinks = null` → lista existente permanece intocada
- Testar `socialLinks = []` (lista vazia) → clear() é chamado, todos links antigos deletados
- Testar `socialLinks = [novo1, novo2]` → clear() + add() para cada
- Verificar que `eventPublisher.publish()` recebe routing key `"user.profile.updated"`
- Verificar que `UserProfileUpdatedEvent` contém `userId.toString()`, `saved.getName()`, `saved.getPhotoUrl()`
- **[HIPÓTESE]** Se o evento falhar (RabbitMQ down), o user é atualizado mas MongoDB fica desatualizado

---

## UserRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findById` | `UUID id` | `Optional<User>` | GetProfile, UpdateProfile + muitos outros módulos |
| `findByEmail` | `String email` | `Optional<User>` | SignIn, ForgotPassword |
| `existsByEmail` | `String email` | `boolean` | SignUp |
| `save` | `User user` | `User` | SignUp, ResetPassword, UpdateProfile |
| `deleteById` | `UUID id` | `void` | — |

### Observações
- `UserRepositoryPort` é a interface mais usada do sistema — dependência de auth, rating (submit), comment (create), library (save), group (create/join)
- `deleteById` existe mas **não é usado** por nenhum use case

---

## Shared Events

### UserProfileUpdatedEvent
```java
record UserProfileUpdatedEvent(String userId, String newName, String newPhotoUrl)
```
- Publicado por `UpdateUserProfileUseCase`
- Consumido por `UserDenormalizationConsumer` na infraestrutura
- Propaga alterações de nome/foto para comments e ratings no MongoDB

### RatingEvent
```java
record RatingEvent(String titleId, String userId)
```
- Publicado por Submit/Update/Delete rating use cases
- Consumido por `RatingEventConsumer` na infraestrutura

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Evento |
|----------|-------------------|----------------|----------------|--------|
| GetUserProfileUseCase | UserRepoPort | 1 | 1 | ❌ |
| UpdateUserProfileUseCase | UserRepoPort, EventPublisher | 4 | 1 | user.profile.updated |

## Status: 🔲 Não Implementado
