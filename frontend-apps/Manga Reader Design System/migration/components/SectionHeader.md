# SectionHeader

Cabeçalho repetido em toda seção de página (Home, Library, Profile, Forum). Eyebrow + title + meta + action opcional.

## Props

```ts
import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  /** Eyebrow uppercase (mr-label) */
  eyebrow?: string;
  /** Título principal */
  title: string;
  /** Meta no canto direito (data, contagem, "ver tudo") */
  meta?: ReactNode;
  /** Ação no canto direito (botão "Ver tudo →") */
  action?: ReactNode;
  /** Tamanho do título. Padrão: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Componente do elemento de título (h2/h3). Padrão: 'h2' */
  as?: 'h2' | 'h3' | 'h4';
}
```

## Sizes

| size | Title fontSize | Line-height |
|---|---|---|
| sm | `clamp(16px, 3.5vw, 18px)` | 1.2 |
| md | `clamp(20px, 4vw, 26px)` | 1.1 |
| lg | `clamp(24px, 5vw, 32px)` | 1.1 |

## Anatomia

```
┌─────────────────────────────────────────────┐
│ eyebrow                            [action] │   ← linha 1: eyebrow + ação (alinhados verticalmente)
│ TITLE                                  meta │   ← linha 2: title + meta
└─────────────────────────────────────────────┘
```

Em mobile, `meta` e `action` quebram pra linha de baixo, alinhados à esquerda.

## Exemplo

```tsx
import type { SectionHeaderProps } from './SectionHeader.types';
import { cn } from '@/lib/cn';

const sizeMap = {
  sm: 'text-[clamp(16px,3.5vw,18px)]',
  md: 'text-[clamp(20px,4vw,26px)]',
  lg: 'text-[clamp(24px,5vw,32px)]',
};

export const SectionHeader = ({ eyebrow, title, meta, action, size = 'md', as = 'h2' }: SectionHeaderProps) => {
  const TitleTag = as;
  return (
    <header className="mb-mr-md flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="mr-label mb-1 text-mr-fg-subtle">{eyebrow}</div>}
        <TitleTag className={cn('m-0 font-mr-extrabold leading-tight tracking-mr text-mr-fg', sizeMap[size])}>
          {title}
        </TitleTag>
      </div>
      {(meta || action) && (
        <div className="flex shrink-0 items-center gap-3 text-mr-tiny text-mr-fg-subtle">
          {meta}
          {action}
        </div>
      )}
    </header>
  );
};
```

## Variações comuns

- **Lista de seção:** eyebrow="Em alta" + title="Esta semana" + action=`<a>Ver tudo →</a>`
- **Detail page:** eyebrow="Resenhas" + title="O que estão dizendo" + meta="247 reviews"
- **Settings:** eyebrow opcional + title="Conta e privacidade"

## Acessibilidade

- O `as` define a hierarquia de headings — manter consistente com a estrutura da página
- Action deve ser interativo real (`<a>` ou `<button>`), não apenas texto

## Dependências

- `cn`
