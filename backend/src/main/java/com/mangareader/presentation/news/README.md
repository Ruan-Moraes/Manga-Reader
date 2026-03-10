# Plano de Testes — Presentation / News

> Controller de notícias (`NewsController`). 4 endpoints em `/api/news/`. Todos públicos (GET). DTO rico com sub-objetos (author, reactions). Mapper com VOs aninhados.

---

## 1. NewsController

### Contexto
Controller REST read-only para notícias da plataforma. Todos os endpoints públicos.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetNewsUseCase` | Use Case | Listagem paginada |
| `GetNewsByIdUseCase` | Use Case | Detalhe por ID |
| `GetNewsByCategoryUseCase` | Use Case | Filtro por categoria |
| `SearchNewsUseCase` | Use Case | Busca por título |

### Base Path
```
/api/news
```

---

### 1.1 GET /api/news

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "publishedAt") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<NewsResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Notícias existem | 200 + página de `NewsResponse` |
| 2 | Sem notícias | 200 + página vazia |
| 3 | Ordenação customizada | `sort=views&direction=desc` — mais vistas primeiro |

#### Observações para Testes
- Default sort `"publishedAt"` desc — mais recentes primeiro

---

### 1.2 GET /api/news/{id}

#### Input
- `@PathVariable String id`

#### Output
```java
// HTTP 200
ApiResponse<NewsResponse>
```

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Notícia não encontrada | Use case → `ResourceNotFoundException` | 404 |

---

### 1.3 GET /api/news/category/{category}

#### Input
- `@PathVariable String category`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<NewsResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Categoria com notícias | 200 + página filtrada |
| 2 | Categoria sem notícias | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Categoria inválida | `parseCategory()` → `IllegalArgumentException` | 500 (handler genérico) [HIPÓTESE] |

#### Observações para Testes
- `parseCategory()` aceita `displayName` (case-insensitive) ou `name()` do enum `NewsCategory`
- Sort fixo `"publishedAt"` desc
- Categoria inválida → `IllegalArgumentException` **não tratada** no handler → 500

---

### 1.4 GET /api/news/search

#### Input
- `@RequestParam String q` — **obrigatório** (sem defaultValue)
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<NewsResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Query com resultados | 200 + notícias que contêm `q` no título |
| 2 | Query sem resultados | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Param `q` ausente | `MissingServletRequestParameterException` | 400 [HIPÓTESE] |

#### Observações para Testes
- `q` obrigatório — sem default
- Sort fixo `"publishedAt"` desc

---

## 2. NewsResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record NewsResponse(
    String id, String title, String subtitle, String excerpt,
    List<String> content, String coverImage, List<String> gallery,
    String source, String sourceLogo, String category, List<String> tags,
    NewsAuthorResponse author, String publishedAt, String updatedAt,
    int readTime, int views, int commentsCount, int trendingScore,
    boolean isExclusive, boolean isFeatured, String videoUrl,
    Map<String, String> technicalSheet, NewsReactionResponse reactions
)
```

### DTOs Aninhados
```java
record NewsAuthorResponse(String id, String name, String avatar, String role, String profileLink)
record NewsReactionResponse(int like, int excited, int sad, int surprised)
```

### Observações para Testes
- `content` é `List<String>` — cada item é um parágrafo/bloco
- `category` usa `getDisplayName()` — display name, não enum name
- `reactions` nunca null — mapper retorna `new NewsReactionResponse(0, 0, 0, 0)` se reactions null
- `technicalSheet` é `Map<String, String>` — metadados formato chave-valor
- Muitos campos primitivos (`int`, `boolean`) — sempre serializados, nunca null

---

## 3. NewsMapper

### Observações para Testes
- `mapAuthor(null)` → `null`
- `mapReaction(null)` → `new NewsReactionResponse(0, 0, 0, 0)` — **never null**
- `toResponse(null)` → `null`
- `toResponseList(null)` → `emptyList`
- `category` null → `null` (sem NPE — verificação `item.getCategory() != null`)
- Data via `DateTimeFormatter.ISO_LOCAL_DATE_TIME`

---

## Status: PENDENTE
