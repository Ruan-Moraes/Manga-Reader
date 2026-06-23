# i18n Locales — Manga Reader

Arquivos de tradução de **UI estática** consumidos via `react-i18next`. Três
idiomas suportados:

- `pt-BR` (padrão / fallback)
- `en-US`
- `es-ES`

> **UI vs Conteúdo.** Estes JSONs cobrem **somente texto estático de interface**
> (botões, placeholders, validações, títulos de tela). Labels de **dados de
> negócio** (status, categorias, tipos, gêneros, moedas, classificações) **não**
> ficam aqui — vêm do backend via `DomainLabel` + hook `useDomainLabels(type)`.
> Ver seção [UI vs Conteúdo](#ui-vs-conteúdo-dois-eixos) abaixo.

## Estrutura

Um arquivo JSON por **feature** (namespace), replicado em cada idioma. 19
namespaces:

```
src/i18n/locales/
├── pt-BR/
│   ├── common.json        # default NS — botões, labels genéricos, validações
│   ├── home.json
│   ├── layout.json        # Header, Footer, navegação
│   ├── auth.json
│   ├── user.json
│   ├── manga.json         # inclui strings de capítulo (chapter)
│   ├── comment.json
│   ├── news.json
│   ├── category.json
│   ├── rating.json
│   ├── forum.json
│   ├── group.json
│   ├── event.json
│   ├── admin.json
│   ├── contact.json
│   ├── library.json
│   ├── store.json
│   ├── help.json
│   └── legal.json
├── en-US/ (mesma estrutura)
└── es-ES/ (mesma estrutura)
```

Fonte da verdade da lista: `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE` e
`NAMESPACES` em `src/i18n/config.ts`. `defaultNS = 'common'`.

## Convenção de chaves

- Agrupar por **contexto** dentro do namespace: `page.section.field`
- camelCase para segmentos da chave: `login.emailLabel`
- Mensagens de validação sob `validation.*`: `validation.passwordRequired`
- Ações genéricas (submit, cancel) sob `common.json` → `actions.*`
- Labels que aparecem em mais de uma feature → promover para `common.json`

## Uso

```tsx
import { useTranslation } from 'react-i18next';

function LoginPage() {
    const { t } = useTranslation('auth');
    return <button>{t('login.submit')}</button>;
}
```

Múltiplos namespaces numa tela (`common` é default, não precisa prefixo):

```tsx
const { t } = useTranslation(['auth', 'common']);
<button>{t('common:actions.submit')}</button>;
```

## Detecção e troca de idioma (UI)

`config.ts` usa `i18next-browser-languagedetector`:

- Ordem: `localStorage` → `navigator`
- Cache em `localStorage`, chave **`i18nextLng`**

A troca de UI dispara só `i18n.changeLanguage()` (não persiste no backend). O
interceptor HTTP envia `Accept-Language: <i18n.language>`, então emails /
validações / mensagens de erro do backend respeitam a UI atual via
`AcceptHeaderLocaleResolver`. UI lang trocada em
`widgets/header/ui/settings/tabs/LanguageSettings.tsx`.

## UI vs Conteúdo (dois eixos)

Dois eixos separados, armazenamento distinto:

| Eixo                 | O que cobre                                                     | Onde mora                                   |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| **UI language**      | interface estática                                              | estes JSONs + `localStorage` (`i18nextLng`) |
| **Content language** | catálogo + UGC (Title, News, Tag, Chapter, Comment, ForumTopic) | `users.content_locales` (JSONB) no backend  |

- **Content lang** sincroniza via hook `useContentLocales(isLoggedIn)`
  (`entities/user/model/useContentLocales.tsx`) — só para users autenticados.
  `LanguageSettings.tsx` dispara mutation quando logado.
- Endpoints: `GET`/`PATCH /api/users/me/content-locales`.

### Configurações do sistema (`/settings`)

Tela de preferências globais não-perfil (leitor, aparência, idioma/região, acessibilidade, dados,
sobre). Strings sob o namespace **`user` → `settings.system.*`** (pt-BR/en-US/es-ES). Persistência:

- Preferências (reader/appearance/locale/a11y) salvas live em `localStorage` (`mr.settings.v1`) e
  sincronizadas via `useUserSettings(isLoggedIn)` → `GET`/`PATCH /api/users/me/settings` (JSONB no
  backend). **UI lang** continua client-only (i18n + reload banner); **idiomas de leitura** reusam
  `content-locales`.

### Domain labels (DB-backed)

Labels de entidades de negócio **não** usam `t('...')`. Padrão:

- Hook `useDomainLabels(type)` (`entities/label/model/useDomainLabels.ts`),
  queryKey `[QUERY_KEYS.DOMAIN_LABELS, type, i18n.language]`, cache 3 dias.
- Endpoint público `GET /api/labels?type={type}` → `[{ value, label }]`
  (locale-resolved pelo backend conforme `Accept-Language`).
- Tipos seed: `publication_status`, `news_category`, `event_type`,
  `event_status`, `event_timeline`, `currency`.

**Não usar `t('...')` para**: enums de negócio, dados dinâmicos, conteúdo
administrativo, qualquer dado persistido.

## Adicionando um novo idioma

1. Criar diretório `src/i18n/locales/<code>/` (ex.: `fr-FR`).
2. Copiar todos os JSONs de `pt-BR/` e traduzir os valores.
3. Registrar em `src/i18n/config.ts`:
    - Importar cada namespace do novo idioma.
    - Adicionar ao objeto `resources`.
    - Adicionar a `SUPPORTED_LANGUAGES`.
4. Registrar no backend em `I18nConfig.SUPPORTED_LOCALES` e criar
   `messages/messages_<code>.properties`.
5. Garantir que a troca apareça em `LanguageSettings.tsx`.

## Revisão de traduções

- **Todas as chaves de `pt-BR` devem existir em todos os idiomas.**
- Chave faltante → i18next retorna a key literal (ex.: `"login.submit"`),
  quebrando a UI.
- Em PR que altera strings, verificar o diff dos três arquivos.
- Auditoria/pruning de chaves órfãs: utilitário `i18n-cleaner` (ver `scripts/`).

## Formatação de datas, números e moedas

Helpers de `@shared/lib/formatters` (respeitam `i18n.language`):

```tsx
import { formatDate, formatCurrency } from '@shared/lib/formatters';

formatDate(new Date()); // "19/04/2026" pt-BR, "4/19/2026" en-US
formatCurrency(1999); // "R$ 19,99" pt-BR, "$19.99" en-US
```

## Backend

Mensagens de validação (`@NotBlank`, `@Size`, etc.) usam keys do backend
(`{validation.email.required}`) resolvidas via `MessageSource` a partir de
`backend/src/main/resources/messages/messages*.properties`. Ver
`backend/src/main/java/com/mangareader/shared/config/I18nConfig.java`.
</content>
