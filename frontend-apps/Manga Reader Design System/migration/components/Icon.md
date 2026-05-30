# Icon

Wrapper sobre `lucide-react` com tamanhos canônicos e cor sempre `currentColor`.

## Props

```ts
import type { LucideIcon, LucideProps } from 'lucide-react';

export type IconSize = 12 | 16 | 20 | 24 | 28;

export interface IconProps extends Omit<LucideProps, 'size'> {
  icon: LucideIcon;
  size?: IconSize;
  /** Marca como decorativo (esconde de leitores de tela). Padrão: true */
  decorative?: boolean;
}
```

## Tamanhos canônicos

| Size | Uso |
|---|---|
| 12 | Inline em badges, metadados |
| 16 | Botões pequenos, ícones de campo |
| 20 | Botões padrão, ações |
| 24 | Nav, headers |
| 28 | Menu aberto, ícones-iconográficos |

## Exemplo

```tsx
import type { IconProps } from './Icon.types';

export const Icon = ({ icon: LucideElement, size = 20, decorative = true, ...rest }: IconProps) => (
  <LucideElement
    width={size}
    height={size}
    strokeWidth={2}
    aria-hidden={decorative || undefined}
    role={decorative ? undefined : 'img'}
    {...rest}
  />
);
```

## Acessibilidade

- Decorativo por padrão (`aria-hidden`)
- Ícone que é a única indicação semântica de um botão → setar `decorative={false}` E garantir `aria-label` no pai

## Dependências

- `lucide-react`

## Notas

Prefira importar `LucideIcon` direto (`import { Search } from 'lucide-react'`) e usar `<Search className="size-5" />`. O wrapper `<Icon>` é útil pra passar `icon` como prop em componentes genéricos (Button, EmptyState, etc.).
