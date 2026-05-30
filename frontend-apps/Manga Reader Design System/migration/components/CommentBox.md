# CommentBox

Bloco de comentário/review. Usado em TitleDetail (reviews), ForumTopic (replies),
GroupDetail (comentários sobre o grupo).

## Props

```ts
import type { ReactNode } from 'react';

export interface CommentAuthor {
  name: string;
  handle?: string;
  avatar?: string;
  badge?: 'author' | 'mod' | 'verified' | string; // texto livre
}

export interface CommentBoxProps {
  author: CommentAuthor;
  /** ISO ou string já formatada (preferida: "há 2 horas") */
  when: string;
  children: ReactNode;
  /** Upvotes */
  upvotes?: number;
  downvotes?: number;
  /** Voto atual do usuário */
  myVote?: 'up' | 'down' | null;
  onVote?: (vote: 'up' | 'down') => void;
  /** Quando true, comentário está em destaque (review top, fixado) */
  highlighted?: boolean;
  /** Resposta a outro comentário */
  replyTo?: { name: string; preview: string };
  /** Ações no canto direito (responder, denunciar, deletar) */
  actions?: ReactNode;
  /** Rating 1-5 (em reviews) */
  rating?: number;
  /** Replies aninhadas (nível 1 — não fazer mais que isso) */
  replies?: ReactNode;
}
```

## Anatomia

```
<article>
├── Avatar
└── Body
    ├── Header: Name + Badge + when
    ├── Reply quote (se replyTo) — pequeno, fundo mr-surface-muted
    ├── Stars (se rating)
    ├── Content (text-mr-body, leading-relaxed)
    ├── Footer: VoteButtons (up/down/count) + actions
    └── Replies (nested, padding-left + border-left mr-accent-25)
```

## Estados

- default: card flat
- highlighted: border `mr-accent` + bg `mr-accent-25` sutil
- myVote up: ícone up filled accent
- myVote down: ícone down filled danger

## Badge do autor

| badge | Cor |
|---|---|
| author | accent ("Autor da obra") |
| mod | danger ("Moderador") |
| verified | neutral + ícone check ("Verificado") |
| string custom | neutral |

## Exemplo (esqueleto)

```tsx
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Stars } from './Stars';
import { cn } from '@/lib/cn';
import type { CommentBoxProps } from './CommentBox.types';

export const CommentBox = ({ author, when, children, upvotes = 0, downvotes = 0, myVote, onVote, highlighted, replyTo, actions, rating, replies }: CommentBoxProps) => (
  <article className={cn(
    'flex gap-3 rounded-mr-md border bg-mr-surface p-mr-md',
    highlighted ? 'border-mr-accent bg-mr-accent-25/50' : 'border-mr-border',
  )}>
    <Avatar src={author.avatar} name={author.name} size={40} />
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
        <span className="text-mr-body font-mr-extrabold text-mr-fg">{author.name}</span>
        {author.handle && <span>@{author.handle}</span>}
        {author.badge && <Badge variant={author.badge === 'mod' ? 'danger' : 'accent'}>{author.badge}</Badge>}
        <span>·</span>
        <span>{when}</span>
      </header>
      {replyTo && (
        <blockquote className="rounded-mr-xs border-l-[3px] border-mr-accent bg-mr-surface-muted p-2 text-mr-tiny text-mr-fg-muted">
          <strong>@{replyTo.name}:</strong> {replyTo.preview}
        </blockquote>
      )}
      {rating != null && <Stars value={rating} size={14} />}
      <div className="text-mr-body leading-relaxed text-mr-fg-muted">{children}</div>
      <footer className="flex flex-wrap items-center gap-3 text-mr-tiny">
        <div className="inline-flex items-center gap-0.5">
          <button onClick={() => onVote?.('up')} aria-pressed={myVote === 'up'} aria-label="Curtir" className={cn('flex size-7 items-center justify-center rounded-mr-xs hover:bg-mr-accent-25', myVote === 'up' && 'bg-mr-accent-25 text-mr-accent')}>
            <ChevronUp className="size-4" />
          </button>
          <span className="min-w-6 text-center font-mr-bold tabular-nums text-mr-fg">{upvotes - downvotes}</span>
          <button onClick={() => onVote?.('down')} aria-pressed={myVote === 'down'} aria-label="Descurtir" className={cn('flex size-7 items-center justify-center rounded-mr-xs hover:bg-[rgba(255,120,79,.1)]', myVote === 'down' && 'text-mr-danger')}>
            <ChevronDown className="size-4" />
          </button>
        </div>
        {actions}
      </footer>
      {replies && (
        <div className="ml-mr-md mt-2 flex flex-col gap-3 border-l-2 border-mr-accent-25 pl-mr-md">
          {replies}
        </div>
      )}
    </div>
  </article>
);
```

## Acessibilidade

- `<article>` por comentário
- Botões de voto com `aria-pressed`
- `<blockquote>` semântico no reply-to
- Replies aninhadas: limitar a 1 nível visual; nível 2+ vira "Ver thread" link

## Dependências

- `<Avatar>`, `<Badge>`, `<Stars>`
- `lucide-react`
- `cn`
