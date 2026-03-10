# Plano de Testes — Application / Manga

> Módulo de títulos e capítulos. 7 use cases + 1 port. MongoDB com cache no GetTitleById.

---

## 1. GetTitlesUseCase

### Contexto
Retorna todos os títulos com paginação (listagem principal).

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findAll(pageable)` |

### Input / Output
- **Input**: `Pageable pageable`
- **Output**: `Page<Title>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Títulos existem | Retorna página paginada |
| 2 | Nenhum título | Retorna página vazia |

### Observações para Testes
- Delegação direta ao repositório — sem lógica de negócio

---

## 2. GetTitleByIdUseCase

### Contexto
Retorna um título pelo ID. Resultado cacheado.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findById(id)` |

### Input / Output
- **Input**: `String id`
- **Output**: `Title`

### Cache
```java
@Cacheable(value = CacheNames.TITLE, key = "#id")
```

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título encontrado | Retorna entidade Title cacheada |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Título não encontrado | `ResourceNotFoundException("Title", "id", id)` | 404 |

### Regras de Negócio
- Cache por ID — acessos subsequentes não vão ao MongoDB
- **Não há CacheEvict** em nenhum use case deste módulo — o cache só expira por TTL ou reinício

### Observações para Testes
- Testar que a segunda chamada com mesmo ID não invoca o repositório (teste de integração com cache)
- **[HIPÓTESE]** Se um título for atualizado externamente (import/scrape), o cache ficará stale até expirar

---

## 3. SearchTitlesUseCase

### Contexto
Busca títulos por nome (pesquisa parcial, case-insensitive). Se a query for blank, retorna todos.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `searchByName(query, pageable)`, `findAll(pageable)` |

### Input / Output
- **Input**: `String query, Pageable pageable`
- **Output**: `Page<Title>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Query válida | Faz `query.trim()` e chama `searchByName` |
| 2 | Query null | Retorna `titleRepository.findAll(pageable)` |
| 3 | Query blank (" ") | Retorna `titleRepository.findAll(pageable)` |

### Regras de Negócio
- `query.trim()` — remove espaços antes de buscar
- Null e blank caem no mesmo branch: `query == null || query.isBlank()`
- A busca no MongoDB usa TextIndex com weights: name=10, author=5, synopsis=3

### Observações para Testes
- Testar os 3 cenários: query válida, null, blank
- A implementação real do `searchByName` usa regex no MongoDB — testar na integração

---

## 4. GetTitlesByGenreUseCase

### Contexto
Filtra títulos por gênero com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findByGenresContaining(genre, pageable)` |

### Input / Output
- **Input**: `String genre, Pageable pageable`
- **Output**: `Page<Title>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Gênero com títulos | Retorna página filtrada |
| 2 | Gênero sem títulos | Retorna página vazia |

### Observações para Testes
- Delegação direta — sem lógica de negócio
- `genre` é passado como String, não enum — case-sensitive no MongoDB

---

## 5. FilterTitlesUseCase

### Contexto
Filtra títulos por múltiplos gêneros e aplica ordenação com paginação **in-memory**.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findByGenresContainingAll(genres)`, `findAll()` |

### Input / Output
- **Input**: `List<String> genres, SortCriteria sort, Pageable pageable`
- **Output**: `Page<Title>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Genres fornecidos | `findByGenresContainingAll(genres)` — filtra títulos que contêm **todos** os gêneros |
| 2 | Genres null/empty | `findAll()` — retorna todos os títulos |
| 3 | Sort MOST_READ | Ordena por `popularity` (String → Double desc) |
| 4 | Sort MOST_RATED | Ordena por `score` (String → Double desc) |
| 5 | Sort MOST_RECENT | Ordena por `createdAt` (reverso, nulls last) |
| 6 | Sort ALPHABETICAL | Ordena por `name` (case-insensitive) |
| 7 | Sort ASCENSION | Ordena por `popularity` (String → Double asc) |
| 8 | Sort RANDOM | `Collections.shuffle()` |
| 9 | Sort null | Sem ordenação |

### Regras de Negócio
- **Paginação in-memory**: carrega todos os resultados, ordena, depois aplica `subList(start, end)`
- `parseNumeric(String value)` — extrai número de strings como "1.2K" → regex `[^\\d.]`
- **[HIPÓTESE-CRÍTICA]** Paginação in-memory não escala — se houver milhares de títulos, carrega tudo em memória
- Null safety: `value == null || value.isBlank()` → retorna 0.0
- RANDOM não é determinístico — não pode ser testado por igualdade
- `createdAt` usa `Comparator.nullsLast(reverseOrder())`

### Observações para Testes
- Testar cada valor de `SortCriteria` individualmente
- Para RANDOM: testar que o resultado contém os mesmos títulos (sem perda)
- Testar `parseNumeric` com strings como "1.2K", null, "", "abc"
- Testar paginação in-memory: offset=0 size=2 de 5 resultados → retorna 2
- Testar offset > resultados → retorna lista vazia
- `parseNumeric` é private — testar indiretamente via cenários de ordenação

---

## 6. GetChaptersByTitleUseCase

### Contexto
Retorna todos os capítulos de um título.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findById(titleId)` |

### Input / Output
- **Input**: `String titleId`
- **Output**: `List<Chapter>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Título com capítulos | Retorna `title.getChapters()` |
| 2 | Título sem capítulos | Retorna lista vazia (default `@Builder.Default`) |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Título não encontrado | `ResourceNotFoundException("Title", "id", titleId)` | 404 |

### Observações para Testes
- Busca o título inteiro para retornar apenas `chapters` — sem otimização de projection

---

## 7. GetChapterByNumberUseCase

### Contexto
Retorna um capítulo específico pelo número dentro de um título.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `TitleRepositoryPort` | Port | `findById(titleId)` |

### Input / Output
- **Input**: `String titleId, String chapterNumber`
- **Output**: `Chapter`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Capítulo encontrado | Filtra `title.getChapters()` por `ch.getNumber().equals(chapterNumber)` |

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Título não encontrado | `ResourceNotFoundException("Title", "id", titleId)` | 404 |
| 2 | Capítulo não encontrado | `ResourceNotFoundException("Chapter", "number", chapterNumber)` | 404 |

### Regras de Negócio
- `chapterNumber` é `String` — comparação case-sensitive com `equals()`
- Busca sequencial em `stream()` — não usa index

### Observações para Testes
- Testar com chapter number "1", "1.5", "Extra"
- Testar título existente mas sem o capítulo

---

## TitleRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<Title>` | FilterTitles (sem genres) |
| `findById` | `String id` | `Optional<Title>` | GetTitleById, GetChapters*, GetChapterByNumber |
| `findByGenresContaining` | `String genre` | `List<Title>` | — |
| `searchByName` | `String query` | `List<Title>` | — |
| `findByGenresContainingAll` | `List<String> genres` | `List<Title>` | FilterTitles (com genres) |
| `save` | `Title title` | `Title` | — (nenhum UC de escrita) |
| `deleteById` | `String id` | `void` | — |
| `findAll` | `Pageable` | `Page<Title>` | GetTitles, SearchTitles (query vazia) |
| `findByGenresContaining` | `String genre, Pageable` | `Page<Title>` | GetTitlesByGenre |
| `searchByName` | `String query, Pageable` | `Page<Title>` | SearchTitles |
| `findByGenresContainingAll` | `List<String> genres, Pageable` | `Page<Title>` | — |

### Observações
- `save` e `deleteById` existem no port mas **não são usados** em nenhum use case — módulo é read-only
- `findByGenresContainingAll(List, Pageable)` paginado existe mas **não é usado** — FilterTitles usa a versão sem Pageable + paginação in-memory

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache | Complexidade |
|----------|-------------------|----------------|----------------|-------|-------------|
| GetTitlesUseCase | TitleRepoPort | 2 | 0 | ❌ | Baixa |
| GetTitleByIdUseCase | TitleRepoPort | 1 | 1 | Cacheable | Baixa |
| SearchTitlesUseCase | TitleRepoPort | 3 | 0 | ❌ | Baixa |
| GetTitlesByGenreUseCase | TitleRepoPort | 2 | 0 | ❌ | Baixa |
| FilterTitlesUseCase | TitleRepoPort | 9 | 0 | ❌ | **Alta** |
| GetChaptersByTitleUseCase | TitleRepoPort | 2 | 1 | ❌ | Baixa |
| GetChapterByNumberUseCase | TitleRepoPort | 1 | 2 | ❌ | Baixa |

## Status: 🔲 Não Implementado
