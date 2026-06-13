import { useTranslation } from 'react-i18next';

import { Select } from '@ui/Select';
import type { ReplyData, TopicAuthor } from '@entities/forum';

import ForumPost from './ForumPost';

type Props = {
    topic: { replies: number };
    replies: ReplyData[];
    sort: string;
    onSortChange: (v: string) => void;
    votes: Record<string, 'up' | 'down' | null>;
    onVote: (id: string, v: 'up' | 'down') => void;
    onReply: (handle: string) => void;
    onOpenProfile: (author: TopicAuthor) => void;
};

const TopicReplies = ({ topic, replies, sort, onSortChange, votes, onVote, onReply, onOpenProfile }: Props) => {
    const { t } = useTranslation('forum');
    const { t: tUser } = useTranslation('user');

    const SORT_OPTIONS = [
        { value: 'top', label: t('topic.replySortTop') },
        { value: 'recent', label: t('topic.replySortRecent') },
        { value: 'old', label: t('topic.replySortOld') },
    ];

    return (
        <>
            <div className="my-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-mr-h4 font-mr-bold text-mr-fg">{t('topicPage.replies_other', { count: topic.replies })}</p>
                <Select value={sort} onChange={e => onSortChange(e.target.value)} options={SORT_OPTIONS} className="w-36" />
            </div>

            <div className="flex flex-col gap-3">
                {replies.map(reply => (
                    <ForumPost
                        key={reply.id}
                        author={reply.author}
                        when={reply.when}
                        edited={reply.edited}
                        updatedAt={reply.updatedAt}
                        content={reply.children}
                        upvotes={reply.upvotes}
                        downvotes={reply.downvotes}
                        myVote={votes[reply.id] ?? null}
                        onVote={v => onVote(reply.id, v)}
                        onReply={() => onReply(reply.author.handle)}
                        onClickAuthor={() => onOpenProfile(reply.author)}
                        authorProfileLabel={tUser('modal.openProfileAria', { name: reply.author.name })}
                    />
                ))}
            </div>
        </>
    );
};

export default TopicReplies;
