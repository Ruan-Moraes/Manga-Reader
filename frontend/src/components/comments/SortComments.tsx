import { MdSort } from 'react-icons/md';
import { AiFillDislike, AiFillLike } from 'react-icons/ai';
import IconButton from '../buttons/IconButton';
import CalendarArrowDown from '../icons/CalendarArrowDown';
import CalendarArrowUp from '../icons/CalendarArrowUp';

import {
    SortType,
    useCommentSortContext,
} from '../../context/comments/CommentSortContext';

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
                    onClick={() => setSortType(null)}
                    className={`h-8 ${sortType === null ? 'bg-quaternary-opacity-50' : ''}`}
                >
                    <MdSort size={13} />
                </IconButton>
                <IconButton
                    onClick={() => handleSortClick('dislikes')}
                    className={`h-8 ${sortType === 'dislikes' ? 'bg-quaternary-opacity-50' : ''}`}
                >
                    <AiFillDislike size={13} />
                </IconButton>
                <IconButton
                    onClick={() => handleSortClick('likes')}
                    className={`h-8 ${sortType === 'likes' ? 'bg-quaternary-opacity-50' : ''}`}
                >
                    <AiFillLike size={13} />
                </IconButton>
                <CalendarArrowDown
                    onClick={() => handleSortClick('newest')}
                    className={`h-8 ${sortType === 'newest' ? 'bg-quaternary-opacity-50' : ''}`}
                />
                <CalendarArrowUp
                    onClick={() => handleSortClick('oldest')}
                    className={`h-8 ${sortType === 'oldest' ? 'bg-quaternary-opacity-50' : ''}`}
                />
            </div>
        </div>
    );
};

export default SortComments;
