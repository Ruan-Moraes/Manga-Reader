import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';
import { ReviewCard, type Review } from '@entities/review';
import { useUserModalContext } from '@entities/user';

export interface ReviewsListProps {
    reviews: Review[];
    filterStar: number | null;
    isLoggedIn: boolean;
    onWriteReview: () => void;
    onClearFilter: () => void;
    onVote: (id: string, vote: 'up' | 'down') => void;
    /** Ações de dono (editar/excluir) para a resenha, quando aplicável. */
    ownerActions: (review: Review) => { onEdit?: () => void; onDelete?: () => void };
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
}

/** Lista paginada de resenhas com estados vazios (sem resenhas / sem match de filtro). */
export const ReviewsList = ({
    reviews,
    filterStar,
    isLoggedIn,
    onWriteReview,
    onClearFilter,
    onVote,
    ownerActions,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: ReviewsListProps) => {
    const { t } = useTranslation('rating');
    const { t: tUser } = useTranslation('user');

    const { openUserModalById } = useUserModalContext();

    if (reviews.length === 0 && filterStar == null) {
        return (
            <div className="flex flex-col gap-3">
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
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-[15px] font-mr-bold text-mr-fg">{t('reviews.empty.noMatch', { star: filterStar })}</p>
                    <button type="button" onClick={onClearFilter} className="text-[13px] font-mr-bold text-mr-accent-fg hover:underline">
                        {t('reviews.empty.clearFilter')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {reviews.map(r => (
                <ReviewCard
                    key={r.id}
                    author={{ name: r.userName }}
                    onClickAuthor={() => openUserModalById(r.userId, { name: r.userName })}
                    authorProfileLabel={tUser('modal.openProfileAria', { name: r.userName })}
                    when={r.createdAt}
                    edited={r.edited}
                    updatedAt={r.updatedAt}
                    rating={r.overallRating}
                    title={r.reviewTitle}
                    upvotes={r.upvotes ?? 0}
                    downvotes={r.downvotes ?? 0}
                    myVote={r.myVote ?? null}
                    onVote={vote => onVote(r.id, vote)}
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
                <Button variant="ghost" className="self-center" loading={isFetchingNextPage} disabled={isFetchingNextPage} onClick={onLoadMore}>
                    {t('reviews.loadMore')}
                </Button>
            )}
        </div>
    );
};

export default ReviewsList;
