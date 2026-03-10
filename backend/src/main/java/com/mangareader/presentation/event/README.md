# Plano de Testes — Presentation / Event

> Controller de eventos (`EventController`). 3 endpoints em `/api/events/`. Todos públicos (GET). DTO rico com sub-objetos (location, organizer, tickets). Mapper com VOs aninhados.

---

## 1. EventController

### Contexto
Controller REST read-only para eventos da comunidade. Todos os endpoints públicos.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `GetEventsUseCase` | Use Case | Listagem paginada |
| `GetEventByIdUseCase` | Use Case | Detalhe por UUID |
| `GetEventsByStatusUseCase` | Use Case | Filtro por status |

### Base Path
```
/api/events
```

---

### 1.1 GET /api/events

#### Input
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`
- `@RequestParam(defaultValue = "startDate") String sort`
- `@RequestParam(defaultValue = "desc") String direction`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<EventResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Eventos existem | 200 + página de `EventResponse` |
| 2 | Sem eventos | 200 + página vazia |
| 3 | Ordenação por startDate asc | `direction=asc` — próximos eventos primeiro |

#### Observações para Testes
- Default sort `"startDate"` desc — eventos mais recentes primeiro

---

### 1.2 GET /api/events/{id}

#### Input
- `@PathVariable UUID id`

#### Output
```java
// HTTP 200
ApiResponse<EventResponse>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Evento encontrado | 200 + `EventResponse` completo (location, organizer, tickets, schedule) |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Evento não encontrado | Use case → `ResourceNotFoundException` | 404 |
| 2 | ID inválido (não UUID) | `MethodArgumentTypeMismatchException` | 400 + `VALIDATION_TYPE_MISMATCH` |

---

### 1.3 GET /api/events/status/{status}

#### Input
- `@PathVariable String status`
- `@RequestParam(defaultValue = "0") int page`
- `@RequestParam(defaultValue = "20") int size`

#### Output
```java
// HTTP 200
ApiResponse<PageResponse<EventResponse>>
```

#### Fluxos Felizes
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Status com eventos | 200 + página filtrada |
| 2 | Status sem eventos | 200 + página vazia |

#### Fluxos Tristes
| # | Cenário | Causa | Resposta |
|---|---------|-------|----------|
| 1 | Status inválido | `parseStatus()` → `IllegalArgumentException` | 500 (handler genérico) [HIPÓTESE] |

#### Observações para Testes
- `parseStatus()` aceita `getValue()` (case-insensitive) ou `name()` do enum `EventStatus`
- Sort fixo `"startDate"` desc
- Status inválido → `IllegalArgumentException` **não tratada** no handler → 500

---

## 2. EventResponse (DTO)

### Estrutura
```java
@JsonInclude(NON_NULL)
record EventResponse(
    String id, String title, String subtitle, String description,
    String image, List<String> gallery, String startDate, String endDate,
    String timezone, String timeline, String status, String type,
    LocationResponse location, OrganizerResponse organizer,
    String priceLabel, int participants, int interested, boolean isFeatured,
    List<String> schedule, List<String> specialGuests,
    List<EventTicketResponse> tickets, Object socialLinks,
    List<String> relatedEventIds
)
```

### DTOs Aninhados (inner records)
```java
record LocationResponse(String label, String address, String city, boolean isOnline, String mapLink, String directions)
record OrganizerResponse(String id, String name, String avatar, String profileLink, String contact)
```

### DTO Separado
```java
record EventTicketResponse(String id, String name, String price, int available)
```

### Observações para Testes
- `LocationResponse` e `OrganizerResponse` são **inner records** de `EventResponse`
- `socialLinks` é `Object` — tipo genérico, pode ser `Map`, `List`, etc.
- `timeline` e `status` usam mapeamento: `enum.name().toLowerCase()` e `enum.getValue()` respectivamente
- `type` usa `getDisplayName()`
- `id` é `UUID.toString()`
- Datas: `startDate` e `endDate` via `ISO_LOCAL_DATE_TIME`

---

## 3. EventMapper

### Observações para Testes
- `mapLocation(null)` → `null`
- `mapOrganizer(null)` → `null`
- `mapTickets(null)` → `emptyList`
- `toResponse(null)` → `null`
- `toResponseList(null)` → `emptyList`
- `timeline` null → `null` (verificação `event.getTimeline() != null`)
- `status` null → `null` (verificação `event.getStatus() != null`)
- `type` null → `null` (verificação `event.getType() != null`)
- Data via `DateTimeFormatter.ISO_LOCAL_DATE_TIME`
- `ticket.getId().toString()` — se ticket ID null → NPE [HIPÓTESE]

---

## Status: PENDENTE
