# Plano de Testes — Application / Category

> Módulo de tags/categorias. 3 use cases + 1 port. PostgreSQL com cache no GetTagById.

---

## 1. GetTagsUseCase

### Contexto
Retorna todas as tags com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TagRepositoryPort` | Port | `findAll(pageable)` |

### Input / Output
- **Input**: `Pageable pageable`
- **Output**: `Page<Tag>`

### Observações para Testes
- Delegação direta ao repositório

---

## 2. GetTagByIdUseCase

### Contexto
Busca uma tag pelo ID. Resultado cacheado.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TagRepositoryPort` | Port | `findById(id)` |

### Input / Output
- **Input**: `Long id`
- **Output**: `Tag`

### Cache
```java
@Cacheable(value = CacheNames.TAG, key = "#id")
```

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Tag não encontrada | `ResourceNotFoundException("Tag", "id", id.toString())` | 404 |

### Regras de Negócio
- Cache por ID — acessos subsequentes não vão ao PostgreSQL
- **Não há CacheEvict** em nenhum use case deste módulo — cache expira por TTL ou reinício
- `id.toString()` na exceção — converte Long para String

### Observações para Testes
- Testar cache hit no segundo acesso
- **[HIPÓTESE]** Se tags forem editadas via admin/SQL, o cache ficará stale

---

## 3. SearchTagsUseCase

### Contexto
Busca tags cujo label contenha a query informada (case-insensitive).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TagRepositoryPort` | Port | `findByLabelContainingIgnoreCase(query, pageable)` |

### Input / Output
- **Input**: `String query, Pageable pageable`
- **Output**: `Page<Tag>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Query com resultados | Retorna tags cujo label contém a query |
| 2 | Query sem resultados | Retorna página vazia |

### Regras de Negócio
- Case-insensitive — delegado ao `ILIKE` do PostgreSQL via Spring Data
- **Não** trata query null/blank — pode lançar exceção dependendo da implementação do adapter

### Observações para Testes
- Testar com query null → verificar se lança exceção ou retorna tudo
- Testar com query parcial: "ação" → deveria encontrar "Ação", "ação", "Ficção Científica"?

---

## TagRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<Tag>` | — |
| `findById` | `Long id` | `Optional<Tag>` | GetTagById |
| `findByLabelContainingIgnoreCase` | `String query` | `List<Tag>` | — |
| `save` | `Tag tag` | `Tag` | — |
| `deleteById` | `Long id` | `void` | — |
| `findAll` | `Pageable` | `Page<Tag>` | GetTags |
| `findByLabelContainingIgnoreCase` | `String query, Pageable` | `Page<Tag>` | SearchTags |

### Observações
- `save`, `deleteById`, `findAll()` sem page e `findByLabelContainingIgnoreCase()` sem page **não são usados** por nenhum UC
- Módulo é read-only no contexto dos use cases

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache |
|----------|-------------------|----------------|----------------|-------|
| GetTagsUseCase | TagRepoPort | 2 | 0 | ❌ |
| GetTagByIdUseCase | TagRepoPort | 1 | 1 | Cacheable |
| SearchTagsUseCase | TagRepoPort | 2 | 0 | ❌ |

## Status: 🔲 Não Implementado
