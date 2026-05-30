# Label

Label semântica + classe utilitária para os "eyebrows" uppercase do produto.

## Variantes

| Componente | Uso |
|---|---|
| `<Label htmlFor>` | Label de form associada a um campo |
| `.mr-label` (classe utilitária) | Eyebrows e small caps em todo o app |

## Props

```ts
import type { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Marca campo como obrigatório — adiciona asterisco accent */
  required?: boolean;
  children: ReactNode;
}
```

## Estilo (`.mr-label`)

- Font 11px, weight 700
- Uppercase
- `letter-spacing: 0.08em`
- Color: `var(--mr-accent)` (eyebrow) ou `var(--mr-fg-muted)` (label genérico) — escolher por contexto

## Exemplo

```tsx
import type { LabelProps } from './Label.types';

export const Label = ({ children, required, className, ...rest }: LabelProps) => (
  <label className={`mr-label ${className ?? ''}`} {...rest}>
    {children}
    {required && <span aria-hidden className="ml-0.5 text-mr-danger">*</span>}
  </label>
);
```

Classe utilitária — para eyebrows que não estão associados a campos:

```css
.mr-label {
  font: 700 11px/1 var(--mr-font-sans);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mr-fg-muted);
}
```

## Acessibilidade

- `htmlFor` obrigatório quando label se refere a um campo
- Asterisco de required tem `aria-hidden` — comunicar requirement via `aria-required` no campo

## Dependências

Nenhuma.
