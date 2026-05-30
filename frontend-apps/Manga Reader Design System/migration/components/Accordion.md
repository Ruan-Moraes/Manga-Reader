# Accordion

Item expansível. Usado em FAQ, seções de help e legal.

## Props

```ts
import type { ReactNode } from 'react';

export interface AccordionItemProps {
  /** Trigger visível (pergunta/título) */
  title: ReactNode;
  /** Conteúdo expandido */
  children: ReactNode;
  /** Inicia aberto */
  defaultOpen?: boolean;
  /** Modo controlado */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

## Anatomia

```
<article> (Card flat, border, radius 8)
├── <button> (header)
│   ├── Title (font-mr-bold)
│   └── Icon Plus → X quando aberto (rotação ou troca)
└── <div> Body (display: open ? block : none, com border-top)
```

## Estados

- Fechado: border `mr-border`
- Aberto: border `mr-accent`, ícone rotacionado/trocado
- Hover: bg `accent-25` no botão

## Exemplo (não-controlado)

```tsx
import { useState, useId } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AccordionItemProps } from './Accordion.types';

export const AccordionItem = ({ title, children, defaultOpen = false, open, onOpenChange }: AccordionItemProps) => {
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;
  const id = useId();

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  return (
    <article className={cn('overflow-hidden rounded-mr-md border bg-mr-surface transition-colors duration-mr-default', isOpen ? 'border-mr-accent' : 'border-mr-border')}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`acc-${id}`}
        onClick={toggle}
        className="flex w-full items-center gap-3 p-mr-md text-left text-mr-body font-mr-bold text-mr-fg transition-colors hover:bg-mr-accent-25"
      >
        <span className="flex-1">{title}</span>
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-mr-xs transition-colors', isOpen ? 'bg-mr-accent text-mr-primary' : 'bg-mr-accent-25 text-mr-accent')}>
          {isOpen ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </button>
      <div id={`acc-${id}`} hidden={!isOpen} className="border-t border-mr-border-subtle p-mr-md text-mr-body leading-relaxed text-mr-fg-muted">
        {children}
      </div>
    </article>
  );
};
```

## Acessibilidade

- `aria-expanded` no trigger
- `aria-controls` aponta pro id do conteúdo
- `hidden` (não `display:none`) preserva semântica
- Tab move entre triggers — não dentro do conteúdo fechado

## Dependências

- `lucide-react`
- `cn`
