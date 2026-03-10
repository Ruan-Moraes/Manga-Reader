# Plano de Testes — Domain: Category

## Contexto

Módulo de categorias/tags da plataforma. Contém a entidade `Tag` (PostgreSQL) como classificador de gêneros/categorias para títulos, e os enums utilitários `PublicationStatus` (filtro de status de publicação) e `SortCriteria` (critérios de ordenação para busca avançada).

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Tag` | Entity | PostgreSQL (`tags`) |
| `PublicationStatus` | Enum (VO) | — |
| `SortCriteria` | Enum (VO) | — |

---

## Entradas

### Tag (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | Long | Não (auto) | `@GeneratedValue(IDENTITY)` | PK |
| `label` | String | Sim | — | max 60, not null, unique |

### PublicationStatus (Enum)

Valores: `COMPLETE`, `ONGOING`, `HIATUS`, `CANCELLED`, `ALL`

### SortCriteria (Enum)

Valores: `MOST_READ`, `MOST_RATED`, `MOST_RECENT`, `ALPHABETICAL`, `ASCENSION`, `RANDOM`

---

## Saídas

- `Tag` com id auto-incrementado e label único
- Enums como categorias de filtro (sem persistência própria)

---

## Fluxos felizes

### Tag

1. **Builder com label** — cria Tag com id auto-gerado (IDENTITY)
2. **Construtor vazio** — instância válida para JPA
3. **Label unique** — cada tag tem nome único

### PublicationStatus

4. **Todos os 5 valores** — COMPLETE, ONGOING, HIATUS, CANCELLED, ALL existem

### SortCriteria

5. **Todos os 6 valores** — MOST_READ, MOST_RATED, MOST_RECENT, ALPHABETICAL, ASCENSION, RANDOM existem

---

## Fluxos tristes

1. **Tag sem label** — not null → exceção
2. **Label duplicado** — unique constraint → `DataIntegrityViolationException`
3. **Label excedendo 60 chars** — length constraint → exceção
4. **PublicationStatus inválido** — `IllegalArgumentException` no parse de string
5. **SortCriteria inválido** — idem

---

## Regras de negócio e validações

- **Tag é entidade simples**: apenas id + label, sem relações (tags são referenciadas como strings nos títulos)
- **IDENTITY vs UUID**: Tag usa `@GeneratedValue(IDENTITY)` (Long auto-increment) ao invés de UUID
- **Label unique**: não pode haver duas tags com o mesmo nome
- **PublicationStatus.ALL**: valor especial para indicar "sem filtro"
- **SortCriteria**: usado pelo FilterTitlesUseCase para ordenação in-memory

---

## Dependências relevantes

- JPA: `@Entity`, `@Table`, `@Column`, `@Id`, `@GeneratedValue(GenerationType.IDENTITY)`
- Lombok: `@Builder`, `@Getter`, `@Setter`

---

## Observações para implementação dos testes

- **Módulo mais simples**: Tag é a entidade mais simples do sistema
- **Sem mocks**: testes puramente unitários
- **Foco**: builder, label unique (integração), enum values completos
- **SortCriteria**: importante pois é usado no FilterTitlesUseCase para switch/matching — todos os valores devem existir
- **Hipótese a validar**: se Tag tem `@Builder` — verificar se Lombok gera builder para entidade com apenas 2 campos

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Tag (builder, label unique), PublicationStatus (5 valores), SortCriteria (6 valores)
