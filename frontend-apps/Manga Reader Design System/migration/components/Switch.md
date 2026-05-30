# Switch

Toggle on/off. Track + thumb. Ativo = fundo `accent` + thumb `primary` (preto).

## Props

```ts
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
}
```

## Dimensões

- Track: 36×20px, radius full
- Thumb: 16×16px, branco quando off, primary quando on
- Padding interno: 2px

## Estados

| Estado | Track | Thumb |
|---|---|---|
| off | `mr-gray-700` | `#fff` |
| on | `mr-accent` | `mr-primary` |
| disabled | opacity 0.4 | idem |
| focus-visible | outline accent | idem |

## Exemplo

```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import type { SwitchProps } from './Switch.types';

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, description, disabled, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-mr-xs border border-mr-border-subtle bg-mr-surface p-3 text-left transition-colors duration-mr-default',
        disabled && 'opacity-mr-disabled cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {label && (
        <span className="flex flex-col">
          <span className="text-mr-body font-mr-bold text-mr-fg">{label}</span>
          {description && <span className="text-mr-tiny text-mr-fg-subtle">{description}</span>}
        </span>
      )}
      <span
        className={cn(
          'relative ml-auto h-5 w-9 shrink-0 rounded-mr-full transition-colors duration-mr-default',
          checked ? 'bg-mr-accent' : 'bg-mr-gray-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-mr-full transition-all duration-mr-default',
            checked ? 'left-[18px] bg-mr-primary' : 'left-0.5 bg-white',
          )}
        />
      </span>
    </button>
  );
});
```

## Acessibilidade

- `role="switch"` + `aria-checked` (obrigatório)
- Toggle por `Space` ou `Enter` (nativo do `<button>`)
- Label clicável move foco pro botão se conectado via `aria-labelledby`

## Dependências

- `cn`

## Variações no DS

- Switch standalone (`<Switch>`) — variante isolada
- Switch+label em row (acima) — variante de configurações
- Switch dentro de card maior — só o knob (sem container) via prop futura
