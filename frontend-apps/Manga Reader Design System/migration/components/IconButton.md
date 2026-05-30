# IconButton

Botão quadrado contendo apenas um ícone. Atalho semântico — internamente é um `<Button>` com aspect-ratio 1:1.

## Props

```ts
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonVariant, ButtonSize } from './Button.types';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Obrigatório — IconButton não tem texto visível */
  'aria-label': string;
}
```

## Tamanhos

| Size | Box | Ícone |
|---|---|---|
| `sm` | 32×32 | 14 |
| `md` | 44×44 | 18 |
| `lg` | 52×52 | 22 |

## Acessibilidade

- `aria-label` **obrigatório** (TS exige) — sem texto visível
- Se o botão tem tooltip via `title`, ainda assim manter `aria-label`
- Estados visuais idênticos ao `Button`

## Exemplo

```tsx
import { forwardRef } from 'react';
import { Button } from './Button';
import type { IconButtonProps } from './IconButton.types';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ icon: Icon, size = 'md', variant = 'ghost', className, ...rest }, ref) {
    const iconSize = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-[22px]' : 'size-[18px]';
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={`aspect-square !p-0 ${className ?? ''}`}
        {...rest}
      >
        <Icon className={iconSize} />
      </Button>
    );
  },
);
```

## Dependências

- `<Button>` (mesmo arquivo)
- `lucide-react`

## Uso típico

- Topbar de navegação (back, settings, notificações)
- Toolbars do leitor de mangá
- Linha de ações em cards
