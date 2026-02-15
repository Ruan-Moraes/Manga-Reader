import React from 'react';

import { BsBookmark } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import { MdGroups, MdOutlineShoppingCart } from 'react-icons/md';

interface TitleActionsProps {
    onBookmarkClick?: () => void;
    onLikeClick?: () => void;
    onGroupsClick?: () => void;
    onCartClick?: () => void;
}

const TitleActions: React.FC<TitleActionsProps> = ({
    onBookmarkClick,
    onLikeClick,
    onGroupsClick,
    onCartClick,
}) => {
    return (
        <div className="flex items-center justify-between h-full py-2 border rounded-r-xs rounded-bl-xs border-tertiary bg-tertiary">
            <div
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onBookmarkClick}
            >
                <BsBookmark className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <div
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onLikeClick}
            >
                <AiOutlineLike className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <div
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onGroupsClick}
            >
                <MdGroups className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <div
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onCartClick}
            >
                <MdOutlineShoppingCart className="text-2xl" />
            </div>
        </div>
    );
};

export default TitleActions;
