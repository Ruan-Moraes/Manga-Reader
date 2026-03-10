# Plano de Testes — Domain: Library

## Contexto

Módulo de biblioteca pessoal do usuário. Contém a entidade `SavedManga` (PostgreSQL) que representa um título salvo na biblioteca do usuário com classificação por lista de leitura, e o enum `ReadingListType` com display names em pt-BR.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `SavedManga` | Entity | PostgreSQL (`user_libraries`) |
| `ReadingListType` | Enum (VO) | — |

---

## Entradas

### SavedManga (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `user` | User | Sim | — | FK, not null, LAZY |
| `titleId` | String | Sim | — | not null, unique com user_id |
| `name` | String | Sim | — | max 200, not null (desnormalizado) |
| `cover` | String | Não | null | URL da capa (desnormalizado) |
| `type` | String | Não | null | max 50, tipo do título (desnormalizado) |
| `list` | ReadingListType | Sim | — | not null, STRING enum |
| `savedAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | — |

**Unique Constraint**: `(user_id, title_id)` — um título por usuário.

### ReadingListType (Enum)

| Valor | Display Name |
|-------|-------------|
| `LENDO` | "Lendo" |
| `QUERO_LER` | "Quero Ler" |
| `CONCLUIDO` | "Concluído" |

**Método**: `getDisplayName()` → retorna o label em pt-BR.

---

## Saídas

- Instância de `SavedManga` vinculada a um User e a um Title (via titleId cross-DB ref)
- `savedAt` preenchido automaticamente

---

## Fluxos felizes

1. **Builder com user, titleId, name, list** — cria SavedManga válido
2. **Builder com todos os campos** — inclui cover e type (desnormalizados)
3. **Construtor vazio** — instância válida para JPA
4. **ReadingListType.LENDO.getDisplayName()** → "Lendo"
5. **ReadingListType.QUERO_LER.getDisplayName()** → "Quero Ler"
6. **ReadingListType.CONCLUIDO.getDisplayName()** → "Concluído"
7. **Alteração de list** — SavedManga.setList(ReadingListType.CONCLUIDO) altera a lista de leitura
8. **Persistência como STRING** — `@Enumerated(EnumType.STRING)` persiste "LENDO", "QUERO_LER", "CONCLUIDO"

---

## Fluxos tristes

1. **SavedManga sem user** — FK not null → `ConstraintViolationException`
2. **SavedManga sem titleId** — not null → exceção
3. **SavedManga sem name** — not null → exceção
4. **SavedManga sem list** — not null → exceção
5. **Duplicata (user_id + title_id)** — unique constraint → `DataIntegrityViolationException`
6. **Name excedendo 200 chars** — `@Column(length=200)` → exceção
7. **Type excedendo 50 chars** — `@Column(length=50)` → exceção

---

## Regras de negócio e validações

- **Um título por usuário**: constraint unique em `(user_id, title_id)`
- **Cross-DB reference**: `titleId` referencia um documento MongoDB (Title) — sem integridade referencial de banco
- **Dados desnormalizados**: `name`, `cover`, `type` são copiados do Title no momento da save (não atualizados automaticamente)
- **ReadingListType** tem 3 valores fixos com display names em pt-BR
- **Sem @Valid na entidade** — validação fica na camada de aplicação

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@UniqueConstraint`, `@ManyToOne`, `@JoinColumn`
- Hibernate: `@CreationTimestamp`
- Lombok: `@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`

---

## Observações para implementação dos testes

- **Sem mocks necessários**: testes unitários puros
- **Foco principal**: unique constraint (user+titleId) — requer teste de integração
- **Foco secundário**: ReadingListType (todos os valores, getDisplayName)
- **Hipótese a validar**: se a unique constraint é aplicada corretamente com o nome composto `(user_id, title_id)`
- **Lacuna**: cross-DB ref não tem integridade — titleId pode referenciar Title inexistente
- **Lacuna**: dados desnormalizados (name, cover, type) podem ficar desatualizados

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: SavedManga (builder, unique constraint), ReadingListType (enum values, displayName)
