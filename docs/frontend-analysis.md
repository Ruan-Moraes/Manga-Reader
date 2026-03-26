# Manga Reader — Análise Técnica do Frontend

> Última atualização: 25 de março de 2026

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
│   ├── route/          → 29 pages organizadas por domínio
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
│   ├── component/      → ~37 componentes compartilhados
│   ├── constant/       → Constantes globais
│   ├── service/        → HTTP client, utilitários
│   └── type/           → Tipos globais
├── mock/               → Dados mock (legacy — todas as features usam API real)
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

**Integração API**: ✅ Completa (sign-in, sign-up, refresh, /me, forgot/reset password). Role mapping: MEMBER→user, MODERATOR→poster, ADMIN→admin.

**Status**: Feature completa e testada. Guards funcionais com sessão localStorage. Fluxo Auth E2E testado no backend (16 testes).

---

### 3.2. `manga` — Títulos (25 arquivos)

**Exportações**: `useTitle()`, `useTitles()`, `useTitlesFetch()`, `useTitleModals()`, `useSearchTitles()`; Componentes: `BaseCard`, `CarouselContainer`, `HighlightCardsContainer`, `HorizontalCardsContainer`, `VerticalCardsContainer`, `TitleDetails`, `TitleDescription`, `TitleActions`

**5 variantes de card**: Base, Carousel, Highlight, Horizontal, Vertical — todos responsivos.

**Integração API**: ✅ Conectado à API real para busca de títulos (`GET /api/titles`, `GET /api/titles/search`).

**Novidades (Fase 9)**: `useSearchTitles` hook + `SearchResults.tsx` page para busca de títulos.

**Status**: Feature mais madura do frontend. Busca, filtros e exibição funcionais com dados reais.

---

### 3.3. `chapter` — Leitor de Capítulos (14 arquivos)

**Exportações**: `ChapterList`, `ChapterFilter`, `ChapterCoverImage`, `ChapterNavigation`, `ChapterPages`, `ChapterBottomBar`; Hooks: `useChapterReader()`, `useChapterSort()`

**Status**: UI completa com lista de capítulos, filtros, navegação e barra inferior. URLs de imagem das páginas são **placeholder/stub** (TODO no código).

---

### 3.4. `comment` — Comentários (30 arquivos — mais complexo)

**Exportações**: `useComments()`, `useCommentPagination()`, `useCommentCRUD()`, `CommentsSection`, `CommentsList`, `CommentInput`, `SortComments`; Contexts: `CommentSortProvider`, `EmojiModalProvider`

**Funcionalidades**: Estrutura hierárquica (replies), emoji picker, reações (like/dislike), ordenação (mais novos, mais antigos, mais curtidos), edição e exclusão com modais.

**Integração API**: ✅ CRUD completo conectado à API real (GET, POST, PUT, DELETE, react).

**Status**: Feature completa com árvore de comentários e CRUD funcional.

---

### 3.5. `user` — Usuários (22 arquivos)

**Exportações**: `useUserProfile()`, `useEnrichedProfile()`, `UserModal`, `UserModalHeader`, `UserModalBody`; Context: `UserModalProvider`

**Novos Componentes (Fase 9b)**: `ProfileBanner`, `ProfileHeader`, `ProfileStats`, `ProfileTabs`, `Recommendations`, `ProfileComments`, `ViewHistory`, `PrivacySettings`, `EditProfileModal`, `PrivacyBadge`, `ProfileSkeleton`, `EmptyState`

**Serviço** (`userService.ts`): getProfile, updateProfile, getEnrichedProfile, addRecommendation, removeRecommendation, reorderRecommendations, updatePrivacy, getUserComments, getUserHistory

**Tipos**: `User`, `EnrichedProfile` (stats, recommendations, comments, history, privacy)

**Status**: Perfil enriquecido completo com recomendações, histórico de visualização, configurações de privacidade, e stats da biblioteca. Conectado à API real.

---

### 3.6. `rating` — Avaliações (14 arquivos)

**Exportações**: `useRating()`, `useRatings()`, `RatingStars`, `RatingModal`, `RatingWizard`, `FinalScoreCard`, `RecentReviews`; Serviços completos de CRUD.

**Integração API**: ✅ CRUD completo conectado à API real (submit, update, delete, get by title/user, average).

**Status**: Feature completa — wizard de avaliação por categorias, lista de reviews, pontuação final. `titleName` desnormalizado no backend.

---

### 3.7. `group` — Grupos de Tradução (13 arquivos)

**Exportações**: `useGroups()`, `useGroupDetails()`, `useGroupWorks()`, `GroupCard`, `GroupDetailHeader`, `GroupSummaryCard`, `GroupsContainer`, `GroupsModal`, `MemberListModal`

**Integração API**: ✅ Conectado à API real (CRUD, join/leave, works).

**Status**: Filtros por status, gênero e ordenação. Modal de membros funcional.

---

### 3.8. `library` — Biblioteca Pessoal (10 arquivos)

**Exportações**: `useBookmark()`, `useSavedMangas()`, `BookmarkButton`

**Listas de Leitura**: READING, COMPLETED, ON_HOLD, DROPPED, PLANNING (5 tabs)

**Integração API**: ✅ CRUD completo conectado à API real (save, remove, change list, get counts).

**Novidades (Fase 9a)**: Tabs unificadas com contagens, paginação, loading/empty/error states, updates otimistas. `useBookmark` desacoplado com Set<string> local.

---

### 3.9. `category` — Categorias e Tags (9 arquivos)

**Exportações**: `useTagsFetch()`, `useCategoryFilters()`, `TagSelectInput`

**Integração API**: ✅ Busca real de tags (`GET /api/tags`).

**Status**: Select customizado com seleção múltipla. Filtros de status de publicação e conteúdo adulto definidos.

---

### 3.10. `news` — Notícias (8 arquivos)

**Exportações**: `useNews()`, `useNewsDetails()`, `NewsCard`, `HeroNews`, `NewsFilterPanel`; Serviços de busca e filtragem.

**Integração API**: ✅ Conectado à API real (GET, search, by category).

**Status**: Feed de notícias com filtros funcional. Endpoint `/related` pendente no backend.

---

### 3.11. `event` — Eventos (7 arquivos)

**Exportações**: `useEvents()`, `useEventForm()`, `EventCard`, `CreateEventForm`

**Integração API**: ✅ Conectado à API real (GET, by status).

**Status**: Lista de eventos com filtros funcional. Endpoint `/related` pendente no backend.

---

### 3.12. `forum` — Fórum (10 arquivos)

**Exportações**: `useForumPage()`, `useForumTopic()`, `TopicCard`, `Pagination`, `ForumStats`, `ReplyCard`, `RelatedTopicCard`; Serviços completos.

**Integração API**: ✅ CRUD completo conectado à API real (topics, replies, categories).

**Status**: Feature completa com tópicos, respostas e categorias funcional.

---

### 3.13. `store` — Lojas (6 arquivos)

**Exportações**: `StoresModal`, `StoresContainer`

**Integração API**: ✅ Conectado à API real (GET, by title).

**Status**: Modal e container de lojas funcional.

---

## 4. Camada Compartilhada (`shared/`)

### 4.1. Componentes (~37 total)

| Categoria | Componentes |
|-----------|------------|
| **Botões** | `BaseButton`, `RaisedButton`, `DarkButton`, `BadgeIconButton` |
| **Formulários** | `AuthenticationForm`, `ContactForm`, `FiltersForm` |
| **Inputs** | `BaseInput`, `MainSearchInput`, `InlineSearchInput`, `RadioInput`, `CheckboxWithLink` |
| **Links** | `AppLink`, `SidebarMenuContent`, `FooterLinksSection` |
| **Modais** | `BaseModal`, `InfoModal`, `ImageLightbox`, `UserSettingsModal` |
| **Notificações** | `AlertBanner`, `Warning`, `ToastProvider` |
| **Menu** | `NavigationMenu` |
| **Layout** | `TextSection`, `SectionTitle`, `TextBlock`, `Overlay` |
| **Social** | `SocialMediaSection`, `SocialMediaLink` |
| **Avatar** | `UserAvatar` (novo) |
| **UI** | `StyledSelect`, `GenreTagList` |

### 4.2. Hooks Compartilhados

| Arquivo | Função |
|---------|--------|
| `useMenuData.tsx` | Dados de navegação do menu lateral |

### 4.3. Constantes

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

### 4.4. Serviços

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
- `checkValidId.ts` — Verificação de IDs válidos
- `validateResponse.ts` — Validação de respostas da API

---

## 5. Dados Mock (Legacy)

O diretório `src/mock/` contém datasets que foram utilizados durante o desenvolvimento. **Todas as 13 features agora usam API real** (migração concluída na Fase 8).

Os mocks permanecem no código como referência de estrutura de dados, mas não são mais utilizados em runtime.

---

## 6. Sistema de Rotas

### 6.1. Rotas Públicas (23)

| Rota | Componente | Status |
|------|-----------|--------|
| `/` | Home | ✅ Completo |
| `/title/:titleId` | TitleDetails | ✅ Completo |
| `/title/:titleId/:chapter` | Chapter | ✅ Completo (imagens stub) |
| `/search` | SearchResults | ✅ Completo |
| `/categories` | CategoryFilters | ✅ Completo |
| `/groups` | Groups | ✅ Completo |
| `/groups/:groupId` | GroupProfile | ✅ Completo |
| `/profile` | UserProfile | ✅ Completo |
| `/users/:userId` | UserProfile | ✅ Completo |
| `/news` | News | ✅ Completo |
| `/news/:newsId` | NewsDetails | ✅ Completo |
| `/events` | Events | ✅ Completo |
| `/event/:eventId` | EventDetails | ✅ Completo |
| `/forum` | Forum | ✅ Completo |
| `/forum/:topicId` | ForumTopic | ✅ Completo |
| `/login` | Login | ✅ Completo (API real) |
| `/sign-up` | SignUp | ✅ Completo (API real) |
| `/forgot-password` | ForgotPassword | ✅ Completo (API real) |
| `/reset-password` | ResetPassword | ✅ Completo (API real) |
| `/about-us` | AboutUs | ✅ Completo |
| `/terms-of-use` | TermsOfUse | ⚠️ Placeholder |
| `/dmca` | Dmca | ⚠️ Placeholder |
| `*` | NotFound | ✅ Completo |

### 6.2. Rotas Protegidas (4)

| Rota | Componente | Requisito | Status |
|------|-----------|-----------|--------|
| `/library` | Library | Autenticado (AuthGuard) | ✅ Completo |
| `/reviews` | MyReviews | Autenticado (AuthGuard) | ✅ Completo |
| `/i-want-to-publish-work` | PublishWork | Autenticado (AuthGuard) | ✅ Completo |
| `/dashboard` | Dashboard | Admin/Poster (AuthGuard + RoleGuard) | ✅ Completo |

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
| **auth** | ✅ | ✅ | API real (sign-in, sign-up, refresh, /me, forgot/reset password) |
| **manga** (titles) | ✅ | — | API real (busca, filtros, search) |
| **category** (tags) | ✅ | — | API real |
| **comment** | ✅ | ✅ | API real (CRUD completo + reações) |
| **rating** | ✅ | ✅ | API real (submit, update, delete, average) |
| **library** | ✅ | ✅ | API real (CRUD + tabs + contagens) |
| **user** | ✅ | ✅ | API real (profile, enriched, recommendations, privacy, history) |
| **forum** | ✅ | ✅ | API real (topics CRUD, replies) |
| **group** | ✅ | ✅ | API real (CRUD, join/leave, works) |
| **news** | ✅ | — | API real (list, detail, category, search) |
| **event** | ✅ | — | API real (list, detail, by status) |
| **store** | ✅ | — | API real (list, detail, by title) |

**13/13 features integradas com API real** ✅

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

1. **Testes**: Nenhum teste unitário ou de integração no frontend
2. **Code splitting**: Sem `React.lazy()` — bundle inteiro carrega na primeira visita
3. **Error Boundaries**: Nenhum ErrorBoundary — erro crasha toda a app
4. **`localhost:5000` hardcoded**: `useCategoryFilters.tsx` aponta para API errada
5. **Validação de formulários**: Forms de signup, publish work sem validação client-side
6. **Lazy loading de imagens**: Tags `<img>` sem `loading="lazy"`
7. **Memoização**: Zero `useMemo`/`React.memo` — re-renders desnecessários
8. **Acessibilidade**: Parcial — botões icon-only sem `aria-label`, landmarks inconsistentes
9. **Conteúdo**: Termos de Uso e DMCA com texto placeholder
10. **Basename hardcoded**: `WEB_URL = '/Manga-Reader'` específico para GitHub Pages
11. **QUERY_KEYS incompleto**: Faltam chaves para enriched profile, recommendations, privacy, etc.
