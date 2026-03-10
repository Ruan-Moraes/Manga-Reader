# Plano de Testes — Application / Event

> Módulo de eventos da comunidade. 3 use cases + 1 port. PostgreSQL. Todos read-only.

---

## 1. GetEventsUseCase

### Contexto
Retorna todos os eventos com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `EventRepositoryPort` | Port | `findAll(pageable)` |

### Input / Output
- **Input**: `Pageable pageable`
- **Output**: `Page<Event>`

### Observações para Testes
- Delegação direta

---

## 2. GetEventByIdUseCase

### Contexto
Busca um evento pelo ID.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `EventRepositoryPort` | Port | `findById(id)` |

### Input / Output
- **Input**: `UUID id`
- **Output**: `Event`

### Fluxos Tristes
| # | Cenário | Exceção | Código |
|---|---------|---------|--------|
| 1 | Evento não encontrado | `ResourceNotFoundException("Event", "id", id)` | 404 |

---

## 3. GetEventsByStatusUseCase

### Contexto
Filtra eventos por status com paginação.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `EventRepositoryPort` | Port | `findByStatus(status, pageable)` |

### Input / Output
- **Input**: `EventStatus status, Pageable pageable`
- **Output**: `Page<Event>`

### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Status com eventos | Retorna página filtrada |
| 2 | Status sem eventos | Retorna página vazia |

### Observações para Testes
- `EventStatus` tem 4 valores, cada um com `getValue()`: SCHEDULED, ONGOING, COMPLETED, CANCELLED

---

## EventRepositoryPort (Interface)

### Métodos
| Método | Parâmetros | Retorno | Usado por |
|--------|-----------|---------|-----------|
| `findAll` | — | `List<Event>` | — |
| `findById` | `UUID id` | `Optional<Event>` | GetById |
| `findByStatus` | `EventStatus` | `List<Event>` | — |
| `save` | `Event` | `Event` | — |
| `deleteById` | `UUID id` | `void` | — |
| `findAll` | `Pageable` | `Page<Event>` | GetEvents |
| `findByStatus` | `EventStatus, Pageable` | `Page<Event>` | GetByStatus |

### Observações
- `save`, `deleteById`, `findAll()` e `findByStatus()` sem page **não são usados** — módulo puramente read-only
- **[HIPÓTESE]** Eventos são criados por admin ou outro fluxo não implementado

---

## Matriz de Cobertura

| Use Case | Mocks Necessários | Fluxos Felizes | Fluxos Tristes | Cache |
|----------|-------------------|----------------|----------------|-------|
| GetEventsUseCase | EventRepoPort | 2 | 0 | ❌ |
| GetEventByIdUseCase | EventRepoPort | 1 | 1 | ❌ |
| GetEventsByStatusUseCase | EventRepoPort | 2 | 0 | ❌ |

## Status: 🔲 Não Implementado
