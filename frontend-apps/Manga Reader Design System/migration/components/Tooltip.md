# Tooltip

Texto informativo em hover/focus. CSS-only quando possível, JS-controlled quando precisar de portal.

## Props

```ts
import type { ReactNode } from 'react';

export interface TooltipProps {
  /** Conteúdo do tooltip */
  content: string;
  /** Elemento âncora */
  children: ReactNode;
  /** Lado de aparição. Padrão: 'top' */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay em ms. Padrão: 300 */
  delay?: number;
  /** Em mobile, mostra em long-press */
  enableOnTouch?: boolean;
}
```

## Anatomia

- Box: `mr-gray-900` bg, border 1px `mr-border`, radius 4px, padding `6px 10px`
- Text: 11px, weight 600, `mr-fg-muted`
- Position: absolute, z-mr-tooltip
- Animation: `mr-fade-in` 200ms

## Comportamento

- Aparece após `delay` ms de hover/focus
- Esconde imediatamente em mouseleave/blur
- Esc esconde
- Multiple tooltips simultâneos: permitido (não há gerenciador global de "only 1")

## Quando usar CSS-only

Se o tooltip pode viver dentro do parent (sem overflow:hidden em ancestral), preferir CSS-only — sem JS, mais leve. Para tooltips em ambientes com overflow:hidden ou clipping (tables, modal), usar Portal.

## Exemplo (CSS-only)

```tsx
import type { TooltipProps } from './Tooltip.types';

const sideClass = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip = ({ content, children, side = 'top', delay = 300 }: TooltipProps) => (
  <span className="group relative inline-flex">
    {children}
    <span
      role="tooltip"
      style={{ transitionDelay: `${delay}ms` }}
      className={`pointer-events-none absolute z-mr-tooltip whitespace-nowrap rounded-mr-sm border border-mr-border bg-mr-gray-900 px-2.5 py-1 text-mr-tiny font-mr-semibold text-mr-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${sideClass[side]}`}
    >
      {content}
    </span>
  </span>
);
```

## Acessibilidade

- `role="tooltip"` no container do conteúdo
- O âncora deve ter `aria-describedby` apontando pro tooltip (omitido no exemplo CSS-only por simplicidade — adicionar via id quando crítico)
- Conteúdo do tooltip nunca deve ser a única forma de comunicar informação importante

## Dependências

Nenhuma. Para tooltips em portal (Fase 2.5), considerar Radix Tooltip.
