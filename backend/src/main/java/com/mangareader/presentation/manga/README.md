# Plano de Testes — Presentation / Manga (Title + Chapter)

> Dois controllers: `TitleController` (5 endpoints em `/api/titles/`) e `ChapterController` (2 endpoints em `/api/titles/{titleId}/chapters/`). Todos públicos (GET). DTOs e mapper estáticos.

---

## 1. TitleController

### Contexto
Controller REST de catálogo de títulos. Todos os endpoints são públicos e read-only.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetTitlesUseCase` | Use Case | Listagem paginada |
| `GetTitleByIdUseCase` | Use Case | Detalhe por ID (cached) |
| `SearchTitlesUseCase` | Use Case | Busca por nome (parcial) |
| `GetTitlesByGenreUseCase` | Use Case | Filtro por gênero |
| `FilterTitlesUseCase` | Use Case | Busca avançada (gêneros + sort) |

### Base Path
```
/api/titles
```

---

### 1.1 GET /api/titles

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "name") String sort`
- `@RequestParam(defaultValue = "asc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TitleResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Catálogo com títulos | 200 + página de `TitleResponse` |
| 2 | Catálogo vazio | 200 + página vazia |
| 3 | Ordenação por name desc | `sort=name&direction=desc` |
| 4 | Sem params | defaults: page=0, size=20, sort=name, direction=asc |

#### Observações para Testes
- Endpoint público — sem autenticação
- `result.map(TitleMapper::toResponse)` — mapeamento inline

---

### 1.2 GET /api/titles/{id}

#### Input
- `@PathVariable String id`

#### Output
```java
// HTTP 200
ApiResponse<TitleResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título encontrado | 200 + `TitleResponse` completo com chapters |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Título não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- Use case usa `@Cacheable` — controller não interfere
- `TitleResponse` inclui `List<ChapterResponse>` aninhado

---

### 1.3 GET /api/titles/search

#### Input
- `@RequestParam(defaultValue = "") String q`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TitleResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Query com resultados | 200 + títulos que contêm `q` no nome |
| 2 | Query vazia (`""`) | 200 + todos os títulos (ou vazio) — depende do use case [HIPÓTESE] |
| 3 | Query sem resultados | 200 + página vazia |

#### Observações para Testes
- Sort fixo em `"name"`, direction `"asc"` — não customizável pelo client
- `q` default `""` — busca com string vazia permitida

---

### 1.4 GET /api/titles/genre/{genre}

#### Input
- `@PathVariable String genre`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TitleResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Gênero com títulos | 200 + títulos que possuem o gênero |
| 2 | Gênero sem títulos | 200 + página vazia |
| 3 | Gênero inexistente | 200 + página vazia (sem exceção) [HIPÓTESE] |

#### Observações para Testes
- Sort fixo `"name"` + `"asc"`
- `genre` é String livre — sem validação no controller

---

### 1.5 GET /api/titles/filter

#### Input
- `@RequestParam(required = false) List<String> genres`
- `@RequestParam(required = false, defaultValue = "MOST_READ") String sort`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<TitleResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Filtro por gêneros | 200 + títulos que contêm todos os gêneros |
| 2 | Sem gêneros | `genres` null — use case trata como "sem filtro" [HIPÓTESE] |
| 3 | Sort MOST_READ | Ordena por popularidade |
| 4 | Sort inválido | Fallback para `MOST_READ` (try-catch no controller) |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | SortCriteria inválido | `IllegalArgumentException` capturada → default `MOST_READ` | **Sem erro** |

#### Observações para Testes
- **O controller faz try-catch** no `SortCriteria.valueOf()` — sort inválido **não gera erro**
- `SortCriteria` é um enum do domínio (`MOST_READ`, etc.)
- `genres` pode ser `null` ou lista vazia — o use case decide o comportamento
- Pageable é construído mas **o `FilterTitlesUseCase` faz paginação in-memory** — o Pageable do controller serve apenas como parâmetro

---

## 2. ChapterController

### Contexto
Sub-recurso de títulos. Todos os endpoints são públicos.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetChaptersByTitleUseCase` | Use Case | Lista todos os capítulos de um título |
| `GetChapterByNumberUseCase` | Use Case | Busca capítulo por número |

### Base Path
```
/api/titles/{titleId}/chapters
```

---

### 2.1 GET /api/titles/{titleId}/chapters

#### Input
- `@PathVariable String titleId`

#### Output
```java
// HTTP 200
ApiResponse<List<ChapterResponse>>
// NÃO é paginado — retorna lista completa
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com capítulos | 200 + `List<ChapterResponse>` |
| 2 | Título sem capítulos | 200 + lista vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Título não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- **Retorna `List` não paginada** — diferente dos outros GET que usam `PageResponse`
- Mapeamento inline: `new ChapterResponse(ch.getNumber(), ch.getTitle(), ch.getReleaseDate(), ch.getPages())`
- **Não usa `ChapterMapper`** — mapeia diretamente no controller

---

### 2.2 GET /api/titles/{titleId}/chapters/{number}

#### Input
- `@PathVariable String titleId`
- `@PathVariable String number`

#### Output
```java
// HTTP 200
ApiResponse<ChapterResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Capítulo encontrado | 200 + `ChapterResponse` |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Capítulo não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | Título não encontrado | Use case → `ResourceNotFoundException` | 404 |

#### Observações para Testes
- `number` é `String` (não int) — permite números como "1.5", "extra", etc.
- Mapeamento inline no controller (sem mapper)

---

## 3. TitleResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record TitleResponse(
    String id, String type, String cover, String name, String synopsis,
    List<String> genres, List<ChapterResponse> chapters,
    String popularity, String score, String author, String artist,
    String publisher, String createdAt, String updatedAt
)
```

### Observações para Testes
- `chapters` pode ser lista vazia (`Collections.emptyList()`) — nunca null (mapper trata)
- `genres` pode ser lista vazia — nunca null (mapper trata)
- `popularity` e `score` são `String` — não numérico

---

## 4. ChapterResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record ChapterResponse(String number, String title, String releaseDate, String pages)
```

### Observações para Testes
- Todos os campos são `String` — incluindo `pages`
- `@JsonInclude(NON_NULL)` — campos nulos omitidos

---

## 5. TitleMapper

### Métodos
| Método | Entrada | Saída |
|--------|---------|-------|
| `toResponse(Title)` | Entidade | `TitleResponse` (ou `null`) |
| `toResponseList(List<Title>)` | Lista | `List<TitleResponse>` (ou `emptyList`) |

### Observações para Testes
- Usa `DateTimeFormatter.ISO_LOCAL_DATE` (**não** `ISO_LOCAL_DATE_TIME`) — diferente dos outros mappers
- `genres` null → `Collections.emptyList()`
- `chapters` null → `Collections.emptyList()` (via `mapChapters`)
- `mapChapters` cria `ChapterResponse` inline — mesmo código que o `ChapterController`
- `toResponse(null)` → `null`

---

## Status: PENDENTE
