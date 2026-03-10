# Plano de Testes — Domain: Forum

## Contexto

Módulo de fórum da comunidade. Contém a entidade `ForumTopic` (tópico principal com flags de moderação), `ForumReply` (resposta a um tópico) e o enum `ForumCategory` com display names em pt-BR. Suporta categorias, tags, lock de tópicos e marcação de melhor resposta.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `ForumTopic` | Entity | PostgreSQL (`forum_topics`) |
| `ForumReply` | Entity | PostgreSQL (`forum_replies`) |
| `ForumCategory` | Enum (VO) | — |

---

## Entradas

### ForumTopic (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `author` | User | Sim | — | FK, not null, LAZY |
| `title` | String | Sim | — | max 300, not null |
| `content` | String | Sim | — | TEXT, not null |
| `category` | ForumCategory | Sim | — | not null, STRING enum |
| `tags` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `viewCount` | int | Não | `0` | `@Builder.Default` |
| `replyCount` | int | Não | `0` | `@Builder.Default` |
| `likeCount` | int | Não | `0` | `@Builder.Default` |
| `isPinned` | boolean | Não | `false` | `@Builder.Default` |
| `isLocked` | boolean | Não | `false` | `@Builder.Default` |
| `isSolved` | boolean | Não | `false` | `@Builder.Default` |
| `replies` | List\<ForumReply\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval |
| `createdAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | updatable=false |
| `lastActivityAt` | LocalDateTime | Não (auto) | `@UpdateTimestamp` | — |

### ForumReply (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | PK |
| `topic` | ForumTopic | Sim | — | FK, not null, LAZY |
| `author` | User | Sim | — | FK, not null, LAZY |
| `content` | String | Sim | — | TEXT, not null |
| `likes` | int | Não | `0` | `@Builder.Default` |
| `isEdited` | boolean | Não | `false` | `@Builder.Default` |
| `isBestAnswer` | boolean | Não | `false` | `@Builder.Default` |
| `createdAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | updatable=false |

### ForumCategory (Enum)

Valores com display names — verificar no código fonte para lista completa. Exemplo esperado: GERAL, DUVIDAS, BUG_REPORT, SUGESTOES, OFF_TOPIC, etc.

---

## Saídas

- `ForumTopic` com defaults: viewCount=0, replyCount=0, likeCount=0, isPinned=false, isLocked=false, isSolved=false
- `ForumReply` com defaults: likes=0, isEdited=false, isBestAnswer=false

---

## Fluxos felizes

### ForumTopic

1. **Builder com author, title, content, category** — cria tópico com todos os defaults
2. **Builder com tags** — lista de tags jsonb
3. **Defaults** — viewCount=0, replyCount=0, likeCount=0, todas as flags false
4. **Construtor vazio** — instância válida para JPA
5. **OrphanRemoval** — remover reply da lista deleta do banco
6. **Timestamps** — createdAt imutável, lastActivityAt atualizado

### ForumReply

7. **Builder com topic, author, content** — cria reply com likes=0, isEdited=false, isBestAnswer=false
8. **Construtor vazio** — instância válida para JPA
9. **Defaults** — likes=0, isEdited=false, isBestAnswer=false

### ForumCategory

10. **Todos os valores do enum** — existem e são válidos
11. **Persistência como STRING** — `@Enumerated(EnumType.STRING)`

---

## Fluxos tristes

1. **ForumTopic sem author** — FK not null → exceção
2. **ForumTopic sem title** — not null → exceção
3. **ForumTopic sem content** — not null → exceção
4. **ForumTopic sem category** — not null → exceção
5. **Title excedendo 300 chars** — length constraint → exceção
6. **ForumReply sem topic** — FK not null → exceção
7. **ForumReply sem author** — FK not null → exceção
8. **ForumReply sem content** — not null → exceção
9. **viewCount/replyCount/likeCount negativos** — sem validação; aceita valores negativos
10. **likes negativos na reply** — sem validação

---

## Regras de negócio e validações

- **isLocked**: tópicos bloqueados não podem ser editados (lógica no use case)
- **isPinned**: tópicos fixados aparecem primeiro (lógica na query)
- **isSolved**: marcação de resolvido (lógica no use case)
- **isBestAnswer**: marcação de melhor resposta na reply
- **replyCount**: deve ser incrementado manualmente no use case ao adicionar reply
- **lastActivityAt**: atualizado automaticamente via `@UpdateTimestamp`
- **OrphanRemoval**: replies removidas da lista são deletadas do banco
- **Tags como jsonb**: lista flexível sem schema fixo

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@ManyToOne`, `@OneToMany`, `@JoinColumn`
- Hibernate: `@CreationTimestamp`, `@UpdateTimestamp`, `@JdbcTypeCode(SqlTypes.JSON)`
- Lombok: `@Builder`, `@Builder.Default`

---

## Observações para implementação dos testes

- **Foco principal**: defaults das flags (isPinned, isLocked, isSolved, isBestAnswer)
- **Foco secundário**: relacionamento Topic ↔ Reply com orphanRemoval
- **Hipótese a validar**: lista completa de valores de ForumCategory — ler o enum diretamente
- **Hipótese a validar**: se tags como jsonb serializa corretamente no PostgreSQL
- **Lacuna**: counters (viewCount, replyCount, likeCount, likes) podem ficar negativos
- **Lacuna**: sem constraint de que replyCount == replies.size()

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: ForumTopic (builder, defaults, flags), ForumReply (builder, defaults), ForumCategory (enum values)
