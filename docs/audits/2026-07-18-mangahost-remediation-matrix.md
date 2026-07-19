# Matriz de remediação das configurações do Mangahost — 18/07/2026

## Proteção da linha de base

- Branch: `feat/auth-refresh-rotation`
- Commit inicial: `3cfaafcf5113fd840b062964b512239a5015ffca`
- Working tree: sujo antes da remediação, com alterações preexistentes em API, web,
  landing, documentação e assets. Nenhuma delas pode ser descartada ou revertida.
- Auditoria de origem:
  [`2026-07-18-mangahost-config-audit.md`](2026-07-18-mangahost-config-audit.md).
- Superfície Sites: não há `.openai/hosting.json`; a aplicação existente permanece no
  monorepo Vite/Spring/Expo, sem inicialização ou publicação de um projeto Sites.

## Matriz A-01–A-12

| ID | Problema | Módulos | Arquivos/símbolos iniciais | Correção prevista | Testes principais | Estado |
|---|---|---|---|---|---|---|
| A-01 | Refresh JWT idêntico no mesmo segundo | API/auth/PostgreSQL | `JwtTokenProvider`, `RefreshTokenUseCase`, `refresh_tokens.token_hash` | `jti` único, validação de tipo/JTI, conflito controlado e rotação atômica | unitário, integração, concorrência e multi-instância simulada | implementado e verificado |
| A-02 | Preferências sem consumidor e fonte dupla | web/mobile/API settings | `mr.settings.v1`, `reader:prefs`, `useChapterReader`, `user_system_settings` | contrato tipado único em `entities/user`, migração local idempotente e consumidores reais | storage vazio/parcial/inválido/legado, API e reload | implementado e verificado |
| A-03 | Tema `LIGHT` recebe semântica escura | web/mobile | `entities/user/lib/accessibility.ts`, providers de tema | tokens/classes claros reais e hidratação coerente | DOM, reload e preferência do sistema | implementado e verificado |
| A-04 | `DO_NOT_TRACK` e conteúdo adulto incompletos | API/web/mobile/Mongo | privacy use cases, ingestão de eventos, catálogo/cards/leitor | separar visibilidade/coleta; filtrar `HIDE` no servidor e aplicar `BLUR`/`SHOW` no cliente | dono/terceiro/anônimo, busca, paginação, cache | implementado e verificado |
| A-05 | Aba Dados executa somente toasts | web/API | `DataTab`, histórico, cache e exportação | cache medido/limpo, histórico real com confirmação, exportação versionada; importação removida ou indisponível até ser segura | API, download, cache e estados de erro | implementado e verificado; importação indisponível por desenho |
| A-06 | Invalidações ausentes ou antes do commit | API/Redis | `CacheConfig`, mutações de título/tag/plano/stats/review | chaves centralizadas e eventos pós-commit com observabilidade | commit/rollback/Redis indisponível | implementado e verificado |
| A-07 | SMTP opcional derruba health | API/Compose/docs | Actuator groups, `application.yml`, Compose | separar liveness/readiness/detalhado e excluir mail opcional da readiness | smoke dos três endpoints | implementado e verificado |
| A-08 | Workaround Mongo 8 não cobre Testcontainers | API e jobs | todos os `MongoDBContainer` | helper compartilhável por módulo a partir de uma única política documentada | suítes Mongo nos quatro módulos | implementado e verificado |
| A-09 | Change units/índices de trending ausentes | trending job/Mongo | Mongock config, `V001CreateTrendingIndexes`, `V002CreateMetricRankingIndexes` | corrigir runner/scan/changelog e validar índices/TTL no startup test | contrato, startup e inspeção de índices | implementado e verificado em startup Testcontainer |
| A-10 | Overrides dos jobs não chegam ao Compose prod | jobs/infra/docs | properties dos jobs, `api/docker-compose.prod.yml` | properties tipadas e todos os overrides suportados no Compose | binding e startup inválido | implementado e verificado |
| A-11 | Segurança/rate limit hardcoded e local por JVM | API/Redis/infra | `RateLimitFilter`, JWT/cleanup/cache properties | properties validadas, Redis, proxies confiáveis e mensagens derivadas da janela real | concorrência, multi-instância e parsing de IP | implementado e verificado |
| A-12 | Capítulos admin persistem só em localStorage | API/Mongo/web admin | `Chapter`, `chapterGateways.ts`, `localStorageChapter*` | casos de uso/API admin, evolução Mongock e gateway HTTP; migração local controlada | domínio, adapter, controller, hooks e fluxo browser | backend/gateway implementados; escrita de páginas aguarda mídia |

## Plano de schema — A-04 (privacidade e retenção)

1. **Banco e ownership.** Preferências permanecem em PostgreSQL
   (`user_profile_settings`); eventos/histórico permanecem nas coleções Mongo já
   proprietárias desses dados. Não será criado JSON genérico.
2. **Normalização.** `view_history_visibility` continua sendo o atributo tipado da
   relação 1:1 por usuário. `DO_NOT_TRACK` será interpretado como política de coleta,
   e não como alias de `PRIVATE`.
3. **Integridade.** A transição será comandada por caso de uso; novas gravações serão
   rejeitadas antes da persistência quando a política efetiva for `DO_NOT_TRACK`.
   Limpeza histórica será idempotente e limitada às projeções explicitamente
   pertencentes a histórico/comportamento do usuário.
4. **Índices.** Reutilizar índices por `userId` das coleções envolvidas; qualquer
   ausência comprovada será adicionada por Mongock, sem auto-index do Spring Data.
5. **Dados derivados.** Contagens e feeds derivados serão reconstruídos ou
   invalidados; não serão mantidos como segunda fonte autoritativa.
6. **Migration e compatibilidade.** A mudança de semântica será documentada e
   acompanhada de change unit idempotente somente se houver dados históricos a
   remover. Saída de `DO_NOT_TRACK` volta a coletar apenas eventos futuros.

## Plano de schema — A-09 (trending)

1. **Banco e ownership.** Rankings, métricas e sinais permanecem no MongoDB do job
   trending.
2. **Normalização.** Nenhum documento novo: corrigir a execução das change units já
   modeladas.
3. **Integridade.** IDs e ordem Mongock serão estáveis; índices divergentes serão
   comparados por nome, chave e opções antes de qualquer substituição.
4. **Índices.** Materializar os índices compostos de ranking/métricas/sinais e o TTL
   existente, preservando ordem dos campos e `expireAfterSeconds`.
5. **Dados derivados.** `title_trend_daily` continua reconstruível; TTL é retenção,
   não mecanismo de consistência.
6. **Migration e compatibilidade.** Execução idempotente, sem recriar coleção ou
   apagar documentos; smoke test deve comprovar changelog e catálogo de índices.

## Plano de schema — A-12 (capítulos administrativos)

1. **Banco e aggregate.** `Chapter` já é aggregate próprio na coleção Mongo
   `chapters`; o ownership existente será mantido. `titleId` referencia o título do
   Mongo, e não uma FK PostgreSQL cross-database.
2. **BCNF/document shape.** Um documento por capítulo. Campos editoriais pertencem ao
   aggregate: `status`, `scheduledAt`, `publishedAt`, `createdAt`, `updatedAt`,
   `deletedAt` e `version`. Métricas de leitura permanecem derivadas das coleções de
   leitura, não duplicadas como autoridade.
3. **Compatibilidade.** Capítulos legados receberão `status=PUBLISHED`, datas
   coerentes com `releaseDate` quando convertível, timestamps de migração apenas como
   fallback e `version=0`; assim a API pública não perde conteúdo existente.
4. **Integridade.** Validar status, agendamento futuro, número normalizado e
   unicidade `(titleId, number)`. Optimistic locking impedirá lost update. Exclusão
   administrativa será soft delete; publicação/despublicação será transição explícita.
5. **Índices.** Preservar o único `(titleId, number)` e adicionar índices orientados às
   consultas administrativas: `(titleId, deletedAt, status, number)` e
   `(status, scheduledAt)` para publicação agendada. A API pública sempre filtra
   `status=PUBLISHED` e `deletedAt=null`.
6. **Migration.** Nova change unit Mongock forward-only, idempotente, com backfill e
   criação explícita dos índices. Rollback operacional: restaurar o binário anterior
   é compatível porque campos adicionais são tolerados; o backfill não será removido.
7. **Frontend.** O gateway HTTP substituirá `chapterGateways.ts`; a chave
   `mr:chapters:admin:v1` será importada somente mediante preview/confirmação e apagada
   apenas após sucesso completo, sem duas fontes permanentes.

## Ordem FSD para A-02/A-03/A-05/A-12

1. `shared`: storage versionado, medição de cache e infraestrutura HTTP genérica.
2. `entities`: contratos/queries de user e chapter, sem comandos de interface.
3. `features`: alteração de preferências, limpeza/exportação e comandos admin.
4. `widgets`: composições existentes, apenas adaptadas às APIs públicas dos slices.
5. `pages`: orquestração das rotas Settings, Chapter e Dashboard.
6. `app`: hidratação/provider global de tema e preferências.

Após cada camada: `npx tsc -b`, `pnpm lint:fsd` e testes direcionados antes de subir
para a próxima camada.

## Resultado pós-remediação

As doze frentes foram implementadas no working tree preservado. A exceção deliberada
é a escrita de páginas de capítulo: o backend e o gateway HTTP administrativos estão
reais, mas criar/substituir imagens continua desabilitado até existir armazenamento de
mídia. Não foi mantido fallback de produção em `localStorage`; os adapters locais
permanecem somente como infraestrutura determinística dos testes.

Evidências dinâmicas principais:

- preferências `demo`: PATCH/GET/PostgreSQL, rejeição de payload inválido, reload e
  restart isolado da API; todos os valores foram restaurados;
- segurança admin: anônimo 401, usuário `demo` 403 e `admin` 200 para capítulos;
- Mongo real: 49 capítulos, change units V025/V026 e cinco índices de capítulo;
- Redis real: chave do limitador distribuído materializada;
- API atual em `:18080`: liveness e readiness HTTP 200/UP; health detalhado 503
  somente porque o SMTP opcional em `localhost:1025` não estava disponível;
- web: login, alteração/restauração de direção, ações reais da aba Dados, redirect de
  não-admin e dashboard admin;
- mobile: login no iPhone Simulator, sessão autenticada após reinício via SecureStore;
  Expo Go temporário, processos e tokens de prova foram removidos ao final.

O processo antigo já aberto em `:8080` não foi substituído: ele não continha os novos
endpoints de health/capítulos. A prova da versão atual foi feita em porta alternativa,
sem interromper o ambiente do usuário.

## Gates finais — 18/07/2026

| Módulo/comando | Resultado final |
|---|---|
| API `./mvnw -q clean test` | 1.364 testes, 0 failures, 0 errors |
| Web `npx tsc -b` | passou, 0 errors |
| Web `CHOKIDAR_USEPOLLING=1 pnpm lint:fsd` | passou, sem diagnósticos |
| Web `npx vitest run --pool=forks --maxWorkers=4` | 175 arquivos, 1.158 testes, todos passaram |
| Mobile `CHOKIDAR_USEPOLLING=1 pnpm check` | typecheck, ESLint, FSD e format passaram |
| Landing testes/build | 24 arquivos, 71 testes; build de produção passou |
| Rating aggregator `./mvnw test` | 11 testes, 0 failures/errors |
| Orphan cleaner `./mvnw test` | 12 testes, 0 failures/errors |
| Trending aggregator `./mvnw test` | 15 testes, 0 failures/errors; V001/V002/V003 aplicadas no startup test |

As falhas registradas na auditoria original são preservadas como evidência histórica;
esta seção é a fonte do estado verificado depois da remediação.

### Seguimento DT-68

No mesmo dia, o prazo de redefinição de senha também foi unificado. O default passou a
30 minutos, o e-mail deriva o texto da property efetiva e o endpoint de solicitação
retorna `expiresInSeconds` para web e mobile. A validade é coberta por relógio fixo;
DT-68 foi encerrada e OPS-007 passou a “totalmente integrada”.
