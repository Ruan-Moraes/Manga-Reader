import { useCallback } from 'react';

import { type MangaRating } from '../type/rating.types';

import RatingStars from './RatingStars';

import { useCommentPagination } from '@feature/comment';
import CommentUser from '@feature/comment/component/header/CommentUser';

import { type User, useUserModalContext, UserModal } from '@feature/user';

import DarkButton from '@shared/component/button/DarkButton.tsx';

const REVIEWS_PER_PAGE = 5;

const CATEGORY_META: Record<string, { icon: string; label: string }> = {
    Diversion: { icon: '🎉', label: 'Diversão:' },
    Art: { icon: '🖌️', label: 'Arte:' },
    Storyline: { icon: '📚', label: 'Enredo:' },
    Characters: { icon: '🧑‍🤝‍🧑', label: 'Personagens:' },
    Originality: { icon: '✨', label: 'Originalidade:' },
    Pacing: { icon: '🏃‍♂️', label: 'Ritmo:' },
};

type RecentReviewsProps = {
    ratings: MangaRating[];
};

const RecentReviews = ({ ratings }: RecentReviewsProps) => {
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
                <h3 className="text-sm font-bold">Avaliações recentes</h3>
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-xs text-center text-tertiary">
                        Nenhuma avaliação ainda. Seja o primeiro!
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-2 p-2 rounded-xs bg-secondary border border-tertiary">
            <UserModal />
            <h3 className="text-sm font-bold">Avaliações recentes</h3>

            {visibleItems.map(review => {
                const categoryEntries = review.categoryRatings
                    ? Object.entries(review.categoryRatings)
                    : [];

                const overallAvg =
                    categoryEntries.length > 0
                        ? categoryEntries.reduce(
                              (sum, [, val]) => sum + val,
                              0,
                          ) / categoryEntries.length
                        : review.stars;

                return (
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
                        {categoryEntries.length > 0 && (
                            <div className="grid grid-cols-2 pt-1 gap-x-4 gap-y-2">
                                {categoryEntries.map(([key, value]) => {
                                    const meta = CATEGORY_META[key];

                                    if (!meta) return null;

                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between gap-1"
                                        >
                                            <span className="flex items-center gap-1 text-[0.65rem]">
                                                <span>{meta.icon}</span>
                                                <span className="text-tertiary">
                                                    {meta.label}
                                                </span>
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <RatingStars
                                                    value={value}
                                                    size={8}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="border border-tertiary rounded-xs"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">
                                Média geral:
                            </span>
                            <div className="flex items-center gap-x-4 gap-y-2">
                                <RatingStars value={overallAvg} size={12} />
                            </div>
                        </div>
                        {review.comment && (
                            <p className="pt-1 text-xs text-tertiary">
                                {review.comment}
                            </p>
                        )}
                    </article>
                );
            })}
            {hasMore && (
                <DarkButton
                    onClick={loadMore}
                    text="Carregar mais avaliações"
                    className="border border-tertiary"
                />
            )}
        </section>
    );
};

export default RecentReviews;
