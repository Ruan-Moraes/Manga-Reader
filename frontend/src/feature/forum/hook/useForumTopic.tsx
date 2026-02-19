import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getForumTopicByIdSync, filterForumTopics } from '@feature/forum';

const useForumTopic = () => {
    const { topicId } = useParams();

    const topic = useMemo(
        () => (topicId ? getForumTopicByIdSync(topicId) : undefined),
        [topicId],
    );

    const [replySort, setReplySort] = useState<'recent' | 'likes'>('recent');

    const sortedReplies = useMemo(() => {
        if (!topic) return [];
        return [...topic.replies].sort((a, b) => {
            if (replySort === 'likes') return b.likes - a.likes;
            return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
        });
    }, [topic, replySort]);

    const relatedTopics = useMemo(() => {
        if (!topic) return [];
        return filterForumTopics({ category: topic.category, sort: 'popular' })
            .filter(t => t.id !== topic.id)
            .slice(0, 5);
    }, [topic]);

    return {
        topic,
        replySort,
        setReplySort,
        sortedReplies,
        relatedTopics,
    };
};

export default useForumTopic;
