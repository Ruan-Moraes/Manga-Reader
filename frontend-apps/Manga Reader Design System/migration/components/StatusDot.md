# StatusDot

Bolinha colorida indicando estado do sistema/recurso. Pulse opcional.

## Props

```ts
export type StatusKind = 'operating' | 'degraded' | 'down' | 'idle';
export type StatusSize = 8 | 10 | 12;

export interface StatusDotProps {
  status: StatusKind;
  size?: StatusSize;
  /** Anima com pulse. Padrão: depends on status — true em 'degraded' */
  pulse?: boolean;
  /** ARIA label */
  label?: string;
}
```

## Cores e comportamento padrão

| status | Cor | Glow | Pulse default |
|---|---|---|---|
| operating | `#ddda2a` (accent) | `rgba(221,218,42,.22)` 3px | false |
| degraded | `#FF784F` (danger) | `rgba(255,120,79,.22)` 3px | **true** |
| down | `#FF4444` | `rgba(255,68,68,.22)` 3px | false |
| idle | `#727273` (tertiary) | none | false |

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { StatusDotProps, StatusKind } from './StatusDot.types';

const colorMap: Record<StatusKind, string> = {
  operating: 'bg-mr-accent  shadow-[0_0_0_3px_rgba(221,218,42,.22)]',
  degraded:  'bg-mr-danger  shadow-[0_0_0_3px_rgba(255,120,79,.22)]',
  down:      'bg-[#FF4444]  shadow-[0_0_0_3px_rgba(255,68,68,.22)]',
  idle:      'bg-mr-tertiary',
};

const labelMap: Record<StatusKind, string> = {
  operating: 'Operando',
  degraded:  'Degradado',
  down:      'Indisponível',
  idle:      'Em espera',
};

export const StatusDot = ({ status, size = 10, pulse, label }: StatusDotProps) => {
  const shouldPulse = pulse ?? status === 'degraded';
  return (
    <span
      role="status"
      aria-label={label ?? labelMap[status]}
      className={cn(
        'inline-block shrink-0 rounded-mr-full',
        colorMap[status],
        shouldPulse && 'animate-mr-pulse',
      )}
      style={{ width: size, height: size }}
    />
  );
};
```

## Acessibilidade

- `role="status"` + `aria-label` descrevendo o estado
- Pulse não deve ser a única indicação — sempre acompanhar com texto adjacente em UI crítica

## Dependências

- `cn`

## Onde aparece no DS

- Footer (status do sistema)
- Help Center (banner + grid)
- Group cards (status do grupo)
- Live indicators de comentários em tempo real
