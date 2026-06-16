# DT-10 — Job de limpeza de órfãos cross-DB (PLANO)

> **Status:** plano. Nada implementado. Aprovar antes de codar.

## 1. Problema

Dual-DB: títulos vivem no Mongo (coleção `titles`, `_id` = ObjectId 24-hex). 5 tabelas
Postgres referenciam `title_id` **sem FK física** (impossível — cross-DB):

| Tabela | Origem | Counter desnormalizado afetado |
|---|---|---|
| `user_libraries.title_id` | biblioteca do usuário | — |
| `group_works.title_id` | obras do grupo | `groups.total_titles` |
| `store_titles.title_id` | loja | — |
| `title_authors.title_id` | autores (novo) | — |
| `title_publishers.title_id` | editoras (novo) | — |

Quando um título é deletado do Mongo, as linhas filhas no Postgres ficam órfãs.
Hoje `DeleteTitleUseCase` só limpa `title_authors` + `title_publishers`
(via `TitleAssociationWriter.clear`). **`user_libraries`, `group_works`, `store_titles`
nunca são limpas** → vazamento garantido por esses três caminhos.

---

## 2. Decisão: onde colocar o job

**→ Estender o `counter-reconciler` existente com um novo reconciler
(`OrphanTitleRefReconciler`). NÃO criar terceiro microserviço.**

Justificativa:
- O `counter-reconciler` **já tem exatamente a infra necessária**: conexão simultânea
  Postgres (`JdbcTemplate`) + Mongo (`MongoTemplate`), `@Scheduled` cron, gatilho manual
  `POST /admin/reconcile` com token, `ReconciliationReport`, Dockerfile, testes com
  TestContainers. Um `orphan-cleaner` separado duplicaria tudo isso por ~1 classe de lógica.
- Conceitualmente é o mesmo tipo de job: **rede de segurança idempotente contra drift**
  entre as duas fontes. Órfãos são "drift de existência"; contadores são "drift de valor".
- O `VoteCounterReconciler` já faz a ponte "agrega no Mongo → corrige no outro lado". O job
  de órfãos é o espelho: "lê ids no Postgres → confere no Mongo → deleta no Postgres".
- Custo de operação: um serviço a menos para deployar/monitorar.

Contra (aceito): o serviço deixa de ser estritamente "counter" e passa a "reconciler" amplo.
Mitigação: nome do serviço já é genérico o suficiente; ajustar Javadoc/README. Se desejado,
renomear o report para algo mais neutro — ver Dúvidas.

---

## 3. Estratégia de limpeza (o reconciler)

`OrphanTitleRefReconciler` (pacote `...reconciler.infrastructure.crossdb`):

Para o conjunto das 5 tabelas:

1. **Coletar candidatos** — `SELECT DISTINCT title_id FROM <tabela>` para cada tabela,
   unir num `Set<String>` (todos os `title_id` referenciados, distintos).
   - Otimização possível: `SELECT DISTINCT title_id FROM (... UNION ...)` numa query só.
   - Mongo `_id` pode ser ObjectId **ou** String (seeds/UUIDs migrados — ver `VoteCounterReconciler.toParentId`). Tratar ambos no passo de existência.

2. **Conferir existência no Mongo em batch** — para o conjunto distinto, dividir em
   *chunks* (ex. 1000) e por chunk:
   `db.titles.find({ _id: { $in: [...] } }, { _id: 1 })`.
   Converter cada `title_id` hex válido para `ObjectId` (e manter a forma String também,
   pois pode haver `_id` String). Coletar o conjunto de **ids que existem**.

3. **Calcular órfãos** = candidatos − existentes.

4. **Deletar as linhas órfãs** — para cada tabela, em batch:
   `DELETE FROM <tabela> WHERE title_id IN (:orphans)` (chunked, ex. 1000 por `IN`).
   Usar `JdbcTemplate` nativo (sem grafo JPA — mesmo padrão do `PostgresCounterReconciler`).

5. **Reparar counters afetados** — após deletar de `group_works`, reaproveitar o
   `PostgresCounterReconciler.reconcileTotalTitles()` já existente (idempotente
   `SET = COUNT`) para corrigir `groups.total_titles`. Ordenar o job: órfãos **antes**
   dos contadores no `CounterReconciliationJob.reconcile()`, para o COUNT já refletir
   a limpeza na mesma passada.

6. **Reportar** — devolver `Map<tabela, linhas_removidas>` agregado no `ReconciliationReport`.

### Frequência
- `@Scheduled` **diário** (ex. `0 30 3 * * *` — 03:30), não de hora em hora.
  Órfãos não têm urgência (não corrompem leitura — as queries de leitura filtram por
  join/existência), e o full-scan de `DISTINCT title_id` é mais pesado que os updates de
  contador. Cron configurável via `reconciler.orphan.cron`.
- Gatilho manual sempre disponível via `POST /admin/reconcile` (já existe) — útil logo após
  um bulk delete de títulos.

---

## 4. Alternativa síncrona (no `DeleteTitleUseCase`)

**Recomendação: fazer AMBOS — limpeza síncrona como caminho primário + job como rede de
segurança.** Não são mutuamente exclusivos; é o mesmo princípio dos contadores
(incremento no use case + reconciler contra drift).

Hoje:
- `DeleteTitleUseCase.execute` → `associationWriter.clear(titleId)` limpa **só**
  `title_authors` + `title_publishers`. **Não** limpa `user_libraries`, `group_works`,
  `store_titles`.

Proposta síncrona (fechar o vazamento na fonte):
- Estender a limpeza no delete do título para as 3 tabelas faltantes. Como
  `group_works`/`store_titles` são filhas de agregados JPA (`Group.translatedWorks`,
  `Store.titles`) e `user_libraries` é `SavedManga`, adicionar `deleteByTitleId(String)`
  nos respectivos JPA repositories (hoje só existe em `TitleAuthor`/`TitlePublisher`) e
  chamá-los no fluxo de delete.
- **Cuidado de counter:** ao deletar de `group_works`, decrementar/recalcular
  `groups.total_titles` dos grupos afetados (senão cria drift que o reconciler corrige só
  no próximo ciclo). Mais simples: após o delete, recomputar `total_titles` dos grupos
  tocados.
- **Cuidado transacional:** o use case é `@Transactional("mongoTransactionManager")`; as
  escritas JPA já correm fora da atomicidade do Mongo (ver DT-52 / Javadoc de
  `TitleAssociationWriter`). A limpeza síncrona herda esse mesmo limite conhecido — daí o
  job continuar necessário como safety net.

Por que **não** confiar só no síncrono: deletes feitos fora do use case (script de
manutenção, migração, delete direto no Mongo, bug futuro) não disparam a limpeza. O job
cobre esses casos. Por que **não** confiar só no job: usuário veria obras "fantasma" na
biblioteca/loja até o próximo ciclo diário. Daí ambos.

---

## 5. Impacto e risco

- **Volume esperado:** normalmente **zero** (com a limpeza síncrona ativa). Picos só após
  bulk delete de títulos ou deletes fora do use case. Full-scan `DISTINCT title_id` nas 5
  tabelas é o custo fixo do job, não o delete.
- **Falso-positivo (RISCO PRINCIPAL):** um `title_id` que existe no Mongo mas o reconciler
  conclui que não existe → **deleta linha válida** (perda de dado do usuário).
  Causas e mitigação:
  - *Forma do `_id`* (ObjectId vs String): conferir **as duas formas** no `$in` (replicar
    `toParentId`). Não tratar isso = apaga refs de títulos com `_id` String.
  - *Janela de criação:* título recém-criado cujo filho já existe mas o título "ainda não
    indexado" — não se aplica (Mongo é read-after-write na mesma instância; não há índice
    secundário assíncrono envolvido na busca por `_id`). Baixo risco. Ainda assim, como
    salvaguarda barata: **ignorar `title_id` com formato inválido** (não-hex e não bate
    nenhum padrão conhecido) em vez de deletar — logar e pular.
  - *Mongo indisponível / query parcial:* se a busca no Mongo falhar ou vier vazia por erro,
    **NÃO** deletar (senão apaga tudo). Guard: se o conjunto "existentes" vier vazio mas
    havia candidatos, abortar o ciclo e logar erro (provável falha de conexão, não 100% de
    órfãos reais).
- **Transacionalidade do job:** deletar **em batch por tabela** (`DELETE ... WHERE title_id
  IN (...)`, chunked), cada tabela em sua transação. Não precisa ser atômico entre tabelas —
  é idempotente e re-executável. Um-por-um seria desnecessariamente lento.
- **Carga:** rodar de madrugada; os `DISTINCT` podem usar os índices existentes
  (`idx_group_works_group` é por group_id, não title_id — `DISTINCT title_id` faz scan;
  aceitável diário, ou avaliar índice por `title_id` se as tabelas crescerem — ver Dúvidas).

---

## 6. Arquivos a criar / modificar

### Criar
- `api/counter-reconciler/.../infrastructure/crossdb/OrphanTitleRefReconciler.java`
  — lógica: coleta `DISTINCT title_id` das 5 tabelas, confere no Mongo (`$in`, chunked,
  tratando ObjectId+String), deleta órfãos em batch, devolve `Map<tabela, removidos>`.
  Guard anti-wipe (não deletar se Mongo veio vazio/erro). Lista das 5 tabelas como
  constante (espelho de `VOTABLE_PARENTS`).
- `api/counter-reconciler/.../crossdb/OrphanTitleRefReconcilerTest.java` — TestContainers
  (Postgres + Mongo), ver §7.

### Modificar
- `CounterReconciliationJob.java` — injetar `OrphanTitleRefReconciler`; chamar **antes** dos
  contadores em `reconcile()`; acrescentar campo ao report. (Decidir: mesmo cron horário ou
  cron próprio diário — recomendo método `@Scheduled` separado só p/ órfãos, ver Dúvidas.)
- `ReconciliationReport.java` — adicionar `Map<String, Long> orphanRefs` (linhas removidas
  por tabela).
- `AdminReconcileController.java` — incluir `orphanRefs` no corpo da resposta + log.
- `application.yml` — `reconciler.orphan.cron` (default diário 03:30).
- `CounterReconciliationJobTest.java` — mockar o novo colaborador; ajustar asserts do report.
- `api/counter-reconciler/README.md` — documentar o novo reconciler e o cron.
- `docs/tech-debt.md` — mover DT-10 de "Adiado" para resolvido (registrar data/decisão).

### (Caminho síncrono — opcional, recomendado em paralelo)
- `LibraryJpaRepository`, `GroupJpaRepository`, `StoreJpaRepository` — adicionar
  `void deleteByTitleId(String titleId)` (modificadora; anotar `@Modifying @Query` p/ as
  join tables de agregado).
- Novos `*RepositoryPort` methods + adapters correspondentes, se a limpeza for chamada via
  porta (seguir o padrão hexagonal — não chamar JPA repo direto do use case).
- `TitleAssociationWriter.clear` **ou** novo `TitleOrphanCleaner` de aplicação — estender
  para as 3 tabelas + recomputar `groups.total_titles` dos grupos afetados.
- `DeleteTitleUseCase` — passar a usar a limpeza ampliada.
- Testes de `DeleteTitleUseCase` cobrindo as 3 tabelas + counter.

---

## 7. Testes necessários

Reconciler (TestContainers Postgres + Mongo, padrão de `PostgresCounterReconcilerTest` /
`MongoReconcilersTest`):
- Título existe no Mongo → filhos **preservados** em todas as 5 tabelas.
- Título ausente no Mongo → filhos **removidos** das 5 tabelas; report conta corretamente.
- Mix: alguns títulos presentes, outros não → remove só os órfãos.
- `_id` String (UUID/seed) presente no Mongo → **não** tratado como órfão (regressão do
  `toParentId`).
- `title_id` inválido / formato inesperado → **pulado**, não deletado.
- **Guard anti-wipe:** Mongo vazio/erro com candidatos presentes → **nada deletado**.
- Após remover de `group_works`, `groups.total_titles` reconciliado bate com o COUNT real.
- Idempotência: segunda execução seguida remove 0.
- `CounterReconciliationJobTest` — report agrega o novo campo; ordem órfãos-antes-contadores.

Síncrono (se implementado):
- `DeleteTitleUseCaseTest` — ao deletar título, as 5 tabelas ficam limpas e
  `groups.total_titles` atualizado.

### Gates (CLAUDE.md)
- `mvn test` 0 failures/0 errors (rodar no módulo `counter-reconciler` e no `server`).
- Sem nova tela → i18n não se aplica.

---

## DÚVIDAS PARA O USUÁRIO

1. **Síncrono + job, ou só job?** Recomendo ambos (fecha vazamento na fonte + safety net).
   Se quiser escopo mínimo do DT-10, faço **só o job** e deixo o caminho síncrono como
   DT separado. Qual prefere?
2. **Cron:** job de órfãos diário separado (`0 30 3 * * *`) ou junto do ciclo horário dos
   contadores? Recomendo separado/diário (mais pesado, sem urgência).
3. **Nome/escopo do serviço:** manter `counter-reconciler` (e ampliar Javadoc) ou prefere
   renomear para algo como `db-reconciler`? Renomear mexe em Dockerfile/compose/README/porta.
4. **Índice por `title_id`:** as 5 tabelas hoje não têm índice em `title_id` (só nas FKs
   pai). Adicionar índice p/ acelerar `DISTINCT`/`DELETE IN`, ou aceitar scan (diário, baixo
   volume)? Adicionar índice = migration Flyway nova (entra no escopo do DT-10?).
5. **`store_titles` tem counter?** Confirmei `groups.total_titles` (reparável). A loja tem
   algum contador desnormalizado de títulos a reparar após delete? (não encontrei — confirmar.)
