# Landing page — `web/apps/landing-page`

Aplicação React de apresentação do Toonlira. É um app Vite independente da
SPA principal e usa uma estrutura simples por seções, adequada a uma página
única de marketing.

## Estrutura

```text
src/
├── section/    # seções da página
├── feature/    # planos, presentes e estatísticas
├── shared/     # componentes, hooks, services e utilitários
├── i18n/       # locale de namespace único
├── style/      # estilos globais
└── test/       # setup e mocks
```

Os contratos TypeScript ficam em `src/shared/type`. Os tokens visuais
específicos da experiência de marketing ficam centralizados em `src/style/index.css`,
sem dependência não utilizada do pacote de design tokens. Os ícones ficam em `public/`.

## Requisitos e instalação

```bash
cd web
pnpm install
```

## Configuração

| Variável | Uso | Padrão atual |
|---|---|---|
| `VITE_APP_URL` | Destino centralizado dos links para a aplicação principal | `http://localhost:5173` em desenvolvimento e `https://toonlira-rm.firebaseapp.com` em produção |

Defina `VITE_APP_URL` no ambiente de build para apontar planos, gift codes,
suporte e contato para a URL pública da aplicação principal. Os links para
termos, privacidade e cookies apontam para o site público do aplicativo em
`toonlira-rm.web.app`.

O servidor de desenvolvimento usa a porta `5174` e encaminha `/api` para
`http://localhost:8080`.

## Execução, build e testes

Na raiz `web/`:

```bash
pnpm dev:landing
pnpm build:landing
pnpm test:landing
```

Ou dentro de `web/apps/landing-page`:

```bash
npm run dev
npm run build
npx vitest run
```

Comandos adicionais:

```bash
npm run preview
npm run test:watch
```

## Internacionalização

A landing usa `react-i18next` com um único `translation.json` por idioma. Ao
alterar uma string, mantenha as chaves equivalentes em `pt-BR`, `en-US` e
`es-ES`.

A auditoria de chaves pode ser executada na raiz do workspace:

```bash
pnpm i18n:clean:landing
```

## Limites arquiteturais

- A landing não segue o FSD completo da aplicação principal.
- Componentes exclusivos de uma seção permanecem próximos dela.
- Os apps são autocontidos; não há `web/packages`. Contratos ficam em `src/shared/type`.
- Regras de produto e chamadas HTTP devem permanecer fora dos componentes
  puramente visuais.

## Links relacionados

- [Workspace web](../README.md)
- [Aplicação principal](../toonlira/README.md)
- [README do projeto](../../README.md)
