# Frontend — `web/` (pnpm workspace)

Workspace pnpm com dois apps React e pacotes compartilhados.

```
web/
├── manga-reader/       # App principal — React 19 + Vite + FSD
├── landing-page/       # Landing page — React + Vite (layout próprio simplificado)
├── packages/
│   ├── design-tokens/  # @manga-reader/design-tokens
│   ├── tsconfig/       # @manga-reader/tsconfig — configs TS base
│   ├── types/          # @manga-reader/types — tipos compartilhados
│   └── assets/         # @manga-reader/assets — favicons/ícones servidos como publicDir do Vite
├── scripts/            # i18n-cleaner — auditoria/limpeza de chaves de tradução órfãs
├── package.json        # scripts do workspace
└── pnpm-workspace.yaml
```

## Comandos (raiz `web/`)

```bash
pnpm install            # instala todo o workspace

pnpm dev:app            # manga-reader :5173 (proxy /api → :8080)
pnpm dev:landing        # landing-page

pnpm build              # packages primeiro, depois apps
pnpm test:app           # vitest do manga-reader (⚠️ baseline quebrado — DT-53)
pnpm test:landing       # vitest da landing-page

pnpm i18n:clean         # relatório de chaves i18n órfãs (dry-run, ambos os apps)
pnpm i18n:clean:app:write     # remove órfãs do manga-reader (com backup)
```

Requisitos: Node ≥ 20, pnpm ≥ 9 (ver `engines` no `package.json`).

## `manga-reader/` — app principal

Feature-Sliced Design completo: `app / pages / widgets / features / entities / shared`
(+ cross-cutting `i18n/`, `styles/`, `test/`, `mock/`). Onde colocar cada arquivo,
regras de boundary e public API por barrel: [`docs/source-layout.md`](../docs/source-layout.md).

Gates de qualidade (rodar dentro de `manga-reader/`):

```bash
npx tsc --noEmit        # type-check — 0 erros exigido
npm run lint:fsd        # steiger — boundaries FSD, verde exigido
npx vitest run          # suíte (no sandbox do Claude: --pool=forks)
```

> `npm run lint` (eslint+prettier) é **vermelho no baseline** repo-wide — não usar
> `format`/`--fix` em arquivos existentes; combinar o estilo dos vizinhos.

i18n: 19 namespaces por idioma (pt-BR/en-US/es-ES) — guia em
[`manga-reader/src/i18n/locales/README.md`](manga-reader/src/i18n/locales/README.md).
Labels de dados de negócio **não** ficam nos JSONs — vêm do backend via `DomainLabel`
([`docs/i18n-guide.md`](../docs/i18n-guide.md)).

## `landing-page/`

App menor e independente do FSD do app principal — estrutura própria
(`section/` por seção da página, `feature/`, `shared/`, i18n de namespace único
`translation.json`). Testes com Vitest + Testing Library.

## Pontos de atenção

- **Pasta `Manga Reader Design System/`** (aqui e dentro de `manga-reader/`):
  artefato **local** de design/handoff, ignorado pelo git — não referenciar em código.
- **`packages/assets`** não tem código importável: os apps o consomem via
  `publicDir` nos `vite.config.ts` (caminho relativo) — favicons/manifest servidos na raiz.
- Dívidas do frontend: [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) + [`docs/tech-debt.md`](../docs/tech-debt.md).
