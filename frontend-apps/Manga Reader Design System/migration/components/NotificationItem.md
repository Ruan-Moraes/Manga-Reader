# NotificationItem

Item de uma notificação. Aparece no dropdown do sino (NavBar) e na tela
NotificationsPage (futura). 5 tipos canônicos.

## Props

```ts
export type NotificationKind =
  | 'chapter'           // novo capítulo de obra que você segue
  | 'reply'             // alguém respondeu seu post
  | 'mention'           // mencionaram você
  | 'group'             // grupo que você segue publicou
  | 'system';           // mudanças da plataforma

export interface NotificationItemProps {
  id: string;
  kind: NotificationKind;
  /** Quem causou (autor da ação) */
  actor?: { name: string; avatar?: string };
  /** Texto principal — geralmente "X fez Y em Z" */
  text: string;
  /** Preview do conteúdo (resposta, etc.) — italic mais sutil */
  preview?: string;
  when: string;
  /** Quando ainda não lida */
  unread?: boolean;
  /** Link de destino */
  onClick?: () => void;
  /** Ação de dismiss */
  onDismiss?: () => void;
}
```

## Iconography por kind

| kind | Ícone Lucide | Cor |
|---|---|---|
| chapter | `BookOpen` | accent |
| reply | `MessageSquare` | accent |
| mention | `AtSign` | accent |
| group | `Users` | accent |
| system | `Bell` | neutral |

## Estados

| Estado | Visual |
|---|---|
| unread | bg `mr-accent-25/50` + dot `mr-accent` à direita |
| read | bg transparent (ou `mr-surface` se em card) |
| hover | bg `mr-accent-25` |

## Anatomia

```
┌─────────────────────────────────────────────────┐
│ ●  [Avatar OU ícone]  Texto principal           │   ← dot accent se unread
│                       Preview (opcional)         │
│                       há 2 horas         [×]    │   ← dismiss button no hover
└─────────────────────────────────────────────────┘
```

## Exemplo

```tsx
import { BookOpen, MessageSquare, AtSign, Users, Bell, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';
import { cn } from '@/lib/cn';
import type { NotificationItemProps, NotificationKind } from './NotificationItem.types';

const kindIcon = { chapter: BookOpen, reply: MessageSquare, mention: AtSign, group: Users, system: Bell };

export const NotificationItem = ({ kind, actor, text, preview, when, unread, onClick, onDismiss }: NotificationItemProps) => {
  const Icon = kindIcon[kind];
  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative flex cursor-pointer gap-3 border-b border-mr-border-subtle px-mr-md py-mr-sm transition-colors',
        'hover:bg-mr-accent-25',
        unread && 'bg-mr-accent-25/40',
      )}
    >
      {unread && <span aria-hidden className="absolute right-3 top-3.5 size-1.5 rounded-mr-full bg-mr-accent" />}
      {actor ? (
        <div className="relative shrink-0">
          <Avatar src={actor.avatar} name={actor.name} size={40} />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-mr-full border border-mr-bg bg-mr-accent text-mr-primary">
            <Icon className="size-2.5" />
          </span>
        </div>
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-25 text-mr-accent">
          <Icon className="size-5" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-mr-body leading-snug text-mr-fg">{text}</div>
        {preview && <div className="line-clamp-1 text-mr-tiny italic text-mr-fg-subtle">"{preview}"</div>}
        <div className="mt-0.5 text-mr-tiny text-mr-fg-subtle">{when}</div>
      </div>
      {onDismiss && (
        <IconButton
          icon={X}
          size="sm"
          variant="ghost"
          aria-label="Dispensar notificação"
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </article>
  );
};
```

## Acessibilidade

- `<article>` por notificação
- Unread dot é decorativo (`aria-hidden`) — o aria-label do item descreve
- `onDismiss` precisa de `aria-label` descritivo

## Dependências

- `<Avatar>`, `<IconButton>`
- `lucide-react`
- `cn`
