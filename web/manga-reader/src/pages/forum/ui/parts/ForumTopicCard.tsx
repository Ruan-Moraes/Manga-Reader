import { useTranslation } from 'react-i18next';
import { Bookmark, ChevronUp, Eye, MessageSquare, TrendingUp } from 'lucide-react';

import { FORUM_CATEGORIES, FORUM_TAGS, FORUM_USERS, formatViews, type ForumTopic } from '../forumData';
import { SquareAvatar } from '@ui/SquareAvatar';

export interface HoveredUser {
    id: string;
    at: DOMRect;
}

interface ForumTopicCardProps {
    topic: ForumTopic;
    onOpen: () => void;
    onUserHover: (u: HoveredUser) => void;
    onUserLeave: () => void;
}

export const ForumTopicCard = ({ topic, onOpen, onUserHover, onUserLeave }: ForumTopicCardProps) => {
    const { t } = useTranslation('forum');
    const u = FORUM_USERS[topic.authorId];
    const last = FORUM_USERS[topic.lastUserId];
    const cat = FORUM_CATEGORIES.find(c => c.key === topic.category);

    return (
        <article className="forum-card" onClick={onOpen}>
            {topic.pinned && (
                <div className="forum-card-pin">
                    <Bookmark size={10} strokeWidth={2} />
                    {t('ui.pinned')}
                </div>
            )}
            {topic.hot && !topic.pinned && (
                <div className="forum-card-hot">
                    <TrendingUp size={10} strokeWidth={2} />
                    {t('ui.hot')}
                </div>
            )}

            <div className="forum-card-main">
                <div
                    className="forum-card-avatar"
                    onMouseEnter={e => onUserHover({ id: u.id, at: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={onUserLeave}
                    onClick={e => e.stopPropagation()}
                >
                    <SquareAvatar initials={u.initials} color={u.color} size={44} />
                    {u.role === 'mod' && <span className="forum-role-badge mod">M</span>}
                    {u.role === 'admin' && <span className="forum-role-badge admin">A</span>}
                </div>

                <div className="forum-card-body">
                    <div className="forum-card-meta">
                        <span className="forum-author" onClick={e => e.stopPropagation()}>
                            {u.name}
                        </span>
                        <span className="forum-meta-dot">·</span>
                        <span>{topic.when}</span>
                        <span className="forum-meta-dot">·</span>
                        <span className="forum-card-cat">{cat?.label}</span>
                    </div>

                    <h3 className="forum-card-title">{topic.title}</h3>
                    <p className="forum-card-excerpt">{topic.excerpt}</p>

                    <div className="forum-card-tags">
                        {topic.tags.map(tg => {
                            const tag = FORUM_TAGS[tg] ?? { label: tg, tone: 'neutral' as const };
                            return (
                                <span key={tg} className={`forum-tag forum-tag-${tag.tone}`}>
                                    {tag.label}
                                </span>
                            );
                        })}
                    </div>

                    <div className="forum-card-footer">
                        <div className="forum-card-stats">
                            <span className="forum-stat">
                                <MessageSquare size={13} strokeWidth={2} />
                                {topic.replies.toLocaleString('pt-BR')}
                            </span>
                            <span className="forum-stat">
                                <Eye size={13} strokeWidth={2} />
                                {formatViews(topic.views)}
                            </span>
                            <span className="forum-stat forum-stat-up">
                                <ChevronUp size={13} strokeWidth={2.5} />
                                {topic.reactions.up}
                            </span>
                        </div>
                        <div className="forum-last-reply" onClick={e => e.stopPropagation()}>
                            <span className="mr-label" style={{ color: '#727273' }}>
                                {t('ui.lastReply')}
                            </span>
                            <div className="forum-last-reply-line">
                                <SquareAvatar initials={last.initials} color={last.color} size={22} />
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.0625rem' }}>{last.name}</span>
                                <span style={{ color: '#999', fontSize: 11 }}>· {topic.lastReplyAt}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};
