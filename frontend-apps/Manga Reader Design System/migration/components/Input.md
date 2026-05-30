# Input

Campo de texto single-line. Base de Textarea/Select via composição.

## Props

```ts
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícone à esquerda */
  leadingIcon?: LucideIcon;
  /** Ícone ou conteúdo à direita */
  trailingIcon?: LucideIcon;
  /** Mensagem de erro — borda vira danger */
  error?: string;
  /** Texto auxiliar abaixo */
  hint?: string;
  /** Variante visual. Padrão: 'default' */
  variant?: 'default' | 'plain';
}
```

## Estados

| Estado | Borda | Background |
|---|---|---|
| default | `mr-tertiary` (1px) | `mr-primary` |
| hover | `mr-accent-50` | idem |
| focus | `mr-accent` (sólida) | idem |
| disabled | `mr-tertiary` + opacity 0.4 | idem |
| error | `mr-danger` | idem |
| readOnly | `mr-tertiary` | `mr-gray-900` |

**Sem outline duplicado** — a borda É o focus ring.

## Anatomia

```
Label (acima, opcional via componente Label)
┌──────────────────────────────────────┐
│ [icon]  input...           [icon]     │  h=44px, padding 0 12px
└──────────────────────────────────────┘
hint OU error (abaixo, 11px)
```

## Exemplo

```tsx
import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';
import type { InputProps } from './Input.types';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leadingIcon: Lead, trailingIcon: Trail, error, hint, disabled, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = hint || error ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'relative flex h-11 items-center gap-2 rounded-mr-xs border bg-mr-primary px-3 transition-colors duration-mr-default',
          'has-[:hover]:border-mr-accent-50 has-[:focus]:border-mr-accent',
          error ? 'border-mr-danger' : 'border-mr-tertiary',
          disabled && 'opacity-mr-disabled',
          className,
        )}
      >
        {Lead && <Lead className="size-4 shrink-0 text-mr-tertiary" />}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className="size-full min-w-0 flex-1 bg-transparent text-mr-body outline-none placeholder:text-mr-tertiary"
          {...rest}
        />
        {Trail && <Trail className="size-4 shrink-0 text-mr-tertiary" />}
      </div>
      {(error || hint) && (
        <p id={describedBy} className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
```

## Acessibilidade

- `aria-invalid` quando há `error`
- `aria-describedby` aponta para hint/error
- Label associada externamente via `<Label htmlFor={id}>`
- Mantém suporte completo a autofill nativo

## Dependências

- `cn` helper

## Não esquecer

- `accent-color` nativo só serve pra checkbox/radio — não aplicar em input texto
- Em forms longos, usar `autoComplete` apropriado (email, current-password, etc.)
