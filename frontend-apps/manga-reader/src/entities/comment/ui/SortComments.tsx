import { ArrowUpDown, CalendarArrowDown, CalendarArrowUp, ThumbsDown, ThumbsUp } from 'lucide-react';

import { IconButton } from '@ui/IconButton';

import { SortType, useCommentSortContext } from '../model/CommentSortContext';

type SortCommentsProps = {
    title: string;
};

const SortComments = ({ title }: SortCommentsProps) => {
    const { sortType, setSortType } = useCommentSortContext();

    const handleSortClick = (type: SortType) => {
        if (sortType === type) {
            setSortType(null);
        }

        if (sortType !== type) {
            setSortType(type);
        }
    };

    return (
        <div className="flex flex-col gap-1 p-2 border rounded-xs bg-secondary border-tertiary">
            <div>
                <h4 className="font-bold">{title}</h4>
            </div>
            <div className="flex items-center gap-2 grow">
                <IconButton
                    icon={ArrowUpDown}
                    aria-label="Sort default"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSortType(null)}
                    className={sortType === null ? 'bg-quaternary-opacity-50' : ''}
                />
                <IconButton
                    icon={ThumbsDown}
                    aria-label="Sort by dislikes"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('dislikes')}
                    className={sortType === 'dislikes' ? 'bg-quaternary-opacity-50' : ''}
                />
                <IconButton
                    icon={ThumbsUp}
                    aria-label="Sort by likes"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('likes')}
                    className={sortType === 'likes' ? 'bg-quaternary-opacity-50' : ''}
                />
                <IconButton
                    icon={CalendarArrowDown}
                    aria-label="Sort by oldest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('oldest')}
                    className={sortType === 'oldest' ? 'bg-quaternary-opacity-50' : ''}
                />
                <IconButton
                    icon={CalendarArrowUp}
                    aria-label="Sort by newest"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSortClick('newest')}
                    className={sortType === 'newest' ? 'bg-quaternary-opacity-50' : ''}
                />
            </div>
        </div>
    );
};

export default SortComments;
