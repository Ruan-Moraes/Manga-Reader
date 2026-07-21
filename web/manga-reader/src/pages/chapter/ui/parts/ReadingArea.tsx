import { type RefObject } from 'react';

import type { ReaderPage } from '@entities/chapter';
import type { ImageQuality } from '@entities/user';

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
    hasNext: boolean;
    onNext: () => void;
    onBack: () => void;
    onForum: () => void;
}

interface ReadingAreaProps {
    mode: ReadMode;
    direction: Direction;
    fit: Fit;
    gap: number;
    quality: ImageQuality;
    preload: number;
    chapter: number;
    page: number;
    listRef: RefObject<HTMLDivElement | null>;
    end: EndProps;
    /** Páginas reais (gateway). Ausente ⇒ fallback nos placeholders legados. */
    pages?: ReaderPage[];
}

const FALLBACK_PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

export const ReadingArea = ({ mode, direction, fit, gap, quality, preload, chapter, page, listRef, end, pages }: ReadingAreaProps) => {
    const rowDir = direction === 'rtl' ? 'row-reverse' : 'row';

    const hasRealPages = Boolean(pages?.length);
    const total = hasRealPages ? pages!.length : TOTAL_PAGES;
    // Numeração POSICIONAL (1..N): `order` pode ter lacunas (ex.: página em
    // reprocessamento excluída do público) e o scrubber/goToPage navegam por
    // índice — usar `order` como número dessincronizaria página e imagem.
    const srcOf = (n: number): string | undefined => {
        const readerPage = hasRealPages ? pages![n - 1] : undefined;
        if (!readerPage) return undefined;
        return quality === 'LOW' ? readerPage.thumbnailUrl || readerPage.imageUrl : readerPage.imageUrl;
    };
    const numbers = hasRealPages ? pages!.map((_, i) => i + 1) : FALLBACK_PAGES;

    return (
        <div className="reader-area" data-mode={mode} style={{ ['--reader-gap' as string]: `${gap}px` }}>
            {mode === 'vertical' && (
                <div className="reader-pages-vertical" ref={listRef}>
                    {numbers.map(n => (
                        <ReaderPagePlaceholder key={n} n={n} chapter={chapter} src={srcOf(n)} eager={n <= page + preload} quality={quality} />
                    ))}
                    <EndOfChapter {...end} />
                </div>
            )}

            {mode === 'paged' && (
                <div className="reader-paged-stage" data-fit={fit} style={{ flexDirection: rowDir }}>
                    {page > total ? <EndOfChapter {...end} /> : <ReaderPagePlaceholder n={page} chapter={chapter} src={srcOf(page)} eager quality={quality} />}
                </div>
            )}

            {mode === 'double' && (
                <div className="reader-double-stage" style={{ flexDirection: rowDir }}>
                    <ReaderPagePlaceholder n={page} chapter={chapter} src={srcOf(page)} eager quality={quality} />
                    {page + 1 <= total && <ReaderPagePlaceholder n={page + 1} chapter={chapter} src={srcOf(page + 1)} eager quality={quality} />}
                </div>
            )}
        </div>
    );
};
