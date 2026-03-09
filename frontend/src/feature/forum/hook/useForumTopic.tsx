import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getForumTopicById, getForumTopics, filterForumTopics } from '@feature/forum';
import type { ForumTopic } from '../type/forum.types';

const useForumTopic = () => {
    const { topicId } = useParams();

    const [topic, setTopic] = useState<ForumTopic | undefined>();
    const [relatedTopicsRaw, setRelatedTopicsRaw] = useState<ForumTopic[]>([]);

    useEffect(() => {
        if (!topicId) {
            setTopic(undefined);
            return;
        }

        getForumTopicById(topicId).then(setTopic).catch(() => setTopic(undefined));
    }, [topicId]);

    useEffect(() => {
        if (!topic) {
            setRelatedTopicsRaw([]);
            return;
        }

        getForumTopics(0, 50).then(page => setRelatedTopicsRaw(page.content));
    }, [topic]);

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
        return filterForumTopics(relatedTopicsRaw, {
            category: topic.category,
            sort: 'popular',
        })
            .filter(t => t.id !== topic.id)
            .slice(0, 5);
    }, [topic, relatedTopicsRaw]);

    return {
        topic,
        replySort,
        setReplySort,
        sortedReplies,
        relatedTopics,
    };
};

export default useForumTopic;
