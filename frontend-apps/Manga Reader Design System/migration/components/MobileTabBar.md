# MobileTabBar

Tab bar fixa no rodapé, **só visível em <768px**. 4 itens canônicos: Home, Buscar,
Biblioteca, Perfil.

## Props

```ts
import type { LucideIcon } from 'lucide-react';

export interface TabBarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  onClick: () => void;
}

export interface MobileTabBarProps {
  items: TabBarItem[];        // recomendado: 4 itens
  activeKey: string;
}
```

## Layout

- `position: fixed; bottom: 0; left: 0; right: 0`
- Height: **72px** (60 + safe-area-inset-bottom)
- `padding-bottom: env(safe-area-inset-bottom)` para iOS notch
- z-index: `mr-z-mobile-tab` (15) — abaixo de drawer/modal/toast
- `border-top: 2px solid var(--mr-tertiary)`
- `background: var(--mr-primary)`
- Visível só em `<md` (768px)

## Item

- 60×60 minimum hit area
- Ícone 24px
- Label 10px abaixo (uppercase, weight 700)
- Ativo: cor `mr-accent`, com border-top 2px accent (do container)
- Inativo: cor `mr-fg-subtle`
- Badge: posicionado top-right do ícone, pill `mr-accent` ou `mr-danger`

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { MobileTabBarProps } from './MobileTabBar.types';

export const MobileTabBar = ({ items, activeKey }: MobileTabBarProps) => (
  <nav
    role="navigation"
    aria-label="Navegação inferior"
    className="fixed inset-x-0 bottom-0 z-mr-mobile-tab flex border-t-2 border-mr-tertiary bg-mr-primary pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    {items.map(it => {
      const active = it.key === activeKey;
      const Icon = it.icon;
      return (
        <button
          key={it.key}
          type="button"
          onClick={it.onClick}
          aria-current={active ? 'page' : undefined}
          aria-label={it.label}
          className={cn(
            'relative flex h-[60px] flex-1 flex-col items-center justify-center gap-1 transition-colors',
            active ? 'text-mr-accent' : 'text-mr-fg-subtle hover:text-mr-fg',
          )}
        >
          <Icon className="size-6" />
          <span className="text-[10px] font-mr-bold uppercase tracking-[0.08em]">{it.label}</span>
          {!!it.badge && (
            <span className="absolute right-3 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-mr-full bg-mr-danger px-1 text-[10px] font-mr-extrabold text-mr-fg">
              {it.badge > 99 ? '99+' : it.badge}
            </span>
          )}
        </button>
      );
    })}
  </nav>
);
```

## Conteúdo padrão (4 itens)

| key | label | icon Lucide |
|---|---|---|
| home | Início | `Home` |
| search | Buscar | `Search` |
| library | Biblioteca | `BookOpen` |
| profile | Perfil | `User` |

## Acessibilidade

- `<nav aria-label="Navegação inferior">`
- `aria-current="page"` no ativo
- Hit target ≥44px (cumprimos com 60×60)

## Notas

- Ajustar `body { padding-bottom: 72px }` em mobile para o conteúdo não ficar atrás da tab bar
- Em telas que usam scroll horizontal (Reader paginado), considerar esconder a tab bar ou mover pra cima do safe-area
