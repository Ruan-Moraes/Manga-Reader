# ReviewCard

Cartão de resenha de uma obra. Variante de `CommentBox` com rating destacado e poster
opcional. Usado em TitleDetail (reviews top) e Profile (últimas reviews escritas).

> Quando review é só texto + estrelas inline, **use `CommentBox` com `rating`** — não
> criar componente novo. Este componente é pra quando aparece em listagem separada
> (Profile, hub de reviews), onde se quer o poster da obra ao lado.

## Props

```ts
import type { ReactNode } from 'react';
import type { CommentAuthor } from './CommentBox';

export interface ReviewCardProps {
  /** Quem escreveu */
  author: CommentAuthor;
  when: string;
  /** Rating 1-5 (obrigatório em review) */
  rating: number;
  /** Título da review (opcional, mas comum) */
  title?: string;
  /** Body (texto da review, line-clamp 4 em listagens) */
  children: ReactNode;
  /** Em qual obra foi escrita */
  manga?: { id: string; title: string; cover?: string; gradient?: string };
  upvotes: number;
  myVote?: 'up' | null;
  onVote?: () => void;
  /** Selo de qualidade (top review, em destaque) */
  badge?: 'top' | 'featured' | null;
  onClick?: () => void;
  /** "Você curtiu" comentário (compatibilidade) */
  comments?: number;
}
```

## Anatomia

```
<article>
├── Header: Avatar + nome + when + badge (top/featured)
├── (Poster da obra à direita, opcional — só se manga é passado)
├── Rating (Stars 18)
├── Title (opcional, h4)
├── Body (texto, line-clamp 4 em list, ilimitado em detail)
├── Footer: upvotes + comments count + "ler mais →"
```

## Sizes / variantes

- **default:** texto completo (em TitleDetail)
- **compact** (futuro): line-clamp 3, sem poster

## Exemplo

```tsx
import { ThumbsUp, MessageSquare, Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Stars } from './Stars';
import { MangaPoster } from './MangaPoster';
import { cn } from '@/lib/cn';
import type { ReviewCardProps } from './ReviewCard.types';

const badgeMap = {
  top:      { label: 'Top review', variant: 'accent' as const },
  featured: { label: 'Em destaque', variant: 'neutral' as const },
};

export const ReviewCard = ({ author, when, rating, title, children, manga, upvotes, myVote, onVote, badge, onClick, comments }: ReviewCardProps) => (
  <article
    onClick={onClick}
    className={cn(
      'flex gap-mr-md rounded-mr-md border border-mr-border bg-mr-surface p-mr-md',
      onClick && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-mr-accent-50',
      badge === 'top' && 'border-mr-accent shadow-mr-elevated',
    )}
  >
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
        <Avatar src={author.avatar} name={author.name} size={32} />
        <span className="text-mr-body font-mr-extrabold text-mr-fg">{author.name}</span>
        {author.badge && <Badge variant={author.badge === 'mod' ? 'danger' : 'accent'}>{author.badge}</Badge>}
        <span>·</span>
        <span>{when}</span>
        {badge && <Badge variant={badgeMap[badge].variant} icon={Star}>{badgeMap[badge].label}</Badge>}
      </header>

      <div className="flex items-center gap-2">
        <Stars value={rating} size={18} />
        <span className="text-mr-h4 font-mr-extrabold tabular-nums text-mr-accent">{rating.toFixed(1)}</span>
      </div>

      {title && <h3 className="text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">{title}</h3>}

      <p className="line-clamp-4 text-mr-body leading-relaxed text-mr-fg-muted">{children}</p>

      <footer className="mt-1 flex items-center gap-mr-md text-mr-tiny">
        <button
          onClick={(e) => { e.stopPropagation(); onVote?.(); }}
          aria-pressed={myVote === 'up'}
          className={cn('inline-flex items-center gap-1 font-mr-bold hover:text-mr-accent', myVote === 'up' ? 'text-mr-accent' : 'text-mr-fg-muted')}
        >
          <ThumbsUp className="size-3.5" />
          {upvotes}
        </button>
        {comments != null && (
          <span className="inline-flex items-center gap-1 text-mr-fg-muted">
            <MessageSquare className="size-3.5" />
            {comments}
          </span>
        )}
      </footer>
    </div>

    {manga && (
      <div className="hidden shrink-0 sm:block">
        <MangaPoster cover={manga.cover} fallbackGradient={manga.gradient} alt="" size={88} radius="sm" />
      </div>
    )}
  </article>
);
```

## Acessibilidade

- `<article>` por review
- Rating: `<Stars value role="img" aria-label="X de 5">` + número visível (redundância intencional para leitores de tela)
- Botão upvote: `aria-pressed`

## Dependências

- `<Avatar>`, `<Badge>`, `<Stars>`, `<MangaPoster>`
- `lucide-react`
- `cn`
