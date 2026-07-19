import { BookOpen, MessageSquare, AtSign, Users, Bell, X } from 'lucide-react';

import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

import { cn } from '@shared/lib/cn';

export type NotificationKind = 'chapter' | 'reply' | 'mention' | 'group' | 'system';

export interface NotificationItemProps {
    id: string;
    kind: NotificationKind;
    actor?: { name: string; avatar?: string };
    text: string;
    preview?: string;
    when: string;
    unread?: boolean;
    onClick?: () => void;
    onDismiss?: () => void;
}

const kindIcon = {
    chapter: BookOpen,
    reply: MessageSquare,
    mention: AtSign,
    group: Users,
    system: Bell,
};

export const NotificationItem = ({ kind, actor, text, preview, when, unread, onClick, onDismiss }: NotificationItemProps) => {
    const Icon = kindIcon[kind];

    return (
        <article
            onClick={onClick}
            className={cn(
                'group relative flex cursor-pointer gap-3 border-b border-mr-border-subtle px-4 py-3 transition-colors',
                'hover:bg-mr-accent-25',
                unread && 'bg-mr-accent-25/40',
            )}
        >
            {unread && <span aria-hidden className="absolute right-3 top-3.5 size-1.5 rounded-mr-full bg-mr-accent" />}

            {actor ? (
                <div className="relative shrink-0">
                    <Avatar src={actor.avatar} name={actor.name} size={40} />
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-mr-full border border-mr-primary bg-mr-accent text-mr-on-accent">
                        <Icon className="size-2.5" />
                    </span>
                </div>
            ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-25 text-mr-accent-fg">
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
                    onClick={e => {
                        e.stopPropagation();
                        onDismiss();
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                />
            )}
        </article>
    );
};

export default NotificationItem;
