# CLAUDE.md

## Project Overview

**Manga Reader** — plataforma para leitura de mangás, manhwas e manhuas. Monorepo com Spring Boot (backend) e React (frontend).

## Build & Run

### Backend (`/api/core/`)

```bash
mvn test                                        # Todos os testes (JUnit 5 + Mockito + H2 + TestContainers)
mvn test -Dtest=UserTest                        # Classe específica
mvn test -Dtest=UserTest#shouldInitialize...    # Método específico
mvn test -Dtest=**/domain/**/*Test              # Por camada (domain/application/presentation/infrastructure)
mvn package -DskipTests                         # Build JAR
mvn spring-boot:run                             # Iniciar (Docker Compose sobe automaticamente)
```

### Frontend (`/web/manga-reader/`)

pnpm workspace (raiz `web/`). Rodar por workspace com `--filter manga-reader`
ou `cd web/manga-reader` + `npx`:

```bash
pnpm --filter manga-reader dev          # Dev server :5173 (proxy API → :8080)
pnpm --filter manga-reader build        # TypeScript check + production build
pnpm --filter manga-reader lint:fsd     # Boundary lint (steiger) — gate que importa, verde
npx tsc --noEmit                        # Type-check gate (rodar dentro do app)
npx vitest run --pool=forks             # Suíte completa (--pool=forks obrigatório neste sandbox)
```

> `npm run lint` (eslint+prettier) é **vermelho no baseline** repo-wide — não usar
> `format`/`--fix` para "corrigir" arquivos (colapsa o JSX expandido do projeto).
> Combinar o estilo dos vizinhos. `lint:fsd` (steiger) e `tsc --noEmit` são os gates.

### Infra

Docker Compose em `/api/docker-compose.yml`: PostgreSQL 17, MongoDB 8.0, RabbitMQ 4, Redis 7. Gerenciado automaticamente via `spring-boot-docker-compose`. Prod: `/api/docker-compose.prod.yml` (serviço `app` em `./core`, `rating-aggregator` em `./jobs/rating-aggregator` porta 8081, `orphan-cleaner` em `./jobs/orphan-cleaner` porta 8082).

### Serviços auxiliares (`/api/`)

Microserviços standalone que rodam fora da API principal (mesmo padrão: Spring Boot,
`@Scheduled` + gatilho manual `POST /admin/reconcile` protegido por token, infra subida
pelo `core`). Ver README de cada um:

- **`jobs/rating-aggregator`** (8081) — agrega avaliações em `title_rating_aggregate`.
- **`jobs/orphan-cleaner`** (8082) — duas redes de segurança Postgres↔Mongo: reconcilia
  contadores desnormalizados (drift) de Postgres (`groups.total_titles`,
  `events.participants`) e Mongo (`replyCount`, votos), de hora em hora; e limpa
  referências órfãs cross-DB (`title_id` sem título no Mongo), diariamente.

---

## Guidelines detalhadas

Estes guias são **normativos** (contrato do projeto). Estão em `docs/` em vez de
inline para manter este arquivo curto — **ler o doc relevante antes de mexer na
área correspondente**:

- **Arquitetura & padrões** → [`docs/architecture.md`](docs/architecture.md) — antes
  de criar controller/use case/mapper, mexer em domínio, dual-DB, rating-aggregator,
  i18n ou contrato de resposta da API. Clean Architecture (4 camadas), 12 domínios,
  Postgres+Mongo, `api/jobs/rating-aggregator`, key patterns, i18n (DB-labels + UI×conteúdo).
- **ORM & Persistência** → [`docs/orm-persistence.md`](docs/orm-persistence.md) —
  qualquer mudança que toque repository/JPA/Mongo: `@Transactional`, N+1, projeções,
  paginação, índices, batch, cascade, pool, observabilidade + checklist de merge.
- **Modelagem de banco** → [`docs/database-modeling.md`](docs/database-modeling.md) —
  **obrigatório antes** de entity/migration/coluna/FK/enum; usar junto da skill
  `database-design`. Escolha dual-DB, BCNF, jsonb×tabela, tipos/constraints, Flyway.
- **Clean Code & estilo** → [`docs/clean-code.md`](docs/clean-code.md) — naming,
  imports (preferir `import`/`import static`), Tailwind (tokens `mr-*`), mobile-first,
  i18n obrigatório em telas novas.
- **Testes** → [`docs/testing.md`](docs/testing.md) — workflow TDD-like, anotações por
  camada, cobertura exigida por tipo de mudança, exemplos e limitações conhecidas
  (H2, TestContainers, Mongock, lazy collections).
- **Layout do código (FSD)** → [`docs/source-layout.md`](docs/source-layout.md) — onde
  colocar cada arquivo, entity×feature, public API por barrel, regras de boundary/import.
- **Política de documentação** → [`docs/documentation-policy.md`](docs/documentation-policy.md)
  — o que atualizar (README/docs/tech-debt/locales) por tipo de mudança.

Aplicação concreta de i18n (receitas de nova entidade traduzível) →
[`docs/i18n-guide.md`](docs/i18n-guide.md).

---

## Verification Checklist

Antes de considerar qualquer tarefa concluída:

1. `mvn test` passa com **0 failures, 0 errors**
2. `cd web/manga-reader && npx tsc --noEmit` compila com **0 errors**
3. Todo requisito novo/alterado tem teste correspondente
4. Nenhum teste existente foi quebrado ou deletado sem justificativa
5. Commits pequenos e focados com mensagens claras
6. Branch names significativos
7. **[Nova tela]** i18n implementado — sem textos hardcoded, todas as chaves presentes em todos os idiomas suportados
8. **[Mudança em persistência]** Checklist de ORM aplicado (ver [`docs/orm-persistence.md`](docs/orm-persistence.md))
