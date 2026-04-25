import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AppLink from '@shared/component/link/element/AppLink';
import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

import {
    RatingStars,
    getUserReviews,
    updateReview,
    deleteReview,
    type MangaRating,
} from '@feature/rating';

const ReviewCard = ({
    review,
    onUpdate,
    onDelete,
}: {
    review: MangaRating;
    onUpdate: (id: string, comment: string) => Promise<void>;
    onDelete: (id: string) => void;
}) => {
    const { t } = useTranslation('rating');
    const [comment, setComment] = useState(review.comment ?? '');
    const [saving, setSaving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const isDirty = comment !== (review.comment ?? '');

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(review.id, comment);
            showSuccessToast(t('myReviews.commentUpdated'));
        } catch {
            showErrorToast(t('myReviews.commentUpdateError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <article className="p-3 border rounded-xs border-tertiary">
            <div className="flex items-center justify-between gap-2">
                <AppLink
                    link={`title/${review.titleId}`}
                    text={
                        review.titleName ??
                        t('myReviews.workPlaceholder', { id: review.titleId })
                    }
                    className="text-sm font-medium"
                />
                <RatingStars value={review.overallRating} />
            </div>
            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full h-20 p-2 mt-2 text-sm border rounded-xs border-tertiary bg-secondary"
            />
            <div className="flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-3 py-1 text-xs border rounded-xs border-quaternary text-quaternary hover:bg-quaternary/20 disabled:opacity-50"
                        >
                            {saving
                                ? t('myReviews.saving')
                                : t('myReviews.save')}
                        </button>
                    )}
                </div>
                {confirming ? (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-quinary-default">
                            {t('myReviews.confirmPrompt')}
                        </span>
                        <button
                            onClick={() => {
                                onDelete(review.id);
                                setConfirming(false);
                            }}
                            className="px-2 py-0.5 border rounded-xs border-quinary-default text-quinary-default hover:bg-quinary-default/20"
                        >
                            {t('myReviews.confirm')}
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="px-2 py-0.5 border rounded-xs border-tertiary hover:bg-tertiary/20"
                        >
                            {t('myReviews.cancel')}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-3 py-1 text-xs border rounded-xs border-quinary-default hover:bg-quinary-default/20 text-quinary-default"
                    >
                        {t('myReviews.delete')}
                    </button>
                )}
            </div>
        </article>
    );
};

const MyReviews = () => {
    const { t } = useTranslation('rating');
    const [reviews, setReviews] = useState<MangaRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const loadReviews = useCallback(async (page = 0, append = false) => {
        try {
            if (!append) setLoading(true);
            const result = await getUserReviews(page);
            setReviews(prev =>
                append ? [...prev, ...result.content] : result.content,
            );
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

    const handleUpdate = async (id: string, comment: string) => {
        await updateReview({ id, comment });
        setReviews(prev =>
            prev.map(r => (r.id === id ? { ...r, comment } : r)),
        );
    };

    const handleDelete = async (id: string) => {
        const prev = reviews;
        setReviews(reviews.filter(r => r.id !== id));
        try {
            await deleteReview(id);
            showSuccessToast(t('myReviews.reviewRemoved'));
        } catch {
            setReviews(prev);
            showErrorToast(t('myReviews.reviewRemoveError'));
        }
    };

    return (
        <>
            <Header />
            <MainContent>
                <section>
                    <h2 className="text-xl font-bold">
                        {t('myReviews.title')}
                    </h2>
                    <p className="text-sm text-tertiary">
                        {t('myReviews.subtitle')}
                    </p>
                </section>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-32 border rounded-xs border-tertiary animate-pulse bg-tertiary/10"
                            />
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <span className="text-4xl">&#9997;</span>
                        <p className="text-sm text-tertiary">
                            {t('myReviews.emptyState')}
                        </p>
                    </div>
                ) : (
                    <>
                        <section className="flex flex-col gap-3">
                            {reviews.map(review => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </section>
                        {hasMore && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() =>
                                        loadReviews(currentPage + 1, true)
                                    }
                                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                >
                                    {t('myReviews.loadMore')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default MyReviews;
