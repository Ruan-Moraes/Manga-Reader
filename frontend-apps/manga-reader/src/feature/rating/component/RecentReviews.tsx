import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { type MangaRating } from '../type/rating.types';

import RatingStars from './RatingStars';

import { useCommentPagination } from '@feature/comment';
import CommentUser from '@feature/comment/component/header/CommentUser';

import { type User, useUserModalContext, UserModal } from '@feature/user';

import DarkButton from '@shared/component/button/DarkButton.tsx';

const REVIEWS_PER_PAGE = 5;

const CATEGORY_META: {
    key: keyof MangaRating;
    icon: string;
    i18nKey: string;
}[] = [
    { key: 'funRating', icon: '🎉', i18nKey: 'fun' },
    { key: 'artRating', icon: '🖌️', i18nKey: 'art' },
    { key: 'storylineRating', icon: '📚', i18nKey: 'storyline' },
    { key: 'charactersRating', icon: '🧑‍🤝‍🧑', i18nKey: 'characters' },
    { key: 'originalityRating', icon: '✨', i18nKey: 'originality' },
    { key: 'pacingRating', icon: '🏃‍♂️', i18nKey: 'pacing' },
];

type RecentReviewsProps = {
    ratings: MangaRating[];
};

const RecentReviews = ({ ratings }: RecentReviewsProps) => {
    const { t } = useTranslation('rating');
    const { visibleItems, hasMore, loadMore } = useCommentPagination(
        ratings,
        REVIEWS_PER_PAGE,
    );

    const { openUserModal, setUserData } = useUserModalContext();

    const handleClickProfile = useCallback(
        (user: User): void => {
            setUserData({
                id: user.id || 'system-generated-id',
                moderator: user.moderator,
                member: user.member,
                name: user.name,
                photo: user.photo || '',
                bio: user.bio,
                socialMediasLinks: user.socialMediasLinks,
                statistics: user.statistics,
                recommendedTitles: user.recommendedTitles,
            });

            openUserModal();
        },
        [openUserModal, setUserData],
    );

    if (ratings.length === 0) {
        return (
            <section className="flex flex-col gap-2 p-4 border rounded-xs border-tertiary">
                <h3 className="text-sm font-bold">{t('recent.title')}</h3>
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-xs text-center text-tertiary">
                        {t('recent.empty')}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-2 p-2 rounded-xs bg-secondary border border-tertiary">
            <UserModal />
            <h3 className="text-sm font-bold">{t('recent.title')}</h3>

            {visibleItems.map(review => (
                <article
                    key={review.id}
                    className="flex flex-col gap-2 p-2 border rounded-xs border-tertiary bg-primary-default"
                >
                    <CommentUser
                        size="sm"
                        user={{ name: review.userName }}
                        createdAt={review.createdAt}
                        onClickProfile={handleClickProfile}
                    />
                    <div className="grid grid-cols-2 pt-1 gap-x-4 gap-y-2">
                        {CATEGORY_META.map(meta => {
                            const value = review[meta.key] as number;

                            return (
                                <div
                                    key={meta.key}
                                    className="flex items-center justify-between gap-1"
                                >
                                    <span className="flex items-center gap-1 text-[0.65rem]">
                                        <span>{meta.icon}</span>
                                        <span className="text-tertiary">
                                            {t(`categories.${meta.i18nKey}`)}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <RatingStars value={value} size={8} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border border-tertiary rounded-xs"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{t('recent.overallAverage')}</span>
                        <div className="flex items-center gap-x-4 gap-y-2">
                            <RatingStars
                                value={review.overallRating}
                                size={12}
                            />
                        </div>
                    </div>
                    {review.comment && (
                        <p className="pt-1 text-xs text-tertiary">
                            {review.comment}
                        </p>
                    )}
                </article>
            ))}
            {hasMore && (
                <DarkButton
                    onClick={loadMore}
                    text={t('recent.loadMore')}
                    className=""
                />
            )}
        </section>
    );
};

export default RecentReviews;
