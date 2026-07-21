import React from 'react';
import { Bookmark, ShoppingCart, ThumbsUp, Users } from 'lucide-react';
interface TitleActionsProps {
    onBookmarkClick?: () => void;
    onLikeClick?: () => void;
    onGroupsClick?: () => void;
    onCartClick?: () => void;
    isBookmarked?: boolean;
}

const TitleActions: React.FC<TitleActionsProps> = ({ onBookmarkClick, onLikeClick, onGroupsClick, onCartClick, isBookmarked = false }) => {
    return (
        <div className="flex items-center justify-between h-full py-2 border rounded-r-xs rounded-bl-xs border-tertiary bg-tertiary rounded-tr-none">
            <button
                aria-label={isBookmarked ? 'Remover da biblioteca' : 'Salvar na biblioteca'}
                className="flex items-center justify-center grow cursor-pointer"
                onClick={onBookmarkClick}
            >
                {isBookmarked ? <Bookmark className="text-2xl text-mr-accent-fg" /> : <Bookmark className="text-2xl" />}
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button aria-label="Curtir" className="flex items-center justify-center grow cursor-pointer" onClick={onLikeClick}>
                <ThumbsUp className="text-2xl" />
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button aria-label="Ver grupos" className="flex items-center justify-center grow cursor-pointer" onClick={onGroupsClick}>
                <Users className="text-2xl" />
            </button>
            <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
            <button aria-label="Comprar" className="flex items-center justify-center grow cursor-pointer" onClick={onCartClick}>
                <ShoppingCart className="text-2xl" />
            </button>
        </div>
    );
};

export default TitleActions;
