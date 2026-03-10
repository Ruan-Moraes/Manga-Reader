# Plano de Testes — Domain: Group

## Contexto

Módulo de grupos de tradução / scanlation. Contém as entidades `Group` (grupo principal), `GroupMember` (tabela de junção com role) e `GroupWork` (obras traduzidas pelo grupo), além dos enums `GroupRole`, `GroupStatus` e `GroupWorkStatus`. Módulo com lógica de controle de acesso baseada em roles (LIDER, TRADUTOR, etc.).

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Group` | Entity | PostgreSQL (`groups`) |
| `GroupMember` | Entity | PostgreSQL (`group_members`) |
| `GroupWork` | Entity | PostgreSQL (`group_works`) |
| `GroupRole` | Enum (VO) | — |
| `GroupStatus` | Enum (VO) | — |
| `GroupWorkStatus` | Enum (VO) | — |

---

## Entradas

### Group (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `name` | String | Sim | — | max 100, not null |
| `username` | String | Sim | — | max 50, not null, unique |
| `logo` | String | Não | null | — |
| `banner` | String | Não | null | — |
| `description` | String | Não | null | max 2000 |
| `website` | String | Não | null | — |
| `totalTitles` | int | Não | `0` | `@Builder.Default` |
| `foundedYear` | Integer | Não | null | — |
| `status` | GroupStatus | Não | `GroupStatus.ACTIVE` | `@Builder.Default` |
| `genres` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `focusTags` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `rating` | double | Não | `0.0` | `@Builder.Default` |
| `popularity` | int | Não | `0` | `@Builder.Default` |
| `members` | List\<GroupMember\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval |
| `translatedWorks` | List\<GroupWork\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval |
| `platformJoinedAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | — |

### GroupMember (Builder)

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|:-----------:|------------|
| `id` | UUID | Não (auto) | PK |
| `group` | Group | Sim | FK, not null, LAZY |
| `user` | User | Sim | FK, not null, LAZY |
| `role` | GroupRole | Sim | not null, STRING enum |
| `joinedAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` |

**Unique Constraint**: `(group_id, user_id)` — um membro por grupo.

### GroupWork (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | PK |
| `group` | Group | Sim | — | FK, not null, LAZY |
| `titleId` | String | Sim | — | not null (cross-DB ref) |
| `title` | String | Sim | — | max 200, not null (desnormalizado) |
| `cover` | String | Não | null | — |
| `chapters` | int | Não | `0` | `@Builder.Default` |
| `status` | GroupWorkStatus | Não | `GroupWorkStatus.ONGOING` | `@Builder.Default` |
| `popularity` | int | Não | `0` | `@Builder.Default` |
| `genres` | List\<String\> | Não | `new ArrayList<>()` | jsonb, `@Builder.Default` |
| `updatedAt` | LocalDateTime | Não (auto) | `@UpdateTimestamp` | — |

### Enums

| Enum | Valores |
|------|---------|
| `GroupRole` | `LIDER`, `TRADUTOR`, `REVISOR`, `EDITOR`, `UPLOADER` |
| `GroupStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `GroupWorkStatus` | `ONGOING`, `COMPLETED`, `DROPPED`, `HIATUS` |

---

## Saídas

- `Group` com defaults: totalTitles=0, status=ACTIVE, rating=0.0, popularity=0, listas vazias
- `GroupMember` vinculando User a Group com role específica
- `GroupWork` vinculando título MongoDB ao grupo com dados desnormalizados

---

## Fluxos felizes

### Group

1. **Builder com name e username** — cria grupo com todos os defaults aplicados
2. **Builder com todos os campos** — grupo completo com logo, banner, genres, etc.
3. **Username unique** — cada grupo tem username único (slug)
4. **Listas jsonb** — genres e focusTags como JSONB no PostgreSQL
5. **Defaults via builder** — totalTitles=0, status=ACTIVE, rating=0.0, popularity=0
6. **OrphanRemoval** — remover member da lista deleta do banco
7. **OrphanRemoval** — remover work da lista deleta do banco

### GroupMember

8. **Builder com group, user, role** — cria membro válido
9. **Unique constraint (group + user)** — impede duplicatas
10. **CreationTimestamp** — joinedAt preenchido automaticamente

### GroupWork

11. **Builder com group, titleId, title** — cria work com chapters=0, status=ONGOING
12. **Defaults** — chapters=0, status=ONGOING, popularity=0, genres=[]
13. **UpdateTimestamp** — updatedAt atualizado em edições

### Enums

14. **GroupRole** — todos os 5 valores existem e são válidos
15. **GroupStatus** — todos os 3 valores existem
16. **GroupWorkStatus** — todos os 4 valores existem

---

## Fluxos tristes

1. **Group sem name** — not null → exceção
2. **Group sem username** — not null → exceção
3. **Username duplicado** — unique constraint → `DataIntegrityViolationException`
4. **GroupMember sem group** — FK not null → exceção
5. **GroupMember sem user** — FK not null → exceção
6. **GroupMember sem role** — not null → exceção
7. **GroupMember duplicado (mesmos group+user)** — unique constraint → exceção
8. **GroupWork sem group** — FK not null → exceção
9. **GroupWork sem titleId** — not null → exceção
10. **GroupWork sem title** — not null → exceção
11. **Description excedendo 2000 chars** — length constraint → exceção

---

## Regras de negócio e validações

- **Username unique**: identifica o grupo como slug único
- **OrphanRemoval**: membros e works removidos da lista são deletados do banco
- **Cascade ALL**: operações em Group propagam para members e works
- **Cross-DB ref**: `GroupWork.titleId` referencia MongoDB Title (sem integridade referencial)
- **Dados desnormalizados**: GroupWork.title, cover, genres copiados do Title
- **Sem validação Bean Validation** na entidade

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@UniqueConstraint`, `@ManyToOne`, `@OneToMany`, `@JoinColumn`
- Hibernate: `@CreationTimestamp`, `@UpdateTimestamp`, `@JdbcTypeCode(SqlTypes.JSON)`
- Lombok: `@Builder`, `@Builder.Default`

---

## Observações para implementação dos testes

- **Módulo mais complexo**: 3 entidades + 3 enums com relacionamentos bidirecionais
- **Sem mocks necessários**: testes unitários puros para builders/defaults
- **OrphanRemoval**: requer teste de integração
- **Unique constraints**: requer teste de integração
- **Hipótese a validar**: se JSONB (genres, focusTags, GroupWork.genres) serializa corretamente com `@JdbcTypeCode(SqlTypes.JSON)`
- **Hipótese a validar**: se GroupRole contém exatamente LIDER, TRADUTOR, REVISOR, EDITOR, UPLOADER — verificar diretamente no enum
- **Lacuna**: sem constraint de que um Group deve ter pelo menos um LIDER

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Group (builder, defaults), GroupMember (unique, role), GroupWork (defaults, cross-DB), Enums (todos os valores)
