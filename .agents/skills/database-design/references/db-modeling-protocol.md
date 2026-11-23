# DB Modeling Protocol — Referência

Detalhe das *Database Modeling Guidelines* (`docs/database-modeling.md`). Exemplos vêm das migrations reais V23–V30.

---

## 1. Dual-DB — ownership

| PostgreSQL (JPA + Flyway) | MongoDB (Spring Data + Mongock) |
|---------------------------|---------------------------------|
| users, groups, group_users, group_works | titles |
| events, event_tickets, event_participants, event_organizers | chapters |
| — (forum migrou p/ Mongo em V016; tabelas dropam na fase 2/V33) | comments (unificado: obra/resenha/fórum), comments_votes |
| | forum_topics, forum_topics_votes, reviews_votes |
| user_libraries, user_recommendations, user_social_links | reviews, reviews_aggregate, title_trend_daily |
| stores, store_titles | news |
| subscriptions, subscription_plans, gift_codes, payments, subscription_audit_logs | |
| tags, domain_labels | |

**Cross-DB**: Postgres guarda `title_id varchar` (ObjectId do Mongo). **Sem FK possível.** Campos da
obra copiados no Postgres (`name`, `cover`, `genres`) são **snapshots de leitura deliberados** —
reconciliar por evento/job, **nunca** criar tabela `titles` no Postgres.

---

## 2. BCNF — teste prático

Para cada tabela, liste as dependências funcionais `X → Y`. Pergunte: **`X` é chave candidata?**

- Sim → ok.
- Não → **viola BCNF**. Extraia `{X, Y…}` para tabela própria e referencie por FK.

**Exemplo real (BCNF-01, V28):** `events` tinha `organizer_id → organizer_name, organizer_avatar…`.
`organizer_id` não era chave candidata de `events` e organizadores se repetiam → extraído para
`event_organizers(id, external_id UNIQUE, name, avatar, …)` + `events.organizer_ref` FK. No write-path,
`findOrCreate(externalId)` deduplica e propaga edição (consistência desejada).

**Quando NÃO normalizar:** se a "repetição" é um snapshot independente por linha (item de biblioteca,
recomendação do usuário), manter denormalizado — não há ganho de consistência, só acoplamento.

---

## 3. Árvore de decisão — jsonb vs tabela

```
O campo é lista/objeto?
 ├── É filtrado / agregado / precisa de FK no Postgres (WHERE/JOIN/GROUP BY)?
 │     ├── SIM  → TABELA (junção ou filha) + índice
 │     └── NÃO  → continua
 └── É opaco / só exibição / i18n / preferência?
       └── SIM  → jsonb aceitável
```

- **jsonb ok**: `users.settings`, `LocalizedString` (`name`/`description`), `users.content_locales`,
  `events.gallery/schedule/special_guests/social_links`, `groups.focus_tags`, `forum_topics.tags`,
  `stores.features`.
- **Vira tabela** quando surgir filtro relacional. *Nota:* filtro de gênero hoje é no **Mongo** (`$all`
  em `titles`), por isso as arrays de gênero do Postgres seguem jsonb. Reabrir se aparecer filtro no
  Postgres.

---

## 4. Tipos

| Conceito | Tipo certo | Errado |
|----------|-----------|--------|
| Dinheiro | `bigint` centavos + `currency varchar(3)` | `varchar`, `double`, `numeric` solto |
| Enum/status | `varchar` + `@Enumerated(STRING)` + CHECK | `EnumType.ORDINAL`, varchar livre |
| Booleano | `boolean` | `varchar('true'/'S')` |
| Timestamp | `timestamp` | string |
| i18n texto | `jsonb` (`LocalizedString`) | colunas por idioma |

**Dinheiro (V24):**
```sql
ALTER TABLE event_tickets
    ADD COLUMN price_in_cents bigint,
    ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'BRL';
UPDATE event_tickets SET price_in_cents = ROUND(
    NULLIF(regexp_replace(replace(price, ',', '.'), '[^0-9.]', '', 'g'), '')::numeric * 100);
ALTER TABLE event_tickets ALTER COLUMN price_in_cents SET NOT NULL,
    ADD CONSTRAINT chk_event_tickets_price CHECK (price_in_cents >= 0);
ALTER TABLE event_tickets DROP COLUMN price;
```
Entity: `long priceInCents` + `String currency`. DTO/mapper/seed/frontend `formatCurrency` juntos.

**Enum + CHECK (V26/V30):** valores espelham `Enum.name()`. CHECK passa NULL (ok p/ coluna nullable).
```sql
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('ADMIN','MODERATOR','MEMBER'));
ALTER TABLE stores ADD CONSTRAINT chk_stores_category CHECK (category IN ('OFICIAL','NOVA','USADO'));
```

---

## 5. Matriz de `ON DELETE` (IR-5, V27)

| Política | Usar quando | Exemplos |
|----------|-------------|----------|
| **CASCADE** | filha/junção perde sentido sem o pai | `event_tickets→events`, `forum_replies→forum_topics`, `group_users→groups/users`, `event_participants→events/users`, `user_social_links/libraries/recommendations→users`, `store_titles→stores` |
| **RESTRICT** | conteúdo autorado ou registro financeiro/plano-em-uso | `forum_topics/forum_replies.author→users`, `payments→users`, `subscriptions→users`, `subscriptions/gift_codes.plan→subscription_plans`, `subscription_audit_logs→subscriptions` |
| **SET NULL** | referência opcional | `gift_codes.redeemed_by_user_id`, `subscription_audit_logs.performed_by`, `events.organizer_ref` |

```sql
ALTER TABLE forum_replies DROP CONSTRAINT fk_forum_replies_topic,
    ADD CONSTRAINT fk_forum_replies_topic
        FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE;
```
FK criada sem nome (inline `REFERENCES`) → Postgres nomeia `<tabela>_<col>_fkey`. Indexe toda FK.

---

## 6. Índices

- **Criar**: toda coluna de FK; `WHERE`/`JOIN`/`ORDER BY` frequentes; parcial p/ flag de baixa
  cardinalidade (`CREATE INDEX … WHERE status='ACTIVE'`).
- **Não criar** (redundante): coluna que é **prefixo mais à esquerda** de um índice composto/UNIQUE já
  existente. Ex.: `idx_user_libraries_user(user_id)` é coberto por `uk(user_id,title_id)` → drop.
- **Não duplicar**: dois índices na mesma coluna com nomes diferentes (ex.: `idx_group_users_user` +
  `idx_group_users_user_id`).

---

## 7. Contadores desnormalizados (PERF-6)

Cache permitido **se há tabela-fonte**. Manter por incremento no use case **e** reconciliar:

```java
@Modifying
@Query("UPDATE ForumTopic t SET t.replyCount = (SELECT COUNT(r) FROM ForumReply r WHERE r.topic = t)")
int reconcileReplyCounts();
```
`CounterReconciliationJob` (`@Scheduled`, `@Profile("!test")`) chama os reconciles. `SET=COUNT` é
idempotente → sem double-count. **Não use trigger.** Contadores sem fonte (likes/views/popularity/
rating/interested) ficam só por incremento — documentar.

Reconciliáveis hoje: `groups.total_titles`←`group_works`,
`events.participants`←`event_participants` (Postgres) e
`forum_topics.replyCount`←`comments {targetType=FORUM_TOPIC}` (Mongo, mesmo job).

---

## 8. Migration Flyway — regras

1. `V<n>__descricao_em_snake.sql`, próximo número na sequência, **forward-only**.
2. Comentário no topo explicando intenção + a query/regra que justifica.
3. Destrutivo (drop coluna, troca de tipo): **backfill na mesma migration antes do drop**.
4. Coluna mapeada mudou → ajustar **entity + DTO + mapper + seed + testes** no mesmo PR (senão
   Hibernate `validate` quebra no boot).
5. **Validar a cadeia `V1..Vn`** aplicando em Postgres real antes de concluir:
   ```bash
   docker run -d --name fwcheck -e POSTGRES_USER=manga -e POSTGRES_PASSWORD=manga -e POSTGRES_DB=manga postgres:17-alpine
   for f in $(ls .../db/migration/V*.sql | sort -V); do
     docker exec -i fwcheck psql -v ON_ERROR_STOP=1 -U manga -d manga < "$f" || break
   done
   ```
6. Testes que persistem entidades com `jsonb` precisam de **Testcontainers Postgres** (H2 não suporta
   jsonb) — `@DataJpaTest @Tag("testcontainers") @Import(PostgresTestContainerConfig.class)` + Flyway.

---

## 9. Documentação

Toda decisão de modelagem nova ou dívida identificada → registrar em
`docs/technical-debt/sql-technical-debt.md` (fonte oficial da dívida de banco). Item resolvido =
marcar **RESOLVIDO** com o número da migration, não apagar.
