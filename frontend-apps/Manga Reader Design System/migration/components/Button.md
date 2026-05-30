# Button

Componente base para ações primárias, secundárias e destrutivas. **Componente mais
visível do produto** — a sombra offset accent é assinatura visual.

## Variantes

| Variant | Uso | Estilo base |
|---|---|---|
| `primary` | CTA principal de um fluxo (1 por tela) | fundo `accent` sólido + texto `primary` |
| `raised` | Ação secundária com peso visual | transparente + border + sombra offset accent |
| `ghost` | Ação terciária / cancelar | surface + border `tertiary` |

## Props (TypeScript estrito)

```ts
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'raised' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual. Padrão: 'raised' */
  variant?: ButtonVariant;
  /** Tamanho. Padrão: 'md' */
  size?: ButtonSize;
  /** Ícone à esquerda */
  icon?: LucideIcon;
  /** Ícone à direita */
  iconRight?: LucideIcon;
  /** Variante destrutiva (apenas em ghost). Aplica cor danger */
  danger?: boolean;
  /** Ocupa 100% da largura do container */
  block?: boolean;
  /** Estado de loading — mostra spinner e desabilita */
  loading?: boolean;
  children?: ReactNode;
}
```

## Tamanhos

| Size | Altura | Padding | Fonte |
|---|---|---|---|
| `sm` | 32px | `0 12px` | `mr-small` (12px) |
| `md` | 44px | `0 16px` | `mr-body` (14px) |
| `lg` | 52px | `0 20px` | `mr-h4` (16px) |

**Importante:** altura mínima sempre ≥44px no mobile pra hit target. `sm` só em densidades altas (toolbars, chips secundários).

## Estados visuais

| Estado | `primary` | `raised` | `ghost` |
|---|---|---|---|
| default | fundo accent | transparent + shadow elevated | surface + border tertiary |
| hover | opacity 0.85 | shadow zera + outline tertiary + weight 800 | bg accent-25 |
| focus-visible | outline 2px accent offset 2 | idem | idem |
| active | scale 0.98 | scale 0.98 + bg accent-50 | scale 0.98 + bg accent-50 |
| disabled | opacity 0.4 + cursor not-allowed | idem | idem |
| loading | spinner Lucide + texto presente + pointer-events none | idem | idem |

## Anatomia

```
<button>
  ├── icon (esquerda, opcional)
  ├── children (label)
  ├── icon (direita, opcional)
  └── spinner (se loading)
```

Gap interno: 8px (`mr-space-sm`).

## Acessibilidade

- Roles: `button` nativo (não usar `<div role="button">`)
- Focus visível obrigatório via `:focus-visible` (não `:focus` puro — evita ring em click)
- `disabled` true → `aria-disabled` true, removido do tab order
- `loading` → `aria-busy="true"` + label não muda (o spinner é decorativo)
- Texto do botão sempre em sentence case ("Salvar alterações"), nunca uppercase

## Exemplo de uso

```tsx
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ButtonProps } from './Button.types';

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-mr-accent text-mr-primary border border-mr-accent ' +
    'hover:opacity-mr-hover active:scale-[0.98]',
  raised:
    'bg-transparent text-mr-fg border border-mr-tertiary ' +
    'shadow-mr-elevated ' +
    'hover:shadow-none hover:outline hover:outline-1 hover:outline-mr-tertiary hover:font-mr-extrabold ' +
    'active:scale-[0.98]',
  ghost:
    'bg-mr-surface text-mr-fg border border-mr-tertiary ' +
    'hover:bg-mr-accent-25 active:bg-mr-accent-50 active:scale-[0.98]',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-mr-small gap-mr-xs',
  md: 'h-11 px-4 text-mr-body gap-mr-sm',
  lg: 'h-13 px-5 text-mr-h4 gap-mr-sm',
};

/**
 * Botão padrão do Manga Reader. Três variantes; raised é o default.
 * Sempre acompanha `letter-spacing` global via body.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'raised', size = 'md', icon: Icon, iconRight: IconRight,
    danger, block, loading, disabled, children, className, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-mr-xs font-mr-bold',
        'transition-all duration-mr-default ease-mr',
        'disabled:opacity-mr-disabled disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        danger && variant === 'ghost' && 'text-mr-danger border-mr-danger',
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
      {!loading && IconRight && <IconRight className="size-4" />}
    </button>
  );
});
```

## Dependências

- `lucide-react` (ícones + spinner)
- `cn` helper (clsx/twMerge) em `@/lib/cn`

## Testes mínimos (Vitest + RTL)

- Renderiza com cada variant
- Click dispara handler
- `disabled` bloqueia click
- `loading` mostra spinner e bloqueia click
- A11y: tem `aria-busy` quando loading

## Notas de migração

Se o codebase legado tem botões inline com `class="btn-primary"`, criar adapter:

```tsx
// adapters/Button.legacy.tsx — remover ao fim da Fase 1
export const LegacyButton = (props: { primary?: boolean; cancel?: boolean; children: ReactNode; onClick?: () => void }) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('LegacyButton: migrar para <Button variant="..." />');
  }
  return <Button variant={props.primary ? 'primary' : props.cancel ? 'ghost' : 'raised'} onClick={props.onClick}>{props.children}</Button>;
};
```
