# Auditoria Técnica — Manga Reader

> Data: **2026-07-02** · Escopo: repositório completo (backend, frontend web, mobile,
> scripts, banco, integrações, infraestrutura e documentação). Auditoria **sem mudança
> de comportamento**: apenas documentação foi alterada (lista completa no §7).

---

## 1. Estado atual

Monorepo em **Fase 9 (qualidade e polish)**, pré-produção por decisão registrada
(2026-05-16). Três frentes:

| Frente | Estado |
|--------|--------|
| **Backend** (`api/`) | Maduro. Clean Architecture consistente em 17 domínios, dual-DB com migrations disciplinadas (37 Flyway + 20 Mongock), 2 jobs auxiliares bem isolados. Última suíte completa registrada verde (1198 testes, 2026-06-23). |
| **Web** (`web/`) | Maduro. FSD completo no app principal (steiger verde, `tsc` 0 erros), i18n em 3 idiomas, integração real com a API. **Suíte de componentes quebrada no baseline** (DT-53). Landing page em redesign (working tree, não commitado, verde). |
| **Mobile** (`mobile/`) | Início. Fundação (tema/i18n/stores/providers) pronta; Fase 1 (Auth) em andamento; tabs são placeholders. |

### Verificações executadas nesta auditoria

| Verificação | Resultado |
|-------------|-----------|
| `web/manga-reader`: `npx tsc --noEmit` | ✅ 0 erros |
| `web/manga-reader`: `npx steiger ./src` | ✅ "No problems found" |
| `web/manga-reader`: `npx vitest run --pool=forks` | ❌ 425 falhas / 499 passam (DT-53) |
| `web/landing-page`: vitest + tsc | ✅ 54 testes / 20 arquivos, tsc ok |
| `api/core`: `./mvnw test -Dtest.excludedGroups=testcontainers` | ❌ 1080 testes, 18 erros de isolamento em `GroupRepositoryAdapterTest`; classe passa isolada (DT-54) |

Comandos de contagem usados nas métricas (reproduzíveis):
domínios `ls api/core/src/main/java/com/mangareader/domain`; use cases
`find api/core/src/main/java -path "*application*" -name "*UseCase.java" | wc -l`;
controllers `find api/core/src/main/java -name "*Controller.java" | wc -l`;
migrations `ls api/core/src/main/resources/db/migration | wc -l` e
`find api/core/src/main/java -path "*migration*" -name "V*.java" | wc -l`.

---

## 2. Pontos fortes

- **Arquitetura backend disciplinada**: 4 camadas com dependência para dentro, ports &
  adapters de fato (controllers não injetam repositórios — DT-04/DT-23 resolvidos),
  enums com `fromValue` no domínio, argument resolvers para paginação/usuário.
- **Dual-DB tratado com seriedade**: transações Mongo habilitadas (replica set),
  contadores desnormalizados com caminho quente + rede de segurança idempotente
  (`orphan-cleaner`), agregação de avaliações isolada em serviço próprio com evento +
  reconciliação. Guard anti-wipe no limpador de órfãos.
- **FSD no frontend levada a rigor incomum**: camadas/segmentos canônicos, cross-import
  via `@x`, lint de boundary automatizado, dead code removido em levas auditadas.
- **Cultura de dívida técnica escrita**: `docs/tech-debt.md` registra decisões, estados
  e verificações por item — raro em projeto pessoal e valioso para retomar contexto.
- **i18n de ponta a ponta** com separação correta UI (JSON) × conteúdo (DB-labels).
- **Migrações de dados com verificação**: runner cross-DB do fórum aborta em divergência
  de contagem; V009 testada pela orquestração real do Mongock.

## 3. Pontos fracos e riscos

1. **Gate de testes do frontend inoperante (DT-53)** — o risco mais concreto: qualquer
   regressão de UI passa sem detecção, e a disciplina de "suíte verde" perde sentido
   enquanto o baseline está vermelho. É também a causa de testes do fórum não terem
   sido reescritos (DT-50).
2. **Suíte leve do backend flaky (DT-54)** — o caminho "sem Docker" prometido pela
   DT-22 não é confiável hoje.
3. **Documentação de fatos voláteis por contagem fixa** — README trazia números
   (domínios, use cases, testes) muito defasados (ex.: "15 domínios/123 use cases/19
   migrations" vs 17/154/37 reais). Contagem embutida em doc envelhece rápido; agora os
   números são datados e têm comandos de reprodução, mas a causa raiz é a política de
   documentação exigir contagens (ver recomendação §5).
4. **Privacidade da biblioteca pública (DT-49)** — endpoint expõe biblioteca de
   qualquer usuário sem checar visibilidade; vira incidente de privacidade em produção.
5. **Escrita cross-DB não-atômica (DT-52)** — janela de divergência conhecida e
   mitigada, mas permanece aberta até decisão de modelagem.
6. **Trabalho não commitado acumulado** — redesign completo da landing page vive só no
   working tree (40+ arquivos). Perda de disco = perda do trabalho.
7. **Mobile ainda sem testes** — nenhum runner configurado (`package.json` não tem
   script de teste); aceitável na fase atual, mas deve entrar antes das telas de dados.
8. **Resíduos de higiene** — dir morto `backend/` na raiz (DT-55), `packages/assets`
   fora do workspace (DT-56).

### Problemas de documentação encontrados (corrigidos nesta auditoria)

- README raiz descrevia estrutura inexistente (`backend/`, `frontend-apps/`), rotas
  antigas (`/api/ratings`), afirmava que o job de agregação "não existe" (existe desde
  a criação do `rating-aggregator`) e trazia contagens defasadas.
- `docs/architecture.md` e `CLAUDE.md` diziam "12 domínios" (são 17 pacotes) e citavam
  a coleção pelo nome antigo `title_rating_aggregate` (hoje `reviews_aggregate`); a
  tabela dual-DB ainda colocava o fórum no Postgres.
- `docs/services/jobs/*.md` eram **cópias byte-a-byte** (exceto 1 link) dos READMEs dos
  jobs, sem nenhuma referência apontando para elas — removidas.
- `mobile/mobile.md` era o planejamento antigo com estrutura **contraditória** ao
  `mobile/README.md` (propunha `components/services/stores`, não-FSD) — removido.
- `mobile/README.md` documentava comandos inexistentes (`pnpm start`) e estrutura
  divergente da real (`src/app` vs `src/application`) — corrigido.

## 4. Arquitetura e organização — avaliação

- **Boundaries**: sem violações detectadas pelos linters (steiger verde; camadas do
  backend respeitadas por convenção verificada nas auditorias DT-24..DT-43).
- **Duplicação**: as levas de 2026-05/06 removeram o grosso (componentes stale,
  constantes mortas, formatadores triplicados). Restante conhecido: páginas-form
  legadas do admin (DT-51, atrás de decisão de produto).
- **Acoplamento**: jobs desacoplados do core por design (sem jar compartilhado);
  ponto de atenção é o contrato implícito `RatingEvent` por FQN replicado — mitigado
  com `TypePrecedence.INFERRED`, documentado.
- **Padrões mistos aceitos e documentados**: landing-page não segue FSD (app de página
  única — divergência razoável, agora registrada em `web/README.md`); imports por
  segmento em `shared/` são idioma deliberado (steiger off com rationale).
- **Nomenclatura**: renames de clareza já feitos (catalog-filter, reviews, TitleInfoCard
  etc.). Não encontrei novos casos graves.

## 5. Recomendações

1. **Consertar o gate de testes primeiro** (DT-53): sem ele, o restante do plano de
   qualidade não tem lastro. Depois, re-registrar a contagem real e reescrever os
   testes do fórum (DT-50).
2. **Estabilizar a suíte leve** (DT-54) para restaurar o fluxo sem Docker.
3. **Fechar DT-49 (visibilidade da biblioteca)** antes de qualquer exposição pública —
   é pequeno e elimina um risco de privacidade.
4. **Commitar o redesign da landing page** em branch própria.
5. **Política de documentação**: trocar a regra "atualizar contagem de testes no
   README" (`docs/documentation-policy.md`) por "números sempre datados + comando de
   reprodução" — contagens fixas foram a maior fonte de drift encontrada.
6. Higiene: remover `backend/` local (DT-55); decidir o destino de `packages/assets`
   (DT-56); atualizar nota de runtime local (JDK 25 → o ambiente voltou a JDK 23).

## 6. Plano de correção em fases

| Fase | Conteúdo | Esforço |
|------|----------|---------|
| **1 — Restaurar gates** | DT-53 (bump jest-dom/vitest + suíte completa verde), DT-54 (isolamento H2) | 0,5–1 dia |
| **2 — Segurança/privacidade** | DT-49 (visibilidade da biblioteca) + commit da landing page | horas |
| **3 — Qualidade contínua** | Reescrever testes do fórum (pós-DT-53); testes no mobile antes das telas de dados | 1–2 dias |
| **4 — Dívidas de arquitetura** | DT-52 (decisão junções × campos texto), DT-51 (decisão de produto + remoção) | planejamento |
| **5 — Pré-produção** (quando decidir ir) | DT-03 CI/CD, DT-02 E2E, DT-08 a11y final, DT-09 legais, DT-21 staging dump, DT-50 fase 2 | ver `docs/deployment-plan.md` |

## 7. O que foi alterado nesta auditoria (somente documentação)

**Removidos** (duplicados/legados):
- `docs/services/jobs/rating-aggregator.md` e `docs/services/jobs/orphan-cleaner.md` (cópias dos READMEs dos jobs)
- `mobile/mobile.md` (planejamento legado contraditório ao README)

**Atualizados**:
- `README.md` (raiz) — estrutura real, contagens datadas, gates com estado honesto, rotas `/api/reviews`, seção de avaliações reescrita (aggregator), links novos
- `mobile/README.md` — estado atual, estrutura real (`app/` + `src/application`), comandos corretos, checklist com `pnpm check`
- `docs/architecture.md` — 17 domínios, coleções renomeadas, dual-DB atualizado
- `CLAUDE.md` — contagem de domínios
- `docs/tech-debt.md` — data, ponteiro para a visão consolidada, DT-53..DT-56, resumo por prioridade

**Criados**:
- `api/README.md`, `web/README.md` (visões de módulo)
- `TECHNICAL_DEBT.md` (visão consolidada por categoria)
- `PROJECT_AUDIT.md` (este documento)

## 8. O que NÃO foi alterado

- **Nenhum código de produção, teste, configuração de build, migration ou dependência.**
- O working tree da landing page (redesign em andamento) foi deixado intacto.
- `backend/.idea/` local não foi apagado (artefato de IDE do dono — DT-55).
- `mobile/.expo/README.md` (gerado pelo Expo) e os READMEs dentro das pastas de
  design/handoff gitignoradas foram mantidos como estão.
- Nenhuma dívida foi "resolvida silenciosamente": correções que exigem código estão
  registradas em `TECHNICAL_DEBT.md`/`docs/tech-debt.md`.

## 9. Riscos pendentes (pós-auditoria)

1. DT-53 mascara o estado real da qualidade do frontend até ser corrigido.
2. A contagem de testes do backend (1198) é a última execução completa registrada
   (2026-06-23); a suíte completa com Docker não foi re-executada nesta auditoria.
3. DT-49 permanece explorável em ambiente exposto.
4. Redesign da landing page segue sem commit.
