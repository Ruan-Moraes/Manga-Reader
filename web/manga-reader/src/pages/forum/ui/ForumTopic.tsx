import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import type { ComposerHandle } from '@ui/Composer';

import useTopicDetail from '../model/useTopicDetail';

import TopicHeader from './parts/TopicHeader';
import TopicReplies from './parts/TopicReplies';
import TopicCommentInput from './parts/TopicCommentInput';
import ForumPost from './parts/ForumPost';

const ForumTopicPage = () => {
    const { t } = useTranslation('forum');
    const { topicId } = useParams();

    const navigate = useAppNavigate();

    const [sort, setSort] = useState('top');

    const composerRef = useRef<ComposerHandle>(null);
    const handleReply = (handle: string) => composerRef.current?.insertMention(handle.replace(/^@/, ''));

    const { topic, replies, replyVotes, loading, voteTopic, voteReply, postReply } = useTopicDetail(topicId);

    if (loading) {
        return null;
    }

    if (!topic) {
        return (
            <PageContainer asMain size="default" paddingY="md">
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
        <PageContainer asMain size="default" paddingY="md">
            <TopicHeader topic={topic} onBack={() => navigate(ROUTES.FORUM)} />

            <ForumPost
                isOp
                author={topic.author}
                when={topic.postedAt}
                edited={topic.edited}
                updatedAt={topic.updatedAt}
                content={topic.content}
                upvotes={topic.upvotes}
                downvotes={topic.downvotes}
                myVote={topic.myVote}
                onVote={voteTopic}
                onReply={() => handleReply(topic.author.handle)}
            />

            <TopicReplies
                topic={topic}
                replies={replies}
                sort={sort}
                onSortChange={setSort}
                votes={replyVotes}
                onVote={voteReply}
                onReply={handleReply}
            />

            <TopicCommentInput composerRef={composerRef} onSubmit={postReply} />
        </PageContainer>
    );
};

export default ForumTopicPage;
