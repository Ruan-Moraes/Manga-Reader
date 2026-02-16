# 📖 Manga Reader — Frontend

> Leitor de mangás com interface moderna construída em React + TypeScript.
> Arquitetura modular por features, design responsivo com TailwindCSS.

**Última atualização:** 15 de fevereiro de 2026

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Progresso Geral](#-progresso-geral)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades por Feature](#-funcionalidades-por-feature)
- [Decisões de Arquitetura](#-decisões-de-arquitetura)
- [Padrões de Importação](#-padrões-de-importação)
- [Erros Conhecidos](#-erros-conhecidos)
- [Próximos Passos](#-próximos-passos)
- [Como Rodar](#-como-rodar)

---

## 🎯 Visão Geral

Aplicação SPA para leitura e gerenciamento de mangás. O frontend consome dados de uma API JSON externa (`db-json-ten.vercel.app`) para títulos, comentários e tags, e utiliza serviços mock (`localStorage`) para autenticação, avaliações, biblioteca e reviews.

| Métrica            | Valor                |
| ------------------ | -------------------- |
| Total de arquivos  | **191** `.ts`/`.tsx` |
| Features           | **11** módulos       |
| Rotas              | **20** páginas       |
| Componentes shared | **33** componentes   |
| Barrel files       | **11** `index.ts`    |

---

## 🛠 Stack Tecnológica

| Categoria           | Tecnologia              | Versão |
| ------------------- | ----------------------- | ------ |
| Framework           | React                   | 19.1.0 |
| Linguagem           | TypeScript              | 5.8.3  |
| Bundler             | Vite (SWC plugin)       | 6.2.6  |
| Estilos             | TailwindCSS             | 4.1.3  |
| Server State        | @tanstack/react-query   | 5.73.3 |
| Roteamento          | react-router-dom        | 6.24.0 |
| Carrossel           | @splidejs/react-splide  | 0.7.12 |
| Selects             | react-select            | 5.10.1 |
| Toasts              | react-toastify          | 11.0.5 |
| Ícones              | react-icons             | 5.5.0  |
| Classes utilitárias | clsx                    | 2.1.1  |
| Linting             | ESLint + Prettier       | 9.24.0 |
| Deploy              | GitHub Pages (gh-pages) | 6.3.0  |

---

## 🚀 Progresso Geral

### Migração para Arquitetura Modular

| Etapa | Descrição                          | Status       |
| ----- | ---------------------------------- | ------------ |
| 1     | Análise completa do codebase       | ✅ Concluído |
| 2     | Criação da estrutura de diretórios | ✅ Concluído |
| 3     | Migração piloto (auth)             | ✅ Concluído |
| 4     | Migração das features restantes    | ✅ Concluído |
| 5     | Limpeza, barrels e padronização    | ✅ Concluído |

### Qualidade e Padronização

| Item                                                      | Status                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| Path aliases (`@features`, `@shared`, `@app`)             | ✅ Concluído                                                       |
| Barrel files para todas as 11 features                    | ✅ Concluído                                                       |
| 0 deep `@features/` imports (100% via barrel ou relativo) | ✅ Concluído                                                       |
| Imports intra-feature convertidos para relativo           | ✅ Concluído                                                       |
| Cross-feature imports via barrel                          | ✅ Concluído                                                       |
| tsconfig.json limpo (project references)                  | ✅ Concluído                                                       |
| tsconfig.node.json escopado para configs                  | ✅ Concluído                                                       |
| Diretórios vazios/bogus removidos                         | ✅ Concluído                                                       |
| Extensões `.ts`/`.tsx` removidas dos imports              | ✅ Concluído                                                       |
| Shared barrel files                                       | ⬜ Pendente (não prioritário — deep paths são padrão no `@shared`) |
| Testes unitários                                          | ⬜ Pendente                                                        |
| Backend real (substituir mocks)                           | ⬜ Pendente                                                        |
| CI/CD pipeline                                            | ⬜ Pendente                                                        |

---

## 📁 Estrutura do Projeto

```
frontend/src/
├── main.tsx                         # Entry point do React
│
├── features/                        # 🧩 Módulos de domínio (11 features)
│   ├── auth/                        #   Autenticação e perfil de usuário
│   │   ├── index.ts                 #   Barrel file (API pública)
│   │   ├── components/              #   UserModal, UserModalHeader, UserModalBody
│   │   ├── context/                 #   UserModalContext, useUserModalContext
│   │   ├── hooks/                   #   useAuth
│   │   ├── services/                #   mockAuthService (localStorage)
│   │   └── types/                   #   UserTypes
│   │
│   ├── manga/                       #   Títulos e cards de mangá
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── actions/             #   TitleActions
│   │   │   ├── cards/               #   base/, carousel/, highlight/, horizontal/, vertical/
│   │   │   └── informations/        #   TitleDetails, TitleDescription
│   │   ├── hooks/                   #   useTitle, useTitles, useTitlesFetch
│   │   └── types/                   #   TitleTypes, CardTypes, CardContainerTypes, CardConfigurationTypes
│   │
│   ├── chapter/                     #   Capítulos
│   ├── comment/                     #   Sistema de comentários completo
│   ├── rating/                      #   Avaliações e estrelas
│   ├── group/                       #   Grupos de scanlation
│   ├── library/                     #   Biblioteca salva do usuário
│   ├── category/                    #   Filtros, tags e categorias
│   ├── news/                        #   Notícias
│   ├── event/                       #   Eventos da comunidade
│   └── store/                       #   Lojas parceiras
│
├── shared/                          # 🔧 Código reutilizável global
│   ├── components/                  #   33 componentes genéricos
│   │   ├── blur/                    #   Blur
│   │   ├── boxes/                   #   GenresBox
│   │   ├── buttons/                 #   BaseButton, BlackButton, IconButton, RaisedButton
│   │   ├── forms/                   #   AuthenticationForm, ContactForm, FiltersForm
│   │   ├── icons/                   #   CalendarArrowDown, CalendarArrowUp
│   │   ├── inputs/                  #   BaseInput, CheckboxInput, MainSearchInput, RadioInput, SearchInput
│   │   ├── links/                   #   CustomLink, FooterLinkBlock, MenuLinkBlock
│   │   ├── menu/                    #   Menu
│   │   ├── modals/                  #   BaseModal, InfoModal (header/body/footer)
│   │   ├── notifications/           #   Warning
│   │   ├── paragraph/               #   Paragraph, ParagraphContainer
│   │   ├── social-medias/           #   SocialMedia, SocialMediasContainer
│   │   ├── titles/                  #   SectionTitle
│   │   ├── toast/                   #   Toast
│   │   └── ui/                      #   Select
│   ├── constants/                   #   API_CONSTANTS, COLORS, POSITIONS, SOCIAL_MEDIA_COLORS
│   ├── services/utils/              #   cache, checkValidId, checkValidReturn, toastUtils, treatDate
│   └── types/                       #   SelectVariantTypes, StatusFetchTypes
│
└── app/                             # 🖥 Camada de aplicação
    ├── layouts/                     #   AppLayout, Header, Main, Footer
    ├── router/                      #   publicRoutes, protectedRoutes
    └── routes/                      #   20 páginas
        ├── home/                    #   Página inicial
        ├── titles/                  #   Detalhes do título
        ├── chapter/                 #   Leitura de capítulo
        ├── categories/              #   Busca por categorias
        ├── login/                   #   Login (mock)
        ├── sign-up/                 #   Cadastro
        ├── profile/                 #   Perfil do usuário
        ├── library/                 #   Biblioteca do usuário
        ├── saved-mangas/            #   Mangás salvos por lista
        ├── reviews/                 #   Avaliações do usuário
        ├── groups/                  #   Listagem e perfil de grupos
        ├── news/                    #   Notícias e detalhes
        ├── events/                  #   Eventos e detalhes
        ├── publish-work/            #   Publicar obra
        ├── about-us/                #   Sobre nós
        ├── terms/                   #   Termos de uso
        ├── forgot-password/         #   Recuperação de senha
        ├── error/                   #   Página de erro
        └── loading/                 #   Tela de loading
```

---

## 🧩 Funcionalidades por Feature

### `auth` — Autenticação _(9 arquivos)_

| Funcionalidade                   | Status |
| -------------------------------- | ------ |
| Login/Logout mock (localStorage) | ✅     |
| Persistência de sessão           | ✅     |
| Edição de perfil (nome, bio)     | ✅     |
| Modal de visualização de usuário | ✅     |
| Context provider (UserModal)     | ✅     |
| Autenticação real (API)          | ⬜     |
| Registro de conta                | ⬜     |
| Recuperação de senha             | ⬜     |

### `manga` — Títulos e Cards _(21 arquivos)_

| Funcionalidade                                                        | Status |
| --------------------------------------------------------------------- | ------ |
| Listagem de títulos (API real)                                        | ✅     |
| 5 variantes de card (base, carousel, highlight, horizontal, vertical) | ✅     |
| Detalhes do título                                                    | ✅     |
| Descrição do título                                                   | ✅     |
| Ações do título (salvar, avaliar, comprar, grupos)                    | ✅     |
| Busca/filtro de títulos                                               | ⬜     |
| Paginação na listagem                                                 | ⬜     |

### `chapter` — Capítulos _(6 arquivos)_

| Funcionalidade            | Status |
| ------------------------- | ------ |
| Lista de capítulos        | ✅     |
| Filtro de capítulos       | ✅     |
| Paginação de capítulos    | ✅     |
| Leitor de capítulo        | ✅     |
| Navegação entre capítulos | ✅     |

### `comment` — Comentários _(35 arquivos)_

| Funcionalidade                     | Status |
| ---------------------------------- | ------ |
| Listagem de comentários (API real) | ✅     |
| Árvore de comentários (replies)    | ✅     |
| Input de comentário com emojis     | ✅     |
| Ordenação de comentários           | ✅     |
| Modal de edição de comentário      | ✅     |
| Modal de resposta                  | ✅     |
| Modal de exclusão                  | ✅     |
| Modal de emojis                    | ✅     |
| Context providers (Emoji, Sort)    | ✅     |
| CRUD real via API                  | ⬜     |

### `rating` — Avaliações _(11 arquivos)_

| Funcionalidade                       | Status |
| ------------------------------------ | ------ |
| Componente de estrelas (RatingStars) | ✅     |
| Modal de avaliação                   | ✅     |
| Cálculo de média de avaliações       | ✅     |
| Avaliações do usuário (mock)         | ✅     |
| Edição/exclusão de review            | ✅     |
| Avaliações reais via API             | ⬜     |

### `group` — Grupos _(11 arquivos)_

| Funcionalidade                 | Status |
| ------------------------------ | ------ |
| Listagem de grupos com filtros | ✅     |
| Perfil do grupo com detalhes   | ✅     |
| Modal de membros               | ✅     |
| Modal de seleção de grupo      | ✅     |
| Cards de grupo                 | ✅     |
| Dados reais via API            | ⬜     |

### `library` — Biblioteca _(6 arquivos)_

| Funcionalidade                                       | Status |
| ---------------------------------------------------- | ------ |
| Salvar/remover mangá (mock)                          | ✅     |
| Organização por status (Lendo, Quero Ler, Concluído) | ✅     |
| Botão de favorito                                    | ✅     |
| Hook useBookmark                                     | ✅     |
| Persistência real via API                            | ⬜     |

### `category` — Categorias _(7 arquivos)_

| Funcionalidade                                  | Status |
| ----------------------------------------------- | ------ |
| Busca de tags (API real)                        | ✅     |
| Filtros por gênero, status, sort                | ✅     |
| SelectInput customizado                         | ✅     |
| Tipos para filtros (Sort, Status, AdultContent) | ✅     |

### `news` — Notícias _(2 arquivos)_

| Funcionalidade              | Status |
| --------------------------- | ------ |
| Listagem de notícias (mock) | ✅     |
| Detalhes da notícia         | ✅     |
| Filtros por categoria       | ✅     |
| Dados reais via API         | ⬜     |

### `event` — Eventos _(3 arquivos)_

| Funcionalidade             | Status |
| -------------------------- | ------ |
| Listagem de eventos (mock) | ✅     |
| Detalhes do evento         | ✅     |
| Filtros por status/tipo    | ✅     |
| Dados reais via API        | ⬜     |

### `store` — Lojas _(5 arquivos)_

| Funcionalidade           | Status |
| ------------------------ | ------ |
| Modal de lojas parceiras | ✅     |
| Container de listagem    | ✅     |
| Card de loja             | ✅     |

---

## 🏗 Decisões de Arquitetura

### Estrutura Modular por Features

O projeto foi migrado de uma estrutura **flat por tipo de arquivo** (`components/`, `hooks/`, `services/`) para uma **arquitetura modular por features** (`features/auth/`, `features/manga/`, etc.).

**Motivação:**

- Encapsulamento — cada feature é autocontida com seus components, hooks, services e types
- Escalabilidade — novas features não poluem pastas globais
- Navegabilidade — qualquer desenvolvedor encontra rapidamente tudo sobre um domínio

**Três camadas:**

| Camada   | Pasta           | Responsabilidade                                         |
| -------- | --------------- | -------------------------------------------------------- |
| Features | `src/features/` | Lógica de domínio encapsulada por módulo                 |
| Shared   | `src/shared/`   | Componentes, utilitários e tipos genéricos reutilizáveis |
| App      | `src/app/`      | Layouts, roteamento e composição de páginas              |

### Path Aliases

Configurados no `tsconfig.app.json` e espelhados no `vite.config.ts`:

| Alias         | Caminho            | Uso                             |
| ------------- | ------------------ | ------------------------------- |
| `@features/*` | `./src/features/*` | Import de features via barrel   |
| `@shared/*`   | `./src/shared/*`   | Import de shared com deep paths |
| `@app/*`      | `./src/app/*`      | Import de layouts/routes        |
| `@/*`         | `./src/*`          | Fallback genérico               |

### Barrel Files

Cada feature expõe sua **API pública** através de um `index.ts`. Regras:

- ✅ `app/` e `main.tsx` importam **exclusivamente** via barrel: `import { useAuth } from '@features/auth'`
- ✅ Cross-feature imports usam barrel: `import { RatingStars } from '@features/rating'`
- ✅ Intra-feature imports usam **caminhos relativos**: `import { UserTypes } from '../types/UserTypes'`
- ❌ Nenhum deep import `@features/auth/hooks/useAuth` no codebase

### Server State

- **@tanstack/react-query** para cache e fetching de dados da API
- QueryClient configurado em `shared/services/utils/cache.ts`
- Custom hooks (`useTitlesFetch`, `useCommentsFetch`, `useTagsFetch`) encapsulam as queries

### Contextos React

3 contextos globais provididos no `main.tsx`:

| Context               | Feature | Finalidade                           |
| --------------------- | ------- | ------------------------------------ |
| `UserModalProvider`   | auth    | Estado do modal de perfil de usuário |
| `EmojiModalProvider`  | comment | Estado do modal de emojis            |
| `CommentSortProvider` | comment | Estado da ordenação de comentários   |

### Serviços Mock vs API Real

| Serviço             | Tipo                   | Caminho                          |
| ------------------- | ---------------------- | -------------------------------- |
| Títulos, Capítulos  | API Real               | `https://db-json-ten.vercel.app` |
| Comentários, Tags   | API Real               | `https://db-json-ten.vercel.app` |
| Auth (login/logout) | Mock (localStorage)    | `features/auth/services/`        |
| Avaliações          | Mock (localStorage)    | `features/rating/services/`      |
| Biblioteca          | Mock (localStorage)    | `features/library/services/`     |
| Reviews do usuário  | Mock (localStorage)    | `features/rating/services/`      |
| Notícias            | Mock (dados estáticos) | `features/news/services/`        |
| Eventos             | Mock (dados estáticos) | `features/event/services/`       |
| Grupos              | Mock (dados estáticos) | `features/group/services/`       |

---

## 📦 Padrões de Importação

Auditoria de imports (atualizada em 15/02/2026):

| Padrão                                  | Contagem | Status    |
| --------------------------------------- | -------- | --------- |
| Imports via barrel (`@features/xxx`)    | 37       | ✅ Padrão |
| Imports intra-feature relativos (`../`) | 77       | ✅ Padrão |
| Imports `@shared/` (deep paths)         | 153      | ✅ Padrão |
| Imports `@app/`                         | 93       | ✅ Padrão |
| Deep `@features/` imports               | **0**    | ✅ Zero   |

---

## ⚠️ Erros Conhecidos

### `Chapter.tsx` — Erros de TypeScript pré-existentes

| Erro                                                                            | Linha       | Severidade |
| ------------------------------------------------------------------------------- | ----------- | ---------- |
| `useParams()` retorna `string \| undefined`, atribuído a `string`               | 21-22       | 🔴 Erro    |
| `titles` é `Error \| TitleTypes[]`, falta type narrowing                        | 27-29       | 🔴 Erro    |
| Variáveis não utilizadas (`isError`, `error`, `handleImageError`, `actionMeta`) | 24, 43, 142 | 🟡 Warning |
| Formatação Prettier (`actionMeta` e template literal)                           | 142, 145    | 🟡 Lint    |

### `Categories.tsx` — Argumento extra

| Erro                                                | Linha | Severidade |
| --------------------------------------------------- | ----- | ---------- |
| `useTagsFetch` chamado com 3 argumentos, esperava 2 | 26    | 🔴 Erro    |

> **Nota:** Esses erros são pré-existentes e **não foram introduzidos** pela migração de arquitetura. São candidatos para correção na próxima iteração.

---

## 📌 Próximos Passos

### Prioridade Alta

- [ ] Corrigir erros TypeScript em `Chapter.tsx` (type narrowing, variáveis não utilizadas)
- [ ] Corrigir erro de argumento em `Categories.tsx`
- [ ] Implementar autenticação real (substituir `mockAuthService`)
- [ ] Implementar API real para avaliações, biblioteca e reviews

### Prioridade Média

- [ ] Adicionar testes unitários (Vitest + Testing Library)
- [ ] Implementar busca e filtro global de títulos
- [ ] Substituir mocks de notícias, eventos e grupos por API real
- [ ] Adicionar paginação na listagem de títulos
- [ ] Implementar loading states e error boundaries consistentes

### Prioridade Baixa

- [ ] Criar barrel files para `@shared/` (opcional — deep paths funcionam bem)
- [ ] Implementar PWA (service worker, offline)
- [ ] Configurar CI/CD (GitHub Actions para lint, type-check, build)
- [ ] Adicionar i18n (internacionalização)
- [ ] Dark/Light mode toggle

---

## 💻 Como Rodar

```bash
# Clonar o repositório
git clone https://github.com/ruan-moraes/Manga-Reader.git
cd Manga-Reader/frontend

# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Deploy GitHub Pages
npm run deploy

# Lint
npm run lint

# Formatar código
npm run format
```

### Scripts Disponíveis

| Script    | Comando                   | Descrição                      |
| --------- | ------------------------- | ------------------------------ |
| `dev`     | `vite --host --force`     | Dev server com hot reload      |
| `build`   | `tsc -b && vite build`    | Type-check + build de produção |
| `preview` | `vite preview`            | Preview do build local         |
| `deploy`  | `gh-pages -d dist`        | Deploy para GitHub Pages       |
| `lint`    | `eslint . --ext .ts,.tsx` | Verificação de lint            |
| `format`  | `prettier --write .`      | Formatação automática          |

---

## 📊 Resumo Visual do Progresso

```
Arquitetura Modular     ████████████████████ 100%
Barrel Files            ████████████████████ 100%
Import Cleanup          ████████████████████ 100%
Config Cleanup          ████████████████████ 100%
UI/UX (mock data)       ████████████████░░░░  80%
API Real                ████░░░░░░░░░░░░░░░░  20%
Testes                  ░░░░░░░░░░░░░░░░░░░░   0%
CI/CD                   ░░░░░░░░░░░░░░░░░░░░   0%
```
