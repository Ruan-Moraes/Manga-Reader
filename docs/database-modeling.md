# Database Modeling Guidelines

> **Obrigatório antes de implementar qualquer recurso que persista dados.** Use a skill
> **`database-design`** (`.claude/skills/database-design/`) para produzir o plano de schema
> **antes** de escrever entidade/migration/repository. Modelagem é decisão de design, não
> ajuste tardio. As regras abaixo são o contrato; a skill é o protocolo de aplicação.

### Escolha do banco (dual-DB)

| Vai para | Quando |
|----------|--------|
| **PostgreSQL** (JPA + Flyway) | dados relacionais com integridade transacional: users, groups, events, forum, library, stores, subscriptions, payments, tags, domain_labels |
| **MongoDB** (Spring Data + Mongock) | catálogo e UGC de alto volume / schema flexível: titles, chapters, comments, ratings, news |

- **Referência cross-DB**: do Postgres para o Mongo usa-se `title_id varchar` (ObjectId string).
  **Não existe FK Postgres↔Mongo.** Atributos da obra copiados no Postgres (`name`, `cover`) são
  **read-snapshots deliberados** — evitam join cross-DB; aceitar o trade-off de consistência
  eventual (reconciliar por job, nunca criar tabela `titles` no Postgres).

### Normalização — BCNF é o alvo

- Modelar em **BCNF por padrão**: todo determinante de uma dependência funcional deve ser chave
  candidata. Se `X → Y` e `X` não é chave candidata da tabela, **extrair `X` para tabela própria + FK**.
- **Desnormalizar só com justificativa explícita** documentada: (a) snapshot cross-DB; (b) contador
  de cache (ver abaixo); (c) lista de exibição opaca em jsonb (ver abaixo).
- Edição compartilhada é **a favor** da normalização quando a consistência entre referências é
  desejada (ex.: organizador de evento). É **contra** quando cada referência é um snapshot
  independente (ex.: item de biblioteca do usuário).

### jsonb vs tabela — regra de decisão

- **jsonb aceitável**: dado **opaco/de exibição**, nunca usado em `WHERE`/`JOIN`/`GROUP BY` no
  Postgres. Ex.: `users.settings`, i18n `name`/`description` (`LocalizedString`), `content_locales`,
  arrays de exibição (`events.gallery`, `groups.focus_tags`, `forum_topics.tags`).
- **Normalizar para tabela** assim que o campo precisar ser **filtrado, agregado ou ter FK** no
  Postgres. (Filtro de gênero hoje é no Mongo via `$all`, por isso as arrays de gênero do Postgres
  seguem jsonb — reabrir se surgir filtro relacional.)

> **Gêneros de `titles` (Mongo).** `Title.genres` guarda **slugs canônicos** de `tags`
> (`tags.slug`, UPPER_SNAKE imutável — mesmo padrão de `domain_labels.value`), não rótulos
> livres. Sem FK cross-DB: a integridade é garantida na **escrita** (`GenreValidator` valida
> os slugs contra o vocabulário `tags`) e o label é **resolvido por locale na leitura**
> (`GenreVocabulary` → `TitleMapper`). Nota/contagem/ranking do título vivem só no agregado
> `title_rating_aggregate` (serviço `rating-aggregator`) — o `Title` não tem mais
> `ratingAverage`/`ratingCount`/`rankingScore`.

### Tipos e constraints (não negociável)

- **Dinheiro**: inteiro de centavos (`bigint`/`long priceInCents`) + `currency` ISO 4217. **Nunca**
  `varchar` nem ponto flutuante. Formatação localizada fica no frontend.
- **Enums**: `@Enumerated(EnumType.STRING)` + **`CHECK (col IN (...))`** espelhando o enum (ou FK para
  `domain_labels`). `EnumType.ORDINAL` proibido. Toda coluna enum-like nova nasce com CHECK.
- **FK sempre presente** para toda referência relacional, com **`ON DELETE` explícito**:
  - `CASCADE` → linha-filha/junção sem sentido sem o pai (membership, tickets, replies, participants).
  - `RESTRICT` → conteúdo autorado (fórum) e registros financeiros (payments, subscriptions, plano em uso).
  - `SET NULL` → referência opcional (ex.: `redeemed_by_user_id`, `organizer_ref`).
- **`NOT NULL` + default** sempre que o domínio exigir; booleano nunca como string.

### Índices — decididos na migration

- Indexar **toda coluna de FK** (Postgres não cria índice de FK automaticamente) e toda coluna usada
  em `WHERE`/`JOIN`/`ORDER BY` frequente. Índice parcial para flags de baixa cardinalidade
  (`WHERE status = 'ACTIVE'`).
- **Não criar índice redundante**: um índice em coluna que é **prefixo mais à esquerda** de um índice
  composto/UNIQUE existente é desperdício. Não duplicar índices com nomes diferentes.

### Contadores desnormalizados

- Permitidos como cache **quando há tabela-fonte** para reconciliar (`reply_count`←`forum_replies`,
  `total_titles`←`group_works`, `participants`←`event_participants`).
- Mantidos por incremento no use case **e** corrigidos por `CounterReconciliationJob` (`@Scheduled`,
  bulk update idempotente `SET = (SELECT COUNT…)`). **Não usar trigger** (risco de double-count com o
  incremento da app). Contadores **sem** tabela-fonte (likes/views/popularity) ficam só por incremento.

### Migrations (Flyway)

- Toda mudança de schema = migration `V<n>__descricao.sql` versionada, **forward-only**, com comentário
  explicando a intenção e a query/regra que a justifica.
- Mudança destrutiva (drop de coluna, troca de tipo) faz **backfill na mesma migration antes do drop**.
- Migration que muda coluna mapeada exige **mudança coordenada** de entity/DTO/mapper/seed/testes
  (Hibernate `validate` quebra no boot caso contrário).
- **Validar a cadeia completa** (`V1..Vn`) aplicando em Postgres real antes de concluir.
