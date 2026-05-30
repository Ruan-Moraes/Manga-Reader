# SegmentedControl

Grupo de opções mutuamente exclusivas, lado a lado. Versão visual de RadioGroup.

## Props

```ts
import type { LucideIcon } from 'lucide-react';

export interface SegmentItem {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  /** block ocupa 100% da largura, dividido entre items */
  block?: boolean;
}
```

## Anatomia

- Container: `display: flex`, gap 4px
- Cada item: button quadrado-arredondado, padding `0 12px`, altura conforme size
- Ativo: bg `accent`, color `primary`, weight 800
- Inativo: bg transparent, border `tertiary`, color `fg-muted`, hover: border accent

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { SegmentedControlProps } from './SegmentedControl.types';

export const SegmentedControl = ({ items, value, onChange, size = 'md', block }: SegmentedControlProps) => {
  const baseSize = size === 'sm' ? 'h-8 px-2 text-mr-tiny' : 'h-11 px-3 text-mr-small';
  return (
    <div role="radiogroup" className={cn('inline-flex gap-1', block && 'w-full')}>
      {items.map(it => {
        const active = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={it.disabled}
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-mr-xs font-mr-bold transition-all duration-mr-default',
              baseSize,
              block && 'flex-1',
              active
                ? 'bg-mr-accent text-mr-primary font-mr-extrabold'
                : 'border border-mr-tertiary bg-transparent text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
              it.disabled && 'opacity-mr-disabled cursor-not-allowed',
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
};
```

## Acessibilidade

- `role="radiogroup"` no container, `role="radio"` em cada
- `aria-checked` na ativa
- Setas (←/→) navegam, Space/Enter seleciona

## Dependências

- `cn`
- `lucide-react` (no consumer)
