import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForumPaginationProps {
    pages?: number[];
    last?: number;
    current?: number;
    style?: React.CSSProperties;
}

/** Paginação estática fiel ao protótipo (1 2 3 … N). Wire real ao React Query depois. */
export const ForumPagination = ({ pages = [1, 2, 3], last = 12, current = 1, style }: ForumPaginationProps) => {
    const { t } = useTranslation('forum');
    return (
        <div className="forum-pagination" style={style}>
            <button type="button" disabled className="forum-page-btn" aria-label={t('ui.prevPage')}>
                <ChevronLeft size={14} strokeWidth={2} />
            </button>
            {pages.map(p => (
                <button key={p} type="button" className={`forum-page-btn ${p === current ? 'active' : ''}`}>
                    {p}
                </button>
            ))}
            <span style={{ color: 'var(--mr-tertiary)', padding: '0 8px' }}>…</span>
            <button type="button" className="forum-page-btn">
                {last}
            </button>
            <button type="button" className="forum-page-btn" aria-label={t('ui.nextPage')}>
                <ChevronRight size={14} strokeWidth={2} />
            </button>
        </div>
    );
};
