# Manga Reader — Mobile App

React Native + Expo. Segue a **mesma arquitetura FSD** do frontend web (`/web/manga-reader/`).

> **Leia este documento antes de qualquer implementação.** Ele é a fonte de verdade para decisões arquiteturais do app mobile.

**Estado atual:** Fase 0 (fundação — tema, i18n, stores, providers) implementada; Fase 1 (Auth) em andamento — rotas `(auth)/login`, `(auth)/register`, `(auth)/forgot` e tabs base (`index`, `library`, `forum`, `profile`) existem; telas das tabs ainda são placeholders.

---

## Stack

| Camada        | Tecnologia                                                               |
| ------------- | ------------------------------------------------------------------------ |
| Framework     | React Native + Expo SDK (latest)                                         |
| Linguagem     | TypeScript                                                               |
| Navegação     | Expo Router (file-based, deep links nativos)                             |
| Estado global | Zustand                                                                  |
| Server state  | TanStack Query v5                                                        |
| HTTP          | Axios + interceptors (auth, refresh token)                               |
| Forms         | React Hook Form + Zod                                                    |
| UI            | NativeWind (Tailwind para RN)                                            |
| Tema          | `@shopify/restyle` ou design tokens via NativeWind — escuro/claro nativo |
| i18n          | `i18next` + `react-i18next` (pt-BR, en-US, es-ES)                        |
| Auth storage  | Expo SecureStore (JWT)                                                   |
| Imagens       | Expo Image (cache nativo)                                                |
| Leitor        | FlashList horizontal + pré-fetch de páginas                              |
| Notificações  | Expo Notifications                                                       |
| OTA updates   | Expo Updates                                                             |

---

## Fundação — obrigatória antes de qualquer tela

Estas estruturas **devem ser implementadas no primeiro commit**, antes de qualquer feature ou tela. A ausência delas na web gerou dívida técnica que foi sendo corrigida em cada canto — o mobile não repete isso.

### 1. Tema escuro/claro

- Design tokens centralizados (cores, espaçamentos, tipografia) desde o início
- Nenhum valor de cor hardcoded em componente — sempre via token
- Suporte a `colorScheme` do sistema operacional + override manual pelo usuário
- Estrutura:
    ```
    src/shared/theme/
    ├── tokens.ts          # cores, espaços, tipografia por tema
    ├── ThemeProvider.tsx  # contexto global de tema
    └── useTheme.ts        # hook de acesso ao tema atual
    ```

### 2. i18n

- Configurado antes do primeiro texto na UI
- Namespaces idênticos ao web: `common`, `auth`, `manga`, `comment`, `user`, etc.
- Estrutura:
    ```
    src/shared/i18n/
    ├── index.ts           # inicialização do i18next
    └── locales/
        ├── pt-BR/
        ├── en-US/
        └── es-ES/
    ```
- Nenhuma string visível hardcoded em componente — sempre via `t()`
- Respeitar header `Accept-Language` nas requests HTTP (alinhado ao backend)

### 3. Estado global de configurações

- Zustand store centralizado para preferências do usuário (tema, idioma, prefs do leitor, etc.)
- Persistência via Expo SecureStore ou AsyncStorage (dados não sensíveis)
- Estrutura:
    ```
    src/shared/store/
    ├── settingsStore.ts   # tema, idioma, prefs do leitor
    └── sessionStore.ts    # usuário autenticado, tokens
    ```

---

## Arquitetura — FSD (Feature Sliced Design)

**Mesma arquitetura do web** (`/web/manga-reader/src/`). Qualquer divergência deve ser documentada aqui com justificativa antes de ser implementada.

```
mobile/
├── app/                  # Expo Router — rotas file-based ((auth)/, (tabs)/, modal, +not-found)
│                         #   arquivos aqui são CASCA fina: importam a tela de src/pages
└── src/
    ├── application/      # Camada app do FSD: providers (tema, query, i18n), navigation, gates
    │                     #   (ignorada no steiger — ver steiger.config.ts)
    ├── pages/            # Telas completas (composição de widgets/features)
    ├── widgets/          # Blocos compostos de UI — criar quando necessário
    ├── features/         # Interações do usuário (auth, comment CRUD, rating)
    ├── entities/         # Modelos de domínio + UI de exibição — criar quando necessário
    └── shared/           # Utilitários, UI atoms, constantes, serviços HTTP
        ├── ui/           # Componentes reutilizáveis (Button, Input, Card, etc.)
        ├── api/          # Axios instance + interceptors
        ├── theme/        # Tokens de tema + ThemeProvider + fontes
        ├── i18n/         # Setup i18n + locales
        ├── store/        # Zustand stores globais (settingsStore, sessionStore)
        ├── hook/         # Hooks cross-feature
        ├── model/        # Tipos compartilhados
        └── constant/     # ROUTES, API_URLS, QUERY_KEYS
```

### Regras de boundary (igual ao web)

- `shared` não importa de nenhuma outra camada
- `entities` importa apenas de `shared`
- `features` importa de `entities` e `shared`
- `widgets` importa de `features`, `entities` e `shared`
- `pages` importa de `widgets`, `features`, `entities` e `shared`
- Sem imports cruzados entre features ou entre pages

### Componentes reutilizáveis

Toda UI que aparece em mais de um lugar **vai para `shared/ui`**, não fica duplicada por tela. Isso garante padronização visual e facilita manutenção.

Exemplos que devem existir em `shared/ui` desde o início:

- `Button`, `IconButton`
- `Input`, `SearchBar`
- `Card`, `Avatar`
- `Badge`, `Chip`
- `Skeleton` (loading state)
- `EmptyState`
- `PageContainer` (wrapper de tela com safe area)

---

## Paridade com o web

Tudo que existe no web **deve existir no mobile**, adaptado para a plataforma. Exceções devem ser listadas aqui com justificativa.

### Adaptações confirmadas

| Feature web                             | Comportamento mobile              |
| --------------------------------------- | --------------------------------- |
| Sidebar/Drawer de comentários do leitor | Bottom sheet ou painel deslizável |
| Modal de avaliação                      | Bottom sheet nativo               |
| Navbar horizontal                       | Tab bar inferior (padrão mobile)  |
| Hover states                            | Não se aplica — remover           |
| Tooltip                                 | Substituir por long press + popup |

### Pendente de análise (reportar ao usuário antes de implementar)

- [ ] Editor Markdown nos comentários (EasyMDE não existe no RN)
- [ ] Upload de imagem em comentários (avaliar Expo ImagePicker)
- [ ] Dashboard admin (provavelmente não vai para o mobile nesta fase)
- [ ] Design handoff / protótipos (verificar se assets web são reutilizáveis)

### TODOs técnicos conhecidos

- [ ] **NativeWind dark mode**: telas que usam classes Tailwind (`bg-mr-bg`, `text-mr-text`, etc.) estão com cores fixas no `tailwind.config.js`. Para que essas classes respeitem o tema do sistema, é necessário configurar `darkMode: 'class'` (ou `media`) no Tailwind e usar o `colorScheme` do `ThemeProvider` para adicionar a classe `dark` ao elemento raiz. Enquanto isso, componentes criados com `useTheme()` + inline styles já suportam o toggle.
- [x] **`SocialRow` caption hardcoded**: corrigido — usa `t('social.orContinueWith')` com chave nos 3 locales.
- [ ] **Locales de telas de placeholder** (`home.comingSoon`, `library.comingSoon`, `forum.comingSoon`): adicionar as chaves aos arquivos de locale quando as telas forem implementadas.

---

## Integração com o backend

- **Base URL**: via `.env` (`EXPO_PUBLIC_API_URL`)
- **Auth**: Bearer JWT no `Expo SecureStore`
- **Interceptor Axios**: injeta Authorization + refresh automático em 401
- **Paginação**: `ApiResponse<PageResponse<T>>` — acesso via `response.data.data.content`
- **TanStack Query**: `staleTime` 5min para listagens, 1min para conteúdo dinâmico

---

## Build & Run

```bash
cd mobile/
pnpm install
pnpm dev                # Metro bundler (expo start --clear)
pnpm android            # Android (emulador ou device)
pnpm ios                # iOS (apenas macOS)

# Gates de qualidade
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint
pnpm lint:fsd           # steiger (boundaries FSD)
pnpm check              # typecheck + lint + lint:fsd + format:check
```

---

## Fases de implementação

### Fase 0 — Fundação (antes de qualquer tela)

- Setup Expo + Expo Router + TypeScript
- NativeWind configurado com design tokens de tema escuro/claro
- `ThemeProvider` + `settingsStore` (Zustand)
- i18n configurado com os 3 idiomas e namespaces base
- Axios instance + interceptors de auth
- TanStack Query setup
- Estrutura de pastas FSD criada com barrels

### Fase 1 — Auth

- Login, registro, refresh token, logout
- Proteção de rotas autenticadas

### Fase 2 — Core de leitura

- Listagem e busca de títulos
- Tela de detalhe do título
- Leitor de capítulos (FlashList horizontal + vertical para manhwa)
- Biblioteca pessoal

### Fase 3 — Engajamento

- Histórico de leitura e progresso
- Avaliação (estrelas)
- Comentários (sistema unificado — mesmo `targetType` do web)
- Perfil com stats

### Fase 4 — Comunidade

- Fórum, tópicos, grupos
- Feed de notícias e eventos

### Fase 5 — Monetização

- Planos de assinatura, loja, carrinho

### Fase 6 — Polimento

- Notificações push
- Cache offline
- Deep links
- Testes E2E (Maestro)

---

## Verificação antes de considerar tarefa concluída

1. `pnpm check` verde (typecheck + eslint + `lint:fsd` + format:check)
2. Nenhum texto hardcoded visível ao usuário (sempre via `t()`)
3. Nenhuma cor hardcoded (sempre via token de tema)
4. Componente reutilizável em `shared/ui` se aparece em mais de um lugar
5. Boundary FSD respeitado (sem import proibido entre camadas)
