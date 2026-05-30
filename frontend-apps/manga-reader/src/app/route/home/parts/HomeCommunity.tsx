import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { ForumTopicCard } from '@ui/ForumTopicCard';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';
import { formatRelativeDate, type ForumTopic } from '@feature/forum';

type HomeCommunityProps = {
    topics: ForumTopic[];
};

const HomeCommunity = ({ topics }: HomeCommunityProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                eyebrow={t('community.eyebrow')}
                title={t('community.title')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/forum')}>
                        {t('community.viewForum')}
                    </Button>
                }
                className="mb-6"
            />
            {topics.length === 0 ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={88} className="rounded-mr-md" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        {topics.map(topic => (
                            <ForumTopicCard
                                key={topic.id}
                                id={topic.id}
                                title={topic.title}
                                category={topic.category}
                                author={{
                                    name: topic.author.name,
                                    avatar: topic.author.avatar,
                                }}
                                replies={topic.replyCount}
                                views={topic.viewCount}
                                pinned={topic.isPinned}
                                postedAt={formatRelativeDate(topic.createdAt)}
                                onClick={() => navigate(`/forum/topic/${topic.id}`)}
                            />
                        ))}
                    </div>
                    <div className="mt-4">
                        <Button variant="raised" onClick={() => navigate('/forum')}>
                            {t('community.viewForumCta')}
                        </Button>
                    </div>
                </>
            )}
        </section>
    );
};

export default HomeCommunity;
