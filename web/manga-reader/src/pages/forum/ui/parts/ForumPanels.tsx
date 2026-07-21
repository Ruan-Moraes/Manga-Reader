import { useTranslation } from 'react-i18next';
import { Calendar, MessageSquare, Newspaper, Sparkles, TrendingUp } from 'lucide-react';

import { FORUM_EVENTS, FORUM_RANKING, FORUM_RECENT_COMMENTS, FORUM_STATS, FORUM_TOPICS, FORUM_TRENDING, FORUM_USERS } from '../forumData';
import { SquareAvatar } from '@ui/SquareAvatar';

interface PanelNavProps {
    onOpenTopic: (id: string) => void;
}

export const ForumPanelTrending = ({ onOpenTopic }: PanelNavProps) => {
    const { t } = useTranslation('forum');
    return (
        <section className="forum-panel">
            <header className="forum-panel-head">
                <TrendingUp size={14} strokeWidth={2} />
                <h4>{t('ui.panelTrending')}</h4>
            </header>
            <ol className="forum-trending">
                {FORUM_TRENDING.map((tp, i) => (
                    <li key={tp.id} onClick={() => onOpenTopic(tp.id)}>
                        <span className="forum-trending-rank">{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="forum-trending-title">{tp.title}</div>
                            <div className="forum-trending-meta">
                                <MessageSquare size={10} strokeWidth={2} />
                                {t('ui.repliesShort', { count: tp.replies })}
                                <span style={{ color: 'var(--mr-accent)', fontWeight: 800 }}>· {tp.trend}</span>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
};

export const ForumPanelRecentComments = ({ onOpenTopic }: PanelNavProps) => {
    const { t } = useTranslation('forum');
    return (
        <section className="forum-panel">
            <header className="forum-panel-head">
                <MessageSquare size={14} strokeWidth={2} />
                <h4>{t('ui.panelRecent')}</h4>
            </header>
            <ul className="forum-recent">
                {FORUM_RECENT_COMMENTS.map((c, i) => {
                    const u = FORUM_USERS[c.userId];
                    const tp = FORUM_TOPICS.find(x => x.id === c.topicId);
                    return (
                        <li key={i} onClick={() => onOpenTopic(c.topicId)}>
                            <SquareAvatar initials={u.initials} color={u.color} size={30} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="forum-recent-head">
                                    <span style={{ color: 'var(--mr-fg)', fontWeight: 700, fontSize: 12, letterSpacing: '.0625rem' }}>{u.name}</span>
                                    <span style={{ color: 'var(--mr-tertiary)', fontSize: 11 }}>· {c.when}</span>
                                </div>
                                <div className="forum-recent-text">{c.text}</div>
                                <div className="forum-recent-on">
                                    {t('ui.commentOn')} <span style={{ color: 'var(--mr-accent)' }}>{tp?.title}</span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export const ForumPanelRanking = () => {
    const { t } = useTranslation('forum');
    return (
        <section className="forum-panel">
            <header className="forum-panel-head">
                <Sparkles size={14} strokeWidth={2} />
                <h4>{t('ui.panelRanking')}</h4>
            </header>
            <ol className="forum-ranking">
                {FORUM_RANKING.map((r, i) => {
                    const u = FORUM_USERS[r.userId];
                    const podium = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    return (
                        <li key={u.id}>
                            <span className={`forum-rank-pos ${podium}`}>{i + 1}</span>
                            <SquareAvatar initials={u.initials} color={u.color} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="forum-rank-name">{u.name}</div>
                                <div className="forum-rank-meta">{t('ui.rankMeta', { level: u.level, posts: r.posts })}</div>
                            </div>
                            <div className="forum-rank-points">{r.points}</div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

export const ForumPanelEvents = ({ onNavEvents }: { onNavEvents: () => void }) => {
    const { t } = useTranslation('forum');
    return (
        <section className="forum-panel">
            <header className="forum-panel-head">
                <Calendar size={14} strokeWidth={2} />
                <h4>{t('ui.panelEvents')}</h4>
            </header>
            <ul className="forum-events">
                {FORUM_EVENTS.map(e => (
                    <li key={e.id}>
                        <div className="forum-event-when">{e.when}</div>
                        <div className="forum-event-title">{e.title}</div>
                        <span className="forum-event-badge">{e.badge}</span>
                    </li>
                ))}
            </ul>
            <button type="button" className="forum-panel-link" onClick={onNavEvents}>
                {t('ui.seeAllEvents')}
            </button>
        </section>
    );
};

export const ForumPanelStats = () => {
    const { t } = useTranslation('forum');
    const s = FORUM_STATS;
    return (
        <section className="forum-panel forum-panel-stats">
            <header className="forum-panel-head">
                <Newspaper size={14} strokeWidth={2} />
                <h4>{t('ui.panelStats')}</h4>
            </header>
            <div className="forum-stats-grid">
                <div className="forum-stat-tile">
                    <div className="forum-stat-tile-v">{s.online.toLocaleString('pt-BR')}</div>
                    <div className="forum-stat-tile-l">
                        <span className="forum-online-dot" />
                        {t('ui.statOnline')}
                    </div>
                </div>
                <div className="forum-stat-tile">
                    <div className="forum-stat-tile-v">{s.topicsToday}</div>
                    <div className="forum-stat-tile-l">{t('ui.statTopicsToday')}</div>
                </div>
                <div className="forum-stat-tile">
                    <div className="forum-stat-tile-v">{s.commentsToday.toLocaleString('pt-BR')}</div>
                    <div className="forum-stat-tile-l">{t('ui.statCommentsToday')}</div>
                </div>
                <div className="forum-stat-tile">
                    <div className="forum-stat-tile-v">+{s.newUsers}</div>
                    <div className="forum-stat-tile-l">{t('ui.statNewUsers')}</div>
                </div>
            </div>
        </section>
    );
};
