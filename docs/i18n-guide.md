# Guia de i18n — Manga Reader

Este documento explica, de ponta a ponta, como funciona o suporte a múltiplos idiomas no Manga Reader: como o conteúdo é armazenado no banco, como o backend resolve traduções por requisição, como o frontend escolhe e propaga o idioma do usuário, e quais são as regras de fallback.

> Para o histórico de implementação por etapa, veja [`i18n.md`](./i18n.md).
> Este guia é a referência operacional para quem vai construir features novas.

---

## 1. Idiomas suportados

| Tag (BCP 47) | Nome              | Papel                                     |
|--------------|-------------------|-------------------------------------------|
| `pt-BR`      | Português (Brasil)| **Padrão e fallback obrigatório**         |
| `en-US`      | Inglês (EUA)      | Suportado                                 |
| `es-ES`      | Espanhol (Espanha)| Suportado                                 |

Convenção: sempre **language tag BCP 47 com hífen** (`pt-BR`), nunca underscore (`pt_BR`) ou minúsculas (`pt-br`). É o que `Locale.toLanguageTag()` (Java) e `i18next` (frontend) produzem.
st
Adicionar um quarto idioma (ex.: `ja-JP`) é **só dados** — sem migração de schema. Veja a seção 9.

---

## 2. Visão geral em uma frase

> Conteúdo de **catálogo** (Title, NewsItem, Event, Tag, Group, Store, SubscriptionPlan) é armazenado como **mapa BCP 47 → texto** num campo único; o backend resolve para uma string de acordo com o `Accept-Language` do request, com fallback para `pt-BR`. Conteúdo **gerado por usuário** (Comment, ForumTopic, ForumReply, MangaRating) é **particionado por idioma** — cada post fica no idioma em que o usuário estava configurado quando o criou, e listagens só retornam posts do idioma ativo.

---

## 3. Dois modelos diferentes

A distinção é importante: catálogo e UGC seguem regras opostas.

### 3.1 Catálogo (admin edita, todo mundo lê)

- **Uma entidade** com **muitas traduções**.
- Backend persiste todas; resolve uma na hora de responder.
- Fallback `pt-BR` quando o idioma pedido não existe.

Exemplo: o `Title` de "Solo Leveling" tem `name = { "pt-BR": "Solo Leveling", "en-US": "Solo Leveling", "es-ES": "Solo Leveling" }` e `synopsis` traduzido em três idiomas. Um leitor em EN recebe `"name": "Solo Leveling"` (string já resolvida); um admin editando recebe o mapa completo.

### 3.2 UGC (usuário cria, mesmos usuários leem)

- **Cada post existe em um único idioma**.
- O idioma é gravado no momento da criação a partir do `Accept-Language`.
- Listagens públicas filtram `WHERE language = :userLocale`. **Sem fallback.**
- Razão: evitar contaminação cross-language no fórum/comentários (usuário em EN não vê comentários em PT misturados na thread).

Exemplo: usuário A (configurado em pt-BR) comenta num título; usuário B (configurado em en-US) também comenta. Cada um vê apenas comentários do próprio idioma. Trocar o idioma da UI muda o conjunto exibido.

---

## 4. Como o conteúdo é armazenado

### 4.1 PostgreSQL — JSONB

Cada campo traduzível vira uma coluna `<campo>_i18n` do tipo `JSONB`, com chaves BCP 47 e valores texto.

```sql
ALTER TABLE events
    ADD COLUMN title_i18n       JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN subtitle_i18n    JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
```

Conteúdo típico:

```json
{
  "pt-BR": "Anime Friends 2026",
  "en-US": "Anime Friends 2026",
  "es-ES": "Anime Friends 2026"
}
```

Para listas (ex.: `SubscriptionPlan.features`, `NewsItem.content[]`):

```json
{
  "pt-BR": ["Acesso ilimitado", "Sem anúncios"],
  "en-US": ["Unlimited access", "Ad-free"],
  "es-ES": ["Acceso ilimitado", "Sin anuncios"]
}
```

#### Tabelas com colunas `*_i18n`

| Tabela               | Colunas i18n                                        |
|----------------------|-----------------------------------------------------|
| `tags`               | `label_i18n`                                        |
| `events`             | `title_i18n`, `subtitle_i18n`, `description_i18n`   |
| `groups`             | `name_i18n`, `description_i18n`                     |
| `stores`             | `name_i18n`, `description_i18n`                     |
| `subscription_plans` | `description_i18n`, `features_i18n`                 |

#### UGC PostgreSQL

UGC ganha uma coluna `language VARCHAR(10) NOT NULL DEFAULT 'pt-BR'` com índice composto `(language, created_at DESC)` para listagens paginadas.

| Tabela          | Coluna     |
|-----------------|------------|
| `forum_topics`  | `language` |
| `forum_replies` | `language` |

### 4.2 MongoDB — subdocumento embutido

A mesma ideia, mas como objeto BSON dentro do documento:

```json
{
  "_id": "title-abc123",
  "name": "Solo Leveling",
  "nameI18n": {
    "pt-BR": "Solo Leveling",
    "en-US": "Solo Leveling",
    "es-ES": "Solo Leveling"
  },
  "synopsis": "Em um mundo onde caçadores...",
  "synopsisI18n": {
    "pt-BR": "Em um mundo onde caçadores...",
    "en-US": "In a world where hunters...",
    "es-ES": "En un mundo donde cazadores..."
  }
}
```

#### Coleções com campos `*I18n`

| Coleção  | Campos i18n                                                      |
|----------|------------------------------------------------------------------|
| `titles` | `nameI18n`, `synopsisI18n`                                       |
| `news`   | `titleI18n`, `subtitleI18n`, `excerptI18n`, `contentI18n`        |

#### UGC MongoDB

| Coleção         | Campo      |
|-----------------|------------|
| `comments`      | `language` |
| `manga_ratings` | `language` |

### 4.3 Por que mantemos o campo legado (Fase A)

Nas migrações de Etapa 2 (V12 / Mongock V004), as colunas/campos antigos (`label`, `title`, `synopsis`, etc.) **continuam existindo** ao lado dos novos `*_i18n` / `*I18n`. Razão: deploy **zero-downtime**. Aplicação antiga continua lendo do campo plano enquanto a nova lê do JSONB. Após estabilização e refatoração de todos os callers, uma **Fase B** (futura) emite `DROP COLUMN` / `$unset` para remover os campos antigos.

Hoje (etapa 4 em andamento) os mappers cobrem o gap automaticamente:

```java
private String resolveOrFallback(LocalizedString i18n, String legacy) {
    if (i18n != null && !i18n.isEmpty()) {
        return localeResolver.resolve(i18n);
    }
    return legacy;
}
```

### 4.4 Fonte da verdade no código (Java)

Dois Value Objects no domínio:

- `com.mangareader.shared.domain.i18n.LocalizedString` — texto único por idioma (`Map<String, String>`).
- `com.mangareader.shared.domain.i18n.LocalizedStringList` — lista por idioma (`Map<String, List<String>>`).

Ambos são **imutáveis**. Métodos principais:

```java
LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello"));
LocalizedString.ofDefault("Olá");                    // só pt-BR
ls.resolve(Locale.forLanguageTag("en-US"));          // "Hello"
ls.resolveOrNull(Locale.forLanguageTag("ja-JP"));    // null (sem fallback)
ls.with("es-ES", "Hola");                            // nova instância
ls.has("pt-BR");                                     // true se preenchido
```

Persistência via `AttributeConverter` (`LocalizedStringJsonConverter` / `LocalizedStringListJsonConverter`) + `@JdbcTypeCode(SqlTypes.JSON)` no campo da entidade. MongoDB serializa direto via Spring Data Mongo + Jackson.

---

## 5. Como o backend resolve o idioma

Fluxo por requisição HTTP:

```
Request com header Accept-Language: en-US
         │
         ▼
[ AcceptHeaderLocaleResolver ]   (Spring; já estava configurado em I18nConfig)
         │
         ▼
LocaleContextHolder.getLocale() = Locale("en", "US")
         │
         ▼
[ Use case ]   ── retorna entidades com LocalizedString cru ──▶
         │
         ▼
[ Mapper Spring bean ]   ── usa LocaleResolutionService ──▶
         │
         ▼
DTO público: { name: "Hello", synopsis: "..." }   (string já resolvida)
DTO admin:   { name: { "pt-BR": "...", "en-US": "..." } }   (mapa cru)
```

### 5.1 Cadeia de fallback (catálogo)

`LocalizedString.resolve(locale)`:

1. **Tag exata** (`locale.toLanguageTag()`) — se preenchida (não-nula, não-em-branco).
2. **Fallback `pt-BR`**.
3. **Primeira tradução disponível** (qualquer idioma com valor).
4. **String vazia**.

Para `LocalizedStringList.resolve(locale)`, mesma cadeia trocando "preenchida" por "lista não-vazia".

### 5.2 UGC — sem fallback, particionamento estrito

Use cases de criação injetam `LocaleResolutionService` e gravam o idioma do contexto:

```java
public Comment execute(CreateCommentInput input) {
    // ...
    return Comment.builder()
            .titleId(input.titleId())
            .userId(input.userId().toString())
            .textContent(input.textContent())
            .language(localeResolver.currentLanguageTag())   // ← do Accept-Language
            .build();
}
```

Use cases de listagem filtram pelo locale ativo:

```java
public Page<Comment> execute(String titleId, Pageable pageable) {
    return commentRepository.findByTitleIdAndLanguage(
            titleId, localeResolver.currentLanguageTag(), pageable);
}
```

Resultado: usuário em EN nunca vê comentários gravados em PT (e vice-versa).

### 5.3 Componentes-chave

| Classe                                     | Pacote                                   | Papel                                        |
|--------------------------------------------|------------------------------------------|----------------------------------------------|
| `LocaleResolutionService`                  | `shared.application.i18n`                | Único ponto que lê `LocaleContextHolder`     |
| `RequiredLanguages` (`@`) + Validator      | `shared.application.i18n`                | Valida pt-BR obrigatório em DTOs admin       |
| `LocalizedMappingHelper`                   | `presentation.shared.mapper`             | Helper para MapStruct (resolve / toMap)      |
| `VaryAcceptLanguageFilter`                 | `infrastructure.i18n`                    | Adiciona `Vary: Accept-Language` em todas as respostas (proteção de cache) |

---

## 6. Como o frontend funciona

### 6.1 Idioma ativo do usuário

`react-i18next` mantém o idioma em `i18n.language`. Persistido em `localStorage` (chave `i18nextLng`) via `i18next-browser-languagedetector`.

```ts
// frontend/src/i18n/config.ts
export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'];
export const DEFAULT_LANGUAGE = 'pt-BR';
```

Componente `LanguageSettings.tsx` permite trocar:

```ts
i18n.changeLanguage('en-US');
```

### 6.2 Header `Accept-Language` em todo request

Interceptor HTTP injeta automaticamente:

```ts
// shared/service/http/httpInterceptors.ts
config.headers.set('Accept-Language', i18n.language);
```

### 6.3 Invalidação de cache ao trocar idioma

Em `main.tsx`:

```ts
i18n.on('languageChanged', () => {
    queryClient.invalidateQueries();
});
```

Sem isso, o React Query devolveria respostas em cache do idioma anterior.

### 6.4 Tipos compartilhados

```ts
// shared/type/i18n.ts
export type LanguageTag = 'pt-BR' | 'en-US' | 'es-ES';
export type LocalizedString = Partial<Record<LanguageTag, string>>;
export type LocalizedStringList = Partial<Record<LanguageTag, string[]>>;
```

### 6.5 Componente `LocalizedTextInput`

Usado em forms admin para editar todos os idiomas com tabs:

```tsx
<LocalizedTextInput
    label="Sinopse"
    value={synopsisI18n}
    onChange={setSynopsisI18n}
    multiline
    rows={6}
    requiredLanguages={['pt-BR']}
/>
```

- Tabs por idioma (`pt-BR` / `en-US` / `es-ES`).
- Indicador `●` verde quando preenchido, vermelho quando obrigatório e ausente.
- Suporta `multiline` para textareas (descrições, sinopses).
- Editar uma aba não afeta as outras (estado é o mapa completo).

---

## 7. Contrato da API

### 7.1 DTOs públicos (consumo geral)

Backend já entrega string resolvida pelo locale do request. Cliente vê texto puro:

```json
GET /api/titles/abc-123     (Accept-Language: en-US)

{
  "data": {
    "id": "abc-123",
    "name": "Solo Leveling",
    "synopsis": "In a world where hunters..."
  },
  "success": true
}
```

### 7.2 DTOs admin (edição)

Endpoints admin retornam **mapa completo** + campos legados resolvidos. Aceitam mapas no body:

```json
PATCH /api/admin/events/abc

{
  "title": "Anime Friends",
  "titleI18n": {
    "pt-BR": "Anime Friends",
    "en-US": "Anime Friends"
  },
  "descriptionI18n": {
    "pt-BR": "O maior evento de cultura pop...",
    "en-US": "The biggest pop culture event..."
  }
}
```

Resposta admin (campos `*I18n` populados):

```json
{
  "data": {
    "id": "abc",
    "title": "Anime Friends",
    "titleI18n": { "pt-BR": "...", "en-US": "..." },
    "description": "O maior...",
    "descriptionI18n": { "pt-BR": "...", "en-US": "..." }
  }
}
```

### 7.3 Validação `@RequiredLanguages`

DTOs admin marcam campos obrigatoriamente preenchidos em determinados idiomas:

```java
public record TagAdminRequest(
    @NotNull
    @RequiredLanguages({"pt-BR"})    // pt-BR obrigatório, demais opcionais
    Map<String, String> label
) {}
```

Mensagem de erro localizada (chave `validation.i18n.requiredLanguages` em `messages*.properties`).

### 7.4 Header `Vary: Accept-Language`

Toda resposta inclui:

```
Vary: Accept-Language
```

Isso garante que CDNs/proxies não sirvam resposta em PT para usuário em EN.

---

## 8. Como adicionar i18n a uma feature nova

### 8.1 Catálogo (texto que admin edita, todos leem)

1. **Domain entity**: trocar `String campo` por `LocalizedString campo`. Para PostgreSQL, anotar com:
   ```java
   @JdbcTypeCode(SqlTypes.JSON)
   @Convert(converter = LocalizedStringJsonConverter.class)
   @Column(name = "campo_i18n", columnDefinition = "jsonb", nullable = false)
   @Builder.Default
   private LocalizedString campoI18n = LocalizedString.empty();
   ```
   Para MongoDB, basta o tipo `LocalizedString` no campo (Spring Data + Jackson cuidam da serialização).

2. **Migração**: Flyway (`Vxx__add_campo_i18n.sql`) ou Mongock changelog. Backfill `pt-BR` com o valor atual:
   ```sql
   UPDATE foo SET campo_i18n = jsonb_build_object('pt-BR', campo) WHERE campo IS NOT NULL;
   ```

3. **Use cases**: retornam a entidade com `LocalizedString` cru — **não chamam `resolve()`**.

4. **Mapper público** (Spring `@Component`): injetar `LocaleResolutionService` e usar o helper:
   ```java
   String resolved = localeResolver.resolve(entity.getCampoI18n());
   ```

5. **DTO admin**: expor `Map<String, String>` (campo `campoI18n`); aceitar igual no `Update*Request`. Anotar com `@RequiredLanguages({"pt-BR"})` se obrigatório.

6. **Frontend**: usar `LocalizedTextInput` no form admin, enviar mapa pronto, ler string resolvida no consumo público.

### 8.2 UGC (usuário cria, mesmos usuários leem)

1. **Domain entity**: adicionar `private String language` (default `"pt-BR"`).

2. **Migração**: adicionar coluna/campo + índice por `(language, created_at)` ou `language` puro.

3. **Use case de criação**: injetar `LocaleResolutionService`:
   ```java
   .language(localeResolver.currentLanguageTag())
   ```

4. **Use case de listagem**: trocar `findByX(...)` por `findByXAndLanguage(...)`:
   ```java
   repository.findByTitleIdAndLanguage(titleId, localeResolver.currentLanguageTag(), pageable);
   ```

5. **Frontend**: nada a fazer — o `Accept-Language` já é enviado automaticamente.

---

## 9. Como adicionar um novo idioma

### Passos (exemplo: `ja-JP`)

1. **Backend `I18nConfig`**: incluir `ja-JP` na lista de locales suportados.
2. **Mensagens UI**: criar `messages_ja_JP.properties` em `backend/src/main/resources/messages/`.
3. **Frontend**:
   - Adicionar `'ja-JP'` em `SUPPORTED_LANGUAGES` (`shared/type/i18n.ts` e `i18n/config.ts`).
   - Criar arquivos `frontend-apps/manga-reader/src/i18n/locales/ja-JP/<feature>.json`.
4. **Conteúdo de catálogo**: **nenhuma migração**. Forms admin já aceitam novas chaves; backend já resolve qualquer tag presente no JSONB.
5. **MongoDB**: criar índice composto se houver busca por idioma:
   ```js
   db.titles.createIndex({ "nameI18n.ja-JP": 1 }, { name: "idx_titles_name_jaJP" })
   ```
6. **Validação**: decidir se `ja-JP` é obrigatório (atualizar `@RequiredLanguages`) ou opcional.

---

## 10. Boas práticas e armadilhas comuns

### Boas práticas

- **Sempre** language tag BCP 47 com hífen (`pt-BR`, não `pt_BR`).
- **Fallback é responsabilidade do mapper**, nunca do use case ou controller.
- Use cases **retornam `LocalizedString`**, nunca string já resolvida (preserva todas as traduções para admin).
- UGC **nunca tem fallback** — particionamento estrito por idioma.
- Frontend **nunca envia `language` para UGC** — backend deriva do `Accept-Language` (resistente a spoofing).
- Cache HTTP de catálogo **deve usar `Vary: Accept-Language`** (já há um filtro global).
- Mudança de idioma na UI **deve invalidar React Query** (já configurado em `main.tsx`).

### Erros comuns

| ❌ Erro                                                            | ✅ Correto                                                    |
|--------------------------------------------------------------------|---------------------------------------------------------------|
| Resolver `LocalizedString` no use case                             | Resolver no mapper                                            |
| Aceitar `language` do frontend em UGC                              | Backend deriva do `Accept-Language`                           |
| Aplicar fallback em listagens UGC                                  | Filtrar estritamente por idioma                               |
| Esquecer `Vary: Accept-Language`                                   | Filtro global já adiciona                                     |
| Backfill sem `pt-BR`                                               | Sempre popular `pt-BR` para entidades antigas                 |
| Persistir locale como `pt_BR` (underscore)                         | Sempre `pt-BR` (hífen, BCP 47)                                |
| `@TextIndexed` em campo agora multilíngue sem revisar índice       | Criar índices compostos por idioma                            |
| Form admin sem indicador de idiomas preenchidos                    | `LocalizedTextInput` mostra ● filled / missing                |

---

## 11. Glossário rápido

| Termo                     | Significado                                                                |
|---------------------------|----------------------------------------------------------------------------|
| **BCP 47**                | Padrão de language tags (`pt-BR`, `en-US`, etc.)                           |
| **Fallback `pt-BR`**      | Idioma usado quando o solicitado não está disponível (catálogo apenas)     |
| **Catálogo**              | Conteúdo editado por admin, lido por todos (Title, News, Event, ...)       |
| **UGC**                   | User-Generated Content — Comment, Forum, Rating                            |
| **Particionamento UGC**   | Cada post existe em um idioma; listagens só veem o idioma do request       |
| **Fase A**                | Migração inicial: campo i18n novo coexiste com legado (zero-downtime)      |
| **Fase B**                | Futura: drop dos campos legados após estabilização                         |
| **`*_i18n` / `*I18n`**    | Sufixo padrão para campos JSONB / subdoc multilíngue                       |

---

## 12. Referências de implementação

| Arquivo                                                                                | O que tem                                       |
|----------------------------------------------------------------------------------------|-------------------------------------------------|
| `backend/src/main/java/com/mangareader/shared/domain/i18n/LocalizedString.java`        | VO principal                                    |
| `backend/src/main/java/com/mangareader/shared/domain/i18n/LocalizedStringList.java`    | VO para listas                                  |
| `backend/src/main/java/com/mangareader/shared/application/i18n/LocaleResolutionService.java` | Resolver de locale                          |
| `backend/src/main/java/com/mangareader/shared/application/i18n/RequiredLanguages.java` | Annotation de validação                         |
| `backend/src/main/java/com/mangareader/infrastructure/i18n/VaryAcceptLanguageFilter.java` | Filtro de cache HTTP                         |
| `backend/src/main/resources/db/migration/V12__i18n_add_localized_columns.sql`          | Backfill PostgreSQL catálogo                    |
| `backend/src/main/resources/db/migration/V13__i18n_forum_language.sql`                 | UGC PostgreSQL `language`                       |
| `backend/src/main/java/com/mangareader/infrastructure/persistence/mongo/migration/V004LocalizeCatalogContent.java` | Backfill MongoDB catálogo |
| `backend/src/main/java/com/mangareader/infrastructure/persistence/mongo/migration/V005AddLanguageToUgc.java` | UGC MongoDB `language` |
| `frontend-apps/manga-reader/src/shared/type/i18n.ts`                                   | Tipos TS compartilhados                         |
| `frontend-apps/manga-reader/src/shared/component/form/LocalizedTextInput.tsx`          | Componente de form multilíngue                  |
| `frontend-apps/manga-reader/src/shared/service/http/httpInterceptors.ts`               | Interceptor `Accept-Language`                   |
| `frontend-apps/manga-reader/src/main.tsx`                                              | Invalidação React Query ao trocar idioma        |
| `docs/i18n.md`                                                                         | Plano + histórico por etapa                     |
