import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, MessageSquare, Settings, ChevronLeft } from 'lucide-react';

import { IconButton } from '@ui/IconButton';
import { CHROME_HEIGHT, TOTAL_PAGES } from '../useChapterReader';

interface ReaderChromeProps {
    titleId: string | undefined;
    chNum: string;
    page: number;
    saved: boolean;
    onBack: () => void;
    onSaveToggle: () => void;
    onCommentsToggle: () => void;
    onOpenSettings: () => void;
}

export const ReaderChrome = forwardRef<HTMLDivElement, ReaderChromeProps>(
    ({ titleId, chNum, page, saved, onBack, onSaveToggle, onCommentsToggle, onOpenSettings }, ref) => {
        const { t } = useTranslation('manga');
        return (
            <div
                ref={ref}
                style={{ height: CHROME_HEIGHT }}
                className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-black/80 px-3 backdrop-blur-sm transition-opacity duration-200"
            >
                <IconButton icon={ChevronLeft} aria-label={t('reader.backAria')} variant="ghost" onClick={onBack} className="text-white hover:text-mr-accent" />

                <button type="button" onClick={() => {}} className="flex flex-1 flex-col items-start leading-none">
                    <span className="max-w-[180px] truncate text-mr-tiny font-mr-bold text-mr-accent">{titleId === '1' ? 'Berserk' : `Título ${titleId}`}</span>
                    <span className="text-[11px] text-white/60">
                        {t('reader.chapterAbbr')} {chNum} · {t('reader.pageAbbr')} {page}/{TOTAL_PAGES}
                    </span>
                </button>

                <span className="hidden text-mr-tiny text-white/60 md:block">
                    {String(page).padStart(2, '0')}/{String(TOTAL_PAGES).padStart(2, '0')}
                </span>

                <IconButton
                    icon={Bookmark}
                    aria-label={t('reader.saveAria')}
                    variant="ghost"
                    onClick={onSaveToggle}
                    className={saved ? 'text-mr-accent' : 'text-white'}
                />
                <IconButton icon={MessageSquare} aria-label={t('reader.commentsAria')} variant="ghost" onClick={onCommentsToggle} className="text-white" />
                <IconButton icon={Settings} aria-label={t('reader.settingsAria')} variant="ghost" onClick={onOpenSettings} className="text-white" />
            </div>
        );
    },
);

ReaderChrome.displayName = 'ReaderChrome';
