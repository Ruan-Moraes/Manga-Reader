# Aplicação web — `web/manga-reader`

SPA principal do Manga Reader, construída com React 19, TypeScript, Vite e
Tailwind CSS. Consome a API em `api/core` e organiza o código com
Feature-Sliced Design.

## Funcionalidades

- autenticação e sessão com refresh token;
- catálogo, busca, detalhes e leitura de capítulos;
- biblioteca, avaliações e comentários;
- notícias, fórum, grupos, eventos e perfis;
- configurações de usuário e internacionalização;
- painéis administrativos.

Nem toda interface representa um backend concluído. O gerenciamento de
capítulos admin ainda usa gateways locais documentados em
[`../../docs/architecture.md`](../../docs/architecture.md) e na dívida DT-57.

## Estrutura

```text
src/
├── app/       # roteamento e composição global
├── pages/     # páginas por rota
├── widgets/   # blocos compostos
├── features/  # ações do usuário
├── entities/  # modelos e UI de domínio
├── shared/    # infraestrutura e componentes reutilizáveis
├── i18n/      # configuração e locales
├── styles/    # estilos globais
└── test/      # utilitários e setup de teste
```

Regras de dependência, barrels e segmentos:
[`../../docs/source-layout.md`](../../docs/source-layout.md).

## Requisitos e instalação

Execute a partir da raiz do workspace:

```bash
cd web
pnpm install
```

## Configuração

Crie `.env.local` em `web/manga-reader` somente quando precisar sobrescrever os
defaults. Referência: [`.env.example`](.env.example).

| Variável | Uso | Padrão |
|---|---|---|
| `VITE_API_BASE_URL` | URL base da API | vazio em desenvolvimento, usando o proxy `/api` |
| `VITE_BASE_URL` | base de roteamento e assets | `/` em desenvolvimento e `/Manga-Reader` no build padrão |

O servidor Vite encaminha `/api` para `http://localhost:8080`.

## Execução e build

```bash
# Na raiz web/
pnpm --filter manga-reader dev
pnpm --filter manga-reader build
pnpm --filter manga-reader preview
```

O desenvolvimento usa `http://localhost:5173`. O build é escrito em `dist/`.

## Gates

Execute dentro de `web/manga-reader`:

```bash
npx tsc -b
npm run lint:fsd
npx vitest run --pool=forks
```

- `tsc -b` é o typecheck correto; `tsc --noEmit` no `tsconfig.json` raiz não
  percorre os projetos referenciados.
- `lint:fsd` valida os limites entre camadas.
- `--pool=forks` é obrigatório no sandbox usado pelo projeto.
- `npm run lint` e formatação global não são gates confiáveis do baseline; não
  use `--fix` para reformatar o repositório inteiro.

Outros comandos:

```bash
npm run test:watch
npm run test:coverage
```

## Integração com a API

O cliente Axios central:

- envia `Accept-Language` conforme a UI;
- mantém o access token em memória;
- usa cookie `HttpOnly` para refresh no navegador;
- faz refresh single-flight ao receber `401`;
- entrega o estado de sessão ao `AuthProvider`.

Respostas simples usam `ApiResponse<T>` e listagens usam
`ApiResponse<PageResponse<T>>`. Consulte o
[`README da API`](../../api/core/README.md) e o Swagger para contratos
específicos.

## Internacionalização

A UI possui três idiomas: `pt-BR`, `en-US` e `es-ES`, distribuídos em 19
namespaces. Regras para chaves, idiomas de conteúdo e labels de domínio:

- [`src/i18n/locales/README.md`](src/i18n/locales/README.md)
- [`../../docs/i18n-guide.md`](../../docs/i18n-guide.md)

## Links relacionados

- [Workspace web](../README.md)
- [Landing page](../landing-page/README.md)
- [Testes](../../docs/testing.md)
- [Clean code](../../docs/clean-code.md)
- [README principal](../../README.md)
