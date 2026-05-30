# Badge

Indicador pequeno (pill) com fundo translúcido. Sempre uppercase.

## Variantes

| variant | Cor | Uso |
|---|---|---|
| `accent` *(default)* | amarelo | tags, status positivo, nova feature |
| `neutral` | cinza | categorias, metadados |
| `danger` | coral | excluir, alerta, prazo |

## Props

```ts
import type { ReactNode } from 'react';

export type BadgeVariant = 'accent' | 'neutral' | 'danger';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  /** ícone à esquerda (Lucide) */
  icon?: React.ComponentType<{ className?: string }>;
}
```

## Anatomia

- `display: inline-flex` + `align-items: center` + `gap: 4px`
- Padding `2px 8px`, radius `999px` (pill)
- Font 11px, weight 700, uppercase, `tracking-wide` (0.08em)
- Border 1px translúcida da cor

## Exemplo

```tsx
const styleMap: Record<BadgeVariant, string> = {
  accent:  'bg-mr-accent-25 text-mr-accent border-mr-accent-50',
  neutral: 'bg-mr-gray-800 text-mr-fg-muted border-mr-gray-700',
  danger:  'bg-[rgba(255,120,79,0.15)] text-mr-danger border-[rgba(255,120,79,0.4)]',
};

export const Badge = ({ variant = 'accent', icon: Icon, children }: BadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded-mr-full border px-2 py-0.5 text-mr-tiny font-mr-bold uppercase tracking-[0.08em] ${styleMap[variant]}`}>
    {Icon && <Icon className="size-3" />}
    {children}
  </span>
);
```

## Acessibilidade

- Decorativo na maioria dos casos — texto comunica tudo
- Para badges que indicam estado dinâmico (ex.: "novo", "10 não lidos"), usar `aria-live="polite"` no container pai

## Dependências

Nenhuma além de Tailwind.
