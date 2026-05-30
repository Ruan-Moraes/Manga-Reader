# Kbd

Indicador de tecla / atalho de teclado. Inline em texto ou em chips.

## Anatomia

- `inline-flex` + `align-items: center`
- Font: monoespaçada (Fira Code)
- Padding: `2px 8px`
- Background: `mr-primary` (mais escura que body)
- Border: 1px tertiary, **border-bottom: 2px** (efeito de tecla física)
- Color: `mr-accent`
- Radius: 2px

## Props

```ts
import type { HTMLAttributes, ReactNode } from 'react';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Tamanho. Padrão: 'md' */
  size?: 'sm' | 'md';
}
```

## Exemplo

```tsx
import type { KbdProps } from './Kbd.types';

export const Kbd = ({ children, size = 'md', className, ...rest }: KbdProps) => (
  <kbd
    className={`inline-flex items-center rounded-mr-xs border border-mr-tertiary border-b-2 bg-mr-primary px-2 font-mr-mono font-mr-extrabold text-mr-accent ${size === 'sm' ? 'text-[10px] py-0' : 'text-mr-tiny py-0.5'} ${className ?? ''}`}
    {...rest}
  >
    {children}
  </kbd>
);
```

## Composições típicas

- `<Kbd>⌘</Kbd> <Kbd>K</Kbd>` — abrir command palette / busca
- `<Kbd>S</Kbd>` — atalho settings
- `<Kbd>Esc</Kbd>` — fechar painel
- `<Kbd>→</Kbd> ou <Kbd>J</Kbd>` — próxima página

## Acessibilidade

- Tag `<kbd>` nativa — leitores de tela leem "kbd"/"keyboard input"
- Para combinações: gap 4px entre `<Kbd>`s, separar por "+" em texto (`<Kbd>⌘</Kbd>+<Kbd>K</Kbd>`)

## Dependências

Nenhuma.
