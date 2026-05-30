import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Tabs } from '@ui/Tabs';
import { MangaCard } from '@ui/MangaCard';
import { ReviewCard } from '@ui/ReviewCard';
import { GroupCard } from '@ui/GroupCard';

import UserProfileHeader from './parts/UserProfileHeader';
import ActivityTab from './parts/ActivityTab';
import { PROFILES, READING_NOW, COMPLETED, REVIEWS, GROUPS_FOLLOWED, ACTIVITY } from '@mock/userProfile';

const UserProfile = () => {
    const { handle } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('user');
    const [tab, setTab] = useState('overview');
    const [following, setFollowing] = useState(false);
    const [votes, setVotes] = useState<Record<number, 'up' | null>>({});

    const profile = PROFILES[handle ?? 'me'] ?? PROFILES['me'];
    const isOwn = !!profile.isOwn;

    const tabItems = [
        { value: 'overview', label: t('profile.tabs.overview') },
        { value: 'reading', label: t('profile.tabs.readingNow') },
        { value: 'completed', label: t('profile.tabs.completedList') },
        { value: 'reviews', label: t('profile.tabs.reviews') },
        { value: 'activity', label: t('profile.tabs.history') },
    ];

    return (
        <PageContainer asMain size="default" paddingY="md">
            <UserProfileHeader profile={profile} isOwn={isOwn} following={following} onFollowToggle={() => setFollowing(f => !f)} />

            <div className="mb-6">
                <Tabs items={tabItems} value={tab} onChange={setTab} variant="underline" />
            </div>

            {tab === 'overview' && (
                <div className="flex flex-col gap-8">
                    <section>
                        <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.stats.reading')}</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {READING_NOW.map(m => (
                                <MangaCard key={m.id} manga={m} progress={m.progress} onClick={() => navigate(`/titles/${m.id}`)} />
                            ))}
                        </div>
                    </section>
                    <section>
                        <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.tabs.recommendations')}</p>
                        <div className="flex flex-col gap-3">
                            {REVIEWS.map((r, i) => (
                                <ReviewCard
                                    key={i}
                                    author={r.author}
                                    when={r.when}
                                    rating={r.rating}
                                    title={r.title}
                                    upvotes={r.upvotes}
                                    myVote={votes[i] ?? null}
                                    onVote={() =>
                                        setVotes(p => ({
                                            ...p,
                                            [i]: p[i] === 'up' ? null : 'up',
                                        }))
                                    }
                                    badge={r.badge}
                                    manga={r.manga}
                                >
                                    {r.body}
                                </ReviewCard>
                            ))}
                        </div>
                    </section>
                    <section>
                        <p className="mr-label mb-3 text-mr-fg-subtle">{t('profile.tabs.comments')}</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {GROUPS_FOLLOWED.map(g => (
                                <GroupCard key={g.id} group={g} onClick={() => navigate(`/groups/${g.id}`)} />
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {tab === 'reading' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {READING_NOW.map(m => (
                        <MangaCard key={m.id} manga={m} progress={m.progress} onClick={() => navigate(`/titles/${m.id}`)} />
                    ))}
                </div>
            )}

            {tab === 'completed' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {COMPLETED.map(m => (
                        <MangaCard key={m.id} manga={m} onClick={() => navigate(`/titles/${m.id}`)} />
                    ))}
                </div>
            )}

            {tab === 'reviews' && (
                <div className="flex flex-col gap-3">
                    {REVIEWS.map((r, i) => (
                        <ReviewCard
                            key={i}
                            author={r.author}
                            when={r.when}
                            rating={r.rating}
                            title={r.title}
                            upvotes={r.upvotes}
                            myVote={votes[i + 10] ?? null}
                            onVote={() =>
                                setVotes(p => ({
                                    ...p,
                                    [i + 10]: p[i + 10] === 'up' ? null : 'up',
                                }))
                            }
                            badge={r.badge}
                            manga={r.manga}
                        >
                            {r.body}
                        </ReviewCard>
                    ))}
                </div>
            )}

            {tab === 'activity' && <ActivityTab activity={ACTIVITY} profileName={profile.name} />}
        </PageContainer>
    );
};

export default UserProfile;
