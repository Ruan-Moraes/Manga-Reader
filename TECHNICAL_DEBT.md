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

### DT-53 — Suíte de componentes do frontend quebrada no baseline (jest-dom × Vitest 4) 🔴

- **Local**: `web/manga-reader` (`@testing-library/jest-dom` 6.9.1 + `vitest` 4.1.4)
- **Descrição**: os matchers do jest-dom (`toBeInTheDocument`, `toBeDisabled`, `toHaveAttribute`, …) não são registrados — todo teste de componente falha com `Invalid Chai property`. Medição 2026-07-02: **425 falhas / 499 passam** (924 testes, 137 arquivos). Reproduzível em arquivo isolado (`Button.test.tsx`). Já havia sido observado como "jest-dom quebrado no sandbox" (nota em DT-47) — está quebrado no ambiente local também.
- **Impacto**: o gate de testes documentado no `CLAUDE.md` está inutilizado; regressões de UI passam despercebidas; qualquer contagem de testes publicada fica sem lastro.
- **Gravidade**: **Alta** | **Prioridade**: **Alta**
- **Correção sugerida**: atualizar `@testing-library/jest-dom` para versão com suporte a Vitest 4 (ou fixar Vitest 3.x até lá) e revalidar `src/test/setup.ts` (`import '@testing-library/jest-dom/vitest'`). Depois, rodar a suíte completa e re-registrar o número real de testes verdes.
- **Pode ser corrigido agora?** Sim — mudança pequena de dependência, mas exige rodar a suíte inteira para validar (pode expor falhas reais mascaradas, ex.: asserção de classe em `Button > size sm`).

### DT-54 — Flake de isolamento na suíte leve do backend (H2) 🟠

- **Local**: `api/core` — `GroupRepositoryAdapterTest` (`@DataJpaTest` + H2)
- **Descrição**: `./mvnw test -Dtest.excludedGroups=testcontainers` falha com **18 erros** `Table "USERS" not found (this database is empty)`; a mesma classe passa **verde isolada** (medição 2026-07-02: 1080 testes, 18 erros). Interação entre cache de contexto Spring e ciclo de vida do banco H2 in-memory.
- **Impacto**: a "suíte leve sem Docker" (DT-22) não é confiável como gate; desenvolvedores sem Docker não conseguem validar o backend.
- **Gravidade**: **Média** | **Prioridade**: **Média**
- **Correção sugerida**: investigar a URL H2 do profile `test` (nome de banco compartilhado + `DB_CLOSE_DELAY`) e a ordem/caching de contextos; alternativa: `@AutoConfigureTestDatabase` com banco único por classe.
- **Pode ser corrigido agora?** Exige investigação curta (horas), não refatoração.

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

### DT-49 — Biblioteca pública sem checagem de visibilidade 🟠

- **Local**: `GET /api/library/user/{userId}`
- **Descrição**: expõe a biblioteca de qualquer usuário sem respeitar `VisibilitySetting` (o enriched profile já filtra comentários/histórico).
- **Impacto**: vazamento de dado de preferência do usuário — vira problema de **privacidade** em produção.
- **Gravidade**: Média (Alta em produção) | **Prioridade**: Média
- **Correção**: aplicar o mesmo padrão de visibilidade do enriched profile no use case da biblioteca. **Pode ser corrigido agora** (escopo pequeno e conhecido).

### DT-51 — Páginas/rotas de formulário legadas do admin

- **Local**: `features/admin/ui/Admin*Form`, rotas `dashboard/*` de deep-link, `FormModal`/`AdminModal`
- **Descrição**: o redesign moveu criação/edição para modais; as páginas-form antigas seguem montadas no router (só alcançáveis por URL), com tokens fora do DS.
- **Impacto**: duplicação de UI e superfície de rota órfã. **Gravidade**: Baixa | **Prioridade**: Baixa. Exige decisão de produto + migração de `PlanFormModal` antes (pré-condições em `docs/tech-debt.md`).

## 3. Produto / Funcionalidades incompletas

### DT-48 — Perfil com seções simuladas

- **Local**: `pages/profile` + `src/mock/userProfile.ts`
- **Descrição**: seguidores/seguindo, grupos seguidos, feed de atividade e handle/verificado ainda são mock (não existe domínio social no backend). Gêneros favoritos já são reais (V37).
- **Impacto**: perfil mistura dado real e fake. **Gravidade**: Baixa | **Prioridade**: Baixa — cada item é um épico próprio (passar pela skill `database-design`).

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
| **Alta** | DT-53 (jest-dom × Vitest 4) |
| **Média** | DT-54 (flake suíte leve H2), DT-49 (visibilidade da biblioteca), DT-52 (cross-DB não-atômico), DT-50 residuais (testes fórum, threads profundas) |
| **Baixa** | DT-48, DT-51 |
| **Resolvidos 2026-07-02** | DT-55, DT-56 |
| **Adiados (não-prod)** | DT-02 (E2E), DT-03 (CI/CD), DT-08 (a11y residual), DT-09 (legais), DT-44 (backlog), DT-21 (staging dump), DT-50 fase 2 (drop fórum PG) |

**Corrigíveis agora, sem refatoração maior**: DT-53, DT-49, DT-55, DT-56 (e DT-54 com investigação curta).
