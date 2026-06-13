import { useTranslation } from 'react-i18next';

import { requireAuth } from '@shared/service/util/requireAuth';
import { formatPostDate } from '@shared/service/util/formatPostDate';
import { ThreadPost } from '@ui/ThreadPost';
import { VotePill } from '@ui/VotePill';
import { RoleChip, type Role } from '@ui/RoleChip';
import { EditedFlag } from '@ui/EditedFlag';
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
    /** Abre o modal de perfil ao clicar no avatar/nome. */
    onClickAuthor?: () => void;
    /** Rótulo acessível do botão de perfil (avatar/nome). */
    authorProfileLabel?: string;
};

const roleFor = (isOp: boolean, badge: TopicAuthor['badge']): Role | null => {
    if (isOp) return 'OP';
    if (badge === 'mod') return 'MOD';
    if (badge === 'author') return 'AUTOR';
    return null;
};

const ForumPost = ({
    author,
    when,
    edited = false,
    updatedAt,
    content,
    isOp = false,
    upvotes,
    downvotes = 0,
    myVote = null,
    onVote,
    onReply,
    onClickAuthor,
    authorProfileLabel,
}: ForumPostProps) => {
    const { t } = useTranslation('forum');

    const role = roleFor(isOp, author.badge);
    const handle = author.handle.replace(/^@/, '');
    const score = upvotes - downvotes;
    const whenDate = formatPostDate(when);
    const editedDate = formatPostDate(updatedAt);

    const badges = role ? <RoleChip role={role} /> : undefined;
    const meta = edited ? <EditedFlag label={t('post.edited')} title={editedDate.title} /> : undefined;

    return (
        <ThreadPost
            avatar={{ name: author.name }}
            avatarSize={isOp ? 44 : 38}
            onClickAvatar={onClickAuthor}
            flat={!isOp}
            op={isOp}
            name={author.name}
            handle={handle}
            onClickName={onClickAuthor}
            nameProfileLabel={authorProfileLabel}
            time={whenDate.label}
            timeTitle={whenDate.title}
            meta={meta}
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
