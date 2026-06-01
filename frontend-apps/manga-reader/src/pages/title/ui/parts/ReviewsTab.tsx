import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Stars } from '@ui/Stars';
import { Button } from '@ui/Button';
import { Select } from '@ui/Select';
import { ReviewCard, type MangaRating, type RatingDistribution } from '@entities/rating';
import { EmptyState } from '@ui/EmptyState';


type Average = { average: number; count: number };

type ReviewsTabProps = {
    ratings: MangaRating[];
    average: Average;
    distribution: RatingDistribution;
    onWriteReview: () => void;
};

const ReviewsTab = ({ ratings, average, distribution, onWriteReview }: ReviewsTabProps) => {
    const { t } = useTranslation('manga');
    const [reviewSort, setReviewSort] = useState('top');
    const [votes, setVotes] = useState<Record<string, 'up' | null>>({});

    const sortOptions = [
        { value: 'top', label: t('titleDetails.sort.top') },
        { value: 'recent', label: t('titleDetails.sort.recent') },
        { value: 'controversial', label: t('titleDetails.sort.controversial') },
    ];

    return (
        <>
            <div className="mb-6 flex items-center gap-6">
                <div className="text-center">
                    <p className="text-[3rem] font-mr-extrabold leading-none text-mr-fg">{average.average.toFixed(1)}</p>
                    <Stars value={average.average} size={14} />
                    <p className="mt-1 text-mr-tiny text-mr-fg-subtle">
                        {average.count.toLocaleString()} {t('titleDetails.votes')}
                    </p>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                    {([5, 4, 3, 2, 1] as const).map(star => {
                        const count = distribution[`star${star}` as keyof RatingDistribution];
                        const percent = distribution.total > 0 ? Math.round((count / distribution.total) * 100) : 0;

                        return (
                            <div key={star} className="flex items-center gap-2">
                                <span className="w-3 text-mr-tiny text-mr-fg-subtle">{star}</span>
                                <div className="h-1.5 flex-1 rounded-full bg-mr-tertiary/20">
                                    <div className="h-full rounded-full bg-mr-accent" style={{ width: `${percent}%` }} />
                                </div>
                                <span className="w-8 text-right text-mr-tiny tabular-nums text-mr-fg-subtle">{percent}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <Button variant="primary" onClick={onWriteReview}>
                    {t('titleDetails.writeReview')}
                </Button>
                <Select value={reviewSort} onChange={e => setReviewSort(e.target.value)} options={sortOptions} className="w-40" />
            </div>

            <div className="flex flex-col gap-3">
                {ratings.length === 0 ? (
                    <EmptyState illustration="pensando" title={t('titleDetails.noReviews')} />
                ) : (
                    ratings.map(r => (
                        <ReviewCard
                            key={r.id}
                            author={{ name: r.userName }}
                            when={r.createdAt}
                            rating={r.overallRating}
                            upvotes={0}
                            myVote={votes[r.id] ?? null}
                            onVote={() =>
                                setVotes(p => ({
                                    ...p,
                                    [r.id]: p[r.id] === 'up' ? null : 'up',
                                }))
                            }
                            badge={null}
                        >
                            {r.comment ?? ''}
                        </ReviewCard>
                    ))
                )}
            </div>
        </>
    );
};

export default ReviewsTab;
