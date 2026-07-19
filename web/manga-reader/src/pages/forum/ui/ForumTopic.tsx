import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Bookmark, ChevronDown, ChevronRight, ChevronUp, Heart, MessageSquare, User } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { FORUM_CATEGORIES, FORUM_TAGS, FORUM_TOPICS, FORUM_USERS, formatViews } from './forumData';
import { Select } from '@ui/Select';
import { SquareAvatar } from '@ui/SquareAvatar';
import { ForumComment } from './parts/ForumComment';
import { ForumPagination } from './parts/ForumPagination';
import { ForumReplyBox } from './parts/ForumReplyBox';
import { RichBody } from './parts/RichBody';
import { FORUM_COMMENTS } from './forumData';
import './forum.css';

const ForumTopic = () => {
    const { topicId } = useParams();
    const { t } = useTranslation('forum');
    const navigate = useAppNavigate();

    const topic = FORUM_TOPICS.find(x => x.id === `t${topicId}`) ?? FORUM_TOPICS[0];
    const author = FORUM_USERS[topic.authorId];
    const cat = FORUM_CATEGORIES.find(c => c.key === topic.category);

    const [replyOpen, setReplyOpen] = useState(false);
    const [followed, setFollowed] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [commentSort, setCommentSort] = useState('best');

    const related = FORUM_TOPICS.filter(x => x.id !== topic.id && x.category === topic.category).slice(0, 3);
    const content = `${topic.excerpt}\n\n${t('ui.topicBodyExtra')}`;

    return (
        <div className="forum-shell">
            <div className="forum-layout forum-layout-topic">
                <main className="forum-main">
                    <div className="forum-crumbs">
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                navigate(ROUTES.FORUM);
                            }}
                        >
                            {t('ui.breadcrumbForum')}
                        </a>
                        <ChevronRight size={11} strokeWidth={2} />
                        <span style={{ color: 'var(--mr-fg-subtle)' }}>{cat?.label}</span>
                        <ChevronRight size={11} strokeWidth={2} />
                        <span style={{ color: 'var(--mr-accent)' }}>{t('ui.topicNumber', { n: topic.id.replace('t', '') })}</span>
                    </div>

                    <article className="forum-topic">
                        <div className="forum-topic-meta">
                            {topic.pinned && (
                                <span className="forum-topic-pin">
                                    <Bookmark size={10} strokeWidth={2} />
                                    {t('ui.pinned')}
                                </span>
                            )}
                            <span className="forum-topic-cat">{cat?.label}</span>
                            <span style={{ flex: 1 }} />
                            <span className="forum-topic-when">{topic.when}</span>
                        </div>

                        <h1 className="forum-topic-title">{topic.title}</h1>

                        <div className="forum-topic-tags">
                            {topic.tags.map(tg => {
                                const tag = FORUM_TAGS[tg] ?? { label: tg, tone: 'neutral' as const };
                                return (
                                    <span key={tg} className={`forum-tag forum-tag-${tag.tone}`}>
                                        {tag.label}
                                    </span>
                                );
                            })}
                        </div>

                        <div className="forum-topic-author">
                            <div className="forum-topic-author-block">
                                <div className="forum-card-avatar">
                                    <SquareAvatar initials={author.initials} color={author.color} size={48} />
                                    {author.role === 'mod' && <span className="forum-role-badge mod">M</span>}
                                    {author.role === 'admin' && <span className="forum-role-badge admin">A</span>}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ color: 'var(--mr-fg)', fontWeight: 800, fontSize: 14, letterSpacing: '.0625rem' }}>{author.name}</span>
                                        {author.badge && <span className="forum-user-badge">{author.badge}</span>}
                                    </div>
                                    <div style={{ color: 'var(--mr-fg-subtle)', fontSize: 11, marginTop: 2 }}>
                                        {t('ui.authorMeta', { handle: author.handle, level: author.level, views: topic.views.toLocaleString('pt-BR') })}
                                    </div>
                                </div>
                            </div>
                            <div className="forum-topic-author-actions">
                                <button
                                    type="button"
                                    className={`forum-icon-btn forum-toggle-btn ${followed ? 'active' : ''}`}
                                    onClick={() => setFollowed(v => !v)}
                                    title={followed ? t('ui.followingTopic') : t('ui.followTopic')}
                                >
                                    <Bell size={16} strokeWidth={2} />
                                </button>
                                <button
                                    type="button"
                                    className={`forum-icon-btn forum-toggle-btn ${bookmarked ? 'active' : ''}`}
                                    onClick={() => setBookmarked(v => !v)}
                                    title={bookmarked ? t('ui.saved') : t('ui.saveTopic')}
                                >
                                    <Bookmark size={16} strokeWidth={2} />
                                </button>
                            </div>
                        </div>

                        <div className="forum-topic-content">
                            <RichBody text={content} />
                        </div>

                        <div className="forum-topic-reactions">
                            <button type="button" className="forum-react forum-react-up">
                                <ChevronUp size={14} strokeWidth={2.5} />
                                <span>{topic.reactions.up}</span>
                            </button>
                            <button type="button" className="forum-react forum-react-down">
                                <ChevronDown size={14} strokeWidth={2.5} />
                                <span>{topic.reactions.down}</span>
                            </button>
                            <button type="button" className="forum-react">
                                <Heart size={14} strokeWidth={2} />
                                <span>{t('ui.like')}</span>
                            </button>
                            <button type="button" className="forum-react">
                                <Bookmark size={14} strokeWidth={2} />
                                <span>{t('ui.save')}</span>
                            </button>
                            <button type="button" className="forum-react">
                                <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>&quot;</span>
                                <span>{t('ui.quote')}</span>
                            </button>
                            <span style={{ flex: 1 }} />
                            <button type="button" className="forum-react">
                                {t('ui.report')}
                            </button>
                        </div>
                    </article>

                    <div className="forum-comments-head">
                        <h2 className="forum-comments-title">{t('ui.commentsCount', { count: topic.replies })}</h2>
                        <div className="forum-comments-sort">
                            <span className="mr-label" style={{ color: 'var(--mr-tertiary)' }}>
                                {t('ui.sortBy')}
                            </span>
                            <Select
                                className="w-44"
                                aria-label={t('ui.sortBy')}
                                value={commentSort}
                                onChange={e => setCommentSort(e.target.value)}
                                options={[
                                    { value: 'best', label: t('ui.sortBest') },
                                    { value: 'recent', label: t('ui.sortRecent') },
                                    { value: 'oldest', label: t('ui.sortOldest') },
                                ]}
                            />
                        </div>
                    </div>

                    <ForumReplyBox open={replyOpen} onToggle={() => setReplyOpen(v => !v)} />

                    <div className="forum-thread">
                        {FORUM_COMMENTS.map(c => (
                            <ForumComment key={c.id} comment={c} />
                        ))}
                    </div>

                    <ForumPagination last={9} style={{ marginTop: 18 }} />
                </main>

                <aside className="forum-sidebar-right">
                    <section className="forum-panel">
                        <header className="forum-panel-head">
                            <MessageSquare size={14} strokeWidth={2} />
                            <h4>{t('ui.relatedTopics')}</h4>
                        </header>
                        <ul className="forum-recent">
                            {related.map(r => (
                                <li key={r.id} onClick={() => navigate(ROUTES.FORUM_TOPIC(r.id.replace('t', '')))}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="forum-trending-title">{r.title}</div>
                                        <div className="forum-trending-meta">
                                            <MessageSquare size={10} strokeWidth={2} />
                                            {r.replies} · {formatViews(r.views)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="forum-panel">
                        <header className="forum-panel-head">
                            <User size={14} strokeWidth={2} />
                            <h4>{t('ui.participants', { count: Object.keys(FORUM_USERS).length })}</h4>
                        </header>
                        <div className="forum-participants">
                            {Object.values(FORUM_USERS)
                                .slice(0, 8)
                                .map(u => (
                                    <div key={u.id} className="forum-participant">
                                        <SquareAvatar initials={u.initials} color={u.color} size={32} />
                                    </div>
                                ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default ForumTopic;
