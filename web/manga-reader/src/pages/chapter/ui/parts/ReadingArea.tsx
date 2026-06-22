import { type RefObject } from 'react';

import { TOTAL_PAGES } from '../../model/readerData';
import type { Direction, Fit, ReadMode } from '../../model/useChapterReader';
import { EndOfChapter } from './EndOfChapter';
import { ReaderPagePlaceholder } from './ReaderPagePlaceholder';

interface EndProps {
    chapter: number;
    rating: number;
    onRate: (n: number) => void;
    ratingAverage: number;
    ratingCount: number;
    onNext: () => void;
    onBack: () => void;
    onForum: () => void;
}

interface ReadingAreaProps {
    mode: ReadMode;
    direction: Direction;
    fit: Fit;
    gap: number;
    chapter: number;
    page: number;
    listRef: RefObject<HTMLDivElement | null>;
    end: EndProps;
}

const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

export const ReadingArea = ({ mode, direction, fit, gap, chapter, page, listRef, end }: ReadingAreaProps) => {
    const rowDir = direction === 'rtl' ? 'row-reverse' : 'row';

    return (
        <div className="reader-area" data-mode={mode} style={{ ['--reader-gap' as string]: `${gap}px` }}>
            {mode === 'vertical' && (
                <div className="reader-pages-vertical" ref={listRef}>
                    {PAGES.map(n => (
                        <ReaderPagePlaceholder key={n} n={n} chapter={chapter} />
                    ))}
                    <EndOfChapter {...end} />
                </div>
            )}

            {mode === 'paged' && (
                <div className="reader-paged-stage" data-fit={fit} style={{ flexDirection: rowDir }}>
                    {page > TOTAL_PAGES ? <EndOfChapter {...end} /> : <ReaderPagePlaceholder n={page} chapter={chapter} />}
                </div>
            )}

            {mode === 'double' && (
                <div className="reader-double-stage" style={{ flexDirection: rowDir }}>
                    <ReaderPagePlaceholder n={page} chapter={chapter} />
                    {page + 1 <= TOTAL_PAGES && <ReaderPagePlaceholder n={page + 1} chapter={chapter} />}
                </div>
            )}
        </div>
    );
};
