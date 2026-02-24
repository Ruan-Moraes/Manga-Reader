import { useCommentPagination } from '@feature/comment';
import formatRelativeDate from '@shared/service/util/formatRelativeDate';

import { type MangaRating } from '../type/rating.types';

import RatingStars from './RatingStars';

const REVIEWS_PER_PAGE = 5;

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
    Diversion: { icon: '🎉', label: 'Diversão' },
    Art: { icon: '🎨', label: 'Arte' },
    Storyline: { icon: '📖', label: 'Enredo' },
    Characters: { icon: '👤', label: 'Personagens' },
    Originality: { icon: '💡', label: 'Originalidade' },
    Pacing: { icon: '⏱', label: 'Ritmo' },
};

type RecentReviewsProps = {
    ratings: MangaRating[];
};

const RecentReviews = ({ ratings }: RecentReviewsProps) => {
    const { visibleItems, hasMore, loadMore } = useCommentPagination(
        ratings,
        REVIEWS_PER_PAGE,
    );

    if (ratings.length === 0) {
        return (
            <section className="flex flex-col gap-2 p-4 border rounded-xs border-tertiary">
                <h3 className="text-sm font-bold">Avaliações recentes</h3>
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-xs text-center text-tertiary">
                        Nenhuma avaliação ainda. Seja o primeiro!
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary">
            <h3 className="text-sm font-bold">Avaliações recentes</h3>

            {visibleItems.map(review => {
                const categoryEntries = review.categoryRatings
                    ? Object.entries(review.categoryRatings)
                    : [];

                const overallAvg =
                    categoryEntries.length > 0
                        ? categoryEntries.reduce(
                              (sum, [, val]) => sum + val,
                              0,
                          ) / categoryEntries.length
                        : review.stars;

                const percentage = Math.round((overallAvg / 5) * 100);

                return (
                    <article
                        key={review.id}
                        className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary bg-secondary/40"
                    >
                        {/* User header */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-tertiary shrink-0">
                                {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate">
                                    {review.userName}
                                </span>
                                <span className="text-[0.65rem] text-tertiary">
                                    {formatRelativeDate(review.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Category ratings grid */}
                        {categoryEntries.length > 0 && (
                            <div className="grid grid-cols-2 pt-1 gap-x-4 gap-y-1">
                                {categoryEntries.map(([key, value]) => {
                                    const meta = CATEGORY_META[key];
                                    if (!meta) return null;

                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between gap-1"
                                        >
                                            <span className="flex items-center gap-1 text-[0.65rem]">
                                                <span>{meta.icon}</span>
                                                <span className="text-tertiary">
                                                    {meta.label}
                                                </span>
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <RatingStars
                                                    value={value}
                                                    size={8}
                                                />
                                                <span className="text-[0.6rem] font-semibold min-w-[1.2rem] text-right">
                                                    {value.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Overall average */}
                        <div className="flex items-center justify-between pt-1 border-t border-tertiary">
                            <span className="text-xs font-bold">
                                Média geral
                            </span>
                            <div className="flex items-center gap-2">
                                <RatingStars
                                    value={overallAvg}
                                    size={12}
                                    showValue
                                />
                                <span className="text-[0.65rem] text-tertiary">
                                    ({percentage}%)
                                </span>
                            </div>
                        </div>

                        {/* Comment */}
                        {review.comment && (
                            <p className="pt-1 text-xs text-tertiary">
                                {review.comment}
                            </p>
                        )}
                    </article>
                );
            })}

            {/* Load more */}
            {hasMore && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="w-full py-2 text-xs font-semibold text-center transition-colors border cursor-pointer rounded-xs border-tertiary hover:border-quaternary-default"
                >
                    Carregar mais avaliações
                </button>
            )}
        </section>
    );
};

export default RecentReviews;
