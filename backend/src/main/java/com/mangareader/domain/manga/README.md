# Plano de Testes — Domain: Manga

## Contexto

Módulo central da plataforma. Contém a entidade `Title` (MongoDB) representando mangás/manhwas/manhuas e o value object `Chapter` (documento embedded). É o domínio mais referenciado por outros módulos (comment, rating, library, store, group).

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Title` | Entity | MongoDB (`titles`) |
| `Chapter` | Value Object | Embedded em Title |

---

## Entradas

### Title (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | String | Não (auto) | MongoDB ObjectId | PK |
| `type` | String | Não | null | ex: "Mangá", "Manhwa", "Manhua" |
| `name` | String | Não | null | `@TextIndexed(weight=10)` |
| `cover` | String | Não | null | URL da capa |
| `synopsis` | String | Não | null | `@TextIndexed(weight=3)` |
| `genres` | List\<String\> | Não | `new ArrayList<>()` | `@Indexed`, `@Builder.Default` |
| `chapters` | List\<Chapter\> | Não | `new ArrayList<>()` | `@Builder.Default` |
| `popularity` | String | Não | null | `@Indexed` |
| `score` | String | Não | null | — |
| `author` | String | Não | null | `@TextIndexed(weight=5)` |
| `artist` | String | Não | null | — |
| `publisher` | String | Não | null | — |
| `createdAt` | LocalDateTime | Não (auto) | `@CreatedDate` | — |
| `updatedAt` | LocalDateTime | Não (auto) | `@LastModifiedDate` | — |

### Chapter (Builder / Value Object)

| Campo | Tipo | Obrigatório | Default |
|-------|------|:-----------:|---------|
| `number` | String | Não | null |
| `title` | String | Não | null |
| `releaseDate` | String | Não | null |
| `pages` | String | Não | null |

---

## Saídas

- Instância de `Title` com listas inicializadas (genres=[], chapters=[])
- `Chapter` como documento embedded dentro da lista `chapters` do Title
- Timestamps via Spring Data auditing

---

## Fluxos felizes

### Title

1. **Builder com campos mínimos** — cria Title com id=null (MongoDB gera), genres=[], chapters=[]
2. **Builder com todos os campos** — all args preenchidos corretamente
3. **Builder com genres populados** — lista de strings representando gêneros
4. **Builder com chapters populados** — lista de Chapter VOs embedded
5. **Construtor vazio** — instância válida para Spring Data
6. **TextIndexed** — fields name (weight 10), synopsis (weight 3), author (weight 5) indexados para full-text search
7. **Indexed** — genres e popularity indexados para queries
8. **CreatedDate/LastModifiedDate** — preenchidos automaticamente pelo Spring Data MongoDB auditing

### Chapter

9. **Builder com todos os campos** — number, title, releaseDate, pages
10. **Builder vazio** — todos os campos null (VO sem constraints)
11. **Embedded como parte de Title** — serializado dentro do documento MongoDB

---

## Fluxos tristes

1. **Title com genres null (sem @Builder.Default)** — se não usar builder, genres pode ser null ao invés de lista vazia
2. **Title com chapters null** — idem; pode causar NPE se acessado sem verificação
3. **Chapter com number null** — sem validação na entidade; aceita valores null
4. **Chapter com number duplicado na lista** — sem constraint de unicidade na lista embedded
5. **Title sem name** — aceito pelo MongoDB (sem not null), mas inválido semanticamente
6. **score e popularity como String** — potencial inconsistência se valores não numéricos forem armazenados

---

## Regras de negócio e validações

- **Sem validação Bean Validation** na entidade — MongoDB não tem constraints como JPA
- Genres e chapters são listas embedded — sem referência externa
- TextIndex com pesos permite busca full-text priorizada (name > author > synopsis)
- `type` é String livre — sem enum restringindo valores (hipótese: deveria ser enum?)
- `score` e `popularity` são String — hipótese: deveriam ser numéricos para ordenação?

---

## Dependências relevantes

- Spring Data MongoDB: `@Document`, `@Id`, `@Indexed`, `@TextIndexed`, `@CreatedDate`, `@LastModifiedDate`
- Lombok: `@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`

---

## Observações para implementação dos testes

- **Prioridade alta**: módulo mais referenciado do sistema
- **Sem mocks necessários**: testes puramente unitários para builder/defaults
- **Text indexes**: não testáveis em teste unitário — requer integração com MongoDB
- **Hipótese a validar**: se `@Builder.Default` funciona com `@NoArgsConstructor` do Lombok (possível conflito em versões antigas)
- **Hipótese a validar**: se Chapter como VO embedded serializa/deserializa corretamente no MongoDB
- **Hipótese a validar**: comportamento de `score` e `popularity` como String em ordenações
- **Lacuna identificada**: sem validação de dados obrigatórios (name, type) — qualquer valor é aceito

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Title (builder, defaults, listas), Chapter (builder), integração MongoDB (indexes, auditing)
