import { useTranslation } from 'react-i18next';

import { requireAuth } from '@shared/service/util/requireAuth';
import { formatPostDate } from '@shared/service/util/formatPostDate';
import { ThreadPost } from '@ui/ThreadPost';
import { VotePill } from '@ui/VotePill';
import { RoleChip, type Role } from '@ui/RoleChip';
import { Markdown } from '@ui/Markdown';
import type { TopicAuthor } from '@entities/forum';

type ForumPostProps = {
    author: TopicAuthor;
    /** ISO de criação (createdAt) — formatado internamente: relativo + tooltip absoluto. */
    when: string;
    /** Post editado após a criação — exibe o selo "(editado)". */
    edited?: boolean;
    /** ISO da última modificação (updatedAt) — tooltip absoluto no selo "(editado)". */
    updatedAt?: string;
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

const ForumPost = ({ author, when, edited = false, updatedAt, content, isOp = false, upvotes, downvotes = 0, myVote = null, onVote, onReply }: ForumPostProps) => {
    const { t } = useTranslation('forum');

    const role = roleFor(isOp, author.badge);
    const handle = author.handle.replace(/^@/, '');
    const score = upvotes - downvotes;
    const whenDate = formatPostDate(when);
    const editedDate = formatPostDate(updatedAt);

    const badges =
        role || edited ? (
            <>
                {role && <RoleChip role={role} />}
                {edited && (
                    <span className="text-mr-tiny text-mr-fg-subtle" title={editedDate.title}>
                        ({t('post.edited')})
                    </span>
                )}
            </>
        ) : undefined;

    return (
        <ThreadPost
            avatar={{ name: author.name }}
            avatarSize={isOp ? 44 : 38}
            flat={!isOp}
            op={isOp}
            name={author.name}
            handle={handle}
            time={whenDate.label}
            timeTitle={whenDate.title}
            badges={badges}
            body={<Markdown text={content} className="text-mr-body leading-[1.62] text-mr-fg-muted" />}
            vote={<VotePill value={score} active={myVote} onUp={() => onVote?.('up')} onDown={() => onVote?.('down')} label={t('reply.reply')} />}
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
    );
};

export default ForumPost;
