import { ArrowDown, ArrowUp, ArrowUpDown, CalendarArrowDown, CalendarArrowUp } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { IconButton } from '@ui/IconButton';

import { SortType, useCommentSortContext } from '@entities/comment';

type SortCommentsProps = {
    title: string;
};

const SortComments = ({ title }: SortCommentsProps) => {
    const { sortType, setSortType } = useCommentSortContext();

    const handleSortClick = (type: SortType) => {
        setSortType(sortType === type ? null : type);
    };

    const segmentClass = (on: boolean) =>
        cn(
            '!min-h-0 !rounded-mr-full !border-0 !p-2 !shadow-none transition-colors duration-mr-default',
            on ? '!bg-mr-accent !text-mr-primary' : '!bg-transparent text-mr-fg-subtle hover:!bg-mr-accent-25 hover:text-mr-fg',
        );

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-mr-small font-mr-semibold text-mr-fg-subtle">{title}</span>
            <div className="inline-flex gap-1 items-center rounded-mr-full border border-mr-chip-border bg-mr-chip p-1">
                <IconButton
                    icon={ArrowUpDown}
                    title="Ordem padrão"
                    aria-label="Sort default"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSortType(null)}
                    className={segmentClass(sortType === null)}
                />

                <span className="mx-1 h-4 w-px shrink-0 bg-mr-chip-border" aria-hidden="true" />

                <IconButton
                    icon={ArrowDown}
                    title="Mais votos negativos"
                    aria-label="Ordenar por mais votos negativos"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('dislikes')}
                    className={segmentClass(sortType === 'dislikes')}
                />
                <IconButton
                    icon={ArrowUp}
                    title="Mais votos positivos"
                    aria-label="Ordenar por mais votos positivos"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('likes')}
                    className={segmentClass(sortType === 'likes')}
                />

                <span className="mx-1 h-4 w-px shrink-0 bg-mr-chip-border" aria-hidden="true" />

                <IconButton
                    icon={CalendarArrowDown}
                    title="Mais antigos"
                    aria-label="Sort by oldest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('oldest')}
                    className={segmentClass(sortType === 'oldest')}
                />
                <IconButton
                    icon={CalendarArrowUp}
                    title="Mais recentes"
                    aria-label="Sort by newest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('newest')}
                    className={segmentClass(sortType === 'newest')}
                />
            </div>
        </div>
    );
};

export default SortComments;
