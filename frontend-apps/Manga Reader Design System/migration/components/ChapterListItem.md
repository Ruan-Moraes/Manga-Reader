# ChapterListItem

Item de uma linha numa lista de capítulos. Usado em TitleDetail (lista completa) e em
GroupDetail (capítulos publicados pelo grupo).

## Props

```ts
export interface ChapterListItemProps {
  number: number;
  title?: string;
  /** Quando foi publicado (string relativa: "hoje", "há 2 dias") */
  publishedAt: string;
  /** Capítulo já lido */
  read?: boolean;
  /** Em andamento */
  current?: boolean;
  /** Group de scan que publicou */
  group?: { name: string; avatar?: string };
  /** Disponível offline */
  downloaded?: boolean;
  onClick?: () => void;
  /** Long-press / context menu → menu de ações */
  onMore?: () => void;
}
```

## Anatomia

```
┌─────────────────────────────────────────────────────────────┐
│ #1120  Título do capítulo                       group · 2h │
│        progress bar (se current) ───────                    │
└─────────────────────────────────────────────────────────────┘
```

- Padding: `py-mr-sm px-mr-md` (12 16)
- Border-bottom 1px `mr-border-subtle` (não no último)
- Hover: `bg-mr-accent-25`
- `current`: border-left 3px `mr-accent` + bg `mr-accent-25` permanente
- `read`: opacity 0.55 — não esconde, mas reduz peso visual

## Exemplo

```tsx
import { MoreHorizontal, CheckCircle2, Download } from 'lucide-react';
import { IconButton } from './IconButton';
import { Avatar } from './Avatar';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';
import type { ChapterListItemProps } from './ChapterListItem.types';

export const ChapterListItem = ({ number, title, publishedAt, read, current, group, downloaded, onClick, onMore }: ChapterListItemProps) => (
  <article
    className={cn(
      'group flex items-center gap-3 border-b border-mr-border-subtle px-mr-md py-mr-sm transition-colors',
      'hover:bg-mr-accent-25 cursor-pointer',
      current && 'border-l-[3px] border-l-mr-accent bg-mr-accent-25',
      read && 'opacity-55',
    )}
    onClick={onClick}
  >
    <span className="w-14 shrink-0 font-mr-mono text-mr-h4 font-mr-bold tabular-nums text-mr-accent">
      #{number}
    </span>
    <div className="min-w-0 flex-1">
      {title && <div className="truncate text-mr-body font-mr-bold text-mr-fg">{title}</div>}
      {!title && <div className="text-mr-body font-mr-bold text-mr-fg">Capítulo {number}</div>}
      {current && <ProgressBar value={42} thickness="thin" className="mt-1" />}
    </div>
    <div className="flex shrink-0 items-center gap-2 text-mr-tiny text-mr-fg-subtle">
      {group && (
        <span className="flex items-center gap-1.5">
          <Avatar size={24} name={group.name} src={group.avatar} />
          <span className="hidden sm:inline">{group.name}</span>
        </span>
      )}
      <span className="font-mr-bold">{publishedAt}</span>
      {downloaded && <Download className="size-3.5 text-mr-accent" />}
      {read && <CheckCircle2 className="size-3.5 text-mr-fg-subtle" />}
      {onMore && <IconButton icon={MoreHorizontal} size="sm" variant="ghost" aria-label="Mais ações" onClick={(e) => { e.stopPropagation(); onMore(); }} />}
    </div>
  </article>
);
```

## Acessibilidade

- `<article>` envolvendo cada item
- O título do capítulo é o "nome" do item — não usar h-level
- Botão "more": `aria-label="Mais ações no capítulo X"`

## Dependências

- `lucide-react`
- `<IconButton>`, `<Avatar>`, `<ProgressBar>`
- `cn`
