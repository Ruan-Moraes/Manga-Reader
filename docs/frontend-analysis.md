# Manga Reader — Análise Técnica do Frontend

> Última atualização: 9 de março de 2026

---

## 1. Stack Tecnológica

| Dependência | Versão | Tipo | Função |
|------------|--------|------|--------|
| react | 19.1.0 | Produção | Biblioteca de UI |
| react-dom | 19.1.0 | Produção | Renderização DOM |
| react-router-dom | 6.24.0 | Produção | Roteamento SPA |
| typescript | 5.8.3 | Dev | Tipagem estática |
| vite | 6.2.6 | Dev | Build tool + HMR (SWC plugin) |
| tailwindcss | 4.1.3 | Dev | CSS utilitário |
| @tanstack/react-query | 5.73.3 | Produção | Server state management |
| @tanstack/react-query-devtools | 5.73.3 | Produção | Debug tools (comentado no main.tsx) |
| axios | 1.13.5 | Produção | Cliente HTTP |
| react-toastify | 11.0.5 | Produção | Notificações toast |
| react-icons | 5.5.0 | Produção | Ícones |
| react-select | 5.10.1 | Produção | Select avançado |
| react-modal | 3.16.3 | Produção | Modais acessíveis |
| @splidejs/react-splide | 0.7.12 | Produção | Carrossel |
| @splidejs/splide | 4.1.4 | Produção | Core do carrossel |
| clsx | 2.1.1 | Produção | Classes condicionais |
| eslint | 9.24.0 | Dev | Linting |
| prettier | 3.5.3 | Dev | Formatação |
| gh-pages | 6.3.0 | Dev | Deploy GitHub Pages |

---

## 2. Arquitetura

### Padrão: Arquitetura Modular por Feature

O frontend segue uma **arquitetura modular orientada a domínio**, onde cada feature é um módulo auto-contido com sua própria camada de componentes, hooks, serviços, tipos e contextos.

```
src/
├── app/                → Aplicação (layouts, rotas, router)
│   ├── layout/         → Header, Footer, Main, RootLayout
│   ├── route/          → 22+ pages organizadas por domínio
│   └── router/         → PublicRoutes + ProtectedRoutes
├── feature/            → 13 módulos de domínio
│   └── [feature]/
│       ├── index.ts    → Barrel file (API pública do módulo)
│       ├── component/  → Componentes React
│       ├── hook/       → Custom hooks
│       ├── service/    → Lógica de negócio + chamadas API
│       ├── type/       → Tipos TypeScript
│       ├── context/    → Context providers (quando necessário)
│       └── constant/   → Constantes do módulo
├── shared/             → Código reutilizável cross-feature
│   ├── component/      → 33 componentes compartilhados
│   ├── constant/       → Constantes globais
│   ├── service/        → HTTP client, utilitários
│   └── type/           → Tipos globais
├── mock/               → 11 datasets de dados mock
├── asset/              → Imagens e SVGs
└── style/              → CSS global + customizações Tailwind
```

### Entry Point (`main.tsx`)

```
QueryClientProvider → UserModalProvider → EmojiModalProvider → CommentSortProvider
  └── BrowserRouter (basename="/Manga-Reader")
        └── ToastContainer
        └── <App /> (routes)
```

### Layout

- **RootLayout**: Wrapper com `<Outlet />` e scroll restoration
- **Header**: Navegação, busca, exibição de autenticação
- **Main**: Container de conteúdo principal com padding
- **Footer**: Links, redes sociais, copyright

---

## 3. Módulos de Feature (13)

### 3.1. `auth` — Autenticação

**Exportações**: `useAuth()`, `useForgotPassword()`, `useResetPassword()`, `AUTH_KEY`

**Serviço** (`authService.ts`):
- `signIn(email, password)` → `POST /api/auth/sign-in`
- `signUp(name, email, password)` → `POST /api/auth/sign-up`
- `getCurrentUser()` → `GET /api/auth/me`
- `refreshToken(token)` → `POST /api/auth/refresh`
- `requestPasswordReset(email)` → `POST /api/auth/forgot-password`
- `resetPassword(token, newPassword)` → `POST /api/auth/reset-password`
- `getStoredSession()` / `persistSession()` → Gerenciamento via localStorage

**Status**: Estrutura completa. Endpoints definidos, guards implementados, sessão com localStorage. Fluxo não testado end-to-end com backend.

---

### 3.2. `manga` — Títulos (21 arquivos)

**Exportações**: `useTitle()`, `useTitles()`, `useTitlesFetch()`, `useTitleModals()`; Componentes: `BaseCard`, `CarouselContainer`, `HighlightCardsContainer`, `HorizontalCardsContainer`, `VerticalCardsContainer`, `TitleDetails`, `TitleDescription`, `TitleActions`

**5 variantes de card**: Base, Carousel, Highlight, Horizontal, Vertical — todos responsivos.

**Integração API**: ✅ Conectado à API real para busca de títulos (`GET /api/titles`).

**Status**: Feature mais madura do frontend. Busca, filtros e exibição funcionais com dados reais. Paginação parcial.

---

### 3.3. `chapter` — Leitor de Capítulos (6 arquivos)

**Exportações**: `ChapterList`, `ChapterFilter`, `ChapterCoverImage`, `ChapterNavigation`, `ChapterPages`, `ChapterBottomBar`; Hooks: `useChapterReader()`, `useChapterSort()`

**Status**: UI completa com lista de capítulos, filtros, navegação e barra inferior. URLs de imagem das páginas são **placeholder/stub** (TODO no código).

---

### 3.4. `comment` — Comentários (35 arquivos — mais complexo)

**Exportações**: `useComments()`, `useCommentPagination()`, `CommentsSection`, `CommentsList`, `CommentInput`, `SortComments`; Contexts: `CommentSortProvider`, `EmojiModalProvider`

**Funcionalidades**: Estrutura hierárquica (replies), emoji picker, ordenação (mais novos, mais antigos, mais curtidos).

**Integração API**: ✅ Listagem conectada à API real (`GET /api/comments/title/{titleId}`). Operações de criação, edição e deleção **não conectadas**.

**Status**: UI completa com árvore de comentários. CRUD incompleto no frontend.

---

### 3.5. `user` — Usuários (3 arquivos)

**Exportações**: `useUserProfile()`, `UserModal`, `UserModalHeader`, `UserModalBody`; Context: `UserModalProvider`

**Tipos**: `User` (id, name, email, bio, role, photo, statistics, member)

**Status**: Modal de usuário e visualização de perfil funcionais. Atualização de perfil não conectada ao backend.

---

### 3.6. `rating` — Avaliações (11 arquivos)

**Exportações**: `useRating()`, `useRatings()`, `RatingStars`, `RatingModal`, `RecentReviews`; Serviços completos de CRUD.

**Status**: UI com estrelas (1-5), modal de avaliação, lista de reviews. **Usa dados mock**. API real não conectada.

---

### 3.7. `group` — Grupos de Tradução (11 arquivos)

**Exportações**: `useGroups()`, `useGroupDetails()`, `useGroupWorks()`, `GroupCard`, `GroupDetailHeader`, `GroupSummaryCard`, `GroupsContainer`, `GroupsModal`, `MemberListModal`

**Status**: Filtros por status, gênero e ordenação. Modal de membros. **Usa dados mock**.

---

### 3.8. `library` — Biblioteca Pessoal (6 arquivos)

**Exportações**: `useBookmark()`, `useSavedMangas()`, `BookmarkButton`

**Listas de Leitura**: "Lendo", "Quero Ler", "Concluído"

**Status**: Persistência em localStorage. Botão de bookmark funcional. **Não conectada ao backend.**

---

### 3.9. `category` — Categorias e Tags (7 arquivos)

**Exportações**: `useTagsFetch()`, `useCategoryFilters()`, `TagSelectInput`

**Integração API**: ✅ Busca real de tags (`GET /api/tags`).

**Status**: Select customizado com seleção múltipla. Filtros de status de publicação e conteúdo adulto definidos.

---

### 3.10. `news` — Notícias (2 arquivos)

**Exportações**: `useNews()`, `useNewsDetails()`, `NewsCard`, `HeroNews`, `NewsFilterPanel`; Serviços de busca e filtragem.

**Status**: Feed de notícias com filtros e artigos relacionados. **Usa dados mock**.

---

### 3.11. `event` — Eventos (3 arquivos)

**Exportações**: `useEvents()`, `useEventForm()`, `EventCard`, `CreateEventForm`

**Status**: Lista de eventos com filtros por tipo/período/status. Formulário de criação não conectado à API. **Usa dados mock**.

---

### 3.12. `forum` — Fórum (10+ arquivos)

**Exportações**: `useForumPage()`, `useForumTopic()`, `TopicCard`, `Pagination`, `ForumStats`, `ReplyCard`, `RelatedTopicCard`; Serviços completos.

**Status**: Tópicos com respostas, categorias, paginação. **Usa dados mock**.

---

### 3.13. `store` — Lojas (3 arquivos)

**Exportações**: `StoresModal`, `StoresContainer`

**Status**: Modal e container de lojas. **Sem integração de dados**.

---

## 4. Camada Compartilhada (`shared/`)

### 4.1. Componentes (33 total)

| Categoria | Componentes |
|-----------|------------|
| **Botões** | `BaseButton`, `RaisedButton`, `DarkButton`, `BadgeIconButton` |
| **Formulários** | `AuthenticationForm`, `ContactForm`, `FiltersForm` |
| **Inputs** | `BaseInput`, `MainSearchInput`, `InlineSearchInput`, `RadioInput`, `CheckboxWithLink` |
| **Links** | `AppLink`, links de footer e menu |
| **Modais** | `BaseModal`, `InfoModal`, `ImageLightbox` |
| **Notificações** | `AlertBanner`, `ToastProvider` |
| **Menu** | `NavigationMenu` |
| **Layout** | `TextSection`, `SectionTitle` |
| **Social** | `SocialMediaSection`, `SocialMediaLink` |
| **UI** | Custom Select |

### 4.2. Constantes

| Arquivo | Conteúdo |
|---------|----------|
| `API_URLS.ts` | Todas as URLs de endpoint da API (auth, titles, chapters, comments, ratings, library, groups, tags, news, events, forum, stores, users) |
| `ROUTES.ts` | `WEB_URL = '/Manga-Reader'` + rotas pré-definidas com filtros |
| `ERROR_MESSAGES.ts` | Mensagens de erro em português (UNKNOWN_ERROR, FETCH_ERROR, NETWORK_ERROR, etc.) |
| `QUERY_KEYS.ts` | Chaves de cache do React Query |
| `THEME_COLORS.ts` | Esquema de cores Tailwind |
| `SOCIAL_MEDIA_COLORS.ts` | Cores para links sociais |
| `TOAST_POSITIONS.ts` | Posições de toast |
| `USER_SETTINGS_STORAGE_KEY.ts` | Chaves de localStorage |

### 4.3. Serviços

**HTTP Client** (`shared/service/http/`):
- `httpClient.ts`: Factory de instâncias Axios com `createHttpClient(config)` + singleton `api`
- `httpInterceptors.ts`: Request (injeta Bearer token), Response (trata erros, limpa sessão em 401)
- `httpTypes.ts`: `ApiResponse<T>`, `ApiErrorResponse`, `PageResponse<T>`, `HttpClientConfig`

**Utilitários** (`shared/service/util/`):
- `toastService.ts` — `showSuccessToast()`, `showErrorToast()`, `showWarningToast()`, `showInfoToast()`
- `queryCache.ts` — Configuração do React Query client
- `apiErrorMessages.ts` — Resolução de mensagens de erro
- `formatDate.ts` — Formatação de datas
- `formatRelativeDate.ts` — Tempo relativo ("2 horas atrás")
- `validateId.ts` — Validação de IDs

---

## 5. Dados Mock

O projeto utiliza dados mock extensivos em `src/mock/` para desenvolvimento sem dependência do backend:

| Dataset | Arquivo | Descrição |
|---------|---------|-----------|
| Users | `data/users.ts` | 6 usuários mock (Leitor Demo = usuário logado) |
| Titles | `data/titles.ts` | Títulos de mangá |
| Comments | `data/comments.ts` | Threads de comentários hierárquicos |
| Ratings | `data/ratings.ts` | Reviews e avaliações |
| Tags | `data/tags.ts` | Tags de categoria |
| Groups | `data/groups.ts` | Grupos de tradução + membros e obras |
| News | `data/news.ts` | Artigos de notícia |
| Events | `data/events.ts` | Eventos da comunidade |
| Stores | `data/stores.ts` | Links de lojas externas |
| Library | `data/library.ts` | Listas de mangás salvos |
| Forums | `data/forums.ts` | Tópicos e respostas do fórum |

**Nota**: Títulos e tags usam **API real**; todos os outros usam dados mock.

---

## 6. Sistema de Rotas

### 6.1. Rotas Públicas (20)

| Rota | Componente | Status |
|------|-----------|--------|
| `/` | Home | ✅ Completo |
| `/title/:titleId` | TitleDetails | ✅ Completo |
| `/title/:titleId/:chapter` | Chapter | ✅ Completo (imagens stub) |
| `/categories` | CategoryFilters | ✅ Completo |
| `/forum` | Forum | ✅ Completo |
| `/forum/:topicId` | ForumTopic | ✅ Completo |
| `/groups` | Groups | ✅ Completo |
| `/groups/:groupId` | GroupProfile | ✅ Completo |
| `/news` | News | ✅ Completo |
| `/news/:newsId` | NewsDetails | ✅ Completo |
| `/events` | Events | ✅ Completo |
| `/event/:eventId` | EventDetails | ✅ Completo |
| `/saved-mangas` | SavedMangas | ✅ Completo |
| `/library` | Library | ✅ Completo |
| `/profile` | Profile | ✅ Completo |
| `/reviews` | MyReviews | ✅ Completo |
| `/users/:userId` | UserDetails | ✅ Completo |
| `/login` | Login | ⚠️ Parcial (mock auth) |
| `/sign-up` | SignUp | ⚠️ Parcial (sem validação) |
| `/forgot-password` | ForgotPassword | ⚠️ Parcial (sem backend) |
| `/reset-password` | ResetPassword | ⚠️ Parcial (sem backend) |
| `/about-us` | AboutUs | ✅ Completo |
| `/terms-of-use` | TermsOfUse | ⚠️ Placeholder |
| `/dmca` | Dmca | ⚠️ Placeholder |
| `*` | NotFound | ✅ Completo |

### 6.2. Rotas Protegidas (2)

| Rota | Componente | Requisito | Status |
|------|-----------|-----------|--------|
| `/dashboard` | Dashboard | Role: Admin/Poster | ✅ Completo |
| `/i-want-to-publish-work` | PublishWork | Autenticado | ✅ Completo |

### 6.3. Guards

- **AuthGuard**: Verifica sessão via `getStoredSession()`, redireciona para `/login` com path de retorno
- **RoleGuard**: Valida role do usuário (admin, poster, user)

---

## 7. Configuração

### Vite (`vite.config.ts`)

- **Base URL**: `/Manga-Reader` (GitHub Pages)
- **Plugins**: `@vitejs/plugin-react-swc`, `@tailwindcss/vite`
- **Aliases**: `@` → `src/`, `@feature` → `src/feature/`, `@shared` → `src/shared/`, `@app` → `src/app/`, `@mock` → `src/mock/`
- **Proxy (dev)**: `/api` → `http://localhost:8080`

### TypeScript (`tsconfig.app.json`)

- Target: ES2024
- JSX: react-jsx
- Strict mode habilitado
- `noUnusedLocals` e `noUnusedParameters` habilitados

### Tailwind (`tailwind.config.js`)

**Tema customizado**:
- `primary` (#161616) — fundo escuro
- `secondary` (#252526) — elementos secundários
- `tertiary` (#727273) — texto terciário
- `quaternary` (#ddda2a) — amarelo destaque
- `quinary` (#FF784F) — laranja accent

**Breakpoints customizados**: mobile-sm (320px), mobile-md (375px), mobile-lg (425px)

### Variáveis de Ambiente

- `VITE_API_BASE_URL` — URL base da API (padrão: proxy para localhost:8080)

---

## 8. Estilização

- **Font**: Nunito Sans (pesos 200-1000, itálico)
- **Tema**: Dark mode nativo (background #161616, texto branco)
- **Scrollbar**: Customizada via -webkit (estilo dark)
- **Animações**: Loader dual-ring, fade-in para UI step-by-step
- **Sombras**: Sistema customizado com amarelo/laranja accent
- **Carrossel**: Splide com setas customizadas (cor #727273)

---

## 9. Status de Integração com API

| Feature | Leitura (GET) | Escrita (POST/PUT/DELETE) | Fonte de Dados |
|---------|:----:|:----:|----------------|
| **manga** (titles) | ✅ | ❌ | API real |
| **category** (tags) | ✅ | ❌ | API real |
| **comment** | ✅ | ❌ | API real (GET) |
| **auth** | 🔲 | 🔲 | Endpoints definidos, não testados |
| **rating** | ❌ | ❌ | Mock data |
| **group** | ❌ | ❌ | Mock data |
| **library** | ❌ | ❌ | Mock data (localStorage) |
| **news** | ❌ | ❌ | Mock data |
| **event** | ❌ | ❌ | Mock data |
| **forum** | ❌ | ❌ | Mock data |
| **store** | ❌ | ❌ | Mock data |
| **user** | ❌ | ❌ | Mock data |

---

## 10. Pontos Fortes

1. **Arquitetura modular** bem definida com separação clara por feature
2. **Stack moderna** (React 19, Vite com SWC, TailwindCSS 4, TypeScript strict)
3. **Camada HTTP robusta** com factory de clientes, interceptores e tipagem
4. **React Query** para gerenciamento de estado do servidor com cache
5. **Design responsivo** com breakpoints mobile customizados
6. **Sistema de erros** com mensagens em português e tratamento centralizado
7. **Guards de rota** com redirect e validação de role
8. **Barrel files** em todas as features para imports limpos

## 11. Lacunas Identificadas

1. **Integração real**: 10 de 13 features dependem de mock data
2. **Testes**: Nenhum teste unitário ou de integração
3. **Validação de formulários**: Forms de signup, publish work sem validação
4. **Lazy loading**: Sem code splitting para rotas — impacta performance
5. **Acessibilidade**: Sem ARIA labels ou HTML semântico adequado
6. **Componentes grandes**: Vários page components > 100 linhas precisam de split
7. **Conteúdo**: Termos de Uso e DMCA com texto placeholder
8. **Basename hardcoded**: `WEB_URL = '/Manga-Reader'` específico para GitHub Pages
