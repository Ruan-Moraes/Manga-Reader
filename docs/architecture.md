# Architecture

Padrões arquiteturais do Manga-Reader. Ler antes de criar controller/use
case/mapper, mexer em domínio, dual-DB, rating-aggregator, i18n ou contrato de
resposta da API. Referenciado por `CLAUDE.md`.

**Clean Architecture — 4 camadas, dependência flui para dentro:**

```
presentation → application → domain ← infrastructure
```

- **presentation**: REST controllers, DTOs, MapStruct mappers
- **application**: use cases (cada um implementa uma Port interface)
- **domain**: entities, value objects, enums — zero dependência de framework
- **infrastructure**: persistence adapters, security, email, messaging

### Domínios (17 pacotes)

`author`, `category`, `comment`, `errorlog`, `event`, `forum`, `group`, `label`, `library`, `manga`, `news`, `payment`, `publisher`, `review`, `store`, `subscription`, `user` — Auth vive em Security (infrastructure). Cada domínio tem package próprio em todas as camadas.

### Dual Database

| DB | Tech | Responsável por |
|----|------|----------------|
| PostgreSQL | JPA/Hibernate + Flyway | users, groups, events, library, stores, tags, subscriptions, payments, authors/publishers, domain labels (tabelas do fórum permanecem só como rollback da migração p/ Mongo — DT-50) |
| MongoDB | Spring Data Mongo + Mongock | titles, chapters, comments (coleção unificada polimórfica), reviews, forum_topics, votos (`<pai>_votes`), news, view history, **reviews_aggregate** |

### Serviço de Agregação de Avaliações (`api/jobs/rating-aggregator`)

Módulo Spring Boot **separado** do monolito (`api/core`), porta 8081. É o **dono** da coleção `reviews_aggregate` (ex-`title_rating_aggregate`, renomeada no rename `ratings`→`reviews` — DT-50), **fonte oficial única** de nota/contagem exibida em todas as telas (detalhe, cards, busca, ranking, recomendações, admin).

- **Por quê**: nota/contagem eram divergentes — listagens liam `Title.ratingAverage/ratingCount` (nunca atualizados; o "job periódico" do javadoc não existia) e o detalhe lia agregação `AVG/COUNT` ao vivo. Agora há fonte única denormalizada, sem agregação pesada por request.
- **Recompute (2 gatilhos)**: (1) consome `RatingEvent` (`rating.*`: submit/update/delete) do RabbitMQ (exchange `manga.events`, fila própria `manga.rating.aggregate`, routing `rating.#`) e recalcula o título; (2) job `@Scheduled` de reconciliação (rede de segurança). Mongock `V001` faz backfill a partir das avaliações (`V002` renomeou as coleções p/ `reviews`/`reviews_aggregate`).
- **Contrato de evento**: `RatingEvent` replicado no **mesmo FQN** `com.mangareader.application.shared.event.RatingEvent`; consumer usa `TypePrecedence.INFERRED` (robusto a divergência de FQN). Sem jar compartilhado entre os apps.
- **Monolito**: apenas **publica** os eventos (já fazia) e **lê** o agregado via `TitleRatingAggregateReadPort` (`findByTitleIdIn` em lote, sem N+1). `GetRatingAverageUseCase`/`GetRatingDistributionUseCase` e `TitleMapper`/`AdminTitleMapper` consomem o agregado — **nenhuma** agregação `AVG/COUNT` durante a renderização. O `RatingEventConsumer` e a fila de recalc do monolito foram removidos (recompute migrou para o serviço).

### Key Patterns

- **Ports & Adapters**: use cases dependem de port interfaces; infrastructure implementa
- **MapStruct**: mappers gerados como `@Component` (Spring beans) por padrão. Apenas mappers puros sem dependências externas podem ser `final class` estáticos. Mappers que injetam serviços (ex.: `DomainLabelService`) **devem** ser beans.
- **JWT Auth**: `JwtAuthenticationFilter` depende de `TokenPort` — todo `@WebMvcTest` **deve** mockar `TokenPort` via `@MockitoBean`
- **Paginação & usuário no controller (DT-23)**: **nunca** criar `buildPageable(...)` privado nem `extractUserId(Authentication)` no controller. Listagens recebem `@PageParams(defaultSort=..., defaultDirection=..., allow={...}, ignoreRequestSort=...) Pageable` (resolvido por `PageableArgumentResolver`, contrato de query `page/size/sort/direction`, whitelist via `SortValidator`); o id do usuário autenticado vem de `@CurrentUserId UUID userId` (`CurrentUserIdArgumentResolver`). Ambos registrados em `shared/web/PageableWebConfig`. `SpringDataWebAutoConfiguration` está **excluída** (não usar `sort=campo,dir` do Spring Data). `@WebMvcTest` que exercita esses endpoints **deve** `@Import(PageableWebConfig.class)`.
- **@Transactional**: use cases que modificam dados ou acessam lazy collections **devem** ter `@Transactional`. Read-only com lazy collections: `@Transactional(readOnly = true)`. Para todas as nuances de transação (propagação, rollback rules, anti-padrões, timeouts), consultar [`docs/orm-persistence.md`](orm-persistence.md).
- **I18n**: `I18nConfig` expõe `MessageSource` + `LocaleResolver` (Accept-Language) + `LocalValidatorFactoryBean`. Mensagens em `src/main/resources/messages/messages*.properties` (pt-BR default, en-US, es-ES). DTOs usam chaves: `@NotBlank(message = "{validation.email.required}")`. `SecurityExceptionHandler` e use cases de email resolvem via `messageSource.getMessage(key, null, LocaleContextHolder.getLocale())`. Frontend usa `react-i18next` com namespaces por feature em `src/i18n/locales/<lang>/<feature>.json` (ver `src/i18n/locales/README.md`). Receitas de implementação consolidadas em [`docs/i18n-guide.md`](i18n-guide.md).

### i18n Architecture — DB-backed Domain Labels

**Regra obrigatória**: Labels de entidades de negócio (status, categorias, tipos, tags, gêneros, moedas, classificações) devem ser armazenadas no banco com `LocalizedString` JSONB e resolvidas pelo backend conforme o `Accept-Language` do request.

**Quando usar `t('...')`**: apenas para textos estáticos de UI — botões, placeholders, mensagens fixas, alerts, validações, títulos de tela.

**Não usar `t('...')` para**: enums de negócio, dados dinâmicos, conteúdos administrativos, qualquer dado persistido.

**Padrão**: entidade `DomainLabel { type, value, labelI18n }` em PostgreSQL.
- Endpoint público: `GET /api/labels?type={type}` → `[{ value, label }]` (locale-resolved, cache 3 dias no frontend)
- Endpoint admin: `GET /api/labels/admin?type={type}` → `[{ value, labelI18n: Map }]` (todos os idiomas)
- Frontend: hook `useDomainLabels(type)` + queryKey `[QUERY_KEYS.DOMAIN_LABELS, type, i18n.language]`
- Mesmo padrão de `Tag` e `LocalizedMappingHelper.resolveOrFallback()`
- Mappers que retornam labels de negócio **devem** injetar `DomainLabelService` e usar `resolveLabel(type, value, fallback)`
- `@WebMvcTest` que importa mapper com `DomainLabelService` **deve** adicionar `@MockitoBean DomainLabelService domainLabelService`
- Novas entidades de negócio com labels exibíveis **devem** seguir esse padrão

**Tipos seed disponíveis**: `publication_status`, `news_category`, `event_type`, `event_status`, `event_timeline`, `currency`

### i18n Architecture — UI vs Conteúdo

Dois eixos separados, com modelos de armazenamento distintos:

- **UI language** (interface): **somente JSON do i18next + localStorage**. Não persistido no backend. Frontend define via `i18n.changeLanguage()` (chave `i18nextLng` no localStorage). O interceptor HTTP envia `Accept-Language: <i18n.language>`, então emails/validações/mensagens de erro do backend respeitam a UI atual via `AcceptHeaderLocaleResolver`.
- **Content language** (catálogo + UGC): persistido em `users.content_locales` (JSONB, BCP 47). Resolve `LocalizedString` (Title, News, Tag, Chapter) e filtra UGC (Comment, ForumTopic). Lista ordenada = cadeia de fallback.

**Backend**:
- `User.contentLocales: List<String>` (default `["pt-BR"]`); método `updateContentLocales` valida BCP 47.
- `LocaleResolutionService.currentContentLocales()` retorna a cadeia: autenticado → `user.contentLocales`; anônimo → parse de `Accept-Language`; sempre termina em `pt-BR`.
- `LocaleResolutionService.resolve(LocalizedString)` percorre a cadeia antes do fallback global. Mappers (`TitleMapper`, `NewsMapper`, `TagMapper`, `LocalizedMappingHelper`) herdam automaticamente.
- UGC: use cases públicos (`GetForumTopicsUseCase`, `GetForumTopicsByCategoryUseCase`, `GetCommentsByTitleUseCase`) usam `findByLanguageIn(currentContentLanguageTags(), ...)`. Admin cross-language toggle (`crossLanguage=true`) bypassa filtro.

**Endpoints**:
- `GET /api/users/me/content-locales` → `{ contentLocales: string[] }`
- `PATCH /api/users/me/content-locales` (body: `{ contentLocales }`; valida via `User.updateContentLocales`)

**Frontend**:
- Hook `useContentLocales(isLoggedIn)` (TanStack Query) — sync com backend somente para users autenticados.
- `LanguageSettings.tsx`: troca de UI lang só dispara `i18n.changeLanguage`; troca de content lang dispara mutation quando logado.

### API Response Patterns

Todas as respostas da API seguem um dos dois padrões:

**Resposta simples** — `ApiResponse<T>`:
```json
{ "data": T, "success": true, "message": "...", "statusCode": 200 }
```
Frontend acessa: `response.data.data`

**Resposta paginada** — `ApiResponse<PageResponse<T>>`:
```json
{
  "data": {
    "content": [],
    "page": 0, "size": 20,
    "totalElements": 100, "totalPages": 5, "last": false
  },
  "success": true
}
```
Frontend acessa: `response.data.data.content` (ou `res.content` após extrair `data.data` no service)

**Regra**: Endpoints de listagem **devem** retornar `ApiResponse<PageResponse<T>>` com paginação. Endpoints de item único retornam `ApiResponse<T>` direto.

### Capítulos admin — ports & armazenamento provisório (frontend-only, DT-57)

O gerenciamento de capítulos (painel admin, páginas, métricas e leitor) foi
implementado antes do backend correspondente existir. O contrato é isolado por
**ports** no frontend, em `web/manga-reader/src/entities/chapter/`:

- `model/admin/` — domínio puro: types (`AdminChapter`, `ChapterPage`,
  `ChapterMetrics`), máquina de status (`draft/processing/scheduled/published/
  hidden/unavailable/archived`), validações como funções puras que retornam
  **codes** (i18n só na UI), e 3 ports: `ChapterAdminGateway` (CRUD, bulk,
  reorder atômico, páginas), `ChapterPublicGateway` (leitor: só `published`,
  `'blocked'` para o resto) e `ChapterAnalyticsGateway` (métricas).
- `api/admin/` — implementação provisória em localStorage: seed demo
  determinístico (PRNG mulberry32 por titleId), latência simulada, pipeline
  fake de processamento de páginas (`uploading→processing→ready|error`) e
  "lazy promotion" de agendados. **Ponto único de troca**:
  `api/admin/chapterGateways.ts` — quando `/api/admin/.../chapters` existir,
  reescrever só este arquivo com services axios (status convertido via
  `CHAPTER_STATUS_TO_API`, minúsculo no front ⇄ MAIÚSCULO na API).

Consumo: `features/admin` (hooks React Query + UI, padrão Titles) e
`pages/chapter` (leitor: `useReaderPages`, fallback para placeholders quando o
armazenamento provisório está vazio). Regras de negócio nunca em componentes —
o fake valida com as mesmas funções do domínio que o form usa inline.
Detalhes e plano de substituição: `docs/tech-debt.md` DT-57 (dep.: DT-44).
