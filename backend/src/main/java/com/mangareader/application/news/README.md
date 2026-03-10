# Plano de Testes — Application / News

> Módulo de notícias. 4 use cases + 1 port. MongoDB. Todos read-only.

---

## 1. GetNewsUseCase

### Contexto
Retorna todas as notícias com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `NewsRepositoryPort` | Port | `findAll(pageable)` |

### Input / Output
- **Input**: `Pageable pageable`
- **Output**: `Page<NewsItem>`

### Observações para Testes
- Delegação direta

---

## 2. GetNewsByIdUseCase

### Contexto
Busca uma notícia pelo ID.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `NewsRepositoryPort` | Port | `findById(id)` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Notícia não encontrada | `ResourceNotFoundException("NewsItem", "id", id)` | 404 |

### Observações para Testes
- Sem cache — diferente de Title e Tag

---

## 3. GetNewsByCategoryUseCase

### Contexto
Filtra notícias por categoria com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `NewsRepositoryPort` | Port | `findByCategory(category, pageable)` |

### Input / Output
- **Input**: `NewsCategory category, Pageable pageable`
- **Output**: `Page<NewsItem>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Categoria com notícias | Retorna página filtrada |
| 2 | Categoria sem notícias | Retorna página vazia |

### Observações para Testes
- `NewsCategory` é enum com 9 valores: MANGA_NEWS, ANIME_NEWS, INDUSTRY, EVENTS, RELEASES, REVIEWS, INTERVIEWS, COMMUNITY, OTHER

---

## 4. SearchNewsUseCase

### Contexto
Busca notícias por texto no título.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `NewsRepositoryPort` | Port | `searchByTitle(query, pageable)` |

### Input / Output
- **Input**: `String query, Pageable pageable`
- **Output**: `Page<NewsItem>`

### Regras de Negócio
- **Não** trata query null/blank — diferente de `SearchTitlesUseCase`
- Delega diretamente ao repositório — busca depende da implementação MongoDB

### Observações para Testes
- Testar com query null → pode lançar NullPointerException dependendo do adapter

---

## NewsRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<NewsItem>` | — |
| `findById` | `String id` | `Optional<NewsItem>` | GetById |
| `findByCategory` | `NewsCategory` | `List<NewsItem>` | — |
| `searchByTitle` | `String query` | `List<NewsItem>` | — |
| `save` | `NewsItem` | `NewsItem` | — |
| `deleteById` | `String id` | `void` | — |
| `findAll` | `Pageable` | `Page<NewsItem>` | GetNews |
| `findByCategory` | `NewsCategory, Pageable` | `Page<NewsItem>` | GetByCategory |
| `searchByTitle` | `String query, Pageable` | `Page<NewsItem>` | SearchNews |

### Observações
- Métodos não-paginados e `save`/`deleteById` **não são usados** — módulo é puramente read-only
- **[HIPÓTESE]** Notícias são criadas por outra interface (admin) ou importadas

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache |
|----------|-------------------|----------------|----------------|-------|
| GetNewsUseCase | NewsRepoPort | 2 | 0 | ❌ |
| GetNewsByIdUseCase | NewsRepoPort | 1 | 1 | ❌ |
| GetNewsByCategoryUseCase | NewsRepoPort | 2 | 0 | ❌ |
| SearchNewsUseCase | NewsRepoPort | 2 | 0 | ❌ |

## Status: 🔲 Não Implementado
