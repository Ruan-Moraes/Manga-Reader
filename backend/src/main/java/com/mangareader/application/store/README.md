# Plano de Testes — Application / Store

> Módulo de lojas parceiras. 3 use cases + 1 port. PostgreSQL. Todos read-only.

---

## 1. GetStoresUseCase

### Contexto
Retorna todas as lojas com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `StoreRepositoryPort` | Port | `findAll(pageable)` |

### Input / Output
- **Input**: `Pageable pageable`
- **Output**: `Page<Store>`

### Observações para Testes
- Delegação direta

---

## 2. GetStoreByIdUseCase

### Contexto
Busca uma loja pelo ID.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `StoreRepositoryPort` | Port | `findById(id)` |

### Input / Output
- **Input**: `UUID id`
- **Output**: `Store`

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Loja não encontrada | `ResourceNotFoundException("Store", "id", id.toString())` | 404 |

### Regras de Negócio
- `id.toString()` na exceção — converte UUID para String

---

## 3. GetStoresByTitleIdUseCase

### Contexto
Busca lojas que disponibilizam um determinado título de mangá.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `StoreRepositoryPort` | Port | `findByTitleId(titleId)` |

### Input / Output
- **Input**: `String titleId`
- **Output**: `List<Store>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Lojas encontradas | Retorna lista de lojas que vendem o título |
| 2 | Nenhuma loja | Retorna lista vazia |

### Regras de Negócio
- Retorna `List<Store>` (não paginado) — pode ser custoso para muitas lojas
- **Cross-DB reference**: titleId vem do MongoDB, busca em StoreTitle no PostgreSQL

---

## StoreRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<Store>` | — |
| `findById` | `UUID id` | `Optional<Store>` | GetById |
| `save` | `Store` | `Store` | — |
| `deleteById` | `UUID id` | `void` | — |
| `findByTitleId` | `String titleId` | `List<Store>` | GetByTitleId |
| `findAll` | `Pageable` | `Page<Store>` | GetStores |

### Observações
- `save`, `deleteById`, `findAll()` sem page **não são usados** — módulo puramente read-only
- **[HIPÓTESE]** Lojas são criadas por admin ou importadas

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache |
|----------|-------------------|----------------|----------------|-------|
| GetStoresUseCase | StoreRepoPort | 2 | 0 | ❌ |
| GetStoreByIdUseCase | StoreRepoPort | 1 | 1 | ❌ |
| GetStoresByTitleIdUseCase | StoreRepoPort | 2 | 0 | ❌ |

## Status: 🔲 Não Implementado
