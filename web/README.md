# Frontend — `web/`

Workspace pnpm com duas aplicações React e pacotes privados compartilhados.

## Estrutura

```text
web/
├── manga-reader/       # aplicação principal React + Vite + FSD
├── landing-page/       # landing page React + Vite
├── packages/
│   ├── assets/         # ícones e manifestos servidos pelo Vite
│   ├── design-tokens/  # @manga-reader/design-tokens
│   ├── tsconfig/       # configurações TypeScript compartilhadas
│   └── types/          # contratos TypeScript compartilhados
├── scripts/            # auditoria de chaves i18n
├── package.json
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 20 ou superior;
- pnpm 9 ou superior.

As versões mínimas estão declaradas em `engines` no `package.json` da raiz do
workspace.

## Instalação e execução

```bash
cd web
pnpm install

pnpm dev:app       # http://localhost:5173
pnpm dev:landing   # http://localhost:5174
```

As duas aplicações encaminham `/api` para `http://localhost:8080` durante o
desenvolvimento.

## Comandos do workspace

```bash
pnpm build:app          # aplicação principal
pnpm build:landing      # landing page
pnpm test:app           # testes do manga-reader
pnpm test:landing       # testes da landing page

pnpm i18n:clean         # relatório dry-run das duas aplicações
pnpm i18n:clean:app:write
pnpm i18n:clean:landing:write
```

Os comandos `*:write` removem chaves consideradas órfãs e criam backup. Revise o
relatório e o diff antes de utilizá-los.

No ambiente de sandbox do projeto, execute a suíte principal explicitamente
com forks:

```bash
pnpm --filter manga-reader exec vitest run --pool=forks
```

O script agregado `pnpm build` existe no manifest, mas atualmente falha porque
os quatro pacotes em `packages/` não declaram um script `build`. Até que o
orquestrador seja corrigido, use `build:app` e `build:landing` separadamente.

## Aplicações

### Manga Reader

Aplicação principal com Feature-Sliced Design, roteamento, autenticação,
catálogo, leitor e áreas de comunidade/administração.

Consulte [`manga-reader/README.md`](manga-reader/README.md) para variáveis,
estrutura, execução e gates.

### Landing page

Aplicação de página única com estrutura própria baseada em seções. Não adota o
FSD completo da aplicação principal.

Consulte [`landing-page/README.md`](landing-page/README.md).

## Pacotes compartilhados

- `@manga-reader/design-tokens`: tokens visuais e preset Tailwind.
- `@manga-reader/types`: contratos TypeScript usados entre os apps.
- `@manga-reader/tsconfig`: bases de configuração TypeScript.
- `@manga-reader/assets`: metadados do workspace; os arquivos são consumidos
  como `publicDir` nos `vite.config.ts`, não por imports JavaScript.

Diretórios locais de design/handoff ignorados pelo Git não são dependências de
runtime e não devem ser importados pelo código.

## Convenções

- O app principal segue as regras de
  [`../docs/source-layout.md`](../docs/source-layout.md).
- Textos visíveis devem usar i18n.
- Labels persistidas de negócio vêm da API, não dos JSONs de UI.
- Não executar `format` ou `--fix` de forma indiscriminada em arquivos
  existentes; combine o estilo dos arquivos vizinhos.
- O lint FSD e o typecheck são os gates estruturais do app principal.

[Voltar ao README principal](../README.md)
