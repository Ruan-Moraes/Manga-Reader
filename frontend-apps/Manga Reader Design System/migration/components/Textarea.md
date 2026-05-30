# Textarea

Campo multi-line. Reaproveita o styling de `Input`.

## Props

```ts
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
  /** Auto-resize vertical conforme conteúdo */
  autoResize?: boolean;
}
```

## Defaults

- `rows`: 4
- `resize: vertical` no CSS
- `min-height`: 96px
- padding: 12px (vertical e horizontal)

## Estados

Idênticos ao `Input` (default, hover, focus, error, disabled, readOnly).

## Exemplo

```tsx
import { forwardRef, useId, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { TextareaProps } from './Textarea.types';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, hint, disabled, autoResize, className, id, onChange, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  const innerRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize opcional
  useEffect(() => {
    if (!autoResize) return;
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [autoResize, rest.value]);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }}
        id={fieldId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        onChange={onChange}
        className={cn(
          'min-h-24 w-full rounded-mr-xs border bg-mr-primary px-3 py-3 text-mr-body leading-relaxed resize-y transition-colors duration-mr-default',
          'placeholder:text-mr-tertiary outline-none',
          'hover:border-mr-accent-50 focus:border-mr-accent',
          error ? 'border-mr-danger' : 'border-mr-tertiary',
          disabled && 'opacity-mr-disabled',
          className,
        )}
        {...rest}
      />
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

Idênticas ao Input — `aria-invalid`, `aria-describedby`, `<Label>` externa.

## Dependências

- `cn`
