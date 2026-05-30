# MangaPoster

Apenas a capa (poster) sem metadados. Usado em hero do TitleDetail, no leitor (fim de
capítulo), em modais de confirmação ("adicionar Berserk?").

> Diferença de `MangaCard`: este é só a imagem. Sem título, sem rating, sem progress.

## Props

```ts
export interface MangaPosterProps {
  cover?: string;
  fallbackGradient?: string;
  alt?: string;
  /** Tamanho em px (lado maior). Padrão: 240 */
  size?: number;
  /** Forma. Padrão: 'rect' */
  shape?: 'rect' | 'square';
  /** Border radius. Padrão: mr-md (8) */
  radius?: 'sm' | 'md' | 'lg';
  /** Sombra accent (uso pontual) */
  elevated?: boolean;
  onClick?: () => void;
}
```

## Exemplo

```tsx
import { cn } from '@/lib/cn';
import type { MangaPosterProps } from './MangaPoster.types';

const radiusMap = { sm: 'rounded-mr-sm', md: 'rounded-mr-md', lg: 'rounded-mr-lg' };

export const MangaPoster = ({ cover, fallbackGradient, alt = '', size = 240, shape = 'rect', radius = 'md', elevated, onClick }: MangaPosterProps) => {
  const ratio = shape === 'square' ? '1 / 1' : '2 / 3';
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'overflow-hidden border border-mr-border bg-mr-surface',
        radiusMap[radius],
        elevated && 'shadow-mr-elevated',
        onClick && 'cursor-pointer transition-transform duration-mr-default hover:-translate-y-0.5',
      )}
      style={{
        width: size,
        aspectRatio: ratio,
        background: !cover ? (fallbackGradient ?? 'linear-gradient(135deg, #2a1f0f, #161616)') : undefined,
      }}
    >
      {cover && <img src={cover} alt={alt} className="size-full object-cover" />}
    </div>
  );
};
```

## Acessibilidade

- `alt` obrigatório se a capa é informativa; `alt=""` se decorativa (com título adjacente)
- Quando clicável, manter focus visible + Enter/Space

## Dependências

- `cn`
