# Tabs

Navegação entre seções de conteúdo. Underline accent na ativa. Suporta scroll horizontal em mobile.

## Props

```ts
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Variante visual. Padrão: 'underline' */
  variant?: 'underline' | 'pills';
  /** Tamanho. Padrão: 'md' */
  size?: 'sm' | 'md';
}
```

## Variantes

| variant | Default | Active |
|---|---|---|
| `underline` | text fg-muted, padding-bottom border-transparent | text fg, border-bottom 2px accent |
| `pills` | bg transparent, border tertiary | bg accent, text primary |

## Comportamento

- `overflow-x: auto` no container (sem scrollbar visível)
- `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`
- Tab focada via teclado → scroll into view se fora da viewport
- Setas ←/→ navegam entre tabs

## Exemplo

```tsx
import type { TabsProps } from './Tabs.types';
import { cn } from '@/lib/cn';

export const Tabs = ({ items, value, onChange, variant = 'underline', size = 'md' }: TabsProps) => {
  const baseSize = size === 'sm' ? 'h-9 px-3 text-mr-small' : 'h-11 px-4 text-mr-body';
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-mr-border-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map(it => {
        const active = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            aria-disabled={it.disabled || undefined}
            disabled={it.disabled}
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 font-mr-bold transition-colors duration-mr-default',
              baseSize,
              variant === 'underline'
                ? active
                  ? 'border-b-2 border-mr-accent text-mr-fg'
                  : 'border-b-2 border-transparent text-mr-fg-muted hover:text-mr-fg'
                : active
                  ? 'rounded-mr-xs bg-mr-accent text-mr-primary'
                  : 'rounded-mr-xs border border-mr-tertiary text-mr-fg hover:border-mr-accent hover:text-mr-accent',
              it.disabled && 'opacity-mr-disabled cursor-not-allowed',
            )}
          >
            {Icon && <Icon className="size-4" />}
            <span>{it.label}</span>
            {it.badge}
          </button>
        );
      })}
    </div>
  );
};
```

## Acessibilidade

- `role="tablist"` no container, `role="tab"` em cada
- `aria-selected` na ativa
- Tab panels (`<TabPanel>` correspondentes) opcionais — neste DS, geralmente o consumidor renderiza condicionalmente o conteúdo abaixo das tabs

## Dependências

- `cn`
- Tab panels não fazem parte do componente — consumidor decide a estrutura
