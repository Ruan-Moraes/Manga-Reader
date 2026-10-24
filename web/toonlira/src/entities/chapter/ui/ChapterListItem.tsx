import { MoreHorizontal, CheckCircle2, Download } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { IconButton } from '@ui/IconButton';
import { Avatar } from '@ui/Avatar';
import { ProgressBar } from '@ui/ProgressBar';

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
            'group flex cursor-pointer items-center gap-3 border-b border-ui-border-subtle px-4 py-3 transition-colors',
            'hover:bg-ui-accent-25',
            current && 'border-l-[3px] border-l-ui-accent bg-ui-accent-25',
            read && 'opacity-55',
        )}
        onClick={onClick}
    >
        <span className="w-14 shrink-0 font-ui-mono text-ui-h4 font-ui-bold tabular-nums text-ui-accent-fg">#{number}</span>
        <div className="min-w-0 flex-1">
            <div className="truncate text-ui-body font-ui-bold text-ui-fg">{title ?? `Capítulo ${number}`}</div>
            {current && <ProgressBar value={42} thickness="thin" className="mt-1" />}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-ui-tiny text-ui-fg-subtle">
            {group && (
                <span className="flex items-center gap-1.5">
                    <Avatar size={24} name={group.name} src={group.avatar} />
                    <span className="hidden sm:inline">{group.name}</span>
                </span>
            )}
            <span className="font-ui-bold">{publishedAt}</span>
            {downloaded && <Download className="size-3.5 text-ui-accent-fg" />}
            {read && <CheckCircle2 className="size-3.5 text-ui-fg-subtle" />}
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
