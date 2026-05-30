# Card

Container de superfície. Base de quase tudo (manga card, comment, news, group, event).
**Sem sombra em repouso** — destaque vem da borda ou de hover.

## Props

```ts
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'flat' | 'elevated';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Padding interno. Padrão: 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Marca como interativo — adiciona hover state */
  interactive?: boolean;
  children: ReactNode;
}
```

## Variantes

| variant | Background | Border | Shadow | Uso |
|---|---|---|---|---|
| `default` | `mr-surface` | `mr-border` 1px | nenhuma | maior parte dos cards |
| `flat` | `mr-surface` | `mr-border` 1px | nenhuma + radius xs (2px) | denso, listas |
| `elevated` | `mr-surface` | `mr-border` 1px | `mr-shadow-elevated` | hero, destaque pontual |

## Padding

| padding | Valor |
|---|---|
| `none` | 0 |
| `sm` | 12px |
| `md` | 16px (default) |
| `lg` | 24px |

## Estado hover (interactive)

- `border-color: rgba(221,218,42,0.5)`
- `transform: translateY(-2px)` (sutil)
- `box-shadow: mr-shadow-elevated`

## Exemplo

```tsx
import type { CardProps } from './Card.types';
import { cn } from '@/lib/cn';

const variantClass: Record<CardVariant, string> = {
  default:  'rounded-mr-md bg-mr-surface border border-mr-border',
  flat:     'rounded-mr-xs bg-mr-surface border border-mr-border',
  elevated: 'rounded-mr-md bg-mr-surface border border-mr-border shadow-mr-elevated',
};

const paddingClass = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

export const Card = ({ variant = 'default', padding = 'md', interactive, className, children, ...rest }: CardProps) => (
  <div
    className={cn(
      variantClass[variant],
      paddingClass[padding],
      interactive && 'transition-all duration-mr-default cursor-pointer hover:border-mr-accent-50 hover:shadow-mr-elevated hover:-translate-y-0.5',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);
```

## Acessibilidade

- Card decorativo: `<div>` puro
- Card clicável: usar `<button>` ou `<a>` direto em vez de Card+onClick (evita problemas de teclado/leitores de tela)

## Dependências

- `cn`
