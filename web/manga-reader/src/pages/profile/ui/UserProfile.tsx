import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import formatRelativeDate from '@shared/service/util/formatRelativeDate';

import { MangaCard } from '@entities/manga';
import { ReviewCard, RatingModal, useUpdateReview, useDeleteReview, type Review } from '@entities/review';
import { GroupCard } from '@entities/group';

import { PageContainer } from '@ui/PageContainer';
import { Tabs } from '@ui/Tabs';
import { Skeleton } from '@ui/Skeleton';
import { EmptyState } from '@ui/EmptyState';

import { useFollow } from '@entities/user';
import { useBookmark } from '@features/library';

import useProfileData from '../model/useProfileData';

import UserProfileHeader from './parts/UserProfileHeader';
import FollowListModal from './parts/FollowListModal';
import ActivityTab from './parts/ActivityTab';

const ProfileReviewCard = ({ review, onEdit, onDelete }: { review: Review; onEdit?: () => void; onDelete?: () => void }) => (
    <ReviewCard
        author={{ name: review.userName }}
        when={formatRelativeDate(review.createdAt)}
        rating={review.overallRating}
        title={review.reviewTitle}
        upvotes={review.upvotes ?? 0}
        downvotes={review.downvotes ?? 0}
        myVote={null}
        onVote={() => {}}
        badge={review.top ? 'top' : null}
        spoiler={review.spoiler}
        manga={{ id: review.titleId, title: review.titleName ?? '' }}
        onEdit={onEdit}
        onDelete={onDelete}
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

const UserProfile = () => {
    const { t } = useTranslation('user');

    const { userId } = useParams();
    const navigate = useAppNavigate();

    const [tab, setTab] = useState('overview');
    const [followList, setFollowList] = useState<'followers' | 'following' | null>(null);

    const { loading, error, profile, isOwn, profileUserId, isFollowedByMe, readingNow, completed, reviews, recommendations, groupsFollowed } =
        useProfileData(userId);

    const follow = useFollow(profileUserId, { following: isFollowedByMe, followersCount: profile.followers });
    const { isSaved, toggleBookmark } = useBookmark();

    const [editing, setEditing] = useState<Review | null>(null);
    const updateReviewMutation = useUpdateReview(editing?.titleId);
    const deleteReviewMutation = useDeleteReview();

    const ownerActions = (r: Review) => (isOwn ? { onEdit: () => setEditing(r), onDelete: () => deleteReviewMutation.mutate(r.id) } : {});

    const tabItems = [
        { value: 'overview', label: t('profile.tabs.overview') },
        { value: 'reading', label: t('profile.tabs.readingNow') },
        { value: 'completed', label: t('profile.tabs.completedList') },
        { value: 'reviews', label: t('profile.tabs.reviews') },
        { value: 'activity', label: t('profile.tabs.history') },
    ];

    if (loading) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <Skeleton className="mb-6 h-[260px] w-full rounded-mr-xs" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[2/3] w-full rounded-mr-xs" />
                    ))}
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <EmptyState illustration="pensando" title={t('details.loadError', { defaultValue: 'Não foi possível carregar o perfil.' })} />
            </PageContainer>
        );
    }

    return (
        <PageContainer asMain size="default" paddingY="md">
            <UserProfileHeader
                profile={{ ...profile, followers: follow.followersCount }}
                isOwn={isOwn}
                following={follow.following}
                onFollowToggle={() => void follow.toggle()}
                onShowFollowers={() => setFollowList('followers')}
                onShowFollowing={() => setFollowList('following')}
            />

            <FollowListModal userId={profileUserId} kind={followList} onClose={() => setFollowList(null)} />

            <div className="mb-6">
                <Tabs items={tabItems} value={tab} onChange={setTab} variant="underline" />
            </div>

            {tab === 'overview' && (
                <div className="flex flex-col gap-8">
                    <section>
                        <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.stats.reading')}</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {readingNow.map(m => (
                                <MangaCard
                                    key={m.id}
                                    manga={m}
                                    onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                                    inLibrary={isSaved(m.id)}
                                    onToggleLibrary={() => toggleBookmark(m.id)}
                                />
                            ))}
                        </div>
                    </section>
                    {recommendations.length > 0 && (
                        <section>
                            <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.tabs.recommendations')}</p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {recommendations.map(m => (
                                    <MangaCard
                                        key={m.id}
                                        manga={m}
                                        onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                                        inLibrary={isSaved(m.id)}
                                        onToggleLibrary={() => toggleBookmark(m.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    <section>
                        <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.tabs.reviews')}</p>
                        <div className="flex flex-col gap-3">
                            {reviews.map(r => (
                                <ProfileReviewCard key={r.id} review={r} {...ownerActions(r)} />
                            ))}
                        </div>
                    </section>
                    {/* TODO(tech-debt): grupos seguidos ainda mock — ver docs/tech-debt.md */}
                    {groupsFollowed.length > 0 && (
                        <section>
                            <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.tabs.groups', { defaultValue: 'Grupos' })}</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {groupsFollowed.map(g => (
                                    <GroupCard key={g.id} group={g} onClick={() => navigate(ROUTES.GROUP_DETAIL(g.id))} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {tab === 'reading' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {readingNow.map(m => (
                        <MangaCard
                            key={m.id}
                            manga={m}
                            onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                            inLibrary={isSaved(m.id)}
                            onToggleLibrary={() => toggleBookmark(m.id)}
                        />
                    ))}
                </div>
            )}

            {tab === 'completed' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {completed.map(m => (
                        <MangaCard
                            key={m.id}
                            manga={m}
                            onClick={() => navigate(ROUTES.TITLE_DETAIL(m.id))}
                            inLibrary={isSaved(m.id)}
                            onToggleLibrary={() => toggleBookmark(m.id)}
                        />
                    ))}
                </div>
            )}

            {tab === 'reviews' &&
                (reviews.length === 0 ? (
                    <EmptyState illustration="pensando" title={t('profile.empty.reviews', { defaultValue: 'Nenhuma resenha ainda.' })} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {reviews.map(r => (
                            <ProfileReviewCard key={r.id} review={r} {...ownerActions(r)} />
                        ))}
                    </div>
                ))}

            {tab === 'activity' && <ActivityTab profileUserId={profileUserId} />}

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
        </PageContainer>
    );
};

export default UserProfile;
