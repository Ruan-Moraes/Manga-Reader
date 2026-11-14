# Frontend — `web/`

Workspace pnpm com múltiplas aplicações React, ferramentas e pacotes compartilhados.

## Estrutura

```text
web/
├── apps/
│   ├── toonlira/           # 🎯 aplicação principal (React + Vite + FSD)
│   ├── landing-page/       # 🚀 landing page (React + Vite)
│   └── gateway-tester/     # 🧪 tester do Translation Gateway
├── tools/
│   └── scripts/            # 🛠️ utilitários (auditoria i18n, etc)
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

# Executar por aplicação (via scripts do workspace)
pnpm dev:app           # Toonlira: http://localhost:5173
pnpm dev:landing       # Landing: http://localhost:5174
pnpm dev:gateway       # Gateway Tester: http://localhost:5175

# Ou diretamente com filtro
pnpm --filter toonlira dev
pnpm --filter landing-page dev
pnpm --filter gateway-tester dev
```

**Encaminhamento de API durante desenvolvimento:**
- `toonlira` e `landing-page`: `/api` → `http://localhost:8080` (Core API)
- `gateway-tester`: `/api` → `http://localhost:8084` (Translation Gateway)

## Comandos do workspace

```bash
pnpm build:app          # aplicação principal
pnpm build:landing      # landing page
pnpm test:app           # testes do toonlira
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
pnpm --filter toonlira exec vitest run --pool=forks
```

O script agregado `pnpm build` existe no manifest, mas atualmente falha porque
os quatro pacotes em `packages/` não declaram um script `build`. Até que o
orquestrador seja corrigido, use `build:app` e `build:landing` separadamente.

## Aplicações

### Toonlira

Aplicação principal com Feature-Sliced Design, roteamento, autenticação,
catálogo, leitor e áreas de comunidade/administração.

Consulte [`toonlira/README.md`](toonlira/README.md) para variáveis,
estrutura, execução e gates.

### Landing page

Aplicação de página única com estrutura própria baseada em seções. Não adota o
FSD completo da aplicação principal.

Consulte [`landing-page/README.md`](landing-page/README.md).

## Independência dos apps

Cada app em `apps/` é autocontido: não há pacotes compartilhados no
workspace. Brand (`shared/config/brand.generated.ts`), ícones (`public/`) e
tsconfig vivem dentro de cada app, o que facilita extrair qualquer um deles do
monorepo. `scripts/brand/brand.mjs` gera os arquivos de brand em cada app.

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
