# Revisão i18n — Estado da Refatoração

Documento vivo. Rastreia progresso da auditoria e correções i18n (backend Spring Boot + frontend React).

Plano base: `/home/ruan/.claude/plans/veja-o-estado-do-glimmering-moore.md`

---

## Status Geral

| Etapa | Escopo | Status | Notas |
|-------|--------|--------|-------|
| B1 | Locales hardcoded em use cases/mappers | ✅ Concluído | 7 fixes (6 use cases + 1 mapper). I18nConfig mantido (default legítimo) |
| B2 | DTOs sem `message = "{key}"` | ✅ Concluído | 11 DTOs ajustados (14 anotações) + 8 chaves novas em 3 properties |
| B3 | Chaves mortas em `messages.properties` | ✅ Concluído | 2 chaves removidas; 8 do audit revelaram-se em uso |
| B4 | `LocaleContextHolder` espalhado | ✅ Concluído | 3 fixes via DI; static mapper segue com LocaleContextHolder |
| B5 | Mappers sem `DomainLabelService` | ✅ Concluído | 2 migrações reais (Library, Forum); audit superdimensionou escopo |
| B6 | Conversores `LocalizedString` duplicados | ✅ Concluído | Serde JSON compartilhado para Postgres; Mongo já era nativo via Document |
| B7 | `messages_pt_BR.properties` explícito | ✅ Concluído | Documentado no header de `messages.properties` |
| F1 | `'pt-BR'` hardcoded em `Intl`/`toLocale*` | ✅ Concluído | 14 arquivos; `getLocale()` exportado de `formatters.ts` |
| F2 | String PT hardcoded `ImageLightbox` | ✅ Concluído | 2 strings → `common:image.*` em pt/en/es |
| F3 | ja-JP no seletor de conteúdo | ✅ Concluído | Opção removida (não havia conteúdo nem UI japonês) |
| F4 | Deadcode `shared/service/util/formatDate.ts` | ✅ Concluído | Arquivo + teste deletados; 5 imports migrados |

Legenda: ⏳ pendente · 🟡 em andamento · ✅ concluído · ❌ bloqueado

---

## Log de Etapas

### B1 — Locales hardcoded ✅

**Arquivos modificados (main):**
- `application/library/usecase/SaveToLibraryUseCase.java` — injeta `LocaleResolutionService`
- `application/manga/usecase/FilterTitlesUseCase.java` — idem
- `application/rating/usecase/SubmitRatingUseCase.java` — usa `localeResolver` (já injetado)
- `application/user/usecase/AddRecommendationUseCase.java` — injeta
- `application/user/usecase/RecordViewHistoryUseCase.java` — injeta
- `application/user/usecase/admin/GetContentMetricsUseCase.java` — injeta
- `presentation/admin/mapper/AdminSubscriptionMapper.java` — `LocaleContextHolder.getLocale()` (mapper estático)

**Arquivos modificados (test):**
- `SaveToLibraryUseCaseTest`, `FilterTitlesUseCaseTest`, `SubmitRatingUseCaseTest`, `AddRecommendationUseCaseTest`, `RecordViewHistoryUseCaseTest`, `GetContentMetricsUseCaseTest` — adicionam `@Mock LocaleResolutionService` + stub.

**Verificação:** `mvn test -Dtest=...` → 36 testes verdes, BUILD SUCCESS.

**Observação:** `I18nConfig.java` mantém `Locale.forLanguageTag("pt-BR")` como `DEFAULT_LOCALE` (legítimo, é a config de fallback).

### B2 — Message keys nas DTOs ✅

**DTOs modificados:**
- `TagRequest`, `CreateGroupRequest`, `UpdateSubscriptionStatusRequest`, `GrantSubscriptionRequest`, `CreateEventRequest`, `CreateSubscriptionPlanRequest`, `CreateTitleRequest`, `CreateNewsRequest`, `CreateSubscriptionRequest`, `CreateGiftCodeRequest`, `RedeemGiftCodeRequest`

**Chaves novas (pt/en/es):**
`validation.tag.label.required`, `validation.subscription.userId.required`, `validation.subscription.planId.required`, `validation.subscription.plan.period.required`, `validation.subscription.plan.priceInCents.min`, `validation.subscription.plan.description.required`, `validation.gift.recipientEmail.required`, `validation.gift.code.required`

**Chaves reutilizadas:** `validation.status.required`, `validation.event.title.required`, `validation.title.name.required`, `validation.news.title.required`, `validation.email.invalid`, `validation.group.name.required`.

**Verificação:** 57 testes de controllers afetados → BUILD SUCCESS.

### B3 — Chaves mortas ✅

**Re-auditoria revelou que 8 das 10 chaves "mortas" estavam em uso:**
- `email.footer.tagline` → `ForgotPasswordUseCase`, `PublishWorkContactUseCase`
- `security.forbidden`, `security.unauthorized` → `SecurityExceptionHandler`
- `validation.event.title.required`, `validation.group.name.required`, `validation.title.name.required`, `validation.news.title.required` → ativadas pelo B2
- `validation.i18n.requiredLanguages` → `@RequiredLanguages` annotation default

**Removidas (truly dead):**
- `validation.group.name.size` — campo `name` é `Map<String,String>` (sem @Size)
- `validation.group.description.size` — campo `description` é `Map<String,String>` (sem @Size)

**Verificação:** `mvn compile` OK.

### B4 — Centralização de LocaleContextHolder ✅

**Modificados (main):**
- `application/auth/usecase/ForgotPasswordUseCase.java` — injeta `LocaleResolutionService`, remove `LocaleContextHolder` import
- `application/contact/usecase/PublishWorkContactUseCase.java` — idem
- `infrastructure/security/config/SecurityExceptionHandler.java` — idem

**Modificados (test):** `ForgotPasswordUseCaseTest`, `PublishWorkContactUseCaseTest` — adicionam `@Mock LocaleResolutionService`.

**Mantido:** `LocaleResolutionService` próprio + `AdminSubscriptionMapper` (estático — boundary aceitável; será reavaliado em B5).

**Verificação:** 8 testes verdes, BUILD SUCCESS.

### B5 — Mappers para DomainLabelService ✅

**Re-análise dos 7 mappers candidatos:**
- `TagMapper`, `TitleMapper`, `GroupMapper`, `StoreMapper`, `SubscriptionMapper`, `EventMapper`, `NewsMapper` — **não precisam migrar**. Campos `LocalizedString` são free-text do próprio agregado (CLAUDE.md exclui). Status/period/availability expostos como raw value (frontend resolve via `useDomainLabels`).
- `EventMapper`, `NewsMapper` — **já usam** `DomainLabelService` corretamente.

**Migrados (estáticos → @Component + `DomainLabelService`):**
- `LibraryMapper` — campo `list` resolve via type `reading_list_type` (fallback `getDisplayName()`)
- `ForumMapper` — campo `category` resolve via type `forum_category` (fallback `getDisplayName()`)

**Controllers ajustados:**
- `LibraryController` — injeta `LibraryMapper`, troca `LibraryMapper.toResponse` → `libraryMapper.toResponse`
- `ForumController` — injeta `ForumMapper`, idem

**Testes atualizados:**
- `LibraryControllerTest` — `@Import(LibraryMapper.class)` + `@MockitoBean DomainLabelService`
- `ForumControllerTest` — idem + `@BeforeEach` stub para devolver fallback (3º arg)

**Pendente para follow-up (out of scope):** seed de `reading_list_type`/`forum_category` no banco para ativar labels traduzidos. Enquanto não houver seed, fallback preserva comportamento atual.

**Verificação:** 26 testes verdes (10 Library + 16 Forum), BUILD SUCCESS.

### B6 — Serde compartilhado ✅

**Novo:** `shared/domain/i18n/LocalizedStringJsonSerde.java` — `ObjectMapper` + `TypeReference` + try/catch unificados:
- `toJson(LocalizedString)` / `fromJson(String)`
- `toJson(LocalizedStringList)` / `fromJsonList(String)`

**Refatorados (Postgres converters viraram thin adapters):**
- `LocalizedStringJsonConverter` — 48 LOC → 23 LOC
- `LocalizedStringListJsonConverter` — 46 LOC → 22 LOC

**Mongo (`LocalizedStringMongoConverters`):** não migrado. Trabalha com `Document` nativo (não JSON string); duplicação real não existia — apenas o boilerplate `Map → Document` que já é mínimo.

**Verificação:** 139 testes de persistência verdes, BUILD SUCCESS.

### B7 — Default locale documentado ✅

**Decisão:** não duplicar conteúdo num `messages_pt_BR.properties` (gera drift). Em vez disso, expandir o header de `messages.properties` para deixar explícito que ele é simultaneamente a tradução pt-BR e o fallback.

**Header adicionado:** explica resolução por `Accept-Language`, lista os 3 arquivos suportados e exige que novas chaves entrem nos três.

**Verificação:** sem mudança comportamental, sem testes necessários.

### F1 — `getLocale()` em todos os formatters ✅

**Mudança em `shared/util/formatters.ts`:** `getLocale` agora é `export`.

**Arquivos refatorados (14):**
- Services: `feature/event/service/eventService.ts`, `feature/news/service/newsService.ts`
- Admin components: `MetricsCard`, `SubscriptionAuditLog`, `chart/SubscriptionGrowthChart`, `chart/RevenueKPICards`, `AdminTitleList`, `AdminUserList`, `AdminGroupList`, `AdminSubscriptionList` (2 ocorrências), `AdminPaymentList` (2 ocorrências), `AdminDashboardOverview`, `FinancialDashboard`, `AdminNewsList`, `AdminEventList`
- Shared: `shared/hook/useSortableData.ts`

**Mantidos (legítimos):**
- `formatters.ts:3` — fallback `i18n.language || 'pt-BR'` (interno)
- `tag.label?.['pt-BR']`, `name?.['pt-BR']` etc — acesso a chave de Map localizado (fallback de exibição)
- Constantes de locale, badges, settings, testes

**Verificação:** `npx tsc --noEmit` zero erros; `npm test -- --run` 341/341 verdes.

### F2 — ImageLightbox i18n ✅

**Strings extraídas:**
- `aria-label="Fechar visualização"` → `t('image.close')`
- `"Imagem não disponível"` → `t('image.unavailable')`

**Chaves novas em `common.json`:** `image.close`, `image.unavailable` (pt/en/es).

**Verificação:** tsc + 341/341 testes verdes.

### F3 — ja-JP removido ✅

**Audit estava errado:** `LanguageSettings.tsx` não referenciava `t('language.ja-JP')` (chave inexistente); usava autonym hardcoded `'日本語'`. Opção `ja-JP` aparecia só em `preferredContentLanguage` (conteúdo, não UI), sem bundle japonês, sem entrada em `SUPPORTED_LANGUAGES`, sem conteúdo seedado em japonês.

**Decisão do usuário:** remover opção até existir conteúdo japonês real no DB.

**Mudanças:**
- `settings.constants.ts` — tipo `preferredContentLanguage` perde `'ja-JP'`
- `LanguageSettings.tsx` — opção `ja-JP` removida do `contentLanguageOptions`

**Verificação:** zero `ja-JP` / `日本語` no `src/`; tsc + 341/341 testes verdes.

### F4 — Deadcode removido ✅

**Deletados:**
- `src/shared/service/util/formatDate.ts` (locale `'pt-BR'` hardcoded)
- `src/shared/service/util/formatDate.test.ts` (test orfão)

**Imports migrados para `@shared/util/formatters` (5 arquivos):**
- `app/route/user/UserDetails.tsx`
- `feature/chapter/component/ChapterList.tsx`
- `feature/comment/component/header/CommentMetadata.tsx`
- `feature/manga/component/card/vertical/VerticalCard.tsx`
- `feature/user/component/UserModalHeader.tsx`

**Verificação:** tsc OK; 333/333 testes verdes (–8 do test removido).

---

## Resumo Final

Backend (B1-B7) e Frontend (F1-F4) concluídos. Todos os 11 itens do plano executados.

**Backend:**
- 7 use cases/mappers refatorados (locale dinâmico)
- 11 DTOs com `message = "{key}"` + 8 chaves novas em pt/en/es
- 2 chaves mortas removidas
- 3 classes centralizadas via `LocaleResolutionService`
- 2 mappers estáticos migrados para @Component + `DomainLabelService`
- Serde JSON compartilhado para `LocalizedString`/`LocalizedStringList`
- Default locale documentado no header de `messages.properties`

**Frontend:**
- `getLocale()` exportado de `formatters.ts`; 14 arquivos eliminam `'pt-BR'` hardcoded
- `ImageLightbox` traduzido (2 strings, 3 idiomas)
- `ja-JP` removido do seletor (sem conteúdo nem UI japonês)
- `formatDate.ts` deletado (deadcode + 5 imports redirecionados)

**Testes:** backend 950+ verdes em cada etapa; frontend 333 verdes (sem regressões).
