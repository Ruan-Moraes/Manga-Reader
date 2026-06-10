// TODO: Refatorar esse componente. Muitas coisas internas pode ser compartilhado por todo o projeto e muitas responsabilidaes.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Filter, Plus } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { Button } from '@ui/Button';
import { Meter } from '@ui/Meter';
import { Stars } from '@ui/Stars';
import Illustration from '@ui/Illustration';
import {
    ReviewCard,
    RatingModal,
    useReviews,
    useReviewVote,
    useUpdateReview,
    useDeleteReview,
    REVIEW_SORT_KEYS,
    type Review,
    type RatingDistribution,
    type ReviewSortKey,
} from '@entities/review';
import { useAuth } from '@features/auth';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';

type Average = { average: number; count: number };

type ReviewsTabProps = {
    titleId: string;
    average: Average;
    distribution: RatingDistribution;
    onWriteReview: () => void;
    isLoggedIn?: boolean;
};

function pctOf(n: number, total: number) {
    return total > 0 ? Math.round((n / total) * 100) : 0;
}

function RatingSummary({
    dist,
    total,
    avg,
    activeStar,
    onFilterStar,
}: {
    dist: RatingDistribution;
    total: number;
    avg: number;
    activeStar: number | null;
    onFilterStar: (star: number | null) => void;
}) {
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
}

function SortDropdown({ sort, onChange }: { sort: ReviewSortKey; onChange: (s: ReviewSortKey) => void }) {
    const { t } = useTranslation('rating');

    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex h-9 items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-secondary px-3 text-[13px] font-mr-bold text-mr-fg hover:border-mr-accent-50"
            >
                <Filter className="size-3.5" aria-hidden="true" />
                <span>{t(`reviews.sort.${sort}`)}</span>
                <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <ul
                        role="listbox"
                        className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-mr-md border border-[#444] bg-[#1a1a1b] py-1 shadow-[0_12px_32px_rgba(0,0,0,.55)]"
                    >
                        {REVIEW_SORT_KEYS.map(key => (
                            <li
                                key={key}
                                role="option"
                                aria-selected={sort === key}
                                onClick={() => {
                                    onChange(key);
                                    setOpen(false);
                                }}
                                className={cn(
                                    'flex cursor-pointer items-center justify-between px-3 py-2 text-[13px] transition-colors',
                                    sort === key ? 'bg-mr-accent-25 font-mr-bold text-mr-accent' : 'text-mr-fg hover:bg-mr-secondary',
                                )}
                            >
                                {t(`reviews.sort.${key}`)}
                                {sort === key && <Check className="size-3.5 text-mr-accent" aria-hidden="true" />}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function ReviewsToolbar({ count, sort, onSort, onWrite }: { count: number; sort: ReviewSortKey; onSort: (s: ReviewSortKey) => void; onWrite: () => void }) {
    const { t } = useTranslation('rating');

    return (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Button size="sm" variant="primary" icon={Plus} onClick={onWrite}>
                    {t('reviews.write')}
                </Button>
                <span className="text-[13px] text-mr-fg-subtle">{t('reviews.reviewsCount', { count })}</span>
            </div>
            <SortDropdown sort={sort} onChange={onSort} />
        </div>
    );
}

function LoginPrompt({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
    const { t } = useTranslation('rating');

    return (
        <div className="mb-4 flex flex-col items-center gap-4 rounded-mr-lg border border-[#333] bg-[#1c1c1d] p-6 text-center sm:flex-row sm:text-left">
            <Illustration type="pensando" alt="" width={92} height={92} className="shrink-0" />
            <div className="min-w-0">
                <h3 className="text-[16px] font-mr-extrabold text-mr-fg">{t('reviews.login.title')}</h3>
                <p className="mt-1 text-[14px] text-mr-fg-muted">{t('reviews.login.desc')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" onClick={onLogin}>
                        {t('reviews.login.signIn')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRegister}>
                        {t('reviews.login.signUp')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

const ReviewsTab = ({ titleId, average, distribution, onWriteReview, isLoggedIn = false }: ReviewsTabProps) => {
    const { t } = useTranslation('rating');

    const navigate = useAppNavigate();

    const [sort, setSort] = useState<ReviewSortKey>('top');
    const [filterStar, setFilterStar] = useState<number | null>(null);

    // Resenhas paginadas (load-more) com ordenação/filtro server-side (DT-47).
    const { reviews, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviews(titleId, { sort, star: filterStar });

    const voteMutation = useReviewVote(titleId);

    const { user } = useAuth();
    const currentUserId = user?.id;

    const [editing, setEditing] = useState<Review | null>(null);
    const updateReviewMutation = useUpdateReview(titleId);
    const deleteReviewMutation = useDeleteReview(titleId);

    const handleVote = (id: string, vote: 'up' | 'down') => {
        // Não chama o backend se não autenticado ou se o usuário vota na própria resenha.
        if (!currentUserId) return;

        const review = reviews.find(r => r.id === id);
        if (!review || review.userId === currentUserId) return;

        voteMutation.mutate({ id, value: vote, currentVote: review.myVote ?? null });
    };

    const ownerActions = (r: Review) =>
        currentUserId && r.userId === currentUserId ? { onEdit: () => setEditing(r), onDelete: () => deleteReviewMutation.mutate(r.id) } : {};

    return (
        <>
            <RatingSummary dist={distribution} total={distribution.total} avg={average.average} activeStar={filterStar} onFilterStar={setFilterStar} />

            {isLoggedIn ? (
                <ReviewsToolbar count={distribution.total} sort={sort} onSort={setSort} onWrite={onWriteReview} />
            ) : (
                <LoginPrompt onLogin={() => navigate(ROUTES.LOGIN)} onRegister={() => navigate(ROUTES.SIGN_UP)} />
            )}

            <div className="flex flex-col gap-3">
                {reviews.length === 0 && filterStar == null ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                        <Illustration type="pensando" alt="" width={120} height={120} />
                        <div>
                            <h3 className="text-[18px] font-mr-extrabold text-mr-fg">{t('reviews.empty.title')}</h3>
                            <p className="mt-1 text-[14px] text-mr-fg-muted">{t('reviews.empty.desc')}</p>
                        </div>
                        {isLoggedIn && (
                            <Button size="sm" variant="primary" icon={Plus} onClick={onWriteReview}>
                                {t('reviews.write')}
                            </Button>
                        )}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <p className="text-[15px] font-mr-bold text-mr-fg">{t('reviews.empty.noMatch', { star: filterStar })}</p>
                        <button type="button" onClick={() => setFilterStar(null)} className="text-[13px] font-mr-bold text-mr-accent hover:underline">
                            {t('reviews.empty.clearFilter')}
                        </button>
                    </div>
                ) : (
                    <>
                        {reviews.map(r => (
                            <ReviewCard
                                key={r.id}
                                author={{ name: r.userName }}
                                when={r.createdAt}
                                edited={r.edited}
                                updatedAt={r.updatedAt}
                                rating={r.overallRating}
                                title={r.reviewTitle}
                                upvotes={r.upvotes ?? 0}
                                downvotes={r.downvotes ?? 0}
                                myVote={r.myVote ?? null}
                                onVote={vote => handleVote(r.id, vote)}
                                badge={r.top ? 'top' : null}
                                spoiler={r.spoiler}
                                {...ownerActions(r)}
                                reviewScores={{
                                    funRating: r.funRating,
                                    artRating: r.artRating,
                                    storylineRating: r.storylineRating,
                                    charactersRating: r.charactersRating,
                                    originalityRating: r.originalityRating,
                                    pacingRating: r.pacingRating,
                                }}
                            >
                                {r.comment ?? ''}
                            </ReviewCard>
                        ))}

                        {hasNextPage && (
                            <Button
                                variant="ghost"
                                className="self-center"
                                loading={isFetchingNextPage}
                                disabled={isFetchingNextPage}
                                onClick={() => fetchNextPage()}
                            >
                                {t('reviews.loadMore')}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {editing && (
                <RatingModal
                    isModalOpen
                    closeModal={() => setEditing(null)}
                    titleName={editing.titleName}
                    isSubmitting={updateReviewMutation.isPending}
                    initial={{
                        funRating: editing.funRating,
                        artRating: editing.artRating,
                        storylineRating: editing.storylineRating,
                        charactersRating: editing.charactersRating,
                        originalityRating: editing.originalityRating,
                        pacingRating: editing.pacingRating,
                        comment: editing.comment,
                        reviewTitle: editing.reviewTitle,
                        spoiler: editing.spoiler,
                    }}
                    onSubmitRating={data => updateReviewMutation.mutate({ id: editing.id, ...data }, { onSuccess: () => setEditing(null) })}
                />
            )}
        </>
    );
};

export default ReviewsTab;
