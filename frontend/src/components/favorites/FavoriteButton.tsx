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
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold border rounded-xs border-tertiary bg-secondary hover:bg-primary-default transition-colors"
        >
            {isLoading ? (
                <span>...</span>
            ) : isSaved ? (
                <BsBookmarkFill className="text-quaternary-default" />
            ) : (
                <BsBookmark />
            )}
            {isSaved ? 'Salvo' : 'Salvar'}
        </button>
    );
};

export default FavoriteButton;
