import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

import { FORUM_USERS, type ForumComment as ForumCommentData } from '../forumData';
import { SquareAvatar } from '@ui/SquareAvatar';
import { RichBody } from './RichBody';

interface ForumCommentProps {
    comment: ForumCommentData;
    depth?: number;
}

export const ForumComment = ({ comment, depth = 0 }: ForumCommentProps) => {
    const { t } = useTranslation('forum');
    const u = FORUM_USERS[comment.userId];
    const role = comment.role ?? u.role;

    return (
        <article className={`forum-comment ${role ?? ''} ${depth > 0 ? 'nested' : ''}`}>
            <div className="forum-card-avatar">
                <SquareAvatar initials={u.initials} color={u.color} size={depth > 0 ? 32 : 38} />
                {role === 'mod' && <span className="forum-role-badge mod">M</span>}
                {role === 'admin' && <span className="forum-role-badge admin">A</span>}
            </div>
            <div className="forum-comment-body">
                <div className="forum-comment-head">
                    <span className="forum-comment-name">{u.name}</span>
                    {comment.isOP && <span className="forum-user-badge op">{t('ui.op')}</span>}
                    {role === 'mod' && <span className="forum-user-badge mod">{t('ui.roleMod')}</span>}
                    {role === 'admin' && <span className="forum-user-badge admin">{t('ui.roleAdminShort')}</span>}
                    {u.badge && !role && !comment.isOP && <span className="forum-user-badge">{u.badge}</span>}
                    <span className="forum-comment-when">· {comment.when}</span>
                    {comment.edited && <span className="forum-comment-edited">· {t('ui.edited')}</span>}
                </div>

                <div className="forum-comment-text">
                    <RichBody text={comment.text} />
                </div>

                <div className="forum-comment-actions">
                    <button type="button" className="forum-react-mini forum-react-up">
                        <ChevronUp size={13} strokeWidth={2.5} />
                        <span>{comment.reactions.up}</span>
                    </button>
                    <button type="button" className="forum-react-mini">
                        <ChevronDown size={13} strokeWidth={2.5} />
                        <span>{comment.reactions.down}</span>
                    </button>
                    <button type="button" className="forum-react-mini">
                        <MessageSquare size={12} strokeWidth={2} />
                        <span>{t('ui.reply')}</span>
                    </button>
                    <button type="button" className="forum-react-mini">
                        <span style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>&quot;</span>
                        <span>{t('ui.quote')}</span>
                    </button>
                    <button type="button" className="forum-react-mini">
                        {t('ui.report')}
                    </button>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="forum-comment-replies">
                        {comment.replies.map(r => (
                            <ForumComment key={r.id} comment={r} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
};
