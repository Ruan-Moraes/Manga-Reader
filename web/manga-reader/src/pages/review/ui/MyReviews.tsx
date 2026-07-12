import { ROUTES } from '@shared/constant/ROUTES';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Compass, Star } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Stars } from '@ui/Stars';
import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';
import Illustration from '@ui/Illustration';
import { cn } from '@shared/lib/cn';

import { showSuccessToast } from '@shared/service/util/toastService';

import { getUserReviews, updateReview, deleteReview, ReviewCard, RatingModal, ReviewSortDropdown, type Review, type ReviewSortKey } from '@entities/review';

/** Ordena resenhas no cliente (sobre as já carregadas), espelhando o backend. */
const SORT_FN: Record<ReviewSortKey, (a: Review, b: Review) => number> = {
    recent: (a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0),
    high: (a, b) => b.overallRating - a.overallRating,
    low: (a, b) => a.overallRating - b.overallRating,
    top: (a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0),
};

const MyReviews = () => {
    const { t } = useTranslation('rating');

    const navigate = useAppNavigate();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const [sort, setSort] = useState<ReviewSortKey>('recent');
    const [filterStar, setFilterStar] = useState<number | null>(null);

    const [editing, setEditing] = useState<Review | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);

    const loadReviews = useCallback(async (page = 0, append = false) => {
        try {
            if (!append) setLoading(true);

            const result = await getUserReviews(page);

            setReviews(prev => (append ? [...prev, ...result.content] : result.content));
            setTotal(result.totalElements);
            setCurrentPage(page);
            setHasMore(!result.last);
        } catch {
            if (!append) setReviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    // Estatísticas do header (calculadas sobre as resenhas carregadas; o total de
    // obras avaliadas vem de `totalElements` do backend).
    const stats = useMemo(() => {
        const count = reviews.length;

        const avg = count ? reviews.reduce((s, r) => s + r.overallRating, 0) / count : 0;

        const withComment = reviews.filter(r => r.comment && r.comment.trim()).length;

        const chapters = reviews.reduce((s, r) => s + (r.chaptersRead ?? 0), 0);

        return { avg, withComment, chapters };
    }, [reviews]);

    const distByStar = useMemo(() => {
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        reviews.forEach(r => {
            const star = Math.max(1, Math.min(5, Math.round(r.overallRating)));

            dist[star] += 1;
        });

        return dist;
    }, [reviews]);

    const visible = useMemo(() => {
        const list = filterStar ? reviews.filter(r => Math.round(r.overallRating) === filterStar) : [...reviews];

        return list.sort(SORT_FN[sort]);
    }, [reviews, filterStar, sort]);

    const handleEditSubmit = async (data: {
        funRating: number;
        artRating: number;
        storylineRating: number;
        charactersRating: number;
        originalityRating: number;
        pacingRating: number;
        comment?: string;
        reviewTitle?: string;
        spoiler?: boolean;
    }) => {
        if (!editing) return;

        setSavingEdit(true);

        try {
            const updated = await updateReview({ id: editing.id, ...data });

            setReviews(prev => prev.map(r => (r.id === editing.id ? { ...r, ...updated } : r)));

            setEditing(null);

            showSuccessToast(t('myReviews.commentUpdated'));
        } catch {
            // Toast de erro já disparado pelo interceptor Axios (httpInterceptors.ts).
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (id: string) => {
        const prev = reviews;

        setReviews(reviews.filter(r => r.id !== id));

        setTotal(n => Math.max(0, n - 1));

        try {
            await deleteReview(id);

            showSuccessToast(t('myReviews.reviewRemoved'));
        } catch {
            setReviews(prev);

            setTotal(prev.length);
        }
    };

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader
                eyebrow={t('myReviews.eyebrow')}
                title={t('myReviews.title', 'Minhas resenhas')}
                meta={t('myReviews.subtitle', 'Edite ou remova suas avaliações')}
                className="mb-6"
            />

            {loading && (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={160} className="rounded-mr-xs" />
                    ))}
                </div>
            )}

            {!loading && reviews.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <Illustration type="pensando" alt="" width={120} height={120} />
                    <div>
                        <h2 className="text-[18px] font-mr-extrabold text-mr-fg">{t('myReviews.emptyState', 'Nenhuma resenha ainda')}</h2>
                        <p className="mt-1 text-mr-body text-mr-fg-muted">{t('myReviews.emptyDesc')}</p>
                    </div>
                    <Button variant="primary" icon={Compass} onClick={() => navigate(ROUTES.CATALOG)}>
                        {t('myReviews.discoverWorks')}
                    </Button>
                </div>
            )}

            {!loading && reviews.length > 0 && (
                <>
                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3">
                            <p className="text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-fg-subtle">{t('myReviews.stats.reviews')}</p>
                            <p className="mt-1 text-[22px] font-mr-extrabold text-mr-fg">{total}</p>
                            <p className="text-mr-tiny text-mr-fg-subtle">{t('myReviews.stats.reviewsSub')}</p>
                        </div>
                        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3">
                            <p className="text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-fg-subtle">{t('myReviews.stats.avg')}</p>
                            <p className="mt-1 text-[22px] font-mr-extrabold text-mr-accent">{stats.avg.toFixed(1)}</p>
                            <Stars value={stats.avg} size={12} />
                        </div>
                        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3">
                            <p className="text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-fg-subtle">{t('myReviews.stats.withComment')}</p>
                            <p className="mt-1 text-[22px] font-mr-extrabold text-mr-fg">{stats.withComment}</p>
                            <p className="text-mr-tiny text-mr-fg-subtle">{t('myReviews.stats.ofLoaded', { count: reviews.length })}</p>
                        </div>
                        <div className="rounded-mr-xs border border-mr-border bg-mr-surface p-3">
                            <p className="text-mr-tiny font-mr-extrabold uppercase tracking-wide text-mr-fg-subtle">{t('myReviews.stats.chapters')}</p>
                            <p className="mt-1 text-[22px] font-mr-extrabold text-mr-fg">{stats.chapters}</p>
                            <p className="text-mr-tiny text-mr-fg-subtle">{t('myReviews.stats.chaptersSub')}</p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 rounded-mr-full border border-mr-chip-border bg-mr-chip px-2.5 py-1 text-mr-tiny font-mr-bold text-mr-fg-subtle">
                            <Trans t={t} i18nKey="reviews.reviewsCountBold" count={visible.length} components={[<strong key="0" className="text-mr-fg" />]} />
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setFilterStar(null)}
                                className={cn(
                                    'rounded-mr-full border px-2.5 py-1 text-mr-tiny font-mr-bold transition-colors',
                                    !filterStar
                                        ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                        : 'border-mr-chip-border bg-mr-chip text-mr-fg-subtle hover:border-mr-accent-50',
                                )}
                            >
                                {t('myReviews.filter.all')}
                            </button>
                            {[5, 4, 3, 2, 1].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFilterStar(filterStar === star ? null : star)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-mr-full border px-2.5 py-1 text-mr-tiny font-mr-bold transition-colors',
                                        filterStar === star
                                            ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                            : 'border-mr-chip-border bg-mr-chip text-mr-fg-subtle hover:border-mr-accent-50',
                                    )}
                                >
                                    {star}
                                    <Star className="size-3" aria-hidden="true" />
                                    <span className="opacity-70">{distByStar[star]}</span>
                                </button>
                            ))}
                        </div>

                        <div className="ml-auto">
                            <ReviewSortDropdown sort={sort} onChange={setSort} />
                        </div>
                    </div>

                    {/* Lista */}
                    {visible.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <p className="text-mr-body font-mr-bold text-mr-fg">{t('reviews.empty.noMatch', { star: filterStar })}</p>
                            <button type="button" onClick={() => setFilterStar(null)} className="text-mr-small font-mr-bold text-mr-accent hover:underline">
                                {t('reviews.empty.clearFilter')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {visible.map(r => (
                                <ReviewCard
                                    key={r.id}
                                    subjectTitle={{
                                        label: r.titleName ?? t('myReviews.workPlaceholder', { id: r.titleId }),
                                        onClick: () => navigate(ROUTES.TITLE_DETAIL(r.titleId)),
                                    }}
                                    genres={r.genres}
                                    manga={{ id: r.titleId, title: r.titleName ?? '', cover: r.cover }}
                                    when={r.createdAt}
                                    edited={r.edited}
                                    updatedAt={r.updatedAt}
                                    rating={r.overallRating}
                                    title={r.reviewTitle}
                                    upvotes={r.upvotes ?? 0}
                                    downvotes={r.downvotes ?? 0}
                                    myVote={r.myVote ?? null}
                                    badge={r.top ? 'top' : null}
                                    spoiler={r.spoiler}
                                    onEdit={() => setEditing(r)}
                                    onDelete={() => handleDelete(r.id)}
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

                            {hasMore && (
                                <Button variant="ghost" className="self-center" onClick={() => loadReviews(currentPage + 1, true)}>
                                    {t('myReviews.loadMore', 'Carregar mais')}
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}

            {editing && (
                <RatingModal
                    isModalOpen
                    closeModal={() => setEditing(null)}
                    onSubmitRating={handleEditSubmit}
                    isSubmitting={savingEdit}
                    titleName={editing.titleName}
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
                />
            )}
        </PageContainer>
    );
};

export default MyReviews;
