import { MoreHorizontal, CheckCircle2, Download } from 'lucide-react';
import { IconButton } from './IconButton';
import { Avatar } from './Avatar';
import { ProgressBar } from './ProgressBar';
import { cn } from '@/lib/cn';

export interface ChapterListItemProps {
    number: number;
    title?: string;
    publishedAt: string;
    read?: boolean;
    current?: boolean;
    group?: { name: string; avatar?: string };
    downloaded?: boolean;
    onClick?: () => void;
    onMore?: () => void;
}

export const ChapterListItem = ({ number, title, publishedAt, read, current, group, downloaded, onClick, onMore }: ChapterListItemProps) => (
    <article
        className={cn(
            'group flex cursor-pointer items-center gap-3 border-b border-mr-border-subtle px-4 py-3 transition-colors',
            'hover:bg-mr-accent-25',
            current && 'border-l-[3px] border-l-mr-accent bg-mr-accent-25',
            read && 'opacity-55',
        )}
        onClick={onClick}
    >
        <span className="w-14 shrink-0 font-mr-mono text-mr-h4 font-mr-bold tabular-nums text-mr-accent">#{number}</span>
        <div className="min-w-0 flex-1">
            <div className="truncate text-mr-body font-mr-bold text-mr-fg">{title ?? `Capítulo ${number}`}</div>
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
            {onMore && (
                <IconButton
                    icon={MoreHorizontal}
                    size="sm"
                    variant="ghost"
                    aria-label={`Mais ações no capítulo ${number}`}
                    onClick={e => {
                        e.stopPropagation();
                        onMore();
                    }}
                />
            )}
        </div>
    </article>
);

export default ChapterListItem;
