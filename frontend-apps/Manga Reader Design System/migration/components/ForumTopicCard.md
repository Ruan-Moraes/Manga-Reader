# ForumTopicCard

Item de listagem de tópico no fórum. Avatar do autor + título + meta + stats.

## Props

```ts
export interface ForumTopicCardProps {
  id: string;
  title: string;
  /** Categoria/tag principal (ex.: "Spoiler livre", "Discussão") */
  category: string;
  /** Autor do tópico */
  author: { name: string; avatar?: string };
  /** ISO ou string relativa */
  postedAt: string;
  /** Última resposta */
  lastReplyAt?: string;
  replies: number;
  views: number;
  /** Tópico fixado */
  pinned?: boolean;
  /** Já tem spoiler de capítulos não publicados */
  spoiler?: boolean;
  /** Tag/badge live: "X leitores discutindo agora" */
  live?: number;
  onClick?: () => void;
}
```

## Anatomia

```
┌────────────────────────────────────────────────────┐
│ [Avatar]  [cat badge] [pinned] [spoiler]    [live] │
│           Título do tópico                          │
│           autor · há 2 horas · última resposta ago  │
│           ───────────────────────────────────────  │
│           💬 312 respostas · 👁 2.4k views          │
└────────────────────────────────────────────────────┘
```

## Estados

- default: Card flat
- hover: border `mr-accent-50` + translateY -2
- pinned: border-left 3px `mr-accent`
- live > 0: status dot pulse + texto "X discutindo agora"

## Exemplo

```tsx
import { Pin, MessageSquare, Eye } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { StatusDot } from './StatusDot';
import { cn } from '@/lib/cn';
import type { ForumTopicCardProps } from './ForumTopicCard.types';

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export const ForumTopicCard = ({ title, category, author, postedAt, lastReplyAt, replies, views, pinned, spoiler, live, onClick }: ForumTopicCardProps) => (
  <article
    onClick={onClick}
    className={cn(
      'group flex cursor-pointer gap-3 rounded-mr-md border bg-mr-surface p-mr-md transition-all duration-mr-default hover:-translate-y-0.5 hover:border-mr-accent-50',
      pinned && 'border-l-[3px] border-l-mr-accent',
    )}
  >
    <Avatar src={author.avatar} name={author.name} size={40} />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-mr-tiny">
        <Badge variant="neutral">{category}</Badge>
        {pinned && <Badge><Pin className="size-3" />Fixado</Badge>}
        {spoiler && <Badge variant="danger">Spoiler</Badge>}
        {!!live && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-mr-accent">
            <StatusDot status="operating" size={8} />
            <span className="font-mr-bold tabular-nums">{fmt(live)} discutindo agora</span>
          </span>
        )}
      </div>
      <h3 className="text-mr-h4 font-mr-extrabold leading-tight tracking-mr text-mr-fg group-hover:text-mr-accent">{title}</h3>
      <div className="flex flex-wrap gap-2 text-mr-tiny text-mr-fg-subtle">
        <span><strong className="font-mr-bold text-mr-fg-muted">{author.name}</strong></span>
        <span>·</span>
        <span>{postedAt}</span>
        {lastReplyAt && (<><span>·</span><span>última resposta {lastReplyAt}</span></>)}
      </div>
      <footer className="mt-1 flex gap-mr-md text-mr-tiny font-mr-bold text-mr-fg-muted">
        <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" />{fmt(replies)} respostas</span>
        <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{fmt(views)} views</span>
      </footer>
    </div>
  </article>
);
```

## Acessibilidade

- `<article>` por item
- Card-as-link: preferir wrapper `<a>` real com href em vez de onClick
- Badge "Spoiler" sempre como aviso textual, não apenas visual

## Dependências

- `<Avatar>`, `<Badge>`, `<StatusDot>`
- `lucide-react`
- `cn`
