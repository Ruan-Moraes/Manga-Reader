import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

import { IconButton } from '@ui/IconButton';
import { ProgressBar } from '@ui/ProgressBar';
import { TOTAL_PAGES } from '../useChapterReader';

interface BottomToolbarProps {
    page: number;
    progress: number;
    chNum: string;
    titleId: string | undefined;
    onPrevPage: () => void;
    onNextPage: () => void;
    onScrub: (page: number) => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
}

export const BottomToolbar = forwardRef<HTMLDivElement, BottomToolbarProps>(
    ({ page, progress, onPrevPage, onNextPage, onScrub, onPrevChapter, onNextChapter }, ref) => {
        const { t } = useTranslation('manga');
        return (
            <div
                ref={ref}
                role="toolbar"
                aria-label={t('reader.toolbarAria')}
                className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-2 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm transition-opacity duration-200"
            >
                <IconButton icon={ChevronLeft} aria-label={t('reader.prevChapterAria')} variant="ghost" className="text-white" onClick={onPrevChapter} />
                <IconButton icon={ChevronUp} aria-label={t('reader.prevPageAria')} variant="ghost" className="text-white" onClick={onPrevPage} />

                <div className="flex flex-1 items-center gap-2">
                    <button
                        type="button"
                        aria-label={t('reader.pageSliderAria', {
                            current: page,
                            total: TOTAL_PAGES,
                        })}
                        aria-valuemin={1}
                        aria-valuemax={TOTAL_PAGES}
                        aria-valuenow={page}
                        role="slider"
                        className="flex-1"
                        onClick={e => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const ratio = (e.clientX - rect.left) / rect.width;
                            onScrub(Math.max(1, Math.min(TOTAL_PAGES, Math.round(ratio * TOTAL_PAGES))));
                        }}
                    >
                        <ProgressBar value={progress} />
                    </button>
                    <span className="shrink-0 text-mr-tiny text-white/60">
                        {page}/{TOTAL_PAGES}
                    </span>
                </div>

                <IconButton icon={ChevronRight} aria-label={t('reader.nextChapterAria')} variant="ghost" className="text-white" onClick={onNextChapter} />
                <IconButton icon={ChevronDown} aria-label={t('reader.nextPageAria')} variant="ghost" className="text-white" onClick={onNextPage} />
            </div>
        );
    },
);

BottomToolbar.displayName = 'BottomToolbar';
