import { useCallback, useEffect, useState } from 'react';

import { requireAuth } from '@shared/service/util/requireAuth';
import { getStoredSession } from '@shared/service/session';

import { createForumReply, getForumTopicById, voteForumTopic } from '@entities/forum';
import type { ForumAuthor, ForumTopic, ReplyData, TopicData } from '@entities/forum';
import { likeComment, dislikeComment, getUserCommentVotes } from '@entities/comment';

/**
 * Loads a forum topic + its replies for the topic-detail page and wires the
 * standardized vote model (topic vote via /api/forum/{id}/vote; reply votes via
 * /api/comments/{id}/vote — replies are unified comments on the backend).
 *
 * Vote handlers trust the server response (the backend toggles), so no
 * optimistic bookkeeping is needed.
 */
export default function useTopicDetail(topicId: string | undefined) {
    const [topic, setTopic] = useState<TopicData | undefined>();
    const [replies, setReplies] = useState<ReplyData[]>([]);
    const [replyVotes, setReplyVotes] = useState<Record<string, 'up' | 'down' | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!topicId) {
            setTopic(undefined);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        getForumTopicById(topicId)
            .then(async apiTopic => {
                if (cancelled) return;

                setTopic(toTopicData(apiTopic));
                const mappedReplies = (apiTopic.replies ?? []).map(r => toReplyData(r, apiTopic.author.id));
                setReplies(mappedReplies);

                if (getStoredSession() && mappedReplies.length > 0) {
                    // Falha aqui não pode derrubar o tópico (o catch externo trata
                    // "tópico não encontrado") — votos apenas ficam sem destaque.
                    try {
                        const votes = await getUserCommentVotes(mappedReplies.map(r => r.id));
                        if (!cancelled) setReplyVotes(votes);
                    } catch {
                        /* estado de voto indisponível; segue sem destaque */
                    }
                }
            })
            .catch(() => {
                if (!cancelled) setTopic(undefined);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [topicId]);

    const voteTopic = useCallback(
        async (value: 'up' | 'down') => {
            if (!topic || !requireAuth('votar')) return;

            try {
                const result = await voteForumTopic(topic.id, value);
                setTopic(prev =>
                    prev && { ...prev, upvotes: result.upvotes, downvotes: result.downvotes, myVote: result.myVote ?? null });
            } catch {
                // Voto rejeitado (ex.: 409 no próprio post) — estado do servidor não mudou.
            }
        },
        [topic],
    );

    const postReply = useCallback(
        async (content: string) => {
            if (!topic || !content.trim() || !requireAuth('responder')) return;

            try {
                // O endpoint devolve o tópico completo atualizado (replyCount + replies).
                const updated = await createForumReply(topic.id, content);
                setTopic(toTopicData(updated));
                setReplies((updated.replies ?? []).map(r => toReplyData(r, updated.author.id)));
            } catch {
                // Resposta rejeitada (ex.: 400 em tópico trancado) — thread inalterada.
            }
        },
        [topic],
    );

    const voteReply = useCallback(async (replyId: string, value: 'up' | 'down') => {
        if (!requireAuth('votar')) return;

        try {
            const result = await (value === 'up' ? likeComment(replyId) : dislikeComment(replyId));
            setReplies(prev =>
                prev.map(r => (r.id === replyId ? { ...r, upvotes: result.upvotes, downvotes: result.downvotes } : r)));
            setReplyVotes(prev => ({ ...prev, [replyId]: result.myVote ?? null }));
        } catch {
            // Voto rejeitado (ex.: 409 no próprio post) — estado do servidor não mudou.
        }
    }, []);

    return { topic, replies, replyVotes, loading, voteTopic, voteReply, postReply };
}

// ---------------------------------------------------------------------------
// Mappers — API → page view-model
// ---------------------------------------------------------------------------

const toAuthor = (author: ForumAuthor, topicAuthorId: string): TopicData['author'] => ({
    userId: author.id,
    name: author.name,
    handle: `@${author.name.replace(/\s+/g, '').toLowerCase()}`,
    badge: author.role === 'moderator' || author.role === 'admin'
        ? 'mod'
        : author.id === topicAuthorId ? 'author' : undefined,
});

const toTopicData = (t: ForumTopic): TopicData => ({
    id: t.id,
    title: t.title,
    category: t.category,
    pinned: t.isPinned,
    author: toAuthor(t.author, ''),
    postedAt: t.createdAt,
    updatedAt: t.updatedAt,
    edited: t.edited,
    views: t.viewCount,
    replies: t.replyCount,
    live: 0,
    content: t.content,
    upvotes: t.upvotes,
    downvotes: t.downvotes,
    myVote: t.myVote ?? null,
});

const toReplyData = (r: NonNullable<ForumTopic['replies']>[number], topicAuthorId: string): ReplyData => ({
    id: r.id,
    author: toAuthor(r.author, topicAuthorId),
    when: r.createdAt,
    updatedAt: r.updatedAt,
    edited: r.edited,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    children: r.content,
});
