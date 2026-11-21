# Toonlira — Dívidas Técnicas

> Última revisão documental: 19 de julho de 2026.
>
> Este arquivo é a **única fonte ativa** para as dívidas técnicas do projeto.

---

## Pendências ativas

Índice rápido das pendências. Itens resolvidos saem deste arquivo (o histórico
fica no git); aqui só permanecem dívidas abertas, adiadas ou com resíduo.

| Área | Itens com ação ou acompanhamento pendente |
|---|---|
| Qualidade | DT-02 (testes de componente/E2E) |
| Produção e infraestrutura | DT-03 (CI/CD), DT-09 (conteúdo legal), DT-21 (validação da migração em staging), DT-59 (notas operacionais de refresh token) e DT-73 (lock distribuído do trending) |
| Produto e governança | DT-44 (funcionalidades adiadas, inclusive armazenamento/upload de mídia), DT-48 (resíduos do perfil) e DT-74 (default de analytics comportamental) |
| Arquitetura e persistência | DT-50 (resíduos da unificação de comentários), DT-52 (escrita cross-DB não atômica), DT-67 (sessões analytics multiaba/offline), DT-69 (outbox de eventos) e DT-70 (invalidação imediata de access tokens) |
| Performance e escala | DT-71 (exportação de dados sem streaming) e DT-72 (filtro adulto da biblioteca em memória) |
| Interface | DT-58 (tokens e portais de elementos flutuantes) |
| Pipeline de tradução | DT-76 (renderização híbrida) e DT-77 (cotas, benefícios e preços das assinaturas web/app) |

> **Decisão 2026-05-16**: o projeto ainda **não vai a produção**. Itens que exigem
> infraestrutura grande (CI/CD, jobs de limpeza, observabilidade, conteúdo legal
> vinculante, E2E) foram **adiados como não-bloqueantes** — permanecem listados,
> mas não serão implementados nesta fase. Itens só-código foram resolvidos.

---

## Registro detalhado por item

### DT-02 (parcial): Sem testes de componente / E2E

**Estado**: A parte "8 testes falhando" está **resolvida/stale** — a suíte atual
roda **817 testes em 120 arquivos, 0 falhas** (`npx vitest run`). Os 8 falhando
descritos em 2026-03 não existem mais.

**Fix 2026-05-30**: 4 testes falhavam por **chaves i18n ausentes** (componente chamava
`t(...)` sem chave nos 3 locales): `filters.metaSuffix` (manga), `page.worksCount` (library),
`passwordStrength.{weak,medium,strong,great}` (auth). Chaves adicionadas em pt-BR/en-US/es-ES → suíte verde.

**Adiado (não-prod)**: ainda **não há testes de componente nem E2E**
(CommentsSection, Library, UserProfile, SearchResults sem cobertura; sem
Playwright). Não-bloqueante enquanto não vai a produção.

---

### DT-03: Sem pipeline CI/CD — **Adiado (não-prod)**

Nenhum workflow de CI/CD. **Decisão 2026-05-16**: não implementar pipelines
enquanto o projeto não for a produção. Quando for: GitHub Actions
lint → test → build (ver `deployment-plan.md`).

---

### DT-09: Conteúdo placeholder em páginas legais — **Parcialmente resolvido**

Termos de Uso / Privacidade / DMCA / Contato com placeholder. Estrutura/UI/i18n
**prontas** (LegalShell + LegalSection + LegalCrossLinks, rotas registradas e
alcançáveis, chaves em pt-BR/en-US/es-ES). Em 2026-09-03, a empresa, o endereço e
os e-mails fictícios foram removidos; as páginas agora identificam Ruan Moraes
como operador, publicam o contato real e exibem aviso explícito de rascunho.
Termos e Privacidade receberam a versão operacional 1.0 em 2026-09-07, com
processamento remoto, Google Cloud, retenção e direitos LGPD explicitados nos
três idiomas. As rotas estão publicadas em `toonlira-rm.firebaseapp.com`. Falta
a aprovação final do operador e, para uso público de maior risco, revisão por
profissional jurídico. DMCA e Contato continuam identificados como rascunho.

---

### DT-21: Migração V009 nunca validada contra Mongo de produção

**Descrição**: `V009MigrateChaptersToCollection` (DT-17 — move
`titles.chapters[]` embedded para coleção `chapters`) só foi exercitada via
TestContainers (migra + idempotente + título sem chapters). O projeto nunca
foi a produção; a migração roda no **boot da aplicação** (Mongock) e ainda
não enfrentou dados reais/volume.

**Impacto**: risco residual no primeiro deploy — documentos legados
inesperados (chapters malformados, `_id` não-String, títulos com milhares de
capítulos) podem se comportar diferente do dataset de teste. Mongock **não é
transacional** no projeto: falha no meio deixa estado parcial.

**Estado (2026-05-18) — lado-código fechado**:
1. Logging de auditoria implementado (`@Slf4j`: início, `debug` por título,
   totais finais, "nada a migrar").
2. **Validação pela orquestração real do Mongock** —
   `V009MongockIntegrationTest` roda o **runner do Mongock** (não
   `execute()` direto) contra Mongo TestContainers, semeando dados em
   **formato legado** (`titles.chapters[]` embedded) antes do contexto subir.
   Cobre os riscos citados aqui: `_id` não-String (`ObjectId` → `titleId` via
   `toString()`), elemento malformado no array (ignorado), volume grande
   (2000 capítulos, `insertMany` em lote), `chapters: []` vazio, título sem
   chapters intocado. Assere invariante `sum == chapters.count()`, ausência de
   `titles.chapters`, registro no `mongockChangeLog` e **idempotência real**
   (reboot do runner não reprocessa — guarda de changelog).

**Resíduo — só infra (não fechável em código)**: validação contra **dump real
de produção** em staging. Runbook antes do primeiro deploy que aplicar V009:
1. Restaurar dump representativo de prod em staging.
2. Subir a aplicação (Mongock roda V009 no boot).
3. Conferir nos logs de auditoria: `títulos processados`/`capítulos inseridos`
   batem com `sum(titles.chapters.size)` pré-migração e `chapters.count()`
   pós; nenhum `titles` retém `chapters`.
4. **Backup do banco antes** do deploy (Mongock não é transacional aqui).

Lado-código resolvido; resíduo só-infra documentado acima.

---

### DT-44: Funcionalidades não implementadas — **Adiado (não-prod)**

**Complemento 2026-09-27 — gateway:** layout semântico é extensão experimental,
separada do aceite atual de `MOB-FEAT-018`. V3 guarda metadados por job em BCNF,
com FK composta/cascade e PK suficiente; não cria tabela de texto/regiões nem
contador. Qualidade geral, geometria irregular, consumo pela tradução e ativação
operacional permanecem abertos. Ver [contrato e limites](../api/apps/translation-gateway/docs/ocr-evaluation/layout-experimental.md).
Layout `1.1` trata duplicatas quase idênticas com auditoria e mantém ambiguidades
reais; isso não aprova qualidade geral. Avaliação específica de onomatopeias fica
para escopo futuro, sem remover suas regiões do OCR.

Itens de produto que ainda não existem no código, preservados aqui após a remoção
do antigo `pending-tasks.md` (cuja maior parte já estava resolvida/stale). Todos
**não-bloqueantes** enquanto o projeto não vai a produção:

- **Upload de arquivos**: capas de título/notícia, avatares de usuário e páginas de
  capítulo ainda são URLs externas; notícias usam Picsum determinístico como provisório e
  já expõem `NewsCoverStoragePort`, mas não há adapter S3/Cloudinary/R2 nem upload binário.
- **Endpoints ausentes**: `events/{id}/related`,
  `groups/{id}/members/{memberId}` (detalhe de membro). Seções de UI
  correspondentes ficam sem dados quando aplicável.
- **Busca global cross-domain** e **filtros avançados** em listagens (além dos
  filtros de catálogo já existentes).
- **Validação client-side dos forms restantes**: Forgot/Reset Password, Edit
  Profile, Publish Work, Create Event, Forum Topic. (Login/SignUp já migrados p/
  React Hook Form + Zod — ver DT-06/DT-37; os demais herdam o mesmo padrão.)

**Prioridade**: Baixa. Sem agendamento até a fase de produção.

---

### DT-48: Perfil — seções ainda simuladas (sem backend) — **Resolvido em sua maior parte (feed entregue em 2026-07-17)**

**Entregue (2026-07-02, branch `feat/dt48-social-graph`)** — grafo social em **Neo4j**:
- **Infra**: Neo4j 5.26-community nos composes dev/prod (spring-boot-docker-compose
  resolve connection details; `spring.neo4j.*` fallback). Sem `Neo4jTransactionManager`
  (statements únicos auto-commit; JPA `@Primary` intacto — racional em
  `Neo4jConfiguration`). Constraint de unicidade `UserNode.userId` criada no boot
  (`Neo4jSchemaInitializer`, `@Profile("!test")`).
- **Grafo**: `SocialGraphPort` (application/social) + `SocialGraphNeo4jAdapter`
  (`Neo4jClient` + Cypher explícito, sem OGM): nó mínimo `(:UserNode {userId})` lazy
  via MERGE, aresta `[:FOLLOWS {since}]`, contagens+`isFollowing` em 1 round-trip,
  listas paginadas `r.since DESC`, `DETACH DELETE` no delete de conta (chamado antes
  do save JPA no `DeleteAccountUseCase`).
- **Seguidores/seguindo**: `Follow/Unfollow/GetFollowers/GetFollowingUseCase`
  (self-follow 409, alvo ativo, hidratação batch do Postgres preservando ordem,
  desativados filtrados) + `FollowController` (`POST/DELETE /api/users/{id}/follow`,
  `GET .../followers|following` permitAll). `EnrichedProfileResponse` ganhou
  `followersCount/followingCount/isFollowedByMe`.
- **Handle/verificado**: Flyway **V39** — `users.username` (único case-insensitive,
  CHECK `^[a-z0-9_]{3,30}$`, claim sem backfill) e `users.verified` (default false,
  mutação administrativa). `UpdateUserProfileUseCase` + `UsernameValidator`
  (reservados; duplicado → 409); campo ligado na `InformacoesTab`.
- **Grupos seguidos**: `findGroupsBySupporterUserId` (JPQL SUPPORTER) + use case +
  `GET /api/users/{id}/followed-groups` (reuso de `GroupPreviewResponse`).
- **Frontend**: `followService` + `useFollow` (otimista com reconciliação/rollback) +
  `useFollowList`/`useFollowedGroups`; header do perfil com selo verificado,
  contadores reais clicáveis → `FollowListModal`; aba de grupos real; mock
  `userProfile.ts` reduzido a `ACTIVITY`. i18n pt/en/es. Testes: Neo4j-TC (5), use
  cases (7), @WebMvcTest (6), JPA SUPPORTER, front service/hook (9). Suítes: backend
  leve 1109; front 932; `tsc -b` 0; steiger verde.

**Residual em aberto (Baixa)**:
- **Endpoint admin p/ `verified`** (hoje mutação manual/SQL).
- **Varredura de consistência Postgres×Neo4j** (estilo orphan-cleaner) — nós órfãos
  são inertes (só userId) e as listas filtram na hidratação; sem urgência.
- **Cache dos contadores** (Redis) se as contagens por Cypher virarem hot-path.

**Entregue (2026-07-17)** — o feed de atividade passou a usar dados reais de
`activity_events`, com GET público sujeito a `viewHistoryVisibility`, ação de ocultar
restrita ao proprietário e separada em `features/hide-activity-event`. A política de
`DO_NOT_TRACK` foi centralizada na aplicação e unificou a retenção de
`view_history`, `user_chapter_reads` e `activity_events`, sem apagar
`reading_progress`. A idempotência de redelivery do RabbitMQ ficou registrada em
DT-60.

**Registro original (contexto):**

**Contexto**: a página de perfil (`pages/profile/ui/UserProfile.tsx`) foi migrada de
100% mock para **dados reais** no que já tem backend: header/bio, stats (contagens),
**resenhas** (`GET /api/ratings/user/{userId}` — novo), recomendações, comentários
recentes e listas **lendo/concluído** (`GET /api/library/user/{userId}` — novo), tudo
de **qualquer** usuário via `useEnrichedProfile`/`useUserReviews`/`useUserLibrary`.

**Resolvido nesta leva (2026-06-21)** — **Gêneros favoritos** agora têm backend:
seleção manual persistida em `users.favorite_genres` (jsonb, Flyway `V37`), validada
contra o vocabulário de `tags` (`GenreValidator`). Endpoints `GET/PATCH
/api/users/me/favorite-genres` + exposição em `EnrichedProfileResponse.favoriteGenres`.
Front: seletor de chips em `InformacoesTab` (cross-import `@entities/catalog-filter/@x/user`)
e leitura real em `useProfileData`. TODO no código para futuramente *sugerir*
automaticamente a partir das obras mais lidas/avaliadas (mini-algoritmo) e mesclar com a
seleção manual.

**Ainda simulado** (mock em `src/mock/userProfile.ts`, marcado com `// TODO(tech-debt)`):

- **Seguidores/seguindo** — não existe domínio social (follow/unfollow, contagens, listas).
- **Grupos seguidos** — `GroupController` não expõe "grupos seguidos por um usuário"
  (a infra de apoio `GroupUser{SUPPORTER}` existe; falta query/endpoint
  `findGroupsBySupporterUserId` + read use case).
- **Feed de atividade** — sem agregação (há `recentViewHistory`, mas não o feed completo).
- **Handle/username e selo "verificado"** — não existem no perfil do backend (handle hoje
  é derivado do nome no front).

**Impacto**: parte do perfil mistura dado real + fake. Não bloqueante.

**Recomendação**: criar os domínios/endpoints restantes (grafo social, grupos seguidos por
usuário, activity feed, username) quando a feature de rede social entrar no roadmap — cada
um é um épico próprio (passar pela skill `database-design`).

### DT-50: Persistência de comentários (resenha, obra, fórum) não padronizada — **Em aberto (Média)**

Os três domínios de comentário/UGC gravam interações de formas divergentes — bancos,
nomes de coluna e estruturas diferentes — dificultando que um dev reconheça que seguem a
mesma lógica. Objetivo: contratos/colunas consistentes (mesmos nomes) entre os domínios,
ainda que em tabelas/coleções distintas.

**Já padronizado nesta leva (2026-06-08)** — indicador de edição + data de modificação:
- Flag canônico **`edited`** nos 3 domínios (renomeado de `wasEdited`/`is_edited`).
- Coluna/campo **`updatedAt`/`updated_at`** (última modificação de conteúdo, setada
  manualmente na edição) adicionada onde faltava; resenha ganhou `edited` + `updatedAt`.
- Migrations: Mongock `V013StandardizeEditedAndUpdatedAt` (ratings/comments),
  Flyway `V32__forum_standardize_edited_updated.sql` (forum_topics/forum_replies).
- UI: base compartilhada `shared/ui/ThreadPost` (obra + fórum com DOM/CSS idênticos);
  resenha exibe criação + selo "(editado)" com tooltip da data de modificação.

**Decisão arquitetural oficial (2026-06-09)** — *comentário unificado*:
uma única coleção `comments` guarda TODO comentário e resposta de qualquer domínio
(obra, resenha, fórum), polimórfica por `targetType` (`TITLE|REVIEW|FORUM_TOPIC`) +
`targetId`, com autorreferência `parentCommentId` (profundidade ilimitada). Proibido
criar coleções/tabelas separadas de "replies". Voto único (padrão resenha):
`VoteValue{UP,DOWN}` + contadores `upvotes`/`downvotes` + doc `<pai>_votes`.

**Padronizado nesta leva (2026-06-09)** — voto único + nomenclatura de votos:
- `shared/domain/vote/VoteValue`, `shared/application/vote/VoteResult`,
  `shared/dto/VoteResponse`+`VoteRequest` (remove `ReviewVoteResult/Response/Request`).
- **Obra**: `comment_reactions`/`ReactionType` → `comments_votes`/`CommentVote` (UP/DOWN);
  `likeCount`/`dislikeCount` → `upvotes`/`downvotes`; `titleId` → `targetType`+`targetId`;
  endpoints `/like`+`/dislike` → `/vote` (toggle) e `/user-reactions` → `/user-votes`;
  bloqueio de self-vote. Frontend adapta no boundary do service.
- **Resenha**: votos passam a usar os tipos compartilhados; `review_votes` →
  `reviews_votes` (convenção `<pai>_votes`).
- Migrations Mongock `V014RenameReviewVotesCollection`, `V015UnifyCommentVotes`.

**Fórum → Mongo ENTREGUE (2026-06-09):**
- `forum_topics` migrou para coleção Mongo (autor snapshot `authorId/authorName/authorPhoto`,
  `like_count`→`upvotes`); **réplicas viram `comments` `targetType=FORUM_TOPIC`**
  (`forum_replies` eliminado; `is_best_answer`→`isHighlighted`). Votos de tópico em
  `forum_topics_votes` (use cases via `VoteToggle`), endpoints `/api/forum/{id}/vote`.
- Runner cross-DB `V016MigrateForumToMongo` (JDBC puro + verificação de contagem,
  aborta em divergência; cria índices das coleções novas).
  **Fase 2 pendente:** Flyway `V33__drop_forum_postgres_tables.sql` — criar SOMENTE
  num deploy posterior, após confirmar o Mongo em produção (tabelas PG ficam como
  rollback até lá).
- `CounterReconciliationJob` agora reconcilia também no Mongo:
  `forum_topics.replyCount = COUNT(comments do tópico)`.

**Entregue também (2026-06-09, leva 2):**
- `CounterReconciliationJob` reconcilia `upvotes`/`downvotes` dos 3 pais votáveis a partir
  de `<pai>_votes` (agregação + bulk update; zera órfãos via `$nin`).
- UI de voto do fórum ligada ao API: tópico via `/api/forum/{id}/vote`, replies via
  `/api/comments/{id}/vote` (`useTopicDetail` trocou o mock pelo API real).

**Entregue também (2026-06-10, leva 3 — auditoria final):**
- **Corpo do texto convergido**: `ratings.comment` → `textContent` (entity, contrato API,
  Mongock `V017`); frontend traduz na borda do `ratingService` (modelo interno intacto).
- **Perfil corrigido**: "comentários do usuário" filtram `targetType=TITLE` — respostas de
  fórum não vazam mais para o perfil com link de obra quebrado
  (`findByUserIdAndTargetType`/`countByUserIdAndTargetType`).
- **Responder tópico ligado ao API**: `TopicCommentInput` era no-op (mock); agora
  `createForumReply` → `POST /api/forum/{id}/replies` e a thread recarrega.
- **Cascata de votos**: excluir comentário remove `comments_votes` dele; excluir tópico
  remove também os votos das respostas (`deleteByCommentId`/`deleteByCommentIdIn`).
- Handlers de voto no front com `catch` (409 self-vote não vira unhandled rejection).

**Pendente:**
- Testes de página do fórum (`ForumTopic.test.tsx`) referenciam o fluxo antigo e dependem de
  jest-dom (quebrado no sandbox) — reescrever com msw quando o baseline for consertado.
- **Rename `ratings`→`reviews` ENTREGUE (2026-06-10)**: coleções `reviews`/`reviews_aggregate`
  (Mongock V018 no server + V002 no aggregator — renames idempotentes nos DOIS changelogs
  porque a ordem de boot dos dois apps não é garantida); pacotes `domain/application/
  presentation.rating`→`.review` e classes `MangaRating`→`Review`, `Rating*`→`Review*`;
  rota `/api/ratings`→`/api/reviews` (+ `SecurityConfig` permitAll atualizado); frontend
  `entities/rating`→`entities/review` + `API_URLS.REVIEWS`. Mantidos por serem contrato
  cross-módulo/conceito de nota: `RatingEvent`, `TitleRatingAggregate*` (classes internas;
  coleção renomeada), `RatingStars`/`RatingModal`/`useRatingSummary` (são sobre a NOTA).
- Profundidade ilimitada: paginação/lazy-load de threads profundas (evitar N+1/payload grande).

**Recomendação**: usar a skill `database-design` + `docs/database-modeling.md`; migrar o
fórum com backfill idempotente e verificação de contagem antes de qualquer drop.

---

### DT-52: Escrita cross-DB não-atômica em autores/editoras de título — **Em aberto (Média)**

`CreateTitleUseCase`/`UpdateTitleUseCase`/`DeleteTitleUseCase` são `@Transactional("mongoTransactionManager")`
(escrita do `Title` no Mongo), mas chamam `TitleAssociationWriter` que grava as junções
`title_authors`/`title_publishers` no **Postgres** via o tx manager JPA (primário). As duas
escritas **não são atômicas**: se a gravação Mongo falhar após as junções (ou vice-versa), há
divergência. Hoje é tolerável porque os campos texto `author`/`artist`/`publisher` continuam a
fonte canônica e as junções são paralelas/compat (ver Etapas 5–6 da modelagem de autores).

**N+1 nos mappers — Resolvido (2026-06-16):** os mappers `TitleMapper`/`AdminTitleMapper`
buscavam as junções **por título** (`findByTitleId`) ao montar a resposta → N+1 nas listagens
pública e admin. Resolvido com `TitleAssociationReader` (batch `findByTitleIdIn` → map por
`titleId`) carregado uma vez por página nos call sites de listagem (`TitleController#mapWithStats`,
`AdminTitleController#listTitles`), passado para overloads `toResponse(..., authorsByTitle,
publishersByTitle)`. Os paths single-fetch (detalhe) seguem usando `findByTitleId`.

**O que resta em aberto:** apenas a escrita cross-DB não-atômica descrita acima.

**Quando fechar:** ao tornar as junções a fonte canônica (remover os campos texto). Aí avaliar
outbox/saga ou mover o título para Postgres.

**Esforço:** médio. Risco baixo enquanto os campos texto coexistirem.

---

### DT-58: Flutuantes fora do admin ainda sem tokens de camada / portal

**Contexto (2026-07-06).** A padronização dos modais admin centralizou as
camadas visuais na escala única `--z-ui-*` (`@theme` em `styles/index.css`;
a escala legada `:root --ui-z-*` foi removida) e resolveu o problema de
dropdowns atrás do `<dialog>` portalando conteúdo flutuante para dentro do
próprio dialog via `FloatingPortalContext` (`shared/ui/FloatingPortalContext.tsx`).
`Select`, `DropdownMenu`, `TagSelectInput` (react-select, `menuPortalTarget`)
e `EntitySearchSelect` (reescrito sobre `@radix-ui/react-popover`) já consomem
o contexto.

**Dívida (fora do escopo do admin, intencionalmente não tocada para reduzir
blast radius):**
- `shared/ui/Tooltip.tsx` posiciona inline (`absolute`) — dentro de um
  contêiner com `overflow` pode cortar; migrar para o mesmo padrão de portal
  quando for usado dentro de modais.
- z-index numéricos hardcoded fora do admin: NavBar/NavSearch/NavMegaMenu,
  `ChapterDropdown` (inline `zIndex: 20`), páginas de evento — rotear para
  utilitários `z-ui-*`.

**Prioridade:** Baixa (nenhum bug visível hoje; é consistência de tokens).

---

### DT-59: Notas operacionais do refresh token endurecido (2026-07-10)

Contexto: sessão expirando silenciosamente no web → implementado refresh
rotation server-side (tabela `refresh_tokens` V40, reuso ⇒ revoga família),
`POST /api/auth/logout`, cookie httpOnly p/ web (body preservado p/ mobile),
interceptor web com fila + `authExpired`. Ver `docs/architecture.md` (Key
Patterns → Refresh token rotation). Notas a acompanhar:

- **Deploy invalida sessões antigas (one-shot)**: refresh tokens emitidos
  antes do deploy não existem na tabela ⇒ primeiro refresh retorna 401 ⇒
  um re-login por usuário (web e mobile). Comunicar no release.
- **SameSite=Strict pressupõe API same-site**: se produção servir a API em
  outro *registrable domain* que o front, o cookie precisa virar
  `SameSite=None; Secure` (ver `RefreshTokenCookieFactory`). Registrar no
  plano de deploy.
- **Suíte `testcontainers` local**: `mongo:8.0` não sobe em Docker com
  kernel Linux ≥ 6.19 (SERVER-121912) — falha ambiental pré-existente em
  macs recentes; rodar `mvn test -Dtest.excludedGroups=testcontainers`
  localmente e deixar o E2E (`AuthSecurityIntegrationTest`, incl. rotação/
  reuso/logout/cookie) para o CI.

**Prioridade:** Baixa (notas operacionais; nenhuma ação de código pendente).

---

### DT-67: Coordenação semântica de analytics entre abas e offline

**Contexto.** A primeira rodada de analytics persiste eventos em IndexedDB,
coordena flush com `BroadcastChannel` e garante idempotência por `eventId`. Ainda
não existe lease compartilhado nem deadline persistido de sessão para deduplicar
semanticamente abas concorrentes ou inferir abandono depois da janela offline.
Origem completa de navegação, filtros estruturados e transições de capítulo também
dependem desse coordenador; inferi-los de mount/unmount criaria falsos positivos.

**Tratamento futuro:** criar uma máquina de sessão versionada em IndexedDB com
lease/heartbeat entre abas, deadline de abandono e intenção de navegação tipada.
Testar crash, reload, retorno online e duas abas com relógio determinístico.

**Prioridade:** Média. **Complexidade:** M. **Risco:** Médio (qualidade analítica).

---

### DT-69: Publicação RabbitMQ não é atômica com a transação de origem

**Contexto comprovado (auditoria de 2026-07-19).** Use cases como envio de resenha,
conclusão de obra, follow e registro de leitura publicam no RabbitMQ durante a mesma
execução que altera PostgreSQL ou MongoDB. O `messageId` de DT-60 torna redelivery
idempotente, mas não fecha as janelas entre sistemas: a mensagem pode ser entregue
antes de um rollback (evento fantasma) ou a transação pode confirmar e o publish
falhar (evento perdido).

**Tratamento futuro.** Adotar transactional outbox no banco proprietário da mutação,
com `event_id`, tipo, payload versionado, instante, tentativas e estado de publicação.
Um relay deve publicar com confirmação do broker e marcar a linha processada; o
consumidor continua idempotente pelo mesmo `event_id`. Como envolve nova tabela,
índices, retenção e migration Flyway, executar o protocolo `database-design` antes da
implementação. Testar rollback, falha do broker após commit, retry e concorrência.

**Critério de aceite:** toda mutação e seu registro de outbox confirmam ou revertem na
mesma transação; o relay recupera eventos pendentes após restart sem duplicar efeitos.

**Prioridade:** Alta antes de produção. **Complexidade:** L. **Risco:** Alto.

---

### DT-70: Access tokens emitidos não têm revogação imediata

**Contexto comprovado (auditoria de 2026-07-19).** Login e refresh já bloqueiam contas
banidas/desativadas, e reset/exclusão revogam todas as sessões de refresh. Entretanto,
`JwtAuthenticationFilter` valida somente assinatura e claims do access token. Um token
emitido antes de banimento, desativação ou troca de senha permanece aceito até expirar
(atualmente, janela máxima de 15 minutos).

**Tratamento futuro.** Escolher entre `tokenVersion` persistido no usuário e incluído
no JWT, denylist Redis com TTL até a expiração, ou access tokens ainda mais curtos. A
primeira opção exige migration e leitura/cache coerente; a segunda exige política de
degradação quando Redis estiver indisponível. Documentar a semântica esperada por ação
administrativa e testar banimento, reset, exclusão e indisponibilidade do cache.

**Critério de aceite:** após uma ação revogadora confirmada, qualquer access token
anterior recebe 401 em todas as instâncias dentro do SLA definido.

**Prioridade:** Alta antes de produção. **Complexidade:** M. **Risco:** Alto.

---

### DT-71: Exportação de dados pessoais materializa coleções sem limite

**Contexto comprovado (auditoria de 2026-07-19).** `ExportUserDataUseCase` busca e
materializa integralmente atividades, histórico e demais dados do usuário para montar
uma única resposta. Contas antigas ou automatizadas podem manter a transação/leitura
aberta por muito tempo e consumir memória proporcional a todo o histórico.

**Tratamento futuro.** Gerar a exportação como job assíncrono paginado, escrever JSON
ou ZIP em streaming para armazenamento temporário e entregar URL curta e autenticada.
Aplicar snapshot lógico ou cursor estável, limites de retenção e limpeza de artefatos.
Não manter transação JPA aberta durante leituras Mongo ou upload do arquivo.

**Critério de aceite:** uso de memória limitado por página/chunk, retomada segura após
falha e teste de volume que exceda o tamanho confortável de uma resposta síncrona.

**Prioridade:** Média. **Complexidade:** L. **Risco:** Médio/alto por volume.

---

### DT-72: Filtro de conteúdo adulto da biblioteca pagina em memória

**Contexto comprovado (auditoria de 2026-07-19).** No modo `HIDE`, consultas da
biblioteca carregam a coleção do usuário, enriquecem títulos e só então filtram e
paginam. O resultado funcional está correto, mas custo e latência crescem com toda a
biblioteca e a paginação deixa de ser responsabilidade da fonte de dados.

**Tratamento futuro.** Tornar a elegibilidade parte da query paginada. Como a
classificação adulta pertence ao catálogo Mongo e a biblioteca ao PostgreSQL, definir
uma projeção mínima sincronizada, uma lista de IDs elegíveis paginável ou outra
estratégia explícita de leitura dual-DB. Avaliar consistência, índice e reconciliação
com o protocolo `database-design` antes de duplicar dados.

**Critério de aceite:** uma página de biblioteca executa trabalho proporcional ao
tamanho da página, mantém `totalElements` correto e não introduz N+1.

**Prioridade:** Média. **Complexidade:** M/L. **Risco:** Médio.

---

### DT-73: Exclusão mútua do trending vale apenas dentro de uma JVM

**Contexto comprovado (auditoria de 2026-07-19).**
`RecalculateTrendingUseCase.execute` é sincronizado e impede sobreposição entre o
gatilho agendado e o manual na mesma instância. Em deployment com duas ou mais
réplicas, cada JVM possui seu próprio monitor e duas reconstruções ainda podem
intercalar a substituição do ranking diário.

**Tratamento futuro.** Usar advisory lock PostgreSQL, ShedLock ou lease equivalente
com timeout e owner identificável. O lock deve cobrir a reconstrução/substituição
completa, liberar após crash e produzir métrica para execução ignorada ou expirada.

**Critério de aceite:** teste com duas instâncias concorrentes comprova um único
escritor por data e recuperação após expiração do lease.

**Prioridade:** Média quando houver mais de uma réplica. **Complexidade:** S/M.
**Risco:** Médio.

---

### DT-74: Default de analytics comportamental depende de decisão de consentimento

**Contexto comprovado (auditoria de 2026-07-19).** Novos perfis recebem
`behaviorAnalyticsEnabled=true`, enquanto `DO_NOT_TRACK` continua prevalecendo e
limpa dados rastreados. A implementação é coerente tecnicamente, mas habilitar coleta
por default é uma decisão de produto, base legal e jurisdição; não deve ser definida
implicitamente pelo código.

**Tratamento futuro.** Produto/jurídico deve registrar se a base é opt-in, opt-out ou
interesse legítimo por região. Derivar o default e o onboarding dessa decisão, manter
prova/versionamento do consentimento quando necessário e alinhar política de
privacidade, retenção e exportação. Até a decisão, evitar descrever o comportamento
como consentimento explícito.

**Critério de aceite:** decisão registrada, textos legais/locales alinhados, default
testado por região e trilha auditável quando a base exigir consentimento.

**Prioridade:** Alta antes de produção. **Complexidade:** depende de produto/legal.
**Risco:** Alto regulatório.

---

### DT-76: Renderização híbrida de tradução — **Urgente/P1**

**Estado:** aberto, registrado em 2026-10-18 por solicitação de Ruan. Continuar
implementando e validando a 020 no servidor; esta prioridade não muda os contratos
ativos nem autoriza implementação/ativação mobile antecipada.

**Objetivo:** investigar OCR/tradução remotos com composição visual leve no
aparelho: instruções de cobertura/texto para fundos simples e, se a medição
justificar, pequenos patches produzidos no servidor para regiões complexas.
Não exigir inpainting no cliente nem presumir que overlay elimina o decode
da página. Benefício de custo, memória e rede ainda não foi medido.

Fonte detalhada: [alternativas e roteiro de comparação](../api/apps/translation-gateway/docs/architecture/hybrid-rendering-options-2026-10-18.md).
O documento diferencia fatos existentes, alternativas e hipóteses; não reabre
nem altera a auditoria de performance mobile DT-75.

**Conclusão:** revisão arquitetural/SDD de 020/021 e protótipo comparativo com
orçamentos definidos previamente, qualidade e consumo aceitáveis nos dois lados.
Não equivale a concluir a 020, liberar uploads ou autorizar novas chamadas pagas.

---

### DT-77: Cotas e preço de tradução nas assinaturas — **Bloqueia cobrança comercial**

**Estado:** aberto, registrado em 2026-11-10. Implementar a franquia por
assinatura com aplicação no gateway e exibição do saldo, benefícios e valores
na web, no Android e no iOS. Separar a franquia dos limites de infraestrutura
e do orçamento temporário de teste.

**Critério de aceite:** validar compra e renovação por canal, impedir consumo
duplicado e reconciliar o saldo de falhas. Aprovar franquia e preço com custos
medidos, taxas e impostos por canal, usando cenários a custo e de margem baixa,
média e alta. Mostrar valor e franquia antes da compra. Ver
[requisitos e modelo de precificação](translation-subscription-quotas.md).

---

## Histórico de priorização

As prioridades registradas durante cada auditoria permanecem no corpo dos
itens. O índice no início deste arquivo representa a visão consolidada atual;
não manter uma segunda tabela de contagens evita que itens resolvidos continuem
aparecendo como pendentes.

### DT-77: Qualidade visual da tradução — Fase 2 da auditoria Ubunchu! (2026-11-14)

**Estado:** Fase 1 feita (preservar original em overflow, teto de fonte por
mediana, termos protegidos/`translate="no"`, textos só-literais sem tradução,
`quality` no manifesto, piso de fonte 0,75× a mediana via expansão para o fundo
liso do balão, limpeza do halo JPEG em volta do texto, máscara do balão — arte/SFX fora do
balão intactos —, original preservado para texto sobre arte ou tradução idêntica, sem quebra no
meio da palavra, `text_free` do ONNX no layout `1.2` em sombra, `quality` no `ReadyResult` com
V10 e selo "revisar" no `gateway-tester`, releitura do OCR por confiança em mosaico com votação
apoiada em dicionário, inpainting LaMa de falas sobre arte no render local, piso de fonte pelo glifo de
origem CJK, recuperação de texto não lido ou lido pela metade pelas caixas do detector, falas CJK
juntadas pelo mesmo balão, fragmentos de balões vizinhos traduzidos juntos, retícula pelo LaMa, legenda
em japonês/chinês reconhecida, inpainting nos modos isolado/nativo com o modelo no pai, regressão visual por fala
(sintética + páginas reais locais), letreiros-frase em Noto Sans Black inclinada).
Manifesto de render `1.1` (2026-11-15): `kept` separa o original mantido de propósito (texto desenhado) do que
não coube, e só este conta como `TEXT_NOT_RENDERED`; render isolado também espera a vez do slot exclusivo.
Limites conhecidos: dois textos no mesmo balão (fala + aparte manuscrito) dividem o espaço e saem
menores; letra à mão que encosta na borda do balão fica (「がま」, pág. 03 — apagar tinta ligada à borda
apagaria o contorno); retícula sem página real de validação nas amostras; fim de letreiro que nem OCR nem
detector leem (「上手くいく」, pág. 03) fica no original. Pendente:

- **Inpainting real** (feito: fringe de 4 px para glifos que vazam do polígono; preenchimento que segue
  degradê, 2026-11-15; falta fundo texturizado).
- **Agrupamento por balão ONNX** avaliado (48 páginas en/ja), texto vertical CJK agrupado, classes
  e balões chegam ao render, modelo provisionado (Dockerfile com SHA fixado + Terraform `layout_mode`,
  worker 2 GiB), `grouping` padrão no Terraform (validate/fmt verdes).
- **SFX/texto livre**: texto livre preservado fica no idioma original (falta tipografia
  estilizada ou inpainting real); letreiros à mão sobre fundo liso viram fonte comum pequena.
- **Comparação com a edição original** (Ubunchu! ep. 01, Hiroshi Seo) e regressão visual.
- **Camada de linguagem opcional** (2026-11-15): Gemini no Vertex AI (`us`) revisa leitura do OCR e
  tradução com o contexto da página, só texto; desligada por padrão (`translation_refine_mode`),
  fallback para o Google em qualquer erro, aceitação por região, `languageModelLocation` no disclosure.
  **Validada no Vertex real em 2026-11-15** (12 páginas, `gemini-3.8-flash` em `us`; o `gemini-2.5-flash` não é
  acessível para projetos novos e deixou de ser o padrão): corrige "IS"→"15" e erros de contexto; onomatopeia deixada
  como desenho pelo Google não é mais trocada pelo modelo. Disclosure `2026-11-15.v1` + Política de Privacidade
  v1.1 (cita a camada) preparadas e exigidas pelo gateway/Terraform com o refino ligado; `translation_refine_mode =
  "gemini"` no exemplo de tfvars. Falta: revisão jurídica e deploy da política v1.1, aprovar a versão no tfvars e
  ligar OCR/tradução do worker no Terraform — ver `api/apps/translation-gateway/docs/architecture/language-layer.md`.

Fonte: auditoria visual das 12 páginas pt-BR (relatório anexado na conversa de 2026-11-14).
