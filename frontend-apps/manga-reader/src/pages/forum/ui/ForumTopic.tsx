import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { CommentBox } from '@ui/CommentBox';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';

import { TOPICS, REPLIES } from '@mock/forumTopic';
import TopicHeader from './parts/TopicHeader';
import TopicReplies from './parts/TopicReplies';
import TopicCommentInput from './parts/TopicCommentInput';

const ForumTopicPage = () => {
    const { topicId } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('forum');

    const [sort, setSort] = useState('top');
    const [votes, setVotes] = useState<Record<string, 'up' | 'down' | null>>({});
    const [reply, setReply] = useState('');

    const topic = TOPICS[topicId ?? ''] ?? TOPICS['2'];

    if (!topic) {
        return (
            <PageContainer asMain size="narrow" paddingY="md">
                <EmptyState
                    illustration="404"
                    title={t('topic.notFound')}
                    description={t('topic.notFoundDesc')}
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.FORUM)}>
                            {t('topic.backToForum')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer asMain size="narrow" paddingY="md">
            <TopicHeader topic={topic} onBack={() => navigate(ROUTES.FORUM)} />

            <CommentBox
                author={{
                    name: topic.author.name,
                    handle: topic.author.handle,
                    badge: topic.author.badge,
                }}
                when={topic.postedAt}
                highlighted
                upvotes={312}
                downvotes={4}
                myVote={votes['op'] ?? null}
                onVote={v => setVotes(prev => ({ ...prev, op: v }))}
            >
                <p className="whitespace-pre-line text-mr-body text-mr-fg-muted leading-relaxed">{topic.content}</p>
            </CommentBox>

            <TopicReplies
                topic={topic}
                replies={REPLIES}
                sort={sort}
                onSortChange={setSort}
                votes={votes}
                onVote={(id, v) => setVotes(prev => ({ ...prev, [id]: v }))}
            />

            <TopicCommentInput value={reply} onChange={setReply} />
        </PageContainer>
    );
};

export default ForumTopicPage;
