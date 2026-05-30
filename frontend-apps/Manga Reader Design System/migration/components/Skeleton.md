# Skeleton

Placeholder de loading. Shimmer suave, respeita `prefers-reduced-motion`.

## Props

```ts
import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante visual. Padrão: 'rect' */
  variant?: 'rect' | 'circle' | 'text';
  /** Largura. CSS valid (ex.: '100%', '120px') */
  width?: string | number;
  /** Altura. CSS valid */
  height?: string | number;
  /** Em quantas linhas (só pra variant text). Padrão: 1 */
  lines?: number;
}
```

## Variantes

| variant | Default size | radius |
|---|---|---|
| rect | 100% × 16px | `mr-radius-xs` (2px) |
| circle | 40×40 | `mr-radius-full` |
| text | 100% × 14px (linha) | `mr-radius-xs` |

## Animação

Shimmer via gradient + animate:

```css
@keyframes mr-skeleton {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

- `background: linear-gradient(90deg, mr-gray-700 0%, mr-gray-600 50%, mr-gray-700 100%)`
- `background-size: 200% 100%`
- `animation: mr-skeleton 1.5s linear infinite`
- Em `prefers-reduced-motion: reduce`, parar animação (CSS already handles via globals.css)

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { SkeletonProps } from './Skeleton.types';

const variantClass = {
  rect:   'rounded-mr-xs',
  circle: 'rounded-mr-full',
  text:   'rounded-mr-xs',
};

export const Skeleton = ({ variant = 'rect', width, height, lines = 1, className, ...rest }: SkeletonProps) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(variantClass.text, 'motion-safe:animate-pulse bg-gradient-to-r from-mr-gray-700 via-mr-gray-600 to-mr-gray-700 bg-[length:200%_100%]')}
            style={{ width: i === lines - 1 ? '70%' : '100%', height: 14 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando"
      className={cn(variantClass[variant], 'motion-safe:animate-pulse bg-gradient-to-r from-mr-gray-700 via-mr-gray-600 to-mr-gray-700 bg-[length:200%_100%]', className)}
      style={{ width: width ?? '100%', height: height ?? (variant === 'rect' ? 16 : 40) }}
      {...rest}
    />
  );
};
```

## Composições típicas

- MangaCard skeleton: rect (aspect 2/3) + text (3 linhas)
- Avatar skeleton: circle 40×40
- Comment skeleton: row(circle + col(rect+text))

## Acessibilidade

- `role="status"` + `aria-busy="true"` no skeleton principal de uma seção
- `aria-label="Carregando"` (uma única vez no container raiz; itens internos não precisam)
- Não usar como CTA — esconder logo que data chega

## Dependências

- `cn`
