# Plano de Testes — Domain: News

## Contexto

Módulo de notícias da plataforma. Contém a entidade `NewsItem` (MongoDB) com suporte a categorias, reações, galeria de imagens, fichas técnicas e destaque editorial. Inclui os VOs `NewsAuthor` (author embedded), `NewsCategory` (enum com display names) e `NewsReaction` (contadores de reação).

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `NewsItem` | Entity | MongoDB (`news`) |
| `NewsAuthor` | Value Object | Embedded em NewsItem |
| `NewsCategory` | Enum (VO) | — |
| `NewsReaction` | Value Object | Embedded em NewsItem |

---

## Entradas

### NewsItem (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | String | Não (auto) | MongoDB ObjectId | PK |
| `title` | String | Não | null | `@TextIndexed(weight=10)` |
| `subtitle` | String | Não | null | — |
| `excerpt` | String | Não | null | `@TextIndexed(weight=3)` |
| `content` | List\<String\> | Não | `new ArrayList<>()` | `@Builder.Default` |
| `coverImage` | String | Não | null | — |
| `gallery` | List\<String\> | Não | `new ArrayList<>()` | `@Builder.Default` |
| `source` | String | Não | null | — |
| `sourceLogo` | String | Não | null | — |
| `category` | NewsCategory | Não | null | `@Indexed` |
| `tags` | List\<String\> | Não | `new ArrayList<>()` | `@Indexed`, `@Builder.Default` |
| `author` | NewsAuthor | Não | null | Embedded VO |
| `publishedAt` | LocalDateTime | Não (auto) | `@CreatedDate` | — |
| `updatedAt` | LocalDateTime | Não (auto) | `@LastModifiedDate` | — |
| `readTime` | int | Não | `0` | `@Builder.Default` |
| `views` | int | Não | `0` | `@Builder.Default` |
| `commentsCount` | int | Não | `0` | `@Builder.Default` |
| `trendingScore` | int | Não | `0` | `@Builder.Default` |
| `isExclusive` | boolean | Não | `false` | `@Builder.Default` |
| `isFeatured` | boolean | Não | `false` | `@Builder.Default` |
| `videoUrl` | String | Não | null | — |
| `technicalSheet` | Map\<String, String\> | Não | `new HashMap<>()` | `@Builder.Default` |
| `reactions` | NewsReaction | Não | `new NewsReaction()` | `@Builder.Default` |

### NewsAuthor (Builder)

| Campo | Tipo |
|-------|------|
| `id` | String |
| `name` | String |
| `avatar` | String |
| `role` | String |
| `profileLink` | String |

### NewsReaction (Builder)

| Campo | Tipo | Default |
|-------|------|---------|
| `like` | int | 0 |
| `excited` | int | 0 |
| `sad` | int | 0 |
| `surprised` | int | 0 |

### NewsCategory (Enum)

| Valor | Display Name |
|-------|-------------|
| `PRINCIPAIS` | "Principais" |
| `LANCAMENTOS` | "Lançamentos" |
| `ADAPTACOES` | "Adaptações" |
| `INDUSTRIA` | "Indústria" |
| `ENTREVISTAS` | "Entrevistas" |
| `EVENTOS` | "Eventos" |
| `CURIOSIDADES` | "Curiosidades" |
| `MERCADO` | "Mercado" |
| `INTERNACIONAL` | "Internacional" |

**Método**: `getDisplayName()` → retorna label em pt-BR.

---

## Saídas

- `NewsItem` com defaults: content=[], gallery=[], tags=[], readTime=0, views=0, commentsCount=0, trendingScore=0, isExclusive=false, isFeatured=false, technicalSheet={}, reactions=NewsReaction()
- `NewsAuthor` como VO embedded (todos os campos nullable)
- `NewsReaction` com todos os contadores em 0

---

## Fluxos felizes

### NewsItem

1. **Builder mínimo** — cria item com todos os defaults aplicados
2. **Builder completo** — todos os campos preenchidos incluindo author, reactions, technicalSheet
3. **Construtor vazio** — instância válida para Spring Data
4. **Defaults** — listas vazias, counters em 0, flags false, reactions com 0s
5. **TextIndexed** — title (weight 10) e excerpt (weight 3) indexados para full-text search
6. **Reactions embedded** — NewsReaction criado automaticamente via `@Builder.Default`
7. **TechnicalSheet** — Map flexível para metadados variáveis

### NewsAuthor

8. **Builder com todos os campos** — author completo
9. **Builder vazio** — todos null (sem constraints)

### NewsReaction

10. **Construtor padrão** — todos os contadores em 0

### NewsCategory

11. **Todos os 9 valores** — existem e são válidos
12. **getDisplayName()** — retorna label correto para cada valor

---

## Fluxos tristes

1. **NewsItem sem title** — aceito pelo MongoDB; semanticamente inválido
2. **Counters negativos** — readTime, views, commentsCount, trendingScore podem ficar negativos
3. **NewsReaction com valores negativos** — like, excited, sad, surprised sem validação
4. **NewsCategory desconhecida** — IllegalArgumentException no parse de enum
5. **TechnicalSheet com chave vazia** — aceito pela entidade

---

## Regras de negócio e validações

- **Entidade read-only**: notícias são criadas via seed data, sem CRUD pelo usuário
- **isFeatured/isExclusive**: flags editoriais sem lógica de negócio na entidade
- **Reactions**: contadores incrementados sem tracking de duplicatas
- **Dados desnormalizados**: author como VO embedded (não referencia User)
- **Sem validação** na entidade — entidade anêmica

---

## Dependências relevantes

- Spring Data MongoDB: `@Document`, `@Id`, `@Indexed`, `@TextIndexed`, `@CreatedDate`, `@LastModifiedDate`
- Lombok: `@Builder`, `@Builder.Default`

---

## Observações para implementação dos testes

- **Entidade com mais campos**: 23 campos com muitos defaults — cobrir todos
- **Foco**: defaults (listas vazias, counters 0, flags false, reactions vazio)
- **NewsCategory**: testar todos os 9 valores e getDisplayName()
- **NewsReaction**: testar construtor padrão (0s) e builder com valores
- **NewsAuthor**: testar builder com todos os campos
- **Hipótese a validar**: se `@Builder.Default` no `reactions = new NewsReaction()` funciona corretamente
- **Lacuna**: sem validação de conteúdo obrigatório (title, content)
- **Lacuna**: counters sem proteção contra valores negativos

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: NewsItem (builder, defaults), NewsAuthor (builder), NewsReaction (builder), NewsCategory (enum values, displayName)
