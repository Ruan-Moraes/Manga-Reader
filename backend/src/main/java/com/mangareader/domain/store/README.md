# Plano de Testes — Domain: Store

## Contexto

Módulo de lojas parceiras da plataforma. Contém a entidade `Store` (PostgreSQL) representando lojas que vendem títulos, a entidade `StoreTitle` (tabela de junção com URL) e o enum `StoreAvailability`. Usa JSONB para features e orphanRemoval para títulos.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Store` | Entity | PostgreSQL (`stores`) |
| `StoreTitle` | Entity | PostgreSQL (`store_titles`) |
| `StoreAvailability` | Enum (VO) | — |

---

## Entradas

### Store (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `name` | String | Sim | — | max 100, not null |
| `logo` | String | Não | null | — |
| `icon` | String | Não | null | — |
| `description` | String | Não | null | max 2000 |
| `website` | String | Sim | — | not null |
| `availability` | StoreAvailability | Não | null | STRING enum |
| `rating` | Double | Não | null | wrapper (nullable) |
| `features` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `titles` | List\<StoreTitle\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval |

### StoreTitle (Builder)

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|:-----------:|------------|
| `id` | UUID | Não (auto) | PK |
| `store` | Store | Sim | FK, not null, LAZY |
| `titleId` | String | Sim | not null (cross-DB ref MongoDB) |
| `url` | String | Não | max 500 |

**Unique Constraint**: `(store_id, title_id)` — verificar no código se existe.

### StoreAvailability (Enum)

Valores: `IN_STOCK`, `OUT_OF_STOCK`, `PRE_ORDER`

---

## Saídas

- `Store` com defaults: features=[], titles=[]
- `StoreTitle` vinculando loja a título MongoDB com URL da compra
- `rating` como Double wrapper — pode ser null (sem avaliação)

---

## Fluxos felizes

### Store

1. **Builder com name, website** — cria store com features=[], titles=[]
2. **Builder completo** — todos os campos preenchidos incluindo availability e rating
3. **Construtor vazio** — instância válida para JPA
4. **Features como JSONB** — lista de strings serializadas em jsonb
5. **OrphanRemoval** — remover StoreTitle da lista deleta do banco
6. **Rating nullable** — Double wrapper permite null (loja sem avaliação)

### StoreTitle

7. **Builder com store, titleId** — cria vínculo loja ↔ título
8. **URL opcional** — url pode ser null se não houver link direto

### StoreAvailability

9. **Todos os 3 valores** — IN_STOCK, OUT_OF_STOCK, PRE_ORDER existem
10. **Availability nullable** — Store.availability pode ser null

---

## Fluxos tristes

1. **Store sem name** — not null → exceção
2. **Store sem website** — not null → exceção
3. **Name excedendo 100 chars** — length constraint → exceção
4. **Description excedendo 2000 chars** — length constraint → exceção
5. **StoreTitle sem store** — FK not null → exceção
6. **StoreTitle sem titleId** — not null → exceção
7. **URL excedendo 500 chars** — length constraint → exceção
8. **Rating como Double — NaN ou Infinity** — sem validação; aceito pela entidade

---

## Regras de negócio e validações

- **Cross-DB reference**: StoreTitle.titleId referencia MongoDB Title (sem integridade referencial)
- **Rating como Double wrapper**: difere de `double` primitivo — permite null
- **Features JSONB**: lista flexível sem schema fixo
- **OrphanRemoval**: StoreTitle removido da lista é deletado do banco
- **Sem validação Bean Validation** na entidade
- **Entidade read-only**: lojas são criadas via seed data

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@OneToMany`, `@ManyToOne`, `@JoinColumn`
- Hibernate: `@JdbcTypeCode(SqlTypes.JSON)`
- Lombok: `@Builder`, `@Builder.Default`

---

## Observações para implementação dos testes

- **Sem mocks necessários**: testes unitários puros
- **Foco**: builder defaults (features=[], titles=[]), rating nullable
- **JSONB**: features como jsonb requer integração para validar serialização
- **Hipótese a validar**: se existe unique constraint em (store_id, title_id) no StoreTitle
- **Hipótese a validar**: se rating=null vs rating=0.0 são tratados diferentemente nas queries
- **Lacuna**: cross-DB ref sem integridade (titleId pode referenciar Title inexistente)

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Store (builder, defaults, features jsonb), StoreTitle (builder, cross-DB), StoreAvailability (enum values)
