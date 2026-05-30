import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Direction, Fit, ReadMode } from '../useChapterReader';
import { PAGE_PLACEHOLDERS, TOTAL_PAGES } from '../useChapterReader';
import { EndCard } from './EndCard';

interface ReadingAreaProps {
    mode: ReadMode;
    dir: Direction;
    fit: Fit;
    chNum: string;
    page: number;
    isEnd: boolean;
    titleId: string | undefined;
    ratingGiven: number;
    comment: string;
    onPrevPage: () => void;
    onNextPage: () => void;
    onRate: (v: number) => void;
    onComment: (v: string) => void;
    onNavigateNext: () => void;
    onNavigateBack: () => void;
}

const fitMaxWidth = (fit: Fit): number | 'none' => {
    if (fit === 'width') return 800;
    if (fit === 'height') return 600;
    return 'none';
};

export const ReadingArea = ({
    mode,
    dir,
    fit,
    chNum,
    page,
    isEnd,
    ratingGiven,
    comment,
    onPrevPage,
    onNextPage,
    onRate,
    onComment,
    onNavigateNext,
    onNavigateBack,
}: ReadingAreaProps) => {
    const { t } = useTranslation('manga');
    const endCardProps = {
        chNum,
        rating: ratingGiven,
        onRate,
        comment,
        onComment,
        onNext: onNavigateNext,
        onBack: onNavigateBack,
    };

    if (mode === 'vertical') {
        return (
            <div className="mx-auto flex flex-col items-center" style={{ gap: 8, maxWidth: fitMaxWidth(fit) }}>
                {PAGE_PLACEHOLDERS.map(pg => (
                    <div key={pg.num} data-page={pg.num}>
                        <div
                            className="w-full"
                            style={{ height: 600, background: pg.gradient }}
                            role="img"
                            aria-label={t('reader.pageAria', {
                                page: pg.num,
                                chNum,
                            })}
                        />
                    </div>
                ))}

                <div className="w-full max-w-[640px] py-16">
                    <EndCard {...endCardProps} />
                </div>
            </div>
        );
    }

    const pageMaxWidth = mode === 'double' ? 360 : 560;
    const leftRailAction = dir === 'rtl' ? onNextPage : onPrevPage;
    const rightRailAction = dir === 'rtl' ? onPrevPage : onNextPage;

    return (
        <div
            className="relative flex min-h-[calc(100vh-112px)] items-center justify-center px-4"
            style={fit === 'height' ? { maxWidth: '70vh', maxHeight: '80vh', margin: '0 auto' } : {}}
        >
            <button
                type="button"
                onClick={leftRailAction}
                aria-label={t('reader.prevRegionAria')}
                className="absolute left-0 top-0 hidden h-full w-16 cursor-pointer items-center justify-center opacity-0 transition-opacity hover:opacity-100 lg:flex"
            >
                <ChevronLeft className="size-8 text-white/60" />
            </button>

            <div className={`flex gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                    className="aspect-[2/3] flex-1"
                    style={{
                        background: PAGE_PLACEHOLDERS[page - 1]?.gradient ?? '#111',
                        minWidth: 240,
                        maxWidth: pageMaxWidth,
                    }}
                    role="img"
                    aria-label={t('reader.pageAria', { page, chNum })}
                />
                {mode === 'double' && page + 1 <= TOTAL_PAGES && (
                    <div
                        className="aspect-[2/3] flex-1"
                        style={{
                            background: PAGE_PLACEHOLDERS[page]?.gradient ?? '#111',
                            minWidth: 240,
                            maxWidth: 360,
                        }}
                        role="img"
                        aria-label={t('reader.pageAria', {
                            page: page + 1,
                            chNum,
                        })}
                    />
                )}
            </div>

            <button
                type="button"
                onClick={rightRailAction}
                aria-label={t('reader.nextRegionAria')}
                className="absolute right-0 top-0 hidden h-full w-16 cursor-pointer items-center justify-center opacity-0 transition-opacity hover:opacity-100 lg:flex"
            >
                <ChevronRight className="size-8 text-white/60" />
            </button>

            {isEnd && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-[480px] p-6">
                        <EndCard {...endCardProps} />
                    </div>
                </div>
            )}
        </div>
    );
};
