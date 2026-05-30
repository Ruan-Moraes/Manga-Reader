# PageContainer

Container central com max-width e padding lateral responsivo. Usado em quase toda tela.

## Props

```ts
import type { HTMLAttributes, ReactNode } from 'react';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Largura máxima. Padrão: 'default' (1240) */
  size?: 'narrow' | 'default' | 'wide' | 'fluid';
  /** Padding vertical. Padrão: 'md' */
  paddingY?: 'none' | 'sm' | 'md' | 'lg';
  /** Renderizar como <main>. Default: false */
  asMain?: boolean;
  children: ReactNode;
}
```

## Sizes

| size | max-width |
|---|---|
| narrow | 720px (texto longo, legal, post detail) |
| default | 1240px |
| wide | 1440px (descoberta, listas largas) |
| fluid | 100% (full-bleed) |

## Padding lateral (responsivo)

| Breakpoint | px lateral |
|---|---|
| <640 | 16 |
| 640–1023 | 20 |
| ≥1024 | 24 |

## Padding vertical

| paddingY | Mobile | Desktop |
|---|---|---|
| none | 0 | 0 |
| sm | 16 | 24 |
| md | 16 | 28 |
| lg | 24 | 40 |

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { PageContainerProps } from './PageContainer.types';

const sizeMap = {
  narrow:  'max-w-[720px]',
  default: 'max-w-mr-container',
  wide:    'max-w-[1440px]',
  fluid:   'max-w-none',
};

const paddingYMap = {
  none: '',
  sm:   'py-mr-md md:py-mr-lg',
  md:   'py-mr-md md:py-mr-xl',
  lg:   'py-mr-lg md:py-10',
};

export const PageContainer = ({ size = 'default', paddingY = 'md', asMain, children, className, ...rest }: PageContainerProps) => {
  const Comp = asMain ? 'main' : 'div';
  return (
    <Comp
      className={cn(
        'mx-auto w-full px-mr-md sm:px-5 lg:px-mr-lg',
        sizeMap[size],
        paddingYMap[paddingY],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
};
```

## Acessibilidade

- Usar `asMain={true}` no container principal de cada rota (id="main-content" + skip link)
- Não usar como wrapper de modal/drawer — só conteúdo de página

## Dependências

- `cn`
