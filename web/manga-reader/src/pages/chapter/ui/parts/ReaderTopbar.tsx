import { useTranslation } from 'react-i18next';
import { Bookmark, ChevronDown, ChevronLeft, MessageSquare, Settings } from 'lucide-react';

import { TOTAL } from '../../model/useChapterReader';
import { ChapterDropdown, type ChapterListItem } from './ChapterDropdown';

interface ReaderTopbarProps {
    title: string;
    chapter: number;
    page: number;
    status: string;
    hidden: boolean;
    saved: boolean;
    chaptersOpen: boolean;
    commentsOpen: boolean;
    settingsOpen: boolean;
    chaptersList: ChapterListItem[];
    onBack: () => void;
    onToggleChapters: () => void;
    onPickChapter: (num: number) => void;
    onToggleSaved: () => void;
    onToggleComments: () => void;
    onToggleSettings: () => void;
}

export const ReaderTopbar = ({
    title,
    chapter,
    page,
    status,
    hidden,
    saved,
    chaptersOpen,
    commentsOpen,
    settingsOpen,
    chaptersList,
    onBack,
    onToggleChapters,
    onPickChapter,
    onToggleSaved,
    onToggleComments,
    onToggleSettings,
}: ReaderTopbarProps) => {
    const { t } = useTranslation('manga');

    return (
        <div className={`reader-topbar ${hidden ? 'hidden' : ''}`}>
            <button type="button" className="reader-icon-btn" onClick={onBack} aria-label={t('reader.backAria')}>
                <ChevronLeft size={18} strokeWidth={2} />
            </button>

            <button type="button" className="reader-title-btn" onClick={onToggleChapters} aria-expanded={chaptersOpen}>
                <span className="reader-title-line">
                    <strong>{title}</strong>
                    <span style={{ color: '#666' }}>·</span>
                    <span>
                        {t('reader.chapterAbbr')} {chapter}
                    </span>
                    <ChevronDown size={14} strokeWidth={2} />
                </span>
                <span className="reader-title-meta">{t('reader.titleMeta', { page, total: TOTAL, status })}</span>
            </button>

            <div className="reader-topbar-actions">
                <span className="reader-pg-counter">
                    {String(page).padStart(2, '0')} / {TOTAL}
                </span>
                <button type="button" className={`reader-icon-btn ${saved ? 'primary' : ''}`} onClick={onToggleSaved} aria-label={t('reader.saveAria')}>
                    <Bookmark size={18} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    className={`reader-icon-btn ${commentsOpen ? 'primary' : ''}`}
                    onClick={onToggleComments}
                    aria-label={t('reader.commentsAria')}
                    title={t('reader.commentsAria')}
                >
                    <MessageSquare size={18} strokeWidth={2} />
                </button>
                <button type="button" className={`reader-icon-btn ${settingsOpen ? 'primary' : ''}`} onClick={onToggleSettings} aria-label={t('reader.settingsAria')}>
                    <Settings size={18} strokeWidth={2} />
                </button>
            </div>

            {chaptersOpen && <ChapterDropdown list={chaptersList} onPick={onPickChapter} onClose={onToggleChapters} />}
        </div>
    );
};
