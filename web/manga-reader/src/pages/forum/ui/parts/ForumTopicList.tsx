import { useTranslation } from 'react-i18next';

import { ForumTopicCard, formatRelativeDate, type ForumTopic } from '@entities/forum';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';
import { Pagination } from '@ui/Pagination';

interface ForumTopicListProps {
    topics: ForumTopic[];
    allTopicsCount: number;
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    onTopicClick: (id: string) => void;
}

export const ForumTopicList = ({ topics, allTopicsCount, page, totalPages, onPageChange, onTopicClick }: ForumTopicListProps) => {
    const { t } = useTranslation('forum');

    const pinned = topics.filter(t => t.isPinned);
    const regular = topics.filter(t => !t.isPinned);

    if (topics.length === 0 && allTopicsCount === 0) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" height={88} className="rounded-mr-xs" />
                ))}
            </div>
        );
    }

    if (topics.length === 0) {
        return <EmptyState illustration="duvida" title={t('page.emptyState')} description={t('page.emptyDescription')} />;
    }

    return (
        <>
            {pinned.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                    {pinned.map(topic => (
                        <ForumTopicCard
                            key={topic.id}
                            id={topic.id}
                            title={topic.title}
                            category={topic.category}
                            author={{
                                name: topic.author.name,
                                avatar: topic.author.avatar,
                            }}
                            postedAt={formatRelativeDate(topic.createdAt)}
                            lastReplyAt={formatRelativeDate(topic.lastActivityAt)}
                            replies={topic.replyCount}
                            views={topic.viewCount}
                            pinned={topic.isPinned}
                            spoiler={topic.category === 'Spoilers'}
                            onClick={() => onTopicClick(topic.id)}
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2">
                {regular.map(topic => (
                    <ForumTopicCard
                        key={topic.id}
                        id={topic.id}
                        title={topic.title}
                        category={topic.category}
                        author={{
                            name: topic.author.name,
                            avatar: topic.author.avatar,
                        }}
                        postedAt={formatRelativeDate(topic.createdAt)}
                        lastReplyAt={formatRelativeDate(topic.lastActivityAt)}
                        replies={topic.replyCount}
                        views={topic.viewCount}
                        pinned={topic.isPinned}
                        spoiler={topic.category === 'Spoilers'}
                        onClick={() => onTopicClick(topic.id)}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="mt-8">
                    <Pagination page={page} total={totalPages} onChange={onPageChange} />
                </div>
            )}
        </>
    );
};
