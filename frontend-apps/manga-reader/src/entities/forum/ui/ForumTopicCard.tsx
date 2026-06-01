import { memo } from 'react';
import { Pin, MessageSquare, Eye } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { StatusDot } from '@ui/StatusDot';

export interface ForumTopicCardProps {
    id: string;
    title: string;
    category: string;
    author: { name: string; avatar?: string };
    postedAt: string;
    lastReplyAt?: string;
    replies: number;
    views: number;
    pinned?: boolean;
    spoiler?: boolean;
    live?: number;
    onClick?: () => void;
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const ForumTopicCardBase = ({ title, category, author, postedAt, lastReplyAt, replies, views, pinned, spoiler, live, onClick }: ForumTopicCardProps) => (
    <article
        onClick={onClick}
        className={cn(
            'group flex cursor-pointer gap-3 rounded-mr-md border bg-mr-surface p-4 transition-all duration-mr-default',
            'hover:-translate-y-0.5 hover:border-mr-accent-50',
            pinned ? 'border-l-[3px] border-l-mr-accent border-mr-border' : 'border-mr-border',
        )}
    >
        <Avatar src={author.avatar} name={author.name} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-mr-tiny">
                <Badge variant="neutral">{category}</Badge>
                {pinned && (
                    <Badge>
                        <Pin className="size-3" />
                        Fixado
                    </Badge>
                )}
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
                <span>
                    <strong className="font-mr-bold text-mr-fg-muted">{author.name}</strong>
                </span>
                <span>·</span>
                <span>{postedAt}</span>
                {lastReplyAt && (
                    <>
                        <span>·</span>
                        <span>última resposta {lastReplyAt}</span>
                    </>
                )}
            </div>
            <footer className="mt-1 flex gap-4 text-mr-tiny font-mr-bold text-mr-fg-muted">
                <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {fmt(replies)} respostas
                </span>
                <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {fmt(views)} views
                </span>
            </footer>
        </div>
    </article>
);

export const ForumTopicCard = memo(ForumTopicCardBase);
export default ForumTopicCard;
