# Architecture

Padrões arquiteturais do Manga-Reader. Ler antes de criar controller, use case
ou mapper, alterar domínios, persistência poliglota, jobs, i18n ou contratos de
resposta da API. Referenciado por `AGENTS.md` e `CLAUDE.md`.

**Clean Architecture — 4 camadas, dependência flui para dentro:**

```
presentation → application → domain ← infrastructure
```

- **presentation**: REST controllers, DTOs, MapStruct mappers
- **application**: use cases (cada um implementa uma Port interface)
- **domain**: entities, value objects, enums — zero dependência de framework
- **infrastructure**: persistence adapters, security, email, messaging

### Domínios

Os 19 pacotes de domínio atuais são `auth`, `author`, `category`, `comment`,
`errorlog`, `event`, `forum`, `group`, `label`, `library`, `manga`, `news`,
`payment`, `publisher`, `review`, `store`, `subscription`, `trending` e `user`.
Nem todo pacote precisa possuir artefatos em todas as camadas; os limites seguem
as responsabilidades implementadas.

### Persistência poliglota

| Tecnologia                          | Papel principal                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL + JPA/Hibernate + Flyway | Usuários, grupos, eventos, biblioteca, lojas, tags, assinaturas, pagamentos, autores, editoras e labels de domínio. As tabelas antigas do fórum permanecem apenas para rollback da migração (DT-50). |
| MongoDB + Spring Data + Mongock     | Títulos, capítulos, comentários polimórficos, avaliações, tópicos do fórum, votos, notícias, histórico de leitura e projeções `reviews_aggregate`/`title_trend_daily`.                               |
| Neo4j + `Neo4jClient`               | Grafo social de seguidores, seguindo e remoção dos nós relacionados à conta.                                                                                                                         |
| Redis                               | Cache de aplicação; não é fonte canônica de dados de negócio.                                                                                                                                        |

PostgreSQL, MongoDB e Neo4j possuem transações independentes. Operações entre
tecnologias não são atomicamente distribuídas; use cases, eventos e jobs de
reconciliação tratam as janelas de divergência conhecidas.

### Feed de últimos lançamentos

`GET /api/releases` consulta capítulos públicos no MongoDB por janela de
calendário (`DAY`, `WEEK` ou `MONTH`) e usa o timezone IANA do cliente para
definir os limites. A busca combina título localizado, idioma do capítulo,
política de conteúdo adulto e, quando autenticado, os ids da biblioteca no
PostgreSQL. O retorno é paginado por `publishedAt desc`; títulos legados sem
idioma ou grupo continuam válidos e são exibidos com metadados desconhecidos.

Cada `Chapter` novo persiste `contentLanguage` em BCP 47. O grupo de scan é
opcional: seu id é validado no PostgreSQL na escrita, enquanto nome localizado
e logo são copiados para o capítulo como snapshot histórico cross-DB. Não há FK
Mongo→PostgreSQL e alterações posteriores no grupo não reescrevem capítulos já
publicados.

O estado privado de visualização fica em `release_feed_views`, com dependência
funcional `(userId, chapterId) → seenAt`, índice composto único e índice simples
por `chapterId` para limpeza. O `PUT` individual é um upsert idempotente que
preserva o primeiro `seenAt`; a ação diária usa bulk upsert para todos os
capítulos públicos do dia, inclusive os que não estão na página carregada.
Esse estado não conclui leitura, não publica atividade, não incrementa métricas
e não é histórico comportamental sujeito a `DO_NOT_TRACK`. A exclusão de conta
ou capítulo remove as respectivas marcações.

### Serviço de Agregação de Avaliações (`api/jobs/rating-aggregator`)

Módulo Spring Boot **separado** do monolito (`api/core`), porta 8081. É o **dono** da coleção `reviews_aggregate` (ex-`title_rating_aggregate`, renomeada no rename `ratings`→`reviews` — DT-50), **fonte oficial única** de nota/contagem exibida em todas as telas (detalhe, cards, busca, ranking, recomendações, admin).

- **Por quê**: nota/contagem eram divergentes — listagens liam `Title.ratingAverage/ratingCount` (nunca atualizados; o "job periódico" do javadoc não existia) e o detalhe lia agregação `AVG/COUNT` ao vivo. Agora há fonte única denormalizada, sem agregação pesada por request.
- **Recompute (2 gatilhos)**: (1) consome `RatingEvent` (`rating.*`: submit/update/delete) do RabbitMQ (exchange `manga.events`, fila própria `manga.rating.aggregate`, routing `rating.#`) e recalcula o título; (2) job `@Scheduled` de reconciliação (rede de segurança). Mongock `V001` faz backfill a partir das avaliações (`V002` renomeou as coleções p/ `reviews`/`reviews_aggregate`).
- **Contrato de evento**: `RatingEvent` replicado no **mesmo FQN** `com.mangareader.application.shared.event.RatingEvent`; consumer usa `TypePrecedence.INFERRED` (robusto a divergência de FQN). Sem jar compartilhado entre os apps.
- **Monolito**: apenas **publica** os eventos (já fazia) e **lê** o agregado via `TitleRatingAggregateReadPort` (`findByTitleIdIn` em lote, sem N+1). `GetRatingAverageUseCase`/`GetRatingDistributionUseCase` e `TitleMapper`/`AdminTitleMapper` consomem o agregado — **nenhuma** agregação `AVG/COUNT` durante a renderização. O `RatingEventConsumer` e a fila de recalc do monolito foram removidos (recompute migrou para o serviço).

### Job de Tendências (`api/jobs/trending-aggregator`)

Job Spring Boot separado, porta 8083, que lê sinais temporais em lote do PostgreSQL e MongoDB uma vez por dia. O score combina leituras, biblioteca, avaliações, comentários e lançamentos, comparando dias UTC completos em janelas adjacentes de 1/7/30 dias com suavização de amostras pequenas. Persiste snapshots idempotentes em `title_trend_daily`, incluindo crescimento geral e por sinal; a API principal só consulta o snapshot mais recente via `TrendingReadPort`, ordenando por score, leituras, avaliações ou salvamentos sem agregações no request.

`title_trend_daily` é uma projeção derivada e reconstruível: `(titleId, snapshotDate)` determina `calculatedAt` e os scores, materializado no `_id` como `titleId:data`. Os mapas por janela são uma desnormalização deliberada para leitura ordenada. Não há FK cross-DB; títulos removidos são filtrados pela API. Índices compostos cobrem data+ranking e cada fonte temporal; snapshots expiram após 90 dias por TTL, pois não são fonte para o próximo cálculo.

### Job de Reconciliação (`api/jobs/orphan-cleaner`)

Serviço separado, porta 8082, responsável pelo caminho frio de consistência
entre PostgreSQL e MongoDB. Reconcilia contadores desnormalizados a partir das
fontes canônicas e remove referências PostgreSQL cujo `title_id` não existe mais
no MongoDB. As operações são idempotentes e incluem proteção contra remoção em
massa quando a verificação de títulos não retorna resultados confiáveis.

Detalhes operacionais ficam no
[`README` do serviço](../api/jobs/orphan-cleaner/README.md).

### Gateway de tradução planejado

O pipeline privado de OCR/tradução não será incorporado à Core. O plano aprovado
cria um serviço Spring Boot independente, com contrato versionado para o mobile,
processamento assíncrono e conteúdo remoto efêmero. A arquitetura, modelo
relacional, fronteiras FSD, retenção e gates estão em
[`translation-gateway-plan.md`](translation-gateway-plan.md). Enquanto o serviço
não for implementado e implantado, esta seção descreve intenção aprovada, não
comportamento disponível.

### Key Patterns

- **Ports & Adapters**: use cases dependem de port interfaces; infrastructure implementa
- **MapStruct**: mappers gerados como `@Component` (Spring beans) por padrão. Apenas mappers puros sem dependências externas podem ser `final class` estáticos. Mappers que injetam serviços (ex.: `DomainLabelService`) **devem** ser beans.
- **JWT Auth**: `JwtAuthenticationFilter` depende de `TokenPort` — todo `@WebMvcTest` **deve** mockar `TokenPort` via `@MockitoBean`
- **Refresh token rotation (server-side)**: refresh tokens persistidos em `refresh_tokens` (Postgres, V40) como **SHA-256 hex** (nunca em claro), com `family_id` por sessão. Cada `POST /api/auth/refresh` revoga o token usado e emite par novo na mesma família; **reuso de token revogado derruba a família inteira** (detecção de roubo). `POST /api/auth/logout` revoga a família. No **web** o refresh trafega em cookie `HttpOnly + SameSite=Strict + Path=/api/auth` (Secure via `app.auth.cookie-secure`); o **mobile** segue enviando no body — o controller aceita ambos, cookie tem precedência. No web o access token vive **só em memória** (`shared/service/session/accessTokenMemory`); o interceptor axios faz refresh silencioso single-flight (fila) e emite `authExpired` (pub/sub em `shared/service/session`) quando a sessão morre — `AuthProvider` assina e os guards reagem ao contexto (`isInitializing` segura render de conteúdo protegido). `@WebMvcTest` do `AuthController` **deve** `@Import(RefreshTokenCookieFactory.class)`.
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

- `useInterfaceLang.ts` altera somente a UI via `i18n.changeLanguage()`.
- `useContentLocales(isLoggedIn)` e `useReadingLangs.ts` sincronizam idiomas de
  conteúdo com o backend somente para usuários autenticados.

### Busca global do catálogo

`GET /api/search/suggestions` e `GET /api/search` pesquisam obras, autores,
artistas, editoras e grupos. O endpoint legado `GET /api/titles/search`
permanece compatível e delega ao mesmo mecanismo de obras. A busca combina o
catálogo do MongoDB com relações do PostgreSQL sem transferir o catálogo inteiro
entre bancos: pessoas usam `title_authors`, editoras usam `title_publishers` e
grupos usam `groups + group_works`. IDs relacionais são enviados em lote para
o Mongo, que mantém paginação e política de conteúdo adulto.

O subdocumento Mongo `Title.searchIndex` é uma projeção reconstruível de
`Title.name` e `Title.aliases`, com nomes normalizados e bigramas. Ele é recalculado por
`TitleSearchIndexCallback` em toda gravação e recebe backfill/índice multikey
pela Mongock V028. A fonte canônica continua sendo `Title.name`; código de
negócio não deve escrever `searchIndex` diretamente. No PostgreSQL, a Flyway
V44 fornece normalização imutável e índices GIN trigram para as correspondências
relacionais. A V45 adiciona imagens e aliases de pessoas, logo/descrição e
aliases de editoras em tabelas filhas BCNF, com unicidade normalizada e FKs
`ON DELETE CASCADE`; contagens de obras continuam derivadas.

No frontend, `features/search-catalog` é proprietária do combobox global, do
debounce e do histórico local versionado. `entities/manga` mantém o contrato
de obras, enquanto `entities/author`, `entities/publisher` e `entities/group`
mantêm seus contratos de leitura. `widgets/header` apenas compõe a mesma feature
nas disposições desktop e mobile. O histórico contém no máximo seis termos e
permanece local ao navegador.

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
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "last": false
  },
  "success": true
}
```

Frontend acessa: `response.data.data.content` (ou `res.content` após extrair `data.data` no service)

**Regra**: Endpoints de listagem **devem** retornar `ApiResponse<PageResponse<T>>` com paginação. Endpoints de item único retornam `ApiResponse<T>` direto.

### Notícias — workflow editorial e mídia provisória

`NewsItem` é um agregado de domínio puro; `NewsDocument` concentra o mapeamento Spring Data
e o adapter converte entre ambos. O workflow `DRAFT → SCHEDULED/PUBLISHED → UNPUBLISHED`
é validado no domínio e usa `Instant`/`Clock`; um job UTC promove agendamentos vencidos de
forma idempotente. Leituras públicas filtram exclusivamente `PUBLISHED`, enquanto a listagem
admin aceita status/categoria e ordenação allow-listed.

`slug` é chave candidata única além de `_id`. SEO e textos localizados são subdocumentos do
mesmo agregado. A URL da capa é temporariamente uma referência externa: o admin pode informar
uma URL ou gerar `https://picsum.photos/seed/{slug}/1600/900`. `NewsCoverStoragePort` registra
o seam para S3/Cloudinary/R2, mas nenhum upload binário é simulado antes desse adapter existir.

### Capítulos admin — ports & gateways HTTP

O gerenciamento de capítulos isola os contratos por **ports** no frontend, em
`web/manga-reader/src/entities/chapter/`:

- `model/admin/` — domínio puro: types (`AdminChapter`, `ChapterPage`,
  `ChapterMetrics`), máquina de status (`draft/processing/scheduled/published/
hidden/unavailable/archived`), validações como funções puras que retornam
  **codes** (i18n só na UI), e 3 ports: `ChapterAdminGateway` (CRUD, bulk,
  reorder atômico, páginas), `ChapterPublicGateway` (leitor: só `published`,
  `'blocked'` para o resto) e `ChapterAnalyticsGateway` (métricas).
- `api/admin/` — gateways HTTP para CRUD admin, leitura pública, progresso e
  analytics. `chapterGateways.ts` é o ponto único de composição; status é
  convertido entre minúsculo no frontend e maiúsculo na API. Os adapters de
  `localStorage` existem somente para testes e importação controlada do legado.

Consumo: `features/admin` (hooks React Query + UI, padrão Titles) e
`pages/chapter` (leitor via `useReaderPages`). Regras de negócio nunca ficam em
componentes; as validações puras continuam compartilhadas com os formulários.
Upload binário de páginas permanece separado em `docs/tech-debt.md` DT-44.
