import { useTranslation } from 'react-i18next';
import { CommentBox } from '@ui/CommentBox';
import { Select } from '@ui/Select';
import type { ReplyData } from './forumTopicMock';

type Props = {
    topic: { replies: number };
    replies: ReplyData[];
    sort: string;
    onSortChange: (v: string) => void;
    votes: Record<string, 'up' | 'down' | null>;
    onVote: (id: string, v: 'up' | 'down' | null) => void;
};

const TopicReplies = ({ topic, replies, sort, onSortChange, votes, onVote }: Props) => {
    const { t } = useTranslation('forum');

    const SORT_OPTIONS = [
        { value: 'top', label: t('topic.replySortTop') },
        { value: 'recent', label: t('topic.replySortRecent') },
        { value: 'old', label: t('topic.replySortOld') },
    ];

    return (
        <>
            <div className="my-6 flex items-center justify-between">
                <p className="text-mr-small font-mr-bold text-mr-fg">{t('topicPage.replies_other', { count: topic.replies })}</p>
                <Select value={sort} onChange={e => onSortChange(e.target.value)} options={SORT_OPTIONS} className="w-36" />
            </div>

            <div className="flex flex-col gap-3">
                {replies.map(r => (
                    <CommentBox
                        key={r.id}
                        author={{
                            name: r.author.name,
                            handle: r.author.handle,
                            badge: r.author.badge,
                        }}
                        when={r.when}
                        upvotes={r.upvotes}
                        downvotes={r.downvotes}
                        myVote={votes[r.id] ?? null}
                        onVote={v => onVote(r.id, v)}
                    >
                        <p className="text-mr-body text-mr-fg-muted leading-relaxed">{r.children}</p>
                    </CommentBox>
                ))}
            </div>
        </>
    );
};

export default TopicReplies;
