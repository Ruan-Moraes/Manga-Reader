# Plano de Testes — Application / Library

> Módulo de biblioteca pessoal do usuário. 4 use cases + 1 port. PostgreSQL com referência cross-DB ao MongoDB.

---

## 1. SaveToLibraryUseCase

### Contexto
Salva um título na biblioteca do usuário. Captura metadados do título (denormalização cross-DB).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `LibraryRepositoryPort` | Port | `findByUserIdAndTitleId()`, `save()` |
| `UserRepositoryPort` | Port | `findById()` |
| `TitleRepositoryPort` | Port | `findById()` — busca no MongoDB |

### Input
```java
record SaveToLibraryInput(UUID userId, String titleId, ReadingListType list)
```

### Output
```java
SavedManga (entidade salva)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Salvar com sucesso | Verifica unicidade, busca user, busca title (MongoDB), cria SavedManga com metadados, salva |
| 2 | Denormalização de title | Copia `title.getName()`, `title.getCover()`, `title.getType()` para a entidade SavedManga |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Título já salvo | `DuplicateResourceException("SavedManga", "titleId", titleId)` | 409 |
| 2 | User não encontrado | `ResourceNotFoundException("User", "id", userId)` | 404 |
| 3 | Title não encontrado (MongoDB) | `ResourceNotFoundException("Title", "id", titleId)` | 404 |

### Regras de Negócio
- **Unicidade**: `findByUserIdAndTitleId()` → se presente, lança `DuplicateResourceException`
- **Cross-DB**: busca User no PostgreSQL e Title no MongoDB na mesma operação
- `SavedManga.user` é a associação JPA (`@ManyToOne`), não apenas o ID
- `list` é obrigatório — vem do input como `ReadingListType` enum (LENDO, QUERO_LER, CONCLUIDO)

### Observações para Testes
- Mock de 3 repositórios necessários
- Testar cenário de duplicata: mock `findByUserIdAndTitleId` retorna `Optional.of(existing)` → lambda chama `ifPresent`
- Verificar que a denormalização copia `name`, `cover`, `type` do Title
- **[HIPÓTESE]** Se title for atualizado no MongoDB, SavedManga fica desatualizado

---

## 2. GetUserLibraryUseCase

### Contexto
Retorna todos os mangás salvos na biblioteca do usuário com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `LibraryRepositoryPort` | Port | `findByUserId(userId, pageable)` |

### Input / Output
- **Input**: `UUID userId, Pageable pageable`
- **Output**: `Page<SavedManga>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | User tem mangás salvos | Retorna página |
| 2 | Biblioteca vazia | Retorna página vazia |

### Observações para Testes
- Delegação direta — sem lógica

---

## 3. RemoveFromLibraryUseCase

### Contexto
Remove um título da biblioteca do usuário.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `LibraryRepositoryPort` | Port | `deleteByUserIdAndTitleId()` |

### Input
```java
UUID userId, String titleId
```

### Output
```java
void
```

### Regras de Negócio
- Anotado com `@Transactional`
- **Não** verifica se o registro existe antes de deletar — operação silenciosa
- **Não** verifica se o user é dono — userId vem implicitamente do contexto de autenticação

### Observações para Testes
- Verificar que `deleteByUserIdAndTitleId` é chamado com os parâmetros corretos
- Testar cenário de titleId inexistente — não lança exceção
- Verificar que o `@Transactional` está presente (teste de integração)

---

## 4. ChangeReadingListUseCase

### Contexto
Altera a lista de leitura de um mangá salvo (ex: LENDO → CONCLUIDO).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `LibraryRepositoryPort` | Port | `findByUserIdAndTitleId()`, `save()` |

### Input
```java
record ChangeListInput(UUID userId, String titleId, ReadingListType newList)
```

### Output
```java
SavedManga (atualizado)
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Mudança com sucesso | Busca SavedManga, seta `list = newList`, salva |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | SavedManga não encontrado | `ResourceNotFoundException("SavedManga", "titleId", titleId)` | 404 |

### Regras de Negócio
- Busca por `(userId, titleId)` — ownership implícita pelo userId
- Apenas o campo `list` é alterado — demais campos permanecem

### Observações para Testes
- Testar transição entre todos os 3 estados: LENDO → QUERO_LER, QUERO_LER → CONCLUIDO, etc.
- Verificar que os demais campos não são alterados

---

## LibraryRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findByUserId` | `UUID userId` | `List<SavedManga>` | — |
| `findByUserIdAndList` | `UUID userId, ReadingListType list` | `List<SavedManga>` | — |
| `findByUserIdAndTitleId` | `UUID userId, String titleId` | `Optional<SavedManga>` | Save, ChangeList |
| `save` | `SavedManga` | `SavedManga` | Save, ChangeList |
| `deleteByUserIdAndTitleId` | `UUID userId, String titleId` | `void` | Remove |
| `findByUserId` | `UUID userId, Pageable` | `Page<SavedManga>` | GetUserLibrary |

### Observações
- `findByUserId(UUID)` sem Pageable e `findByUserIdAndList()` existem no port mas **não são usados** por use cases
- `deleteByUserIdAndTitleId` opera sem verificar existência

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Transactional |
|----------|-------------------|----------------|----------------|---------------|
| SaveToLibraryUseCase | LibraryRepoPort, UserRepoPort, TitleRepoPort | 2 | 3 | ❌ |
| GetUserLibraryUseCase | LibraryRepoPort | 2 | 0 | ❌ |
| RemoveFromLibraryUseCase | LibraryRepoPort | 1 | 0 | ✅ |
| ChangeReadingListUseCase | LibraryRepoPort | 1 | 1 | ❌ |

## Status: 🔲 Não Implementado
