# ProgressBar

Barra de progresso. Variantes: thin (4px) e thick (12px). Usado em scrubber do leitor,
loaders, indicadores de leitura.

## Props

```ts
export interface ProgressBarProps {
  /** Valor 0-100 (porcentagem) */
  value: number;
  /** Indeterminate quando value é undefined */
  indeterminate?: boolean;
  /** Espessura. Padrão: 'thin' */
  thickness?: 'thin' | 'thick';
  /** Animar transição. Padrão: true */
  animated?: boolean;
  /** Tom. Padrão: 'accent' */
  tone?: 'accent' | 'danger';
  /** Texto acessível */
  label?: string;
}
```

## Dimensões

| thickness | Altura | Border-radius |
|---|---|---|
| thin | 4px | full |
| thick | 12px | full |

## Estados

| State | Track | Fill |
|---|---|---|
| default | `mr-gray-700` | `mr-accent` |
| indeterminate | `mr-gray-700` | accent + animação infinite slide |
| danger | `mr-gray-700` | `mr-danger` |

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { ProgressBarProps } from './ProgressBar.types';

export const ProgressBar = ({ value, indeterminate, thickness = 'thin', animated = true, tone = 'accent', label }: ProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, value));
  const height = thickness === 'thick' ? 'h-3' : 'h-1';
  const fillColor = tone === 'danger' ? 'bg-mr-danger' : 'bg-mr-accent';
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('relative w-full overflow-hidden rounded-mr-full bg-mr-gray-700', height)}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-mr-full',
          fillColor,
          animated && 'transition-[width] duration-mr-default ease-mr',
          indeterminate && 'w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite]',
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
};
```

Keyframes a adicionar ao Tailwind config:

```js
keyframes: {
  indeterminate: {
    '0%':   { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(400%)' },
  },
}
```

## Acessibilidade

- `role="progressbar"` + `aria-valuemin/max/now`
- Indeterminate: omitir `aria-valuenow`
- Sempre `aria-label` se não houver label visível adjacente

## Dependências

- `cn`
