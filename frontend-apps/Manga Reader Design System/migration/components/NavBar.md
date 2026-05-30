# NavBar (Header)

Header sticky no topo. **Componente mais visível do produto.** Mobile: hamburger + logo + ícone busca. Desktop: logo + links + busca expandida + ações.

## Anatomia

```
Mobile (<768px)                          Desktop (≥1024px)
─────────────────────────                ────────────────────────────────────
[☰] [Logo]      [🔍] [👤]               [Logo] [Descobrir] [Comunidade] [Atualizações]  [Busca expandida] [🔔] [📚] [Avatar/Entrar]
                                          h=72
h=64
```

## Props

```ts
import type { ReactNode } from 'react';

export interface NavLink {
  key: string;
  label: string;
  /** Dropdown opcional */
  children?: NavLink[];
  onClick?: () => void;
}

export interface NavBarProps {
  /** Links centrais (desktop) */
  links: NavLink[];
  /** Usuário logado (ou null) */
  user?: { name: string; avatar?: string; notificationCount?: number; libraryCount?: number } | null;
  /** Click no logo (geralmente home) */
  onLogoClick?: () => void;
  /** Click no avatar/entrar */
  onAccountClick?: () => void;
  /** Click no botão hamburger (abre SideMenu) */
  onMenuClick: () => void;
  /** Query de busca controlada */
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** Quando search é submetida (Enter ou click no botão) */
  onSearchSubmit?: (v: string) => void;
}
```

## Comportamento

- **Sticky:** `position: sticky; top: 0; z-index: var(--mr-z-header)`
- **Background:** `mr-primary` sólido (não translúcido — evita problemas de contraste)
- **Border-bottom:** 2px `mr-tertiary`
- **Mobile:** busca colapsada como `<IconButton>` que abre overlay full-screen com `SearchField`
- **Desktop:** `SearchField` size `md` inline, flex-1 (ocupa espaço entre links e ações)
- **Dropdown de links:** ao hover/click, expande com `DropdownMenu`
- **Avatar logado:** click abre dropdown (Perfil / Configurações / Sair)
- **Sem logado:** botão "Entrar" variant `primary`

## Wordmark

```tsx
<span className="font-mr-sans font-mr-extrabold italic tracking-mr-logo text-mr-fg">
  Manga <span className="text-mr-accent">Reader</span>
</span>
```

## Acessibilidade

- `<header role="banner">` no topo da página
- `<nav aria-label="Principal">` envolve links
- Hamburger button: `aria-label="Abrir menu"` + `aria-expanded` quando SideMenu está aberto
- Logo: `<a href="/" aria-label="Manga Reader, ir para home">`

## Dependências

- `<IconButton>`, `<Avatar>`, `<Badge>` (contadores), `<SearchField>`, `<DropdownMenu>`, `<Button>` (Entrar)
- `lucide-react` (Menu, Bell, Library, Search)

## Notas críticas

- Background sólido — **nunca** `rgba(22,22,22,.8)` aqui. O conteúdo passa por trás quando o usuário rola, e a transparência cria problemas de contraste com capas coloridas
- Em mobile, ao abrir o search overlay, foco vai automaticamente pro input
- Mantém o mesmo height entre estado logado/deslogado pra evitar layout shift no login
