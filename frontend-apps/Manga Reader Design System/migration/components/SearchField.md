# SearchField

Campo de busca com ícone Search à esquerda, clear button à direita quando preenchido,
e kbd hint opcional (⌘K). Composição sobre `<Input>`.

## Props

```ts
import type { InputHTMLAttributes } from 'react';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  /** Mostra hint de atalho à direita (ex.: "⌘K") */
  shortcut?: string;
  /** Esconde botão clear. Padrão: false */
  hideClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

## Sizes

| size | Altura | Padding |
|---|---|---|
| sm | 36px | `0 10px` |
| md | 44px (default) | `0 14px` |
| lg | 56px | `0 16px` (hero) |

## Estados

- Empty: ícone search visível, sem clear, kbd hint visível
- Filled: clear button aparece, kbd hint pode permanecer
- Focused: borda accent
- Disabled: opacity 0.4

## Exemplo

```tsx
import { Search, X } from 'lucide-react';
import { IconButton } from './IconButton';
import { Kbd } from './Kbd';
import { cn } from '@/lib/cn';
import type { SearchFieldProps } from './SearchField.types';

const sizeMap = { sm: 'h-9', md: 'h-11', lg: 'h-14' } as const;

export const SearchField = ({ value, onChange, shortcut, hideClear, size = 'md', placeholder, className, ...rest }: SearchFieldProps) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 transition-colors duration-mr-default',
      'has-[:hover]:border-mr-accent-50 has-[:focus]:border-mr-accent',
      size === 'lg' && 'shadow-mr-elevated has-[:focus]:shadow-[0_0_0_4px_rgba(221,218,42,.18)]',
      sizeMap[size],
      className,
    )}
  >
    <Search className="size-4 shrink-0 text-mr-tertiary" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Buscar...'}
      className="size-full min-w-0 flex-1 bg-transparent text-mr-body text-mr-fg outline-none placeholder:text-mr-tertiary"
      {...rest}
    />
    {value && !hideClear && (
      <IconButton icon={X} size="sm" variant="ghost" aria-label="Limpar busca" onClick={() => onChange('')} />
    )}
    {shortcut && !value && <Kbd size="sm">{shortcut}</Kbd>}
  </div>
);
```

## Acessibilidade

- `type="search"` ativa o suporte nativo de history e clear no iOS
- Clear button com `aria-label="Limpar busca"`
- Em modal de busca global, associar com `<Label>` ou usar `aria-label` no input

## Dependências

- `lucide-react`
- `<IconButton>`, `<Kbd>`
- `cn`
