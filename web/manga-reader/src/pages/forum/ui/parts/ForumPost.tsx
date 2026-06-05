import { useTranslation } from 'react-i18next';

import { requireAuth } from '@shared/service/util/requireAuth';
import { PostShell } from '@ui/PostShell';
import { PostHeader } from '@ui/PostHeader';
import { VotePill } from '@ui/VotePill';
import { ActionBar } from '@ui/ActionBar';
import { RoleChip, type Role } from '@ui/RoleChip';
import { Markdown } from '@ui/Markdown';
import type { TopicAuthor } from '@entities/forum';

type ForumPostProps = {
    author: TopicAuthor;
    when: string;
    content: string;
    isOp?: boolean;
    upvotes: number;
    downvotes?: number;
    myVote?: 'up' | 'down' | null;
    onVote?: (vote: 'up' | 'down') => void;
    onReply?: () => void;
};

const roleFor = (isOp: boolean, badge: TopicAuthor['badge']): Role | null => {
    if (isOp) return 'OP';
    if (badge === 'mod') return 'MOD';
    if (badge === 'author') return 'AUTOR';
    return null;
};

const ForumPost = ({ author, when, content, isOp = false, upvotes, downvotes = 0, myVote = null, onVote, onReply }: ForumPostProps) => {
    const { t } = useTranslation('forum');

    const role = roleFor(isOp, author.badge);
    const handle = author.handle.replace(/^@/, '');
    const score = upvotes - downvotes;

    return (
        <PostShell avatar={{ name: author.name }} avatarSize={isOp ? 44 : 38} flat={!isOp} op={isOp}>
            <PostHeader name={author.name} handle={handle} time={when} badges={role ? <RoleChip role={role} /> : undefined} />
            <Markdown text={content} className="text-mr-body leading-[1.62] text-mr-fg-muted" />
            <ActionBar
                vote={
                    <VotePill
                        value={score}
                        active={myVote}
                        onUp={() => onVote?.('up')}
                        onDown={() => onVote?.('down')}
                        label={t('reply.reply')}
                    />
                }
                onReply={
                    onReply
                        ? () => {
                              if (!requireAuth(t('reply.reply'))) return;
                              onReply();
                          }
                        : undefined
                }
                replyLabel={t('reply.reply')}
            />
        </PostShell>
    );
};

export default ForumPost;
