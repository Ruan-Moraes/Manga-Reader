import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { TOTAL } from '../../model/useChapterReader';

interface ReaderBottombarProps {
    page: number;
    fillPct: number;
    hidden: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    onScrub: (page: number) => void;
}

export const ReaderBottombar = ({ page, fillPct, hidden, onPrevPage, onNextPage, onPrevChapter, onNextChapter, onScrub }: ReaderBottombarProps) => {
    const { t } = useTranslation('manga');
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    const pageFromClientX = (clientX: number) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return page;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(ratio * (TOTAL - 1)) + 1;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onScrub(pageFromClientX(e.clientX));
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        onScrub(pageFromClientX(e.clientX));
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        setDragging(false);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    return (
        <div className={`reader-bottombar ${hidden ? 'hidden' : ''}`} role="toolbar" aria-label={t('reader.toolbarAria')}>
            <div className="reader-bb-group">
                <button type="button" className="reader-icon-btn" onClick={onPrevChapter} aria-label={t('reader.prevChapterAria')} title={t('reader.prevChapterAria')}>
                    <ChevronLeft size={14} strokeWidth={2} />
                    <ChevronLeft size={14} strokeWidth={2} />
                </button>
                <button type="button" className="reader-icon-btn" onClick={onPrevPage} aria-label={t('reader.prevPageAria')}>
                    <ChevronLeft size={18} strokeWidth={2} />
                </button>
            </div>

            <div className="reader-bb-scrubber">
                <div
                    ref={trackRef}
                    className={`reader-scrubber-track ${dragging ? 'dragging' : ''}`}
                    role="slider"
                    tabIndex={0}
                    aria-label={t('reader.pageSliderAria', { current: page, total: TOTAL })}
                    aria-valuemin={1}
                    aria-valuemax={TOTAL}
                    aria-valuenow={page}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onKeyDown={e => {
                        if (e.key === 'ArrowRight') onScrub(Math.min(TOTAL, page + 1));
                        if (e.key === 'ArrowLeft') onScrub(Math.max(1, page - 1));
                    }}
                >
                    <div className="reader-scrubber-fill" style={{ width: `${fillPct}%` }} />
                    <div className="reader-scrubber-thumb" style={{ left: `${fillPct}%` }} />
                </div>
                <div className="reader-scrubber-stamp">
                    <strong>{String(page).padStart(2, '0')}</strong> / {TOTAL}
                </div>
            </div>

            <div className="reader-bb-group">
                <button type="button" className="reader-icon-btn primary" onClick={onNextPage} aria-label={t('reader.nextPageAria')}>
                    <ChevronRight size={18} strokeWidth={2} />
                </button>
                <button type="button" className="reader-icon-btn" onClick={onNextChapter} aria-label={t('reader.nextChapterAria')} title={t('reader.nextChapterAria')}>
                    <ChevronRight size={14} strokeWidth={2} />
                    <ChevronRight size={14} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
};
