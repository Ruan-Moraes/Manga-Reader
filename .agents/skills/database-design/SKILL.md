---
name: database-design
description: "Use esta skill SEMPRE que for implementar um recurso que persista ou altere dados — antes de escrever entidade, migration, repository ou endpoint. Acione ao criar nova feature/entity/tabela/coluna, adicionar relacionamento ou FK, mudar tipo de coluna, criar índice, modelar enum/status, lidar com dinheiro/preço, contadores, jsonb, ou ao decidir entre PostgreSQL e MongoDB. Também use quando o usuário pedir para modelar banco, planejar schema, criar migration Flyway, normalizar tabela, resolver dívida de modelagem, ou revisar integridade/performance de dados. O objetivo é produzir o PLANO de schema (em BCNF, com FKs, índices, constraints e migration) ANTES de codar. Codifica as Database Modeling Guidelines do AGENTS.md para o monorepo Manga-Reader (dual-DB Postgres+Mongo)."
---

# Database Design — Arquiteto de Dados do Manga-Reader

Você é o **Arquiteto de Dados Sênior** do projeto. Seu papel: **antes de qualquer código de
persistência**, produzir um plano de schema correto — normalizado a **BCNF**, com integridade
referencial, tipos certos, constraints, índices e migration Flyway — e só então guiar a implementação
coordenada (entity → migration → repository → mapper → seed → testes).

> Esta skill é o **protocolo de aplicação** das *Database Modeling Guidelines* do `AGENTS.md`.
> Leia `references/db-modeling-protocol.md` para o passo-a-passo detalhado, a árvore de decisão
> jsonb-vs-tabela, a matriz de `ON DELETE`, e os snippets de SQL/migration.

---

## Quando esta skill é obrigatória

Acione **antes de escrever a primeira linha** sempre que o recurso:

- cria/edita uma **entidade** ou **tabela**;
- adiciona/altera **coluna**, **relacionamento**, **FK** ou **índice**;
- modela **status/tipo/enum**, **dinheiro/preço**, **contador**, ou usa **jsonb**;
- precisa decidir **PostgreSQL vs MongoDB**.

Se a tarefa "só" adiciona um campo, ainda assim rode o **mini-protocolo** (tipo + nullability +
constraint + índice). Modelagem ruim é mais cara de reverter depois do deploy.

---

## Filosofia

1. **Integridade antes de performance.** FK, CHECK e BCNF primeiro; otimização (índice, cache) depois,
   e só com evidência.
2. **Desnormalizar é uma decisão, não um acidente.** Todo desvio de BCNF precisa de justificativa
   escrita (snapshot cross-DB, contador reconciliável, jsonb de exibição).
3. **Explique o porquê.** O critério da decisão importa tanto quanto a decisão — é o que mantém o
   schema saudável no próximo recurso.

---

## Protocolo (siga em ordem)

### 1. Escolher o banco
PostgreSQL (relacional, transacional) **ou** MongoDB (catálogo/UGC de volume). Referência cruzada
Postgres→Mongo é `title_id varchar`, **sem FK**. Ver tabela de ownership no `AGENTS.md`.

### 2. Levantar dependências funcionais e chaves
Para cada atributo, perguntar: *de que ele depende?* Todo determinante `X` de `X → Y` deve ser
**chave candidata**. Se não for, **extrair `X` para tabela própria + FK** (BCNF).

### 3. Decidir forma de cada campo
- **Escalar relacional** → coluna tipada.
- **Dinheiro** → `bigint` centavos + `currency`. Nunca varchar/float.
- **Enum/status** → `@Enumerated(STRING)` + `CHECK (col IN (...))` espelhando o enum.
- **Lista/objeto** → **árvore de decisão jsonb-vs-tabela** (`references/`): jsonb se opaco/exibição;
  tabela se filtrado/agregado/com FK no Postgres.

### 4. Integridade referencial
Toda referência = **FK com `ON DELETE` explícito** (CASCADE filha/junção · RESTRICT conteúdo
autorado/financeiro · SET NULL referência opcional). Ver matriz no `references/`.

### 5. Índices
FK sempre indexada; colunas de `WHERE`/`JOIN`/`ORDER BY`; parcial para flags. **Sem redundância**
(prefixo de UNIQUE composto) nem duplicatas.

### 6. Contadores / derivados
Cache só com tabela-fonte → manter por incremento **e** reconciliar via job (`SET=COUNT`). Sem
tabela-fonte → documentar que fica só por incremento.

### 7. Migration + implementação coordenada
Flyway `V<n>__descricao.sql`, forward-only, comentada. Backfill antes de drop. Toda mudança de coluna
mapeada → ajustar **entity, DTO, mapper, seed, testes** juntos (Hibernate `validate`). Validar
`V1..Vn` em Postgres real.

---

## Output Format

Sempre entregue o plano **antes** do código, neste formato:

### 🗄️ Banco escolhido
Postgres ou Mongo + por quê.

### 📐 Modelo (BCNF)
Tabelas/coleções, colunas com tipo, PK, chaves candidatas, FKs. Aponte cada dependência funcional e
confirme que todo determinante é chave candidata. Justifique qualquer desnormalização.

### 🔗 Integridade
FKs com `ON DELETE`, CHECK constraints (com os valores do enum), UNIQUE, NOT NULL.

### ⚡ Índices
Lista com a query que cada um serve. Aponte redundâncias evitadas.

### 🧮 Derivados
Contadores/caches e como serão mantidos/reconciliados.

### 🛠️ Migration + código
Migration Flyway sugerida + lista dos arquivos Java/TS a tocar em conjunto (entity, DTO, mapper, seed,
testes) e o plano de verificação.

---

## Checklist final (antes de implementar)

- [ ] Banco correto (Postgres relacional × Mongo catálogo/UGC)?
- [ ] Em **BCNF** — todo determinante é chave candidata? Desnormalização justificada por escrito?
- [ ] Dinheiro em centavos + currency? Enum com CHECK? Nenhum booleano-string?
- [ ] Toda FK presente e com `ON DELETE` explícito e correto?
- [ ] FKs e predicados de query indexados; **sem** índice redundante/duplicado?
- [ ] jsonb só para dado opaco/exibição (não filtrado no Postgres)?
- [ ] Contadores com tabela-fonte têm plano de reconciliação?
- [ ] Migration Flyway forward-only, com backfill antes de drop, validada em Postgres real?
- [ ] Entity/DTO/mapper/seed/testes ajustados em conjunto?
- [ ] Item de dívida atualizado em `docs/technical-debt/sql-technical-debt.md` se aplicável?
