# Dívidas Técnicas — Visão Consolidada

> Medição: **2026-07-02** (auditoria técnica — ver [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md)).
>
> Este documento é a **visão consolidada por categoria** das dívidas em aberto.
> O histórico detalhado de cada item (contexto, decisões, o que já foi resolvido)
> vive em [`docs/tech-debt.md`](docs/tech-debt.md), que continua sendo o log
> canônico por item `DT-NN`. Ao resolver uma dívida, atualizar **os dois**.

**Contexto de priorização** (decisão 2026-05-16): o projeto ainda não vai a produção.
Itens que exigem infraestrutura grande (CI/CD, observabilidade, E2E, conteúdo legal)
estão **adiados como não-bloqueantes** e permanecem listados.

---

## 1. Testes e Qualidade

### ~~DT-53 — Suíte de componentes do frontend quebrada (jest-dom × Vitest 4)~~ — **Resolvido (2026-07-02)**

Causa: duas majors de vitest no workspace faziam a entry `/vitest` do jest-dom estender o expect errado. Fix: `expect.extend` explícito no `setup.ts` + triagem dos testes desatualizados enquanto a suíte esteve quebrada (providers no helper, rotas `/api/reviews`, contrato `textContent`, redesigns de Groups/GroupProfile/UserProfile/Chapter). Suíte: **923 testes, 0 falhas**. Detalhes em `docs/tech-debt.md`.

### ~~DT-54 — Flake de isolamento na suíte leve do backend (H2)~~ — **Resolvido (2026-07-02)**

URL H2 fixa compartilhada + `create-drop` derrubava o schema sob contextos cacheados. Fix: banco único por contexto via `${random.uuid}` na URL (`application-test.yml`). 2× `./mvnw test -Dtest.excludedGroups=testcontainers` → 1080 testes, 0 erros.

### DT-02 (residual) — Sem E2E de frontend

- **Local**: `web/manga-reader`
- **Descrição**: não há Playwright/E2E para fluxos críticos (auth, navegação, leitura).
- **Impacto**: fluxos ponta a ponta só são validados manualmente. **Gravidade**: Média | **Prioridade**: Alta quando for a produção; **adiado (não-prod)**.
- **Correção**: Playwright para auth + leitura de capítulo. Exige planejamento.

### DT-50 (residuais) — Testes de página do fórum + threads profundas

- **Local**: `web/manga-reader/pages/forum`, backend `comments`
- **Descrição**: `ForumTopic.test.tsx` referencia o fluxo antigo (bloqueado por DT-53); paginação/lazy-load de threads de comentários com profundidade ilimitada ainda não existe.
- **Impacto**: payload/N+1 potencial em threads grandes. **Gravidade**: Média | **Prioridade**: Média. Reescrever testes após DT-53; paginação exige planejamento.

### DT-21 (residual, só-infra) — Migração V009 nunca validada contra dump real

- **Local**: `api/core` Mongock `V009MigrateChaptersToCollection`
- **Descrição**: lado-código fechado (teste de orquestração real); falta exercitar contra dump de produção em staging. Runbook documentado em `docs/tech-debt.md`.
- **Impacto**: risco residual no primeiro deploy. **Gravidade**: Baixa hoje, Alta no deploy | **Prioridade**: bloqueia primeiro deploy. Exige infra de staging.

## 2. Arquitetura e Backend

### DT-52 — Escrita cross-DB não-atômica em autores/editoras de título 🟠

- **Local**: `Create/Update/DeleteTitleUseCase` + `TitleAssociationWriter`
- **Descrição**: escrita do título (Mongo, tx `mongoTransactionManager`) e das junções `title_authors`/`title_publishers` (Postgres, tx JPA) não são atômicas.
- **Impacto**: janela de divergência entre bancos; tolerável enquanto os campos texto (`author`/`artist`/`publisher`) seguem canônicos e o `orphan-cleaner` cobre o caminho frio.
- **Gravidade**: Média | **Prioridade**: Média
- **Correção**: ao tornar as junções fonte canônica, avaliar outbox/saga ou mover título p/ Postgres. **Exige planejamento** (decisão de modelagem).

### DT-50 (fase 2) — Drop das tabelas Postgres do fórum

- **Local**: Flyway (futura `V38+__drop_forum_postgres_tables`)
- **Descrição**: fórum migrou para Mongo; as tabelas PG ficam como rollback até confirmar o Mongo em produção. Criar o drop **somente** num deploy posterior.
- **Gravidade**: Baixa | **Prioridade**: pós-produção. Planejado de propósito — não antecipar.

### ~~DT-49 — Biblioteca pública sem checagem de visibilidade~~ — **Resolvido (2026-07-02)**

Coluna `library_visibility` (Flyway V38) + `LibraryVisibilityService` no padrão do enriched profile (privado ⇒ página vazia); toggle "Biblioteca" na aba de privacidade (i18n pt/en/es). Detalhes em `docs/tech-debt.md`.

### ~~DT-51 — Páginas/rotas de formulário legadas do admin~~ — **Resolvido (2026-07-02)**

Decisão de produto confirmada: criar/editar por URL direta eliminado. `PlanFormModal` migrado p/ shared `Modal`; `DashboardGroupDetail` abre `GroupFormModal` in-page; removidos 4 páginas-form, 3 hooks de rota, `FormModal`, `EventFormField`, 7 rotas e 7 constantes. `AdminModal` mantido (ConfirmDeleteModal). Gates verdes.

## 3. Produto / Funcionalidades incompletas

### DT-48 — Perfil com seções simuladas — **Resolvido em sua maior parte (2026-07-02)**

Grafo social entregue em **Neo4j** (follow/unfollow, listas, contagens), handle/verificado (V39) e grupos seguidos (SUPPORTER) reais no perfil. **Residual (Baixa)**: feed de atividade (segue mock), endpoint admin de `verified`, varredura Postgres×Neo4j, cache de contadores. Detalhes em `docs/tech-debt.md`.

### DT-44 — Backlog de produto não implementado (adiado, não-prod)

Upload de arquivos (capas/avatares/páginas), endpoints `related`, busca global cross-domain, validação client-side dos forms restantes (Forgot/Reset, Edit Profile, Publish Work, Create Event, Forum Topic). Detalhes em `docs/tech-debt.md`.

### DT-09 — Conteúdo placeholder nas páginas legais (adiado, não-prod)

Estrutura/UI/i18n prontas; falta texto legal vinculante (revisão jurídica — não é tarefa de engenharia). **Bloqueia produção.**

## 4. Infra / Produção (adiados por decisão)

- **DT-03 — Sem CI/CD**: nenhum workflow. Quando for a produção: GitHub Actions lint → test → build (`docs/deployment-plan.md`).
- **DT-08 (residual) — a11y**: axe por rota implementado em 29 rotas; falta navegação por teclado completa fora de overlays e auditoria sistemática final.

## 5. Higiene de repositório e documentação

### ~~DT-55 — Diretório morto `backend/` na raiz~~ — **Resolvido (2026-07-02)**

Removido localmente (`rm -rf backend/`; continha só `.idea/` não versionado).

### ~~DT-56 — `web/packages/assets` fora do workspace~~ — **Resolvido (2026-07-02)**

Promovido a `@manga-reader/assets` (`package.json` privado); apps seguem consumindo via `publicDir` relativo nos `vite.config.ts`.

### Trabalho não commitado (risco, não dívida)

- Redesign da **landing-page** em andamento no working tree (seções novas Compare/Demo/Final/MobileApp/Stats + testes; 54 testes verdes, `tsc` ok em 2026-07-02). Commitar em branch própria para não perder o trabalho.

---

## Resumo

| Prioridade | Itens |
|-----------|-------|
| **Alta** | — |
| **Média** | DT-52 (cross-DB não-atômico), DT-50 residuais (testes fórum, threads profundas) |
| **Baixa** | DT-48 residuais (feed de atividade, endpoint admin de verified, varredura Postgres×Neo4j) |
| **Resolvidos 2026-07-02** | DT-48 (núcleo: grafo social Neo4j + handle/verified + grupos seguidos), DT-49, DT-51, DT-53, DT-54, DT-55, DT-56 |
| **Adiados (não-prod)** | DT-02 (E2E), DT-03 (CI/CD), DT-08 (a11y residual), DT-09 (legais), DT-44 (backlog), DT-21 (staging dump), DT-50 fase 2 (drop fórum PG) |

**Corrigíveis agora, sem refatoração maior**: DT-53, DT-49, DT-55, DT-56 (e DT-54 com investigação curta).
