# Relatório — Unificação de Comentários e Padronização de Votos

Data: 2026-06-09 · Branch: `refactor/unified-comments-votes`

## 1. Diferenças encontradas (estado anterior)

| Aspecto | Resenha | Obra | Fórum |
|---|---|---|---|
| Banco | MongoDB | MongoDB | **PostgreSQL** |
| Pai | `ratings` | `comments` | `forum_topics` |
| Voto | `review_votes` + `VoteValue`(UP/DOWN) + `upvotes`/`downvotes` + `/vote` toggle + self-vote block ✅ | `comment_reactions` + `ReactionType`(LIKE/DISLIKE) + `likeCount`/`dislikeCount` + `/like`+`/dislike` | só `likes` int, sem voto por usuário, sem endpoint |
| Réplica | — | thread (`parentCommentId`) | `forum_replies` (coleção separada) |
| Resultado/Response | `ReviewVoteResult`/`ReviewVoteResponse` | retorno do `Comment` | inexistente |

Problemas: 2 bancos para o mesmo conceito (UGC); 3 modelos de voto; nomes ambíguos
(`review_votes`≠`ratings`; `comment_reactions` não é "voto"); réplica do fórum em estrutura
separada.

## 2. Decisões oficiais

1. **Comentário unificado**: coleção `comments` única, polimórfica por `targetType`
   (`TITLE|REVIEW|FORUM_TOPIC`) + `targetId`, autorreferência `parentCommentId`
   (profundidade ilimitada). Réplica = comentário. Proibido `*_replies` separados.
2. **Voto único** (padrão resenha): `VoteValue{UP,DOWN}`, contadores `upvotes`/`downvotes`,
   doc `<pai>_votes`, endpoint `/vote` (toggle) + `/user-votes`, bloqueio self-vote.
3. **Nomenclatura** `<pai>` / `<pai>_votes`.

## 3. Alterações realizadas (entregue, build verde)

**Backend** (`api/server`):
- `shared/domain/vote/VoteValue`, `shared/application/vote/VoteResult`,
  `shared/dto/VoteResponse`+`VoteRequest`. Removidos `ReviewVoteResult/Response/Request`,
  `ReactionType`.
- `Comment`: `targetType`+`targetId` (substitui `titleId`), `parentCommentId`,
  `upvotes`/`downvotes` (substitui `like/dislikeCount`). `CommentReaction`→`CommentVote`
  (`comments_votes`, índice único `{commentId,userId}`).
- Use cases: `CastCommentVoteUseCase`+`RemoveCommentVoteUseCase` (espelham resenha),
  `GetUserCommentVotesUseCase`, `GetCommentsByTargetUseCase` (substituem React/GetUserReactions/ByTitle).
- `CommentController`: `/vote`+`DELETE /vote`+`/user-votes` (substitui `/like`,`/dislike`,
  `/user-reactions`); listagem `/target/{type}/{id}` + `/title/{id}` (compat).
- Resenha: votos usam os tipos compartilhados; `review_votes`→`reviews_votes`.
- Migrations Mongock `V014RenameReviewVotesCollection`, `V015UnifyCommentVotes`
  (targetType/targetId + `comment_reactions`→`comments_votes` com `reactionType`→`value`).
- i18n: chave `validation.vote.value.required` + `validation.comment.targetType/targetId.required`.
- Testes atualizados; **suíte da área alterada: 85+ testes verdes**, `mvn compile`/`test-compile` ok.

**Frontend** (`web/manga-reader`): `entities/comment/api/commentService.ts` adapta ao novo
contrato (upvotes/downvotes; create com targetType/targetId; `/vote`; `/user-votes`
traduzido para o modelo interno). Zero churn em types/hook/componentes. Service test 14 verde,
sem novos erros de `tsc`.

### 3.1 Correções da auditoria (2026-06-09, revisão pós-entrega)

Auditoria do entregue achou e corrigiu 2 bugs + 1 duplicação:

- **V015 — conflito de índice (boot failure)**: o rename de coleção carrega os índices;
  recriar o único composto `{commentId,userId}` com outro nome dispararia
  IndexOptionsConflict (erro 85). Corrigido: drop do índice herdado antes do create
  (`idx_comments_votes_comment_user`), e drop dos simples órfãos redundantes.
- **V015 — collection scan**: `$rename titleId→targetId` não atualiza índices; o
  `idx_comments_titleId` ficava morto e nenhum índice cobria `{targetType,targetId}`.
  Corrigido: drop do índice morto + `idx_comments_target_language`
  `{targetType,targetId,language,createdAt desc}` (cobre listagem particionada + sort).
- **V014**: índice herdado renomeado para `idx_reviews_votes_review_user` (casa com a
  anotação). Anotações das entities atualizadas (com `auto-index-creation=false`,
  anotação é documentação — índice real vem da migration).
- **`VoteToggle` compartilhado** (`shared/application/vote`): regra única do toggle
  (cria/remove/troca + clamp ≥0) extraída dos use cases de resenha e comentário
  (eliminando ~40 linhas duplicadas ×2; fase do fórum reutiliza). Entities votáveis
  implementam `HasVoteCounters`. Use cases mantêm só validação + persistência.
  `VoteToggleTest` cobre a regra direto; **suíte completa: 1027 testes, 0 falhas**.

## 4. Impactos da migração

- **Contrato de API quebrado** (comentários de obra): `/like`,`/dislike`,`/user-reactions`
  removidos; contadores agora numéricos `upvotes`/`downvotes`; criação exige
  `targetType`+`targetId`. Frontend atualizado no mesmo conjunto de commits.
- **Self-vote** agora bloqueado também em comentários de obra (antes permitido).
- **Dados**: V015 faz backfill idempotente (`titleId`→`targetId`, `targetType=TITLE`,
  `like/dislikeCount`→`upvotes/downvotes`, `comment_reactions`→`comments_votes`).

## 5. Pendente — próxima fase (fórum → Mongo)

Maior e mais arriscado item, deixado com roadmap preciso (ver
`/.claude/plans/prompt-aprimorado-realize-deep-wind.md` e DT-50):
- `forum_topics` → coleção Mongo (subject; autor vira snapshot); **`forum_replies` eliminado
  → vira `comments` `targetType=FORUM_TOPIC`**; votos `forum_topics_votes`.
- Runner cross-DB `V016MigrateForumToMongo` (lê JPA, grava Mongo, valida contagem) +
  Flyway `V33` drop das tabelas — **deploy em 2 fases** (backfill+leitura Mongo → confirmar → drop).
- Frontend do fórum: réplicas passam a consumir o comment service.
- Motivo do faseamento: forum acopla `User` (role/memberSince/postCount), `CounterReconciliationJob`
  e `ForumSeed`; exige verificação iterativa que não cabia num único passo seguro.

## 6. Débitos técnicos identificados

- Reconciliação Mongo dos contadores `upvotes`/`downvotes`/`replyCount` (job hoje só Postgres).
- Rename `ratings`→`reviews` (coleção + pacote + `title_rating_aggregate`) adiado: blast radius
  no módulo `rating-aggregator` + métricas admin + ~6 changeunits históricas; `ratings` não é
  ambíguo → baixa prioridade.
- Corpo do texto ainda diverge (`comment`/`content` vs `textContent`).
- Frontend mantém modelo interno `likeCount`/`userReaction` (adaptado no boundary) — rename
  cosmético para `upvotes`/`myVote` é follow-up opcional.

## 7. Sugestões arquiteturais

- **Votos polimórficos**: a longo prazo, unificar `<pai>_votes` numa coleção `votes`
  (`targetType`+`targetId`+`value`) alinhada ao comentário unificado — habilita moderação,
  notificações e métricas globais por um só ponto.
- **Paginação de threads**: com profundidade ilimitada, paginar/lazy-load por nível para
  evitar N+1 e payloads grandes.
- **Moderação/notificação/métricas** como serviços transversais sobre `comments`+`*_votes`,
  agora que o modelo é único.
