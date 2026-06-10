import { ROUTES } from '@shared/constant/ROUTES';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Stars } from '@ui/Stars';
import { Textarea } from '@ui/Textarea';
import { Button } from '@ui/Button';
import { Skeleton } from '@ui/Skeleton';
import { EmptyState } from '@ui/EmptyState';
import { Card } from '@ui/Card';

import { showSuccessToast, showErrorToast } from '@shared/service/util/toastService';

import { getUserReviews, updateReview, deleteReview, type Review } from '@entities/review';

const ReviewCard = ({
    review,
    onUpdate,
    onDelete,
}: {
    review: Review;
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
        <Card variant="default" className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <Link to={ROUTES.TITLE_DETAIL(review.titleId)} className="text-mr-small font-mr-bold text-mr-fg hover:text-mr-accent transition-colors">
                    {review.titleName ?? t('myReviews.workPlaceholder', { id: review.titleId })}
                </Link>
                <Stars value={review.overallRating} size={16} />
            </div>

            <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder={t('myReviews.commentPlaceholder', 'Escreva sua resenha...')}
                className="mb-3"
            />

            <div className="flex items-center justify-between gap-2">
                <div>
                    {isDirty && (
                        <Button variant="raised" size="sm" loading={saving} onClick={handleSave}>
                            {saving ? t('myReviews.saving') : t('myReviews.save')}
                        </Button>
                    )}
                </div>

                {confirming ? (
                    <div className="flex items-center gap-2">
                        <span className="text-mr-tiny text-mr-danger">{t('myReviews.confirmPrompt')}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onDelete(review.id);
                                setConfirming(false);
                            }}
                            className="text-mr-danger"
                        >
                            {t('myReviews.confirm')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                            {t('myReviews.cancel')}
                        </Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-mr-danger">
                        {t('myReviews.delete')}
                    </Button>
                )}
            </div>
        </Card>
    );
};

const MyReviews = () => {
    const { t } = useTranslation('rating');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const loadReviews = useCallback(async (page = 0, append = false) => {
        try {
            if (!append) setLoading(true);
            const result = await getUserReviews(page);
            setReviews(prev => (append ? [...prev, ...result.content] : result.content));
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
        setReviews(prev => prev.map(r => (r.id === id ? { ...r, comment } : r)));
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
        <PageContainer asMain size="narrow" paddingY="md">
            <SectionHeader
                eyebrow={t('myReviews.eyebrow')}
                title={t('myReviews.title', 'Minhas resenhas')}
                meta={t('myReviews.subtitle', 'Edite ou remova suas avaliações')}
                className="mb-6"
            />

            {loading && (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={140} className="rounded-mr-md" />
                    ))}
                </div>
            )}

            {!loading && reviews.length === 0 && (
                <EmptyState
                    illustration="pensando"
                    title={t('myReviews.emptyState', 'Nenhuma resenha ainda')}
                    description={t('myReviews.emptyDesc')}
                    action={
                        <Button variant="primary" onClick={() => window.location.assign('/genres')}>
                            {t('myReviews.discoverWorks')}
                        </Button>
                    }
                />
            )}

            {!loading && reviews.length > 0 && (
                <>
                    <div className="flex flex-col gap-3">
                        {reviews.map(review => (
                            <ReviewCard key={review.id} review={review} onUpdate={handleUpdate} onDelete={handleDelete} />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="mt-6 flex justify-center">
                            <Button variant="raised" onClick={() => loadReviews(currentPage + 1, true)}>
                                {t('myReviews.loadMore', 'Carregar mais')}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default MyReviews;
