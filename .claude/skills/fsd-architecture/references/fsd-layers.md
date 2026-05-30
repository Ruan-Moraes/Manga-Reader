# FSD Layers — Referência Completa

## Índice
1. [Visão Geral das Camadas](#visão-geral)
2. [app](#app)
3. [pages](#pages)
4. [widgets](#widgets)
5. [features](#features)
6. [entities](#entities)
7. [shared](#shared)
8. [Regras de Importação Detalhadas](#regras-de-importação)
9. [Exemplos de Estrutura Real](#exemplos-de-estrutura-real)

---

## Visão Geral

```
src/
├── app/          ← Inicialização, providers globais, roteamento raiz
├── pages/        ← Composições de rota — montam widgets e features
├── widgets/      ← Blocos autônomos que combinam features e entities
├── features/     ← Ações do usuário com valor de negócio
├── entities/     ← Conceitos do domínio com estado e UI básica
└── shared/       ← Código agnóstico ao negócio, reutilizável
```

A regra central: **uma camada só importa de camadas abaixo dela**.

---

## app

**O que pertence aqui:**
- Arquivo raiz da aplicação (`main.tsx`, `App.tsx`)
- Providers globais (QueryClient, Redux Store, ThemeProvider, i18n)
- Configuração de roteamento raiz (React Router, TanStack Router)
- Estilos globais (`globals.css`, reset CSS)
- Inicialização de SDKs externos (Sentry, analytics)

**O que NÃO pertence aqui:**
- Lógica de negócio de qualquer domínio
- Componentes visuais reutilizáveis
- Chamadas de API específicas

**Exemplo de estrutura:**
```
app/
├── providers/
│   ├── QueryProvider.tsx
│   ├── ThemeProvider.tsx
│   └── index.ts
├── styles/
│   └── globals.css
├── router/
│   ├── routes.ts
│   └── index.ts
└── index.tsx         ← Ponto de entrada
```

**Pode importar de:** pages, widgets, features, entities, shared

---

## pages

**O que pertence aqui:**
- Um arquivo por rota da aplicação
- Composição de widgets, features e entities para formar a tela
- Lógica de orquestração de dados da página (qual query buscar, qual estado inicializar)
- Layouts de página quando são específicos de uma rota

**O que NÃO pertence aqui:**
- Componentes visuais reutilizáveis (→ widgets ou shared)
- Lógica de negócio (→ features ou entities)
- Chamadas de API diretas (→ feature/entity.api.ts)

**Critério:** se dois componentes do mesmo arquivo são usados em rotas diferentes, extraia para widget.

**Exemplo de estrutura:**
```
pages/
├── home/
│   ├── ui/
│   │   └── HomePage.tsx      ← Compõe <ProductList />, <HeroBanner />
│   └── index.ts
├── product-detail/
│   ├── ui/
│   │   └── ProductDetailPage.tsx
│   └── index.ts
└── checkout/
    ├── ui/
    │   └── CheckoutPage.tsx
    └── index.ts
```

**Pode importar de:** widgets, features, entities, shared  
**Não pode importar de:** app, outras pages

---

## widgets

**O que pertence aqui:**
- Blocos visuais autônomos e complexos que combinam múltiplos slices
- Componentes que aparecem em múltiplas páginas com a mesma estrutura
- Layouts compostos (Header com navegação + busca + avatar, Sidebar com filtros)

**O que NÃO pertence aqui:**
- Ações do usuário isoladas (→ features)
- Conceitos de domínio puro (→ entities)

**Critério:** um widget sabe como compor features e entities, mas não implementa a lógica delas.

**Exemplo de estrutura:**
```
widgets/
├── header/
│   ├── ui/
│   │   ├── Header.tsx          ← Compõe SearchBar (feature) + UserMenu (entity)
│   │   └── NavigationMenu.tsx
│   ├── model/
│   │   └── header.model.ts     ← Estado de menu aberto/fechado (UI state)
│   └── index.ts
├── product-card/
│   ├── ui/
│   │   └── ProductCard.tsx     ← Compõe AddToCart (feature) + ProductInfo (entity)
│   └── index.ts
└── sidebar-filters/
    ├── ui/
    │   └── SidebarFilters.tsx
    └── index.ts
```

**Pode importar de:** features, entities, shared  
**Não pode importar de:** app, pages, outros widgets

---

## features

**O que pertence aqui:**
- Funcionalidades que representam ações do usuário com valor de negócio
- Interações que modificam estado global ou disparam side effects
- Fluxos de formulário vinculados a uma ação específica

**Nomenclatura:** sempre verbos ou ações (`add-to-cart`, `authenticate-user`, `filter-products`, `submit-review`)

**O que NÃO pertence aqui:**
- Representação de dados (→ entities)
- Blocos visuais compostos sem ação específica (→ widgets)

**Critério:** se remover esta feature, o usuário perde a capacidade de *fazer* algo específico.

**Exemplo de estrutura:**
```
features/
├── add-to-cart/
│   ├── ui/
│   │   └── AddToCartButton.tsx
│   ├── model/
│   │   ├── cart.store.ts
│   │   └── cart.types.ts
│   ├── api/
│   │   └── cart.api.ts
│   └── index.ts              ← Exporta AddToCartButton, useCart, cartStore
├── authenticate/
│   ├── ui/
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   ├── model/
│   │   ├── auth.store.ts
│   │   └── auth.selectors.ts
│   ├── api/
│   │   └── auth.api.ts
│   ├── lib/
│   │   └── token.helpers.ts
│   └── index.ts
└── filter-products/
    ├── ui/
    │   └── FilterPanel.tsx
    ├── model/
    │   └── filters.store.ts
    └── index.ts
```

**Pode importar de:** entities, shared  
**Não pode importar de:** app, pages, widgets, outras features

---

## entities

**O que pertence aqui:**
- Conceitos centrais do domínio de negócio (User, Product, Order, Article)
- Modelos de dados, tipos TypeScript e esquemas de validação
- UI básica para representar o conceito (ProductCard sem ações, UserAvatar)
- Queries de leitura de dados (sem mutações — essas ficam em features)
- Seletores e derivações de estado

**Nomenclatura:** sempre substantivos no singular (`user`, `product`, `order`)

**O que NÃO pertence aqui:**
- Ações do usuário (→ features)
- Chamadas de API de mutação (POST/PUT/DELETE → features)

**Critério:** uma entity representa *o que existe* no domínio; uma feature representa *o que o usuário faz*.

**Cross-reference com `@x`:**
Quando duas entities genuinamente se referenciam (Order precisa do tipo User):
```ts
// entities/user/index.ts — exposição normal
export type { User } from './model/types'

// entities/user/@x/order.ts — exposição controlada para Order
export type { UserId } from './model/types'

// entities/order/model/types.ts
import type { UserId } from 'entities/user/@x/order'  // ✅ Cross-ref explícita
```

**Exemplo de estrutura:**
```
entities/
├── user/
│   ├── ui/
│   │   ├── UserAvatar.tsx
│   │   └── UserBadge.tsx
│   ├── model/
│   │   ├── user.types.ts
│   │   ├── user.store.ts
│   │   └── user.selectors.ts
│   ├── api/
│   │   └── user.api.ts       ← Apenas GET/queries
│   ├── @x/
│   │   └── order.ts          ← Cross-reference pública para entity order
│   └── index.ts
├── product/
│   ├── ui/
│   │   └── ProductInfo.tsx   ← Apenas exibe dados, sem ações
│   ├── model/
│   │   ├── product.types.ts
│   │   └── product.schema.ts
│   ├── api/
│   │   └── product.api.ts
│   └── index.ts
└── order/
    ├── model/
    │   └── order.types.ts
    ├── api/
    │   └── order.api.ts
    └── index.ts
```

**Pode importar de:** shared (e outras entities via `@x`)  
**Não pode importar de:** app, pages, widgets, features

---

## shared

**O que pertence aqui:**
- UI Kit: componentes genéricos sem lógica de negócio (Button, Input, Modal, Table)
- Wrappers de bibliotecas externas (axios instance, query client configurado)
- Utilitários agnósticos (formatDate, cn/clsx helpers, validators genéricos)
- Constantes globais (API_BASE_URL, BREAKPOINTS, COLORS)
- Tipos utilitários TypeScript genéricos
- Hooks utilitários sem lógica de negócio (useDebounce, useLocalStorage)

**O que NÃO pertence aqui:**
- Qualquer código que conheça conceitos de negócio (User, Product)
- Lógica específica de uma feature ou entity

**Critério:** o código de `shared/` pode ser copiado para qualquer outro projeto sem modificação.

**Exemplo de estrutura:**
```
shared/
├── ui/               ← Componentes genéricos (UI Kit)
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Modal/
│   └── index.ts      ← Re-exporta tudo
├── api/              ← Configuração base de HTTP
│   ├── axios.instance.ts
│   └── index.ts
├── lib/              ← Utilitários puros
│   ├── format.ts
│   ├── cn.ts
│   └── index.ts
├── config/           ← Variáveis de ambiente e constantes globais
│   ├── env.ts
│   └── index.ts
└── types/            ← Tipos utilitários genéricos
    └── index.ts
```

**Pode importar de:** nada do projeto (apenas node_modules)  
**Não pode importar de:** nenhuma camada

---

## Regras de Importação

### Matriz de Dependências Permitidas

| Camada | Pode importar de |
|--------|-----------------|
| app | pages, widgets, features, entities, shared |
| pages | widgets, features, entities, shared |
| widgets | features, entities, shared |
| features | entities, shared |
| entities | shared (+ entities via `@x`) |
| shared | — (apenas node_modules) |

### Exemplos Práticos

**✅ Correto:**
```ts
// pages/checkout/ui/CheckoutPage.tsx
import { OrderSummary } from 'widgets/order-summary'         // widget abaixo
import { PaymentForm } from 'features/process-payment'       // feature abaixo
import { useCurrentUser } from 'entities/user'               // entity abaixo
import { Button } from 'shared/ui'                           // shared abaixo
```

**❌ Errado — import horizontal:**
```ts
// features/add-to-cart/model/cart.store.ts
import { authStore } from 'features/authenticate'  // ❌ mesma camada!
```

**✅ Correto — dado compartilhado sobe via props:**
```tsx
// widgets/product-card/ui/ProductCard.tsx — recebe userId por prop
import { AddToCartButton } from 'features/add-to-cart'
import { useCurrentUser } from 'entities/user'

export const ProductCard = ({ product }) => {
  const { user } = useCurrentUser()                    // entity
  return <AddToCartButton productId={product.id} userId={user.id} />
}
```

**❌ Errado — deep import:**
```ts
import { authStore } from 'features/authenticate/model/auth.store'  // ❌
```

**✅ Correto — via index.ts público:**
```ts
import { authStore } from 'features/authenticate'  // ✅
```

---

## Exemplos de Estrutura Real

### Projeto E-commerce

```
src/
├── app/
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── StoreProvider.tsx
│   │   └── index.ts
│   ├── router/
│   │   ├── routes.tsx
│   │   └── index.ts
│   └── styles/
│       └── globals.css
│
├── pages/
│   ├── home/
│   ├── catalog/
│   ├── product-detail/
│   └── checkout/
│
├── widgets/
│   ├── header/
│   ├── product-card/
│   ├── cart-drawer/
│   └── footer/
│
├── features/
│   ├── add-to-cart/
│   ├── authenticate/
│   ├── filter-products/
│   ├── search-products/
│   ├── apply-coupon/
│   └── process-payment/
│
├── entities/
│   ├── product/
│   ├── user/
│   ├── cart/
│   └── order/
│
└── shared/
    ├── ui/
    ├── api/
    ├── lib/
    └── config/
```

### Projeto de Leitura de Manga (referência)

```
src/
├── app/
│   └── (providers, router, styles globais)
│
├── pages/
│   ├── reader/         ← Página do leitor de capítulos
│   ├── manga-detail/   ← Página de detalhes do manga
│   ├── catalog/        ← Listagem e busca
│   └── profile/        ← Perfil do usuário
│
├── widgets/
│   ├── reader-toolbar/     ← Controles do leitor (modo, página, zoom)
│   ├── chapter-list/       ← Lista de capítulos com progresso
│   └── manga-header/       ← Capa, título, metadados do manga
│
├── features/
│   ├── navigate-chapters/  ← Avançar/voltar capítulo
│   ├── bookmark-manga/     ← Adicionar/remover favorito
│   ├── track-progress/     ← Salvar última página lida
│   ├── rate-manga/         ← Dar nota/review
│   └── search-manga/       ← Busca por título/gênero
│
├── entities/
│   ├── manga/              ← Modelo, tipos, UI básica de card
│   ├── chapter/            ← Modelo de capítulo, página
│   └── user/               ← Perfil, preferências de leitura
│
└── shared/
    ├── ui/                 ← Button, Icon, Skeleton, Modal
    ├── api/                ← axios instance configurado
    └── lib/                ← formatDate, cn, storage helpers
```
