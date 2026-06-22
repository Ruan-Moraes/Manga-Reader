import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';
import {
    RatingModal,
    RatingSummary,
    ReviewSortDropdown,
    useReviews,
    useReviewVote,
    useUpdateReview,
    useDeleteReview,
    type Review,
    type RatingDistribution,
    type ReviewSortKey,
} from '@entities/review';
import { useAuth } from '@features/auth';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';

import { ReviewsList } from './ReviewsList';

type Average = { average: number; count: number };

type ReviewsTabProps = {
    titleId: string;
    average: Average;
    distribution: RatingDistribution;
    onWriteReview: () => void;
    isLoggedIn?: boolean;
};

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
            <ReviewSortDropdown sort={sort} onChange={onSort} />
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
                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
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

            <ReviewsList
                reviews={reviews}
                filterStar={filterStar}
                isLoggedIn={isLoggedIn}
                onWriteReview={onWriteReview}
                onClearFilter={() => setFilterStar(null)}
                onVote={handleVote}
                ownerActions={ownerActions}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
            />

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
                    onSubmitRating={async data => {
                        await updateReviewMutation.mutateAsync({ id: editing.id, ...data });
                        setEditing(null);
                    }}
                />
            )}
        </>
    );
};

export default ReviewsTab;
