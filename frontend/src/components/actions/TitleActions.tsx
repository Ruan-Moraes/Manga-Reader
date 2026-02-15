import React from 'react';

import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import { MdGroups, MdOutlineShoppingCart } from 'react-icons/md';

interface TitleActionsProps {
    onBookmarkClick?: () => void;
    onLikeClick?: () => void;
    onGroupsClick?: () => void;
    onCartClick?: () => void;
    isBookmarked?: boolean;
}

const TitleActions: React.FC<TitleActionsProps> = ({
    onBookmarkClick,
    onLikeClick,
    onGroupsClick,
    onCartClick,
    isBookmarked = false,
}) => {
    return (
        <div className="flex items-center justify-between h-full py-2 border rounded-r-xs rounded-bl-xs border-tertiary bg-tertiary">
            <button
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onBookmarkClick}
            >
                {isBookmarked ? (
                    <BsBookmarkFill className="text-2xl text-quaternary-default" />
                ) : (
                    <BsBookmark className="text-2xl" />
                )}
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onLikeClick}
            >
                <AiOutlineLike className="text-2xl" />
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onGroupsClick}
            >
                <MdGroups className="text-2xl" />
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onCartClick}
            >
                <MdOutlineShoppingCart className="text-2xl" />
            </button>
        </div>
    );
};

export default TitleActions;
