# Stars

Indicador de rating de 0 a 5 estrelas. Suporta display-only (Fase 1) e interativo (Fase 2).

## Props

```ts
export interface StarsProps {
  /** Valor 0–5 (aceita decimais; arredonda visualmente) */
  value: number;
  /** Tamanho das estrelas em px */
  size?: 12 | 14 | 16 | 18 | 20 | 24;
  /** Modo interativo (rating input) */
  interactive?: boolean;
  /** Callback quando interactive=true */
  onChange?: (value: number) => void;
  /** ARIA label do componente como um todo */
  label?: string;
}
```

## Anatomia

- 5 SVGs `<polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />`
- Preenchidas: `fill="var(--mr-accent)"`
- Vazias: `fill="var(--mr-gray-700)"`
- Gap entre estrelas: 2px

## Estados (interactive)

- default: estrelas em `gray-700`
- hover: preview do valor que seria selecionado (até a estrela atual)
- focus: outline accent na estrela focada
- selected: estrelas selecionadas em `accent`

## Exemplo (display)

```tsx
export const Stars = ({ value, size = 14, label }: StarsProps) => {
  const full = Math.round(value);
  return (
    <span role="img" aria-label={label ?? `${value} de 5 estrelas`} className="inline-flex gap-0.5 text-mr-accent">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= full ? 'currentColor' : 'var(--mr-gray-700)'}>
          <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
        </svg>
      ))}
    </span>
  );
};
```

## Exemplo (interactive)

```tsx
import { useState } from 'react';

export const StarsInput = ({ value, onChange, size = 18, label = 'Avalie de 1 a 5' }: StarsProps) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="inline-flex gap-1" aria-label={label}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(value === i ? 0 : i)}
          aria-pressed={value >= i}
          aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          className="text-mr-gray-700 hover:text-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent"
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={i <= shown ? 'var(--mr-accent)' : 'currentColor'}>
            <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
          </svg>
        </button>
      ))}
    </fieldset>
  );
};
```

## Acessibilidade

- Display: `role="img"` + `aria-label` com o valor
- Interactive: `<fieldset>` com `aria-label`, cada estrela é `<button>` com `aria-pressed` e label individual
- Suporta teclado: Tab navega entre estrelas, Enter/Space seleciona

## Dependências

Nenhuma.
