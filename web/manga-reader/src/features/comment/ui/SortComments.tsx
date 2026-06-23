import { ArrowUpDown, CalendarArrowDown, CalendarArrowUp, ThumbsDown, ThumbsUp } from 'lucide-react';

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

    const activeClass = (on: boolean) => (on ? 'text-mr-accent' : 'text-mr-fg-subtle');

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-mr-small font-mr-semibold text-mr-fg-subtle">{title}</span>
            <div className="inline-flex items-center gap-0.5 rounded-mr-full border border-mr-chip-border bg-mr-chip p-0.5">
                <IconButton
                    icon={ArrowUpDown}
                    aria-label="Sort default"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSortType(null)}
                    className={activeClass(sortType === null)}
                />
                <IconButton
                    icon={ThumbsDown}
                    aria-label="Sort by dislikes"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('dislikes')}
                    className={activeClass(sortType === 'dislikes')}
                />
                <IconButton
                    icon={ThumbsUp}
                    aria-label="Sort by likes"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('likes')}
                    className={activeClass(sortType === 'likes')}
                />
                <IconButton
                    icon={CalendarArrowDown}
                    aria-label="Sort by oldest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('oldest')}
                    className={activeClass(sortType === 'oldest')}
                />
                <IconButton
                    icon={CalendarArrowUp}
                    aria-label="Sort by newest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('newest')}
                    className={activeClass(sortType === 'newest')}
                />
            </div>
        </div>
    );
};

export default SortComments;
