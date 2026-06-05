import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react';
type BookmarkButtonProps = {
    isSaved: boolean;
    onClick: () => void;
    isLoading?: boolean;
};

const BookmarkButton = ({ isSaved, onClick, isLoading = false }: BookmarkButtonProps) => {
    const { t } = useTranslation('library');

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border rounded-xs transition-all ${
                isSaved ? 'border-quaternary-default bg-quaternary-default/25' : 'border-tertiary bg-secondary hover:bg-primary-default'
            }`}
        >
            {isLoading ? <span>...</span> : isSaved ? <Bookmark className="text-quaternary-default animate-pulse" /> : <Bookmark />}
            {isSaved ? t('bookmark.saved') : t('bookmark.save')}
        </button>
    );
};

export default BookmarkButton;
