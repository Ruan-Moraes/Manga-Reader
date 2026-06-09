# Source Layout

Estrutura de pastas (backend + frontend FSD): onde colocar cada arquivo,
entity×feature, regras de boundary/import. Referenciado por `CLAUDE.md`.

```
api/server/src/main/java/com/mangareader/
├── domain/{domain}/entity/            # Entities e VOs
├── application/{domain}/usecase/      # Use cases
├── application/{domain}/port/         # Port interfaces (in/out)
├── infrastructure/persistence/        # postgres/adapter/, mongo/adapter/
├── infrastructure/security/           # JWT, SecurityConfig, RateLimit
├── presentation/{domain}/controller/  # REST endpoints
├── presentation/{domain}/dto/         # Request/Response DTOs
├── presentation/{domain}/mapper/      # MapStruct mappers
└── shared/                            # Cross-cutting: configs, exceptions, constants

web/manga-reader/src/
├── app/      # Router config + route guards (@app) — FSD app layer
├── pages/    # Route-level pages, 1 slice por rota (@pages) — FSD pages layer
├── widgets/  # Blocos compostos: header/, footer/, mobile-tab-bar/,
│             #   admin-panel/, layouts/ (shells) (@widgets) — FSD widgets layer
├── features/ # Interações/verbos: auth, admin, library, contact, comment (@features)
├── entities/ # Modelos de domínio/nouns: user, manga, news, … (@entities)
├── shared/   # Reusable components, HTTP client, types (@shared, @ui)
├── mock/     # Mock data (legacy — features usam API real)
└── styles/   # Global CSS + Tailwind
```

**Segmentos (FSD canônico)** — slices de `pages/widgets/features/entities` organizam
o código em segmentos canônicos: `ui/` (componentes), `api/` (chamadas de serviço),
`model/` (hooks, tipos, contexts, state), `lib/` (utils), `config/` (constantes).
`shared/` mantém nomes próprios por caminho de segmento (`@shared/service`, `@shared/component`, `@ui`).

**Mocks de runtime** — `src/mock/` (alias `@mock`, fora do FSD de propósito, steiger-ignored) é a
**fonte única** de dado-fake p/ telas ainda sem backend. Nova tela sem API ⇒ mock vai aqui, componente
importa `@mock`. Ao ligar o backend: deletar o mock do domínio e trocar pelo hook/service real.
Hoje mockados: forum-topic (`@mock/forumTopic`), profile (`@mock/userProfile`).

**Arquitetura frontend — Feature-Sliced Design (em migração)**

Camadas FSD com import unidirecional (camada superior importa inferior, nunca o contrário):
`app → pages → widgets → features → entities → shared`. Aliases: `@app`, `@pages`, `@widgets`, `@features`, `@entities`, `@shared`, `@ui`.

- **app**: só `router/` (PublicRoutes, ProtectedRoutes) + bootstrap em `main.tsx`. Sem páginas/widgets aqui.
- **features vs entities — regra para não errar a classificação**:
    - **entity = substantivo / modelo.** O que a app *é*. Contém: tipos (`model`),
      acesso a dados (`api`) e **exibição "burra"** do conceito (cards/átomos que só
      recebem props/callbacks). Ex.: `user`, `manga`, `rating`, `comment` (o
      comentário em si: types, service, `CommentUser`/`CommentContent`).
    - **feature = verbo / ação.** O que o usuário *faz* — uma interação completa que
      entrega valor; orquestra entities + UI da ação. Ex.: `auth` (logar), `library`
      (salvar), `comment` (compor/editar/responder/reagir: `CommentInput`,
      `CommentsList`, modais, hooks de CRUD/reactions/editor).
    - **Teste rápido**: o slice **é** algo (entity) ou **faz** algo (feature)?
    - **Regra dura**: feature pode importar entity; **entity NUNCA importa feature**
      (validado pelo steiger). Entity↔entity só via cross-import `@x` (ex.:
      `@entities/user/@x/comment`).
    - **Slice misto → dividir**, não mover inteiro: átomos de exibição + dados ficam
      na entity; input/modais/reactions/editor viram feature. **Ex. canônico**:
      `comment` foi dividido em `entities/comment` (modelo+exibição) + `features/comment`
      (interações) — ver DT-28. Nomes de slice podem coexistir nas duas camadas.
    - Hook que combina dados de entity + `useAuth`/estado de UI é **page hook**
      (ex.: `pages/event/useEvents.tsx`), não fica em `entities/`.
    - Entities (nouns): user, manga, chapter, rating, comment, category, label, news,
      event, group, store, forum. Features (verbos): auth, library, admin, contact, comment.
- **pages / widgets / features / entities**: cada slice expõe public API via `index.ts` (barrel). **Importar sempre da raiz do slice** (`@pages/home`, `@widgets/header`, `@features/auth`, `@entities/user`), nunca de arquivos internos — exceto `import()` dinâmico do router/`main.tsx` (code-splitting por página).
- **widgets**: slices coesos por bloco de UI. `layouts/` contém os shells de rota (RootLayout, ChapterLayout, PageShell) — esses compõem `@widgets/header|footer|mobile-tab-bar` (desvio pragmático widget→widget, permitido na config do steiger).

**Boundary lint**: `npm run lint:fsd` (steiger + `@feature-sliced/steiger-plugin`, config `steiger.config.ts`). Verde no escopo atual. Regras de trabalho adiado desligadas com nota (ver `steiger.config.ts` e DT-24).

**Estado FSD**: layers completas (`app→pages→widgets→features→entities→shared`), slices segmentados em `ui/api/model/lib/config`, lint verde. **Pendências** (ver `docs/tech-debt.md` DT-24): cross-import API (`@x`) p/ refs entity↔entity (hoje import direto, aceito); public API nos segmentos de `shared/` (`no-public-api-sidestep`, idiomático/deferido).
