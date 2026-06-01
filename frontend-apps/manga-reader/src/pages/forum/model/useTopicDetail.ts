import { TOPICS, REPLIES } from '@mock/forumTopic';
import type { TopicData, ReplyData } from '@entities/forum';

/**
 * Loads a forum topic + its replies for the topic-detail page.
 *
 * Mock-backed (no forum backend yet) — this hook is the single swap point: when
 * the API lands, only this file changes, the page stays the same.
 */
export default function useTopicDetail(topicId: string | undefined): { topic: TopicData | undefined; replies: ReplyData[] } {
    const topic = TOPICS[topicId ?? ''] ?? TOPICS['2'];

    return { topic, replies: REPLIES };
}
