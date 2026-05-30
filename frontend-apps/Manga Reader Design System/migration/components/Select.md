# Select

Dropdown nativo estilizado. **Fase 1 = native only**. Custom dropdown (com search, etc.) fica pra Fase 2 via `DropdownMenu`.

## Props

```ts
import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}
```

## Estados

Idênticos ao Input. Adicionalmente:
- chevron à direita (CSS `background-image` ou Lucide overlay)
- `appearance: none` no `<select>`

## Exemplo

```tsx
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SelectProps } from './Select.types';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, error, hint, disabled, className, ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'relative flex h-11 items-center rounded-mr-xs border bg-mr-primary transition-colors duration-mr-default',
          'has-[:hover]:border-mr-accent-50 has-[:focus]:border-mr-accent',
          error ? 'border-mr-danger' : 'border-mr-tertiary',
          disabled && 'opacity-mr-disabled',
          className,
        )}
      >
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          className="size-full appearance-none bg-transparent px-3 pr-9 text-mr-body text-mr-fg outline-none"
          {...rest}
        >
          {placeholder && <option value="" disabled hidden>{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 size-4 text-mr-tertiary" />
      </div>
      {(error || hint) && (
        <p className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
```

## Acessibilidade

- Nativo já é acessível por padrão
- Em iOS, o `<select>` abre o picker nativo — não tentar substituir

## Dependências

- `lucide-react` (ChevronDown)
- `cn`
