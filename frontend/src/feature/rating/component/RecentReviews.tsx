import { type MangaRating } from '../type/rating.types';

import RatingStars from './RatingStars';

const MAX_VISIBLE_REVIEWS = 5;

type RecentReviewsProps = {
    ratings: MangaRating[];
    maxItems?: number;
};

const RecentReviews = ({
    ratings,
    maxItems = MAX_VISIBLE_REVIEWS,
}: RecentReviewsProps) => {
    return (
        <section className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary">
            <h3 className="font-bold">Avaliações recentes</h3>
            {ratings.slice(0, maxItems).map(review => (
                <article
                    key={review.id}
                    className="p-2 border rounded-xs border-tertiary"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                            {review.userName}
                        </span>
                        <RatingStars value={review.stars} size={12} />
                    </div>
                    {review.comment && (
                        <p className="mt-1 text-xs text-tertiary">
                            {review.comment}
                        </p>
                    )}
                </article>
            ))}
        </section>
    );
};

export default RecentReviews;
