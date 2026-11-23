import { useTranslation } from 'react-i18next';

import type { Review } from '../model/review.types';

import ReviewCard from './ReviewCard';

export type UserReviewCardActions = {
    onEdit?: () => void;
    onDelete?: () => void;
};

export interface UserReviewCardProps {
    review: Review;
    onOpenTitle: (titleId: string) => void;
    actions?: UserReviewCardActions;
}

/**
 * Adapta uma resenha de lista de usuário para o card centrado na obra.
 * É a fonte única de apresentação compartilhada por /reviews e /profile.
 */
export const UserReviewCard = ({ review, onOpenTitle, actions }: UserReviewCardProps) => {
    const { t } = useTranslation('rating');

    return (
        <ReviewCard
            subjectTitle={{
                label: review.titleName ?? t('myReviews.workPlaceholder', { id: review.titleId }),
                onClick: () => onOpenTitle(review.titleId),
            }}
            genres={review.genres}
            manga={{ id: review.titleId, title: review.titleName ?? '', cover: review.cover }}
            when={review.createdAt}
            edited={review.edited}
            updatedAt={review.updatedAt}
            rating={review.overallRating}
            title={review.reviewTitle}
            upvotes={review.upvotes ?? 0}
            downvotes={review.downvotes ?? 0}
            myVote={review.myVote ?? null}
            badge={review.top ? 'top' : null}
            spoiler={review.spoiler}
            onEdit={actions?.onEdit}
            onDelete={actions?.onDelete}
            reviewScores={{
                funRating: review.funRating,
                artRating: review.artRating,
                storylineRating: review.storylineRating,
                charactersRating: review.charactersRating,
                originalityRating: review.originalityRating,
                pacingRating: review.pacingRating,
            }}
        >
            {review.comment ?? ''}
        </ReviewCard>
    );
};

export default UserReviewCard;
