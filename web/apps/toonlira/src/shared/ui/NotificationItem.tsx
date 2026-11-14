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
                'group relative flex cursor-pointer gap-3 border-b border-ui-border-subtle px-4 py-3 transition-colors',
                'hover:bg-ui-accent-25',
                unread && 'bg-ui-accent-25/40',
            )}
        >
            {unread && <span aria-hidden className="absolute right-3 top-3.5 size-1.5 rounded-ui-full bg-ui-accent" />}

            {actor ? (
                <div className="relative shrink-0">
                    <Avatar src={actor.avatar} name={actor.name} size={40} />
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-ui-full border border-ui-primary bg-ui-accent text-ui-on-accent">
                        <Icon className="size-2.5" />
                    </span>
                </div>
            ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-ui-xs bg-ui-accent-25 text-ui-accent-fg">
                    <Icon className="size-5" />
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="text-ui-body leading-snug text-ui-fg">{text}</div>
                {preview && <div className="line-clamp-1 text-ui-tiny italic text-ui-fg-subtle">"{preview}"</div>}
                <div className="mt-0.5 text-ui-tiny text-ui-fg-subtle">{when}</div>
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
