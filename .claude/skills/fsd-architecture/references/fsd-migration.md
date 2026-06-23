# FSD Migration — Protocolo de Resolução de Dívida Técnica

## Princípio Central

Nunca migre tudo de uma vez. A ordem importa porque as camadas superiores dependem das inferiores — resolver `shared` antes de `entities` garante que quando você chegar em `features`, as peças de baixo já estão corretas.

**Ordem obrigatória de resolução:**
```
1. shared
2. entities
3. features
4. widgets
5. pages
6. app
```

> Por que de baixo para cima? Porque cada camada depende das abaixo. Corrigir `features` com `entities` ainda incorretas vai gerar retrabalho.

---

## Fase 1 — Auditoria

Antes de mover qualquer arquivo, faça um mapa do estado atual.

### Checklist de Auditoria por Camada

Execute esta verificação para cada camada do projeto:

#### shared/
- [ ] Existe algum componente que importa de `entities/` ou `features/`?
- [ ] Existe lógica de negócio específica de um domínio?
- [ ] Existe algum tipo TypeScript que referencia modelos de domínio?
- [ ] Componentes de UI têm dependências de estado global?

**Problemas comuns encontrados:**
```
shared/api/user.api.ts         ← ❌ lógica de domínio em shared
shared/hooks/useCartTotal.ts   ← ❌ hook de negócio em shared
shared/types/Product.ts        ← ❌ tipo de domínio em shared
```

#### entities/
- [ ] Alguma entity importa de `features/` ou `widgets/`?
- [ ] Alguma entity importa de outra entity sem usar `@x`?
- [ ] Alguma entity tem lógica de mutação (POST/PUT/DELETE)?
- [ ] Alguma entity tem componentes com ações de negócio embutidas?

**Problemas comuns encontrados:**
```
entities/product/ui/ProductCard.tsx  ← tem botão "Adicionar ao Carrinho"
entities/user/api/user.api.ts        ← tem chamada de login/logout
```

#### features/
- [ ] Alguma feature importa de outra feature (import horizontal)?
- [ ] Alguma feature importa de `widgets/` ou `pages/`?
- [ ] Alguma feature tem representação de dados que pertence a uma entity?
- [ ] Existem deep imports sendo feitos em features?

**Problemas comuns encontrados:**
```
features/checkout/model/store.ts    ← importa de features/cart diretamente
features/auth/ui/UserProfile.tsx    ← componente que pertence em entities/user
```

#### widgets/
- [ ] Algum widget importa de `pages/`?
- [ ] Algum widget importa de outro widget?
- [ ] Algum widget tem lógica de negócio que deveria estar em uma feature?
- [ ] Algum widget está sendo usado em apenas uma page (candidato a mover para pages/)?

#### pages/
- [ ] Alguma page importa de outra page?
- [ ] Alguma page tem componentes visuais complexos inline (>50 linhas de JSX)?
- [ ] Alguma page tem lógica de negócio além de orquestração?
- [ ] Alguma page tem chamadas de API diretas sem passar por features/entities?

#### app/
- [ ] Providers importam lógica de negócio diretamente?
- [ ] Existe inicialização de store com dados hardcoded que deveriam vir de API?
- [ ] O roteamento referencia componentes de camadas erradas?

---

## Fase 2 — Priorização

Após a auditoria, classifique os problemas por impacto:

### Alta Prioridade (resolver primeiro)
- Imports que violam o fluxo top-down (camada superior sendo importada por inferior)
- Deep imports que expõem internals de slices
- Lógica de negócio em `shared/`

### Média Prioridade
- Imports horizontais entre features
- Entities com lógica de mutação
- God components em pages

### Baixa Prioridade
- Nomenclatura incorreta de slices
- Segmentos ausentes ou mal organizados
- Falta de `@x` em cross-references entre entities

---

## Fase 3 — Execução por Camada

### Migrando shared/

**Passo 1:** Identifique o que não é agnóstico ao negócio.

```bash
# Buscar imports de domínio em shared
grep -r "from 'entities\|from 'features" src/shared/
```

**Passo 2:** Mova para a camada correta.

```
shared/api/user.api.ts → entities/user/api/user.api.ts
shared/hooks/useCartTotal.ts → features/add-to-cart/lib/useCartTotal.ts
shared/types/Product.ts → entities/product/model/product.types.ts
```

**Passo 3:** Atualize todos os imports referenciando o arquivo movido.

**Passo 4:** Garanta que `shared/` só exporta via `index.ts` raiz.

---

### Migrando entities/

**Passo 1:** Separe representação de ação.

Se `entities/product/ui/ProductCard.tsx` tem um botão "Adicionar ao Carrinho":
```tsx
// ❌ Antes — entity com ação embutida
export const ProductCard = ({ product }) => (
  <div>
    <img src={product.image} />
    <h2>{product.name}</h2>
    <button onClick={() => addToCart(product)}>Adicionar</button>  {/* ← pertence em feature */}
  </div>
)

// ✅ Depois — entity apenas exibe, recebe slot de ação
export const ProductInfo = ({ product, actions }) => (
  <div>
    <img src={product.image} />
    <h2>{product.name}</h2>
    {actions}  {/* ← injetado por quem compõe: widget ou page */}
  </div>
)
```

**Passo 2:** Mova mutações para features.
```
entities/user/api/user.api.ts  (login, logout) → features/authenticate/api/auth.api.ts
entities/product/api/ (apenas GET queries)     → permanece em entities
```

**Passo 3:** Configure cross-references com `@x` onde necessário.

---

### Migrando features/

**Passo 1:** Quebre imports horizontais.

```ts
// ❌ features/checkout importando de features/cart
import { cartItems } from 'features/cart'

// ✅ Alternativa A: o dado sobe via props/context do widget/page
// ✅ Alternativa B: o estado compartilhado sobe para entities/cart
```

**Passo 2:** Garanta que cada feature tem um `index.ts` com API mínima.

```ts
// features/authenticate/index.ts
export { LoginForm } from './ui/LoginForm'
export { LogoutButton } from './ui/LogoutButton'
export { authStore } from './model/auth.store'
export { useAuth } from './model/auth.selectors'
// NÃO exportar internals: token.helpers, auth.config
```

**Passo 3:** Elimine deep imports de outros slices que apontam para esta feature.

```bash
grep -r "from 'features/authenticate/" src/ --include="*.ts" --include="*.tsx"
# Todos os resultados fora de features/authenticate/ são violações
```

---

### Migrando widgets/

**Passo 1:** Extraia god components de pages.

Se `pages/home/ui/HomePage.tsx` tem um Header de 150 linhas inline:
```
pages/home/ui/HomePage.tsx (Header inline) → widgets/header/ui/Header.tsx
```

**Passo 2:** Resolva imports horizontais entre widgets.

Se `widgets/cart-drawer` importa de `widgets/header`:
```
# Geralmente o dado compartilhado deve subir para pages/
# ou ser fornecido via props
```

**Passo 3:** Verifique se o widget não é muito específico de uma page (considere mover para pages/).

---

### Migrando pages/

**Passo 1:** Torne as pages composições puras.

```tsx
// ✅ Page ideal: orquestra, não implementa
export const CheckoutPage = () => {
  const { user } = useCurrentUser()          // entity

  return (
    <PageLayout>
      <OrderSummary userId={user.id} />      {/* widget */}
      <PaymentForm onSuccess={handleSuccess} />{/* feature */}
    </PageLayout>
  )
}
```

**Passo 2:** Mova qualquer componente reusável para widgets.

**Passo 3:** Mova chamadas de API diretas para features ou entities.

---

### Migrando app/

**Passo 1:** Garanta que providers não contêm lógica de negócio.

```tsx
// ❌ Provider com lógica de inicialização inline
export const AppProvider = ({ children }) => {
  useEffect(() => {
    fetch('/api/user/me').then(...)  // ← pertence em entities/user
  }, [])
}

// ✅ Provider delega para hooks de entities
export const AppProvider = ({ children }) => {
  useInitializeUser()  // hook de entities/user
  return <>{children}</>
}
```

**Passo 2:** Garanta que o roteamento usa componentes de pages/ (não de widgets ou features diretamente).

---

## Fase 4 — Validação

Após cada camada migrada, rode:

```bash
# Verificar imports proibidos (adapte para sua estrutura)
npx eslint --rule '{"import/no-restricted-paths": "error"}' src/

# Ou com o plugin FSD para ESLint
npx eslint src/ --ext .ts,.tsx
```

### ESLint Config para FSD (referência)

```js
// eslint.config.js
import { defineConfig } from 'eslint-define-config'

export default defineConfig({
  rules: {
    // Proibir imports de camadas superiores
    'import/no-restricted-paths': ['error', {
      zones: [
        // shared não pode importar de camadas acima
        { target: './src/shared', from: './src/entities' },
        { target: './src/shared', from: './src/features' },
        { target: './src/shared', from: './src/widgets' },
        { target: './src/shared', from: './src/pages' },
        { target: './src/shared', from: './src/app' },
        // entities não pode importar de features+
        { target: './src/entities', from: './src/features' },
        { target: './src/entities', from: './src/widgets' },
        { target: './src/entities', from: './src/pages' },
        { target: './src/entities', from: './src/app' },
        // features não pode importar de widgets+
        { target: './src/features', from: './src/widgets' },
        { target: './src/features', from: './src/pages' },
        { target: './src/features', from: './src/app' },
        // widgets não pode importar de pages+
        { target: './src/widgets', from: './src/pages' },
        { target: './src/widgets', from: './src/app' },
      ]
    }]
  }
})
```

---

## Guia de Decisão Rápida

Quando em dúvida sobre onde colocar um artefato:

```
É código genérico sem lógica de negócio?
  → shared/

É um conceito do domínio (substantivo)?
  → entities/

É uma ação do usuário (verbo)?
  → features/

É um bloco visual que combina features e entities?
  → widgets/

É uma rota/tela completa?
  → pages/

É inicialização global ou provider?
  → app/
```

### Casos Ambíguos Comuns

**"Meu hook de autenticação: feature ou entity?"**
- Se apenas lê o estado do usuário logado → `entities/user/model/`
- Se faz login/logout/refresh → `features/authenticate/model/`

**"Meu componente UserAvatar: entity ou shared?"**
- Se usa o tipo `User` do domínio → `entities/user/ui/`
- Se é apenas um avatar genérico com src/alt → `shared/ui/Avatar/`

**"Meu filtro de produtos: feature ou widget?"**
- Se é apenas a UI de seleção sem estado → pode ser `shared/ui/`
- Se gerencia o estado de filtros ativos → `features/filter-products/`
- Se combina o estado de filtros com a lista de produtos → `widgets/product-filters/`

**"Tenho um store Zustand/Redux: onde fica?"**
- Estado de UI local de um componente → no próprio componente (`useState`)
- Estado de negócio de uma feature → `features/[name]/model/`
- Estado de dados de um domínio → `entities/[name]/model/`
- Estado global de tema/locale → `app/` ou `shared/config/`
