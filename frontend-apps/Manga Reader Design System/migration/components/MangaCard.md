# MangaCard

Cartão canônico de uma obra. **Componente mais reusado do produto** — aparece em Home,
Biblioteca, Profile, Search, Para você, Trending, recomendados.

> Regra dura: existe **uma** implementação de MangaCard. Variações vivem como props.

## Props

```ts
import type { ReactNode } from 'react';

export interface Manga {
  id: string;
  title: string;
  author?: string;
  cover?: string;          // URL da capa
  fallbackGradient?: string; // CSS gradient quando cover está ausente
  rating?: number;
  genre?: string[];
  chapter?: number;        // última leitura ou último capítulo
  status?: 'reading' | 'completed' | 'on-hold' | 'dropped' | 'planned';
}

export interface MangaCardProps {
  manga: Manga;
  /** Estilo de destaque (hero / em alta) */
  featured?: boolean;
  /** Tag/badge sobre o card (ex.: "Novo", "Top 1") */
  tag?: ReactNode;
  /** Barra de progresso 0–100 abaixo do poster */
  progress?: number;
  /** Tamanho. Padrão: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** Click no botão de biblioteca (favorito) */
  onToggleLibrary?: () => void;
  /** Está na biblioteca? */
  inLibrary?: boolean;
}
```

## Sizes (aspect 2/3)

| size | Largura típica | Title text |
|---|---|---|
| sm | 120px | 13px |
| md | 160-200px (default) | 14px |
| lg | 240px | 16px |

## Anatomia

```
<a/button> (poster wrapper, aspect 2/3, radius mr-md)
├── Cover img OR gradient placeholder
├── Tag (top-left, opcional)
├── Library button (top-right, IconButton ghost com fundo translúcido)
├── Bottom gradient overlay (linear gradient transparente → #000d)
└── Bottom info (sobre o poster)
    ├── Title (truncate 2 linhas, font-bold, text-shadow)
    ├── Author meta (truncate 1 linha, text-mr-fg-subtle)
    └── Footer row: Stars + chapter count
Progress (4px bar abaixo do poster, se progress fornecido)
```

## Estados

- **default:** sem sombra
- **hover:** `translateY(-2px)` + `shadow-mr-elevated`
- **featured:** sombra sempre, border accent 2px
- **inLibrary:** ícone Bookmark preenchido (accent)

## Exemplo (estrutural)

```tsx
import { useState } from 'react';
import { Bookmark, Star } from 'lucide-react';
import { Stars } from './Stars';
import { Badge } from './Badge';
import { IconButton } from './IconButton';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';
import type { MangaCardProps } from './MangaCard.types';

export const MangaCard = ({ manga, featured, tag, progress, size = 'md', onClick, onToggleLibrary, inLibrary }: MangaCardProps) => {
  const [hover, setHover] = useState(false);
  const lifted = hover || featured;
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn('block no-underline transition-transform duration-mr-default', lifted && '-translate-y-0.5')}
    >
      <div
        className={cn(
          'relative aspect-[2/3] overflow-hidden rounded-mr-md border bg-mr-surface',
          featured ? 'border-mr-accent shadow-mr-elevated' : 'border-mr-border',
          lifted && 'shadow-mr-elevated',
        )}
        style={!manga.cover ? { background: manga.fallbackGradient ?? 'linear-gradient(135deg, #2a1f0f, #161616)' } : undefined}
      >
        {manga.cover && <img src={manga.cover} alt="" className="absolute inset-0 size-full object-cover" />}

        {tag && <div className="absolute left-2 top-2 z-1">{tag}</div>}

        {onToggleLibrary && (
          <div className="absolute right-2 top-2 z-1">
            <IconButton
              icon={Bookmark}
              size="sm"
              variant="ghost"
              aria-label={inLibrary ? 'Remover da biblioteca' : 'Adicionar à biblioteca'}
              aria-pressed={inLibrary}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLibrary(); }}
              className={cn('!bg-mr-primary-75 backdrop-blur-mr', inLibrary && '!text-mr-accent')}
            />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-mr-sm">
          <h3 className="line-clamp-2 text-mr-body font-mr-extrabold leading-tight tracking-mr text-mr-fg mr-text-shadow-default">
            {manga.title}
          </h3>
          {manga.author && <div className="mt-0.5 truncate text-mr-tiny text-mr-fg-subtle">{manga.author}</div>}
          {(manga.rating || manga.chapter) && (
            <div className="mt-1 flex items-center justify-between gap-2 text-mr-tiny text-mr-fg-muted">
              {manga.rating != null && <Stars value={manga.rating} size={12} />}
              {manga.chapter != null && <span className="font-mr-bold">Cap. {manga.chapter}</span>}
            </div>
          )}
        </div>
      </div>

      {progress != null && <ProgressBar value={progress} thickness="thin" label={`Progresso de leitura: ${progress}%`} className="mt-1" />}
    </a>
  );
};
```

## Acessibilidade

- `<a>` real com href (mesmo que use SPA — usar `<Link>` do router)
- `alt=""` na imagem (título adjacente comunica)
- Toggle library com `aria-pressed`
- Hover não é única indicação — focus-visible também levanta

## Dependências

- `<Stars>`, `<Badge>`, `<IconButton>`, `<ProgressBar>`
- `lucide-react`, `cn`

## Variações cobertas

| Caso | Props |
|---|---|
| Em alta com selo | `tag={<Badge>Top 1</Badge>}`, `featured` |
| Currently reading | `progress={42}` |
| Sem cover | `manga.cover` undefined, usa gradient |
| Lista compacta | `size="sm"` |

**Não criar `<TrendingMangaCard>`, `<LibraryMangaCard>`, `<RelatedMangaCard>` etc.** — sempre `<MangaCard>` com props.
