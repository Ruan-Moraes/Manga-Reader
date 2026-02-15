import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';

type FavoriteButtonProps = {
    isSaved: boolean;
    onClick: () => void;
    isLoading?: boolean;
};

const FavoriteButton = ({
    isSaved,
    onClick,
    isLoading = false,
}: FavoriteButtonProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border rounded-xs transition-all ${
                isSaved
                    ? 'border-quaternary-default bg-quaternary-default/25'
                    : 'border-tertiary bg-secondary hover:bg-primary-default'
            }`}
        >
            {isLoading ? (
                <span>...</span>
            ) : isSaved ? (
                <BsBookmarkFill className="text-quaternary-default animate-pulse" />
            ) : (
                <BsBookmark />
            )}
            {isSaved ? 'Na biblioteca' : 'Salvar na biblioteca'}
        </button>
    );
};

export default FavoriteButton;
