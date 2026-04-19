# Manga Reader — Design System

Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade, avaliações e loja.

---

## 🎨 Design System

### Cores

#### Paleta Principal
| Token | Hex | Uso |
|-------|-----|-----|
| **primary** | `#161616` | Fundo principal |
| **secondary** | `#252526` | Cards, containers |
| **tertiary** | `#727273` | Ícones, disabled |
| **accent-primary** | `#ddda2a` | Highlights, borders, botões |
| **accent-secondary** | `#FF784F` | Deletes, warnings |
| **text-default** | `#ffffff` | Texto padrão |

#### Grays (Suporte)
| Valor | Hex | Uso |
|-------|-----|-----|
| gray-900 | `#1a1a1a` | Backgrounds escuros |
| gray-800 | `#2d2d2d` | Editors, code blocks |
| gray-700 | `#444444` | Borders, separators |
| gray-600 | `#555555` | Separadores finos |
| gray-400 | `#777777` | Placeholders, disabled |
| gray-300 | `#999999` | Text subtle |
| gray-200 | `#cccccc` | Text very subtle |

### Tipografia

| Tipo | Tamanho | Weight | Uso |
|------|---------|--------|-----|
| **H1** | 32px | 700 | Títulos de página |
| **H2** | 24px | 600 | Subtítulos |
| **H3** | 20px | 600 | Seções |
| **H4** | 16px | 600 | Subseções |
| **Body** | 14px | 400 | Texto padrão |
| **Small** | 12px | 400 | Labels, meta |
| **Tiny** | 11px | 400 | Badges, captions |

**Font:** Nunito Sans (variable weight 200-1000)

### Espaçamento (8px grid)

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Micro gaps |
| `sm` | 8px | Small padding |
| `md` | 16px | Default padding |
| `lg` | 24px | Large spacing |
| `xl` | 32px | Sections |
| `2xl` | 48px | Major sections |

### Efeitos

#### Box Shadows
```css
shadow-default:   0.25rem 0.25rem 0 0 #ddda2a40
shadow-inside:    0 0 0.075rem 0.25rem #ddda2a40
shadow-elevated:  -0.25rem 0.25rem 0 0 #ddda2a40
shadow-black:     0 0 2rem 0.25rem #161616bf
```

#### Borders & Radius
- **Border default:** 1px solid `#444444`
- **Border-radius:** 4px (subtle), 8px (cards), 12px (buttons)

#### Opacidades
```
accent-primary-opacity-25:  25% (#ddda2a40)
accent-primary-opacity-50:  50% (#ddda2a80)
accent-primary-opacity-75:  75% (#ddda2abf)
```

---

## 📱 Breakpoints

| Label | Width | Uso |
|-------|-------|-----|
| **mobile-sm** | 320px | Phones mínimos |
| **mobile-md** | 375px | Phones comuns |
| **mobile-lg** | 425px | Tablets pequenos |
| **sm** | 640px | Tablets |
| **md** | 768px | Tablets grandes |
| **lg** | 1024px | Desktops |
| **xl** | 1280px | Desktops grandes |

**Mobile-First:** Base sem prefixo, media queries crescentes.

---

## 🧩 Componentes UI

### Navegação

#### NavigationMenu
- Logo + menu items
- Search bar global
- Profile dropdown
- Colapsável em `<md` (hamburger menu)
- Overlay com backdrop em mobile

#### Header
- Responsive logo
- Search bar integrada
- Auth controls (Login/Profile)
- Dark background `#161616`

#### Breadcrumb
- Hierarquia de navegação
- Links com accent color `#ddda2a`

### Cards & Containers

#### MangaCard
- Poster (image com aspect ratio)
- Título (H4)
- Rating stars
- Gêneros como badges
- Hover: shadow elevada, border accent
- Tamanho: 160px × 240px (base)

#### CommentCard
- Avatar + username
- Data + edit/delete buttons
- Conteúdo markdown
- Like/Dislike buttons
- Reply button

#### EventCard
- Cover image
- Título (H4)
- Data + status badge
- Descrição (truncada)
- Participantes count

#### NewsCard
- Thumbnail image
- Headline (H4)
- Categoria badge
- Data (small)
- Excerpt

#### GroupCard
- Cover image
- Título + descrição
- Member count
- Status badge (público/privado)

### Forms & Inputs

#### FormField
- Label (small weight 600)
- Input com border `#444444`
- Hover: border `#ddda2a`
- Focus: border + shadow accent
- Error state: text `#FF784F`

#### TagInput
- Multi-select
- Pills com accent
- X para remover
- Dropdown com sugestões

#### RatingInput
- 6 sliders (Diversão, Arte, Enredo, Personagens, Originalidade, Ritmo)
- Slider background: `#2d2d2d`
- Thumb: `#ddda2a`
- Value display abaixo

#### CommentInput
- Textarea com markdown editor (EasyMDE)
- Toolbar com botões de formatação
- Preview ao lado (splitscreen)
- Submit button primário

#### SearchBar
- Icon left (search)
- Placeholder text gray
- Sugestões dropdown (títulos, usuários, grupos)

### Dados & Apresentação

#### DataTable
- Striped rows (alternate `#1a1a1a` e `#161616`)
- Header background `#2d2d2d`
- Sortable columns (icon na header)
- Paginação na footer

#### Pagination
- Previous/Next buttons
- Numbers com active state accent
- Disabled states gray

#### Badge
- Inline labels
- Background: accent primary ou secondary
- Text: white
- Tamanhos: small, medium
- Exemplos: "Reading", "Completed", "Ongoing"

#### Rating Display
- Stars (5 ou 6 pontos)
- Yellow/gold color
- Count abaixo (ex: "4.5 (120 reviews)")

#### Avatar
- Circle
- Default fallback (initials)
- Sizes: xs (24px), sm (32px), md (48px), lg (64px)

#### Skeleton
- Shimmer animation
- Placeholder de cards, textos

### Modais & Overlays

#### Modal
- Backdrop dark semi-transparent
- Content card com border
- Close button (top-right)
- Header, body, footer sections

#### ConfirmDialog
- Título + mensagem
- Cancel (secondary) + Confirm (primary) buttons
- Ícone contextual (warning, delete, etc)

#### Toast
- Fixed position (top-right)
- Auto-dismiss (4s)
- Tipos: success (green), error (red), info (blue)
- Ícone + message + close

#### Dropdown
- Trigger button
- Menu overlay
- Items com hover state
- Dividers onde necessário

#### Tooltip
- Hover trigger
- Dark background
- Text small
- Arrow pointing to trigger

### Especializados

#### CommentsSection
- Lista de comments paginada
- Add comment form no topo
- Sort options (newest, oldest, most liked)
- Edit/Delete actions (próprio usuário)
- Replies nested

#### RatingSection
- Sua nota (se existir) em destaque
- Média geral com stars
- Distribution bars (por star)
- Total de reviews

#### LibraryTabs
- Abas: Reading, Completed, On-Hold, Dropped, Planning
- Grid de MangaCards
- Paginação
- Count na aba (ex: "Reading (23)")

#### UserProfile
- Avatar large (64px)
- Username (H2)
- Bio + stats em 3 colunas (Reviews, Groups, Following)
- Social links
- Edit button (próprio perfil)

#### SearchResults
- Abas: Titles, Users, Groups, News
- Results em grid ou list
- Load more ou paginação
- Empty state com ícone

---

## 📄 Layouts & Padrões

### Layout Principal

```
┌─────────────────────────────────────┐
│          Header/Navigation          │
├──────────────────┬──────────────────┤
│    Sidebar       │   Main Content   │
│  (colapsável)    │   (fluid)        │
│                  │                  │
│                  │                  │
├──────────────────┴──────────────────┤
│           Footer                     │
└─────────────────────────────────────┘
```

**Mobile:** Sidebar em overlay, hamburger menu no header.

### Página Listagem
- Header com título + filters/sort
- Grid responsiva (1 col mobile, 2-4 cols desktop)
- Paginação ou load more
- Empty state se vazio

### Página Detalhe
- Hero image (full width ou sidebar)
- Título + metadata (H2)
- Descrição/Sinopse
- Actions buttons (Add Library, Rate, etc)
- Related section (carousel)
- Comments section
- Rating section

### Página Perfil
- Header com avatar + banner background
- User info card
- Tabs: About, Reviews, Library, History
- Tab content muda dinamicamente

### Modal Forms
- Title (H3)
- Form fields
- Submit + Cancel buttons
- Validation errors em red

---

## 🎬 Componentes por Página

### Públicas (23)

| Página | Componentes Principais |
|--------|------------------------|
| **Home** | Header, Hero banner, MangaCard grid (trending), NewsCard carousel, Footer |
| **Titles** | Header com filters, Grid de MangaCard com paginação, Sidebar de filtros |
| **Title Detail** | Hero, RatingSection, CommentsSection, Related carousel |
| **Chapter Reader** | Chapter navigation, Reader (full width), Comments sidebar |
| **User Profile** | UserProfile header, Tabs (Reviews, Library, History), Grid de ReviewCards |
| **Library** | LibraryTabs, Grid de SavedMangaCard, Empty state |
| **Categories** | Header + Grid de CategoryBadges, Search dentro |
| **Forum** | Header, List de TopicCard, Sidebar com categories |
| **Forum Topic** | Topic header, List de ReplyCards, Add reply form |
| **Groups** | Header, Grid de GroupCard, Search + filters |
| **Group Detail** | GroupHeader, Tabs (About, Members, Works, Discussion) |
| **News** | Header + Grid de NewsCard com paginação, Sidebar latest |
| **News Detail** | News header + content, Related news carousel, Comments |
| **Events** | Header + Grid de EventCard, Filters (status, date) |
| **Event Detail** | Event header + description, Participants list, Tickets section |
| **Stores** | Header + Grid de StoreCard |
| **Store Detail** | Store header + products grid, Filter por gênero |
| **Search** | SearchResults com abas (Titles, Users, Groups, News) |
| **Auth Login** | Card com form (email, password), Link signup |
| **Auth Signup** | Card com form (name, email, password, confirm), Link login |
| **Auth Forgot** | Card com form (email), Success message |
| **Terms** | Header + content markdown |
| **Privacy** | Header + content markdown |

### Protegidas (4)

| Página | Componentes Principais |
|--------|------------------------|
| **My Profile** | UserProfile editable, Form fields, Save button |
| **My Library** | LibraryTabs (com CRUD), Edit modal por item |
| **My Reviews** | Grid de ReviewCard editáveis, Add review button, Edit modal |
| **My Groups** | List de GroupCard (mine), Create group modal, Settings |

---

## 🎨 Padrões de Interação

### Hover States
- Cards: `shadow-elevated` + slight scale up
- Links: `color: #ddda2a` + underline
- Buttons: opacity 0.8 ou background change

### Focus States
- Inputs: `border: 2px solid #ddda2a` + `shadow-inside`
- Buttons: `outline: 2px solid #ddda2a`

### Loading States
- Skeleton loaders (shimmer)
- Spinner (white border + yellow fill)
- Disabled buttons com opacity

### Error States
- Text color: `#FF784F`
- Border: `#FF784F`
- Message: small help text
- Shake animation (opcional)

### Success States
- Toast success
- Highlight border
- Checkmark icon

---

## 📐 Responsive Strategy

### Mobile First
1. **Base:** mobile-sm (320px) — 1 coluna, fullwidth
2. **mobile-md (375px):** Pequenos ajustes
3. **mobile-lg (425px):** Ready para tablet
4. **md (768px):** 2 colunas, sidebar colapsável
5. **lg (1024px):** 3+ colunas, sidebar expanded
6. **xl (1280px):** Hero images maiores, wider cards

### Componentes Responsivos
- **Grid:** `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Sidebar:** Hidden `<md`, overlay com hamburger
- **DataTable:** `overflow-x-auto` com horizontal scroll
- **Modais:** Full height mobile, centered no desktop
- **Images:** `object-cover` com aspect ratios fixos

---

## 🌙 Dark Mode

- **Primary:** `#161616` (fundo)
- **Secondary:** `#252526` (cards)
- **Text:** `#ffffff` (padrão)
- **Accent:** `#ddda2a` (highlight)
- **Borders:** `#444444` (grid)

Projeto inteiramente dark mode. Sem toggle necessário.

---

## ♿ Acessibilidade

### ARIA
- `role="navigation"` em menus
- `aria-label` em buttons sem texto
- `aria-expanded` em toggles
- `aria-current="page"` em nav links ativos

### Semantic HTML
- `<button>` para ações
- `<a>` para navegação
- `<header>`, `<nav>`, `<main>`, `<footer>`
- `<form>`, `<label>`, `<input>`

### Color & Contrast
- ✅ Branco `#ffffff` sobre Preto `#161616`: 21:1 (AAA)
- ✅ Amarelo `#ddda2a` sobre Preto: 15:1 (AA)
- ⚠️ Cinza `#727273` sobre Preto: 3.8:1 (grande texto OK)

### Keyboard Navigation
- Tab order lógico
- Enter para buttons
- Escape para modais
- Arrow keys em carousels/dropdowns

---

## 📋 Checklist de Design

Antes de implementar um novo componente:

- [ ] Usa colors da paleta
- [ ] Tipografia consistente
- [ ] Espaçamento segue grid 8px
- [ ] Hover/focus states definidos
- [ ] Responsivo em 3+ breakpoints
- [ ] Acessibilidade (contrast, ARIA)
- [ ] Dark mode (já é padrão)
- [ ] Estado loading/error
- [ ] Reusa componentes existentes

---

## 📎 Referências

**Cores:** Ver `PALETA_CORES.md` para detalhes + código  
**Componentes:** `/frontend-apps/manga-reader/src/shared/component/`  
**Styles:** `/frontend-apps/manga-reader/src/style/index.css`  
**Tailwind:** `/frontend-apps/manga-reader/tailwind.config.js`

---

**Última atualização:** 19/04/2026
