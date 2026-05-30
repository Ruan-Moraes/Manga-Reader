# Radio

Radio group nativo com `accent-color`. Igual ao Checkbox, sem custom widget.

## Props

```ts
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  hint?: string;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string; hint?: string; disabled?: boolean }>;
  /** Layout. Padrão: 'vertical' */
  layout?: 'vertical' | 'horizontal';
  /** Legend acessível */
  legend?: string;
}
```

## Exemplo (RadioGroup)

```tsx
import { useId } from 'react';
import type { RadioGroupProps } from './Radio.types';

export const RadioGroup = ({ name, value, onChange, options, layout = 'vertical', legend }: RadioGroupProps) => {
  const baseId = useId();
  return (
    <fieldset className={layout === 'vertical' ? 'flex flex-col gap-2' : 'flex gap-4'}>
      {legend && <legend className="mr-label mb-1">{legend}</legend>}
      {options.map(o => {
        const id = `${baseId}-${o.value}`;
        return (
          <label key={o.value} htmlFor={id} className={`flex cursor-pointer items-start gap-2 text-mr-body ${o.disabled ? 'opacity-mr-disabled cursor-not-allowed' : ''}`}>
            <input
              id={id}
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange?.(o.value)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer"
              style={{ accentColor: 'var(--mr-accent)' }}
            />
            <span className="flex flex-col">
              <span className="text-mr-fg">{o.label}</span>
              {o.hint && <span className="text-mr-tiny text-mr-fg-subtle">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};
```

## Acessibilidade

- `<fieldset>` + `<legend>` agrupam semanticamente
- Setas (↑↓) navegam entre rádios mesmo (nativo)
- Tab move entre groups (não dentro)

## Dependências

Nenhuma.
