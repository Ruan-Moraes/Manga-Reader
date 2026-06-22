import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { Meter } from '@ui/Meter';
import { Stars } from '@ui/Stars';

import type { RatingDistribution } from '../api/reviewService';

export interface RatingSummaryProps {
    dist: RatingDistribution;
    total: number;
    avg: number;
    activeStar: number | null;
    onFilterStar: (star: number | null) => void;
}

const pctOf = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/**
 * Resumo de avaliações: nota média + distribuição por estrela, com filtro clicável.
 * Domínio de review — reusável em qualquer tela que liste resenhas.
 */
export const RatingSummary = ({ dist, total, avg, activeStar, onFilterStar }: RatingSummaryProps) => {
    const { t } = useTranslation('rating');

    return (
        <section
            className="mb-6 flex flex-col gap-4 rounded-[12px] border border-[#333] bg-[#1c1c1d] p-4 sm:flex-row sm:items-center sm:gap-6"
            aria-label={t('reviews.summary.aria')}
        >
            <div className="flex flex-col items-center gap-1 sm:border-r sm:border-[#333] sm:pr-6">
                <p className="text-[clamp(48px,8vw,56px)] font-mr-extrabold leading-none text-mr-fg">{avg.toFixed(1)}</p>
                <Stars value={avg} size={18} />
                <p className="text-[13px] text-mr-fg-subtle">{t('reviews.ratingsCount', { count: total })}</p>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
                {([5, 4, 3, 2, 1] as const).map(star => {
                    const count = dist[`star${star}` as keyof RatingDistribution] as number;
                    const p = pctOf(count, total);
                    const active = activeStar === star;
                    return (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onFilterStar(active ? null : star)}
                            aria-pressed={active}
                            title={active ? t('reviews.summary.removeFilter') : t('reviews.summary.filterBy', { count: star })}
                            className={cn(
                                'flex items-center gap-2 rounded-mr-xs px-2 py-1 text-[13px] transition-colors',
                                active ? 'bg-mr-accent-25' : 'hover:bg-mr-secondary',
                            )}
                        >
                            <span className="flex w-8 shrink-0 items-center justify-end gap-0.5 text-mr-fg-subtle">
                                {star}
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="var(--mr-accent)" aria-hidden="true">
                                    <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
                                </svg>
                            </span>
                            <Meter value={p} height={9} trackClassName="bg-mr-gray-700" className="flex-1" />
                            <span className="w-8 text-right tabular-nums text-mr-fg-subtle">{p}%</span>
                            <span className="w-8 text-right tabular-nums text-mr-fg-subtle">{count}</span>
                        </button>
                    );
                })}

                {activeStar && (
                    <button
                        type="button"
                        className="mt-1 flex items-center gap-1.5 self-start rounded-mr-xs bg-mr-accent-25 px-2 py-1 text-[12px] font-mr-bold text-mr-accent hover:bg-mr-accent-50"
                        onClick={() => onFilterStar(null)}
                    >
                        <Check className="size-3" aria-hidden="true" />
                        {t('reviews.summary.clearFilterStar', { star: activeStar })}
                    </button>
                )}
            </div>
        </section>
    );
};

export default RatingSummary;
