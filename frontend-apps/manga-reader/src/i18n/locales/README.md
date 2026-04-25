# i18n Locales — Manga Reader

Arquivos de tradução consumidos via `react-i18next`. Três idiomas suportados:

- `pt-BR` (padrão / fallback)
- `en-US`
- `es-ES`

## Estrutura

Um arquivo JSON por **feature** (namespace), replicado em cada idioma:

```
src/i18n/locales/
├── pt-BR/
│   ├── common.json        # botões, labels genéricos, validações
│   ├── layout.json        # Header, Footer, navegação
│   ├── auth.json
│   ├── manga.json
│   ├── chapter.json       # (reservado — hoje vive em manga.json)
│   ├── comment.json
│   ├── rating.json
│   ├── user.json
│   ├── library.json
│   ├── news.json
│   ├── event.json
│   ├── group.json
│   ├── forum.json
│   ├── category.json
│   ├── contact.json
│   ├── store.json
│   └── admin.json
├── en-US/ (mesma estrutura)
└── es-ES/ (mesma estrutura)
```

## Convenção de chaves

- Agrupar por **contexto** dentro do namespace: `page.section.field`
- Use camelCase para segmentos da chave: `login.emailLabel`
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

Para usar múltiplos namespaces numa única tela:

```tsx
const { t } = useTranslation(['auth', 'common']);
<button>{t('common:actions.submit')}</button>;
```

## Adicionando um novo idioma

1. Criar diretório `src/i18n/locales/<code>/` (ex.: `fr-FR`).
2. Copiar todos os JSONs de `pt-BR/` e traduzir os valores.
3. Registrar em `src/i18n/config.ts`:
    - Importar cada namespace do novo idioma.
    - Adicionar ao objeto `resources`.
    - Adicionar à lista `supportedLngs`.
4. Registrar no backend em `I18nConfig.SUPPORTED_LOCALES` e criar `messages/messages_<code>.properties`.
5. Adicionar botão no `LanguageSwitcher.tsx`.

## Revisão de traduções

- **Todas as chaves presentes em `pt-BR` devem existir em todos os idiomas.**
- Chave faltante → i18next retorna a key literal (ex.: `"login.submit"`), o que quebra a UI.
- Em PR que altera strings, verifique o diff dos três arquivos.

## Formatação de datas, números e moedas

Use os helpers de `@shared/util/formatters` (que respeitam `i18n.language`):

```tsx
import { formatDate, formatCurrency } from '@shared/util/formatters';

formatDate(new Date()); // "19/04/2026" em pt-BR, "4/19/2026" em en-US
formatCurrency(1999); // "R$ 19,99" em pt-BR, "$19.99" em en-US
```

## Backend

Mensagens de validação (`@NotBlank`, `@Size`, etc.) usam keys do backend
(`{validation.email.required}`) resolvidas via `MessageSource` a partir de
`backend/src/main/resources/messages/messages*.properties`. Ver
`backend/src/main/java/com/mangareader/shared/config/I18nConfig.java`.
