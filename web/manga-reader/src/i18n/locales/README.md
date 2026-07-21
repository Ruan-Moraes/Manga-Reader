# Locales da aplicação web

Traduções de texto estático da interface do `web/manga-reader`, consumidas por
`i18next` e `react-i18next`.

## Idiomas

- `pt-BR`: idioma padrão e fallback;
- `en-US`;
- `es-ES`.

A fonte de verdade é
[`../config.ts`](../config.ts): `SUPPORTED_LANGUAGES`,
`DEFAULT_LANGUAGE` e `NAMESPACES`.

## Estrutura

Cada idioma contém os mesmos 19 namespaces:

```text
locales/<idioma>/
├── common.json
├── home.json
├── layout.json
├── auth.json
├── user.json
├── manga.json
├── comment.json
├── news.json
├── category.json
├── rating.json
├── forum.json
├── group.json
├── event.json
├── admin.json
├── contact.json
├── library.json
├── store.json
├── help.json
└── legal.json
```

`common` é o namespace padrão.

## O que deve ser traduzido aqui

Use os JSONs para texto fixo da UI:

- títulos, botões e labels;
- placeholders e mensagens de validação;
- estados visuais fixos, toasts e textos de ajuda.

Não use os JSONs para dados persistidos ou labels de negócio. Status,
categorias, tipos, moedas e outros valores administráveis são resolvidos pela
API por meio de `DomainLabel` e do hook `useDomainLabels(type)`.

## Convenção de chaves

- agrupar por contexto: `page.section.field`;
- usar `camelCase` em cada segmento;
- manter validações sob `validation.*`;
- manter ações genéricas em `common:actions.*`;
- promover para `common` apenas textos realmente compartilhados;
- não usar frases traduzidas como chave.

Exemplo:

```tsx
import { useTranslation } from 'react-i18next';

function LoginAction() {
    const { t } = useTranslation('auth');
    return <button>{t('login.submit')}</button>;
}
```

Com mais de um namespace:

```tsx
const { t } = useTranslation(['auth', 'common']);

return <button>{t('common:actions.submit')}</button>;
```

## Idioma da UI

O detector configurado em `src/i18n/config.ts` usa esta ordem:

1. `localStorage`, chave `i18nextLng`;
2. idioma do navegador.

A troca chama `i18n.changeLanguage()` em
`pages/settings/model/useInterfaceLang.ts` e no seletor do footer. O cliente
HTTP envia `Accept-Language`, permitindo que mensagens, validações e e-mails da
API usem o mesmo locale.

## Idiomas de conteúdo

Idioma da UI e preferência de conteúdo são conceitos diferentes:

| Eixo | Persistência | Responsabilidade |
|---|---|---|
| Idioma da UI | JSONs + `localStorage` | Texto estático da interface |
| Idiomas de conteúdo | `users.content_locales` no backend | Catálogo e conteúdo gerado por usuários |

Usuários autenticados sincronizam idiomas de conteúdo por
`entities/user/model/useContentLocales.tsx` e pelos endpoints:

```http
GET   /api/users/me/content-locales
PATCH /api/users/me/content-locales
```

As configurações gerais usam `pages/settings/model/useSettingsSync.ts` e
`entities/user/model/useUserSettings.tsx`, com cache local em `mr.settings.v1`
e sincronização pelos endpoints `/api/users/me/settings`.

## Labels de domínio

O hook `entities/label/model/useDomainLabels.ts` consulta:

```http
GET /api/labels?type={type}
```

A query inclui `i18n.language` na chave e mantém cache por três dias. Os tipos
seed atualmente documentados no backend incluem `publication_status`,
`news_category`, `event_type`, `event_status`, `event_timeline` e `currency`.

## Datas, números e moedas

Use os helpers de `@shared/lib/formatters`, que respeitam o idioma atual:

```tsx
import { formatCurrency, formatDate } from '@shared/lib/formatters';

formatDate(new Date());
formatCurrency(19.99, 'BRL');
```

O valor de `formatCurrency` é expresso na unidade monetária, não em centavos.

## Alterando traduções

1. Adicione ou altere a chave nos três idiomas.
2. Confirme que a chave pertence ao namespace correto.
3. Execute os testes da área afetada.
4. Rode a auditoria a partir de `web/`:

```bash
pnpm i18n:clean:app
```

O utilitário é uma análise estática e pode exigir revisão manual antes de usar a
variante `:write`.

## Adicionando um namespace

1. Crie o mesmo arquivo JSON em `pt-BR`, `en-US` e `es-ES`.
2. Importe os três arquivos em `src/i18n/config.ts`.
3. Adicione o namespace a `NAMESPACES` e aos três blocos de `resources`.
4. Atualize este README.

## Adicionando um idioma

1. Crie `locales/<tag-BCP-47>/` com todos os namespaces.
2. Registre imports, resources e `SUPPORTED_LANGUAGES` em `config.ts`.
3. Registre o locale no backend e adicione
   `api/core/src/main/resources/messages/messages_<locale>.properties`.
4. Exponha a opção nos seletores de idioma e teste o fallback.

## Backend relacionado

- Configuração:
  `api/core/src/main/java/com/mangareader/shared/config/I18nConfig.java`.
- Mensagens:
  `api/core/src/main/resources/messages/messages*.properties`.
- Guia completo: [`../../../../../docs/i18n-guide.md`](../../../../../docs/i18n-guide.md).
- README da aplicação: [`../../../README.md`](../../../README.md).
