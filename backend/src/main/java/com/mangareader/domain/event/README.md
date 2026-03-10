# Plano de Testes — Domain: Event

## Contexto

Módulo de eventos da plataforma. É o módulo de domínio mais complexo, com a entidade principal `Event` (PostgreSQL) contendo múltiplos VOs embedded, listas JSONB e entidades auxiliares. Inclui `EventTicket` (ingressos), `EventParticipant` (participantes) e 5 value objects: `EventLocation`, `EventOrganizer`, `EventStatus`, `EventTimeline`, `EventType`.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Event` | Entity | PostgreSQL (`events`) |
| `EventTicket` | Entity | PostgreSQL (`event_tickets`) |
| `EventParticipant` | Entity | PostgreSQL (`event_participants`) |
| `EventLocation` | VO (@Embeddable) | Embedded em Event |
| `EventOrganizer` | VO (@Embeddable) | Embedded em Event |
| `EventStatus` | Enum (VO) | — |
| `EventTimeline` | Enum (VO) | — |
| `EventType` | Enum (VO) | — |

---

## Entradas

### Event (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `title` | String | Sim | — | max 200, not null |
| `subtitle` | String | Não | null | max 500 |
| `description` | String | Não | null | max 5000 |
| `image` | String | Não | null | — |
| `gallery` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `startDate` | LocalDateTime | Sim | — | not null |
| `endDate` | LocalDateTime | Sim | — | not null |
| `timezone` | String | Não | null | max 50 |
| `timeline` | EventTimeline | Sim | — | not null, STRING enum |
| `status` | EventStatus | Sim | — | not null, STRING enum |
| `type` | EventType | Sim | — | not null, STRING enum |
| `location` | EventLocation | Não | null | `@Embedded` |
| `organizer` | EventOrganizer | Não | null | `@Embedded` |
| `priceLabel` | String | Não | null | max 100 |
| `participants` | int | Não | `0` | `@Builder.Default` |
| `interested` | int | Não | `0` | `@Builder.Default` |
| `isFeatured` | boolean | Não | `false` | `@Builder.Default` |
| `schedule` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `specialGuests` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `tickets` | List\<EventTicket\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval |
| `socialLinks` | Object | Não | null | jsonb |
| `relatedEventIds` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `createdAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | updatable=false |
| `updatedAt` | LocalDateTime | Não (auto) | `@UpdateTimestamp` | — |

### EventTicket (Builder)

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|:-----------:|------------|
| `id` | UUID | Não (auto) | PK |
| `event` | Event | Sim | FK, not null, LAZY |
| `name` | String | Sim | max 100, not null |
| `price` | String | Sim | max 50, not null |
| `available` | int | Não | default 0 |

### EventParticipant (Builder)

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|:-----------:|------------|
| `id` | UUID | Não (auto) | PK |
| `event` | Event | Sim | FK, not null, LAZY |
| `user` | User | Sim | FK, not null, LAZY |
| `joinedAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` |

**Unique Constraint**: `(event_id, user_id)` — um participante por evento.

### EventLocation (@Embeddable)

| Campo | Tipo |
|-------|------|
| `label` | String |
| `address` | String |
| `city` | String |
| `isOnline` | boolean |
| `mapLink` | String |
| `directions` | String |

### EventOrganizer (@Embeddable)

| Campo | Tipo |
|-------|------|
| `organizerId` | String |
| `organizerName` | String |
| `organizerAvatar` | String |
| `organizerProfileLink` | String |
| `organizerContact` | String |

### Enums

| Enum | Valores |
|------|---------|
| `EventStatus` | `HAPPENING_NOW` ("happening_now"), `REGISTRATIONS_OPEN` ("registrations_open"), `COMING_SOON` ("coming_soon"), `ENDED` ("ended") |
| `EventTimeline` | `UPCOMING`, `ONGOING`, `PAST` |
| `EventType` | `CONVENCAO` ("Convenção"), `LANCAMENTO` ("Lançamento"), `LIVE` ("Live"), `WORKSHOP` ("Workshop"), `MEETUP` ("Meetup") |

**EventStatus**: tem método `getValue()` retornando string snake_case.
**EventType**: tem método `getDisplayName()` retornando label pt-BR.

---

## Saídas

- `Event` com defaults: gallery=[], participants=0, interested=0, isFeatured=false, schedule=[], specialGuests=[], tickets=[], relatedEventIds=[]
- VOs embedded com todos os campos nullable

---

## Fluxos felizes

### Event

1. **Builder com campos obrigatórios** — title, startDate, endDate, timeline, status, type + defaults aplicados
2. **Builder completo** — todos os campos preenchidos incluindo VOs embedded
3. **Construtor vazio** — instância válida para JPA
4. **Defaults** — listas vazias, counters 0, isFeatured false
5. **VOs embedded** — location e organizer instanciados via builder
6. **Tickets orphanRemoval** — remoção da lista deleta do banco
7. **JSONB lists** — gallery, schedule, specialGuests, relatedEventIds como JSONB

### EventTicket

8. **Builder com event, name, price** — cria ticket válido
9. **Price como String** — permite valores formatados como "R$ 50,00" ou "Gratuito"

### EventParticipant

10. **Builder com event, user** — cria participante com joinedAt automático
11. **Unique constraint (event + user)** — impede duplicatas

### EventLocation

12. **Builder com todos os campos** — location completa
13. **isOnline** — diferencia evento presencial de virtual

### EventOrganizer

14. **Builder com todos os campos** — organizer completo

### Enums

15. **EventStatus.getValue()** — retorna string snake_case correta para cada valor
16. **EventType.getDisplayName()** — retorna label pt-BR correto
17. **EventTimeline** — todos os 3 valores existem

---

## Fluxos tristes

1. **Event sem title** — not null → exceção
2. **Event sem startDate** — not null → exceção
3. **Event sem endDate** — not null → exceção
4. **Event sem timeline** — not null → exceção
5. **Event sem status** — not null → exceção
6. **Event sem type** — not null → exceção
7. **startDate posterior a endDate** — sem validação na entidade (aceita datas inválidas)
8. **Title excedendo 200 chars** — length constraint → exceção
9. **Description excedendo 5000 chars** — length constraint → exceção
10. **EventTicket sem event** — FK not null → exceção
11. **EventTicket sem name** — not null → exceção
12. **EventTicket sem price** — not null → exceção
13. **EventParticipant duplicado** — unique constraint → exceção
14. **Counters negativos** — participants, interested sem validação

---

## Regras de negócio e validações

- **Entidade mais complexa do sistema**: 25+ campos, 5 VOs, 3 enums, 2 entidades auxiliares
- **startDate/endDate**: sem validação de startDate < endDate na entidade
- **Price como String**: permite formato livre (não numérico)
- **socialLinks como Object**: tipo genérico — pode ser Map ou qualquer estrutura serializável
- **JSONB**: 5 campos usam JSONB (gallery, schedule, specialGuests, socialLinks, relatedEventIds)
- **Sem validação Bean Validation** na entidade

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@Embedded`, `@Embeddable`, `@OneToMany`, `@ManyToOne`, `@UniqueConstraint`
- Hibernate: `@CreationTimestamp`, `@UpdateTimestamp`, `@JdbcTypeCode(SqlTypes.JSON)`
- Lombok: `@Builder`, `@Builder.Default`

---

## Observações para implementação dos testes

- **Entidade mais complexa**: priorizar cobertura ampla dos defaults e VOs
- **VOs (@Embeddable)**: testar builder e todos os campos — dados podem ser parcialmente null
- **Enums especiais**: EventStatus.getValue() e EventType.getDisplayName() precisam de testes dedicados
- **JSONB**: requer teste de integração para validar serialização
- **Hipótese a validar**: se EventLocation.isOnline funciona corretamente como boolean em @Embeddable
- **Hipótese a validar**: comportamento de socialLinks como Object com JSONB
- **Lacuna**: sem validação de datas (startDate < endDate)
- **Lacuna**: price como String — sem tipo numérico para cálculos

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Event (builder, defaults, embedded VOs), EventTicket (builder), EventParticipant (unique), EventLocation (builder), EventOrganizer (builder), Enums (valores, getValue, getDisplayName)
