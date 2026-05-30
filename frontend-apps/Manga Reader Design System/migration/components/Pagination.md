# Pagination

Paginação numérica com prev/next e ellipsis. Para listas longas (catálogo, fórum, resultados).

## Props

```ts
export interface PaginationProps {
  /** Página atual, 1-indexed */
  page: number;
  /** Total de páginas */
  total: number;
  onChange: (page: number) => void;
  /** Quantidade de páginas mostradas ao redor da atual. Padrão: 1 */
  siblings?: number;
  /** Esconder labels de prev/next no mobile. Padrão: true */
  compactMobile?: boolean;
}
```

## Comportamento

- Sempre mostra: primeira página, última página, página atual + `siblings` vizinhos
- Gaps representados por `…`
- Botões prev/next: `<Button variant="ghost" size="sm">` com chevron
- Página atual: `variant="primary"` (accent)
- Páginas adjacentes: `variant="ghost"`

## Lógica de range

```ts
function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function paginationRange(page: number, total: number, siblings = 1): Array<number | 'gap'> {
  const totalNumbers = siblings * 2 + 5; // first + last + current + 2 siblings + 2 gaps
  if (total <= totalNumbers) return range(1, total);

  const leftSibling = Math.max(page - siblings, 1);
  const rightSibling = Math.min(page + siblings, total);
  const showLeftGap = leftSibling > 2;
  const showRightGap = rightSibling < total - 1;

  if (!showLeftGap && showRightGap) {
    return [...range(1, 3 + siblings * 2), 'gap', total];
  }
  if (showLeftGap && !showRightGap) {
    return [1, 'gap', ...range(total - 2 - siblings * 2, total)];
  }
  return [1, 'gap', ...range(leftSibling, rightSibling), 'gap', total];
}
```

## Exemplo

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { paginationRange } from './pagination-utils';
import type { PaginationProps } from './Pagination.types';

export const Pagination = ({ page, total, onChange, siblings = 1 }: PaginationProps) => {
  const items = paginationRange(page, total, siblings);
  return (
    <nav role="navigation" aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1">
      <Button variant="ghost" size="sm" icon={ChevronLeft} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">Anterior</Button>
      {items.map((it, i) =>
        it === 'gap' ? (
          <span key={`gap-${i}`} className="px-2 text-mr-fg-subtle" aria-hidden>…</span>
        ) : (
          <Button
            key={it}
            variant={it === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onChange(it)}
            aria-current={it === page ? 'page' : undefined}
            aria-label={`Página ${it}`}
          >
            {it}
          </Button>
        ),
      )}
      <Button variant="ghost" size="sm" iconRight={ChevronRight} disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Próxima página">Próxima</Button>
    </nav>
  );
};
```

## Acessibilidade

- `<nav role="navigation" aria-label="Paginação">`
- `aria-current="page"` na ativa
- Cada botão com `aria-label` descritivo (porque o número sozinho não é claro fora de contexto)

## Dependências

- `lucide-react`
- `<Button>`
