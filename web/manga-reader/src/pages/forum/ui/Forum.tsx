import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MessagesSquare, Plus, Search, X } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { illustrationUrl } from '@shared/lib/illustrations';
import { Button } from '@ui/Button';

import { useForumFilters } from '../model/useForumFilters';
import { FORUM_CATEGORIES, FORUM_STATS, type ForumTab } from './forumData';
import { forumIcon } from './forumIcons';
import { ForumPagination } from './parts/ForumPagination';
import { ForumPanelEvents, ForumPanelRanking, ForumPanelRecentComments, ForumPanelStats, ForumPanelTrending } from './parts/ForumPanels';
import { ForumSidebarNav } from './parts/ForumSidebarNav';
import { ForumTopicCard, type HoveredUser } from './parts/ForumTopicCard';
import { UserHoverCard } from './parts/UserHoverCard';
import './forum.css';

const TABS: Array<[ForumTab, string, string]> = [
    ['alta', 'tabHot', 'trending'],
    ['recentes', 'tabRecent', 'clock'],
    ['sem-resposta', 'tabUnanswered', 'comment'],
    ['comentados', 'tabMostCommented', 'forum'],
    ['seguindo', 'tabFollowing', 'heart'],
    ['fixados', 'tabPinned', 'bookmark'],
];

const Forum = () => {
    const { t } = useTranslation('forum');
    const navigate = useAppNavigate();

    const { category, setCategory, tab, setTab, topics } = useForumFilters();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hovered, setHovered] = useState<HoveredUser | null>(null);

    const categoryLabel = FORUM_CATEGORIES.find(c => c.key === category)?.label ?? t('ui.homeTitle');
    const pensando = illustrationUrl('pensando');

    const openTopic = (id: string) => navigate(ROUTES.FORUM_TOPIC(id.replace('t', '')));
    const openCompose = () => navigate(ROUTES.FORUM_NEW);

    return (
        <div className="forum-shell">
            {drawerOpen && (
                <div className="forum-drawer-overlay" onClick={() => setDrawerOpen(false)}>
                    <aside className="forum-drawer" onClick={e => e.stopPropagation()}>
                        <div className="forum-drawer-head">
                            <span className="mr-label" style={{ color: 'var(--mr-accent)' }}>
                                {t('ui.categories')}
                            </span>
                            <button type="button" onClick={() => setDrawerOpen(false)} className="forum-icon-btn" aria-label={t('ui.close')}>
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>
                        <ForumSidebarNav
                            active={category}
                            onSelect={k => {
                                setCategory(k);
                                setDrawerOpen(false);
                            }}
                        />
                    </aside>
                </div>
            )}

            <div className="forum-layout">
                <aside className="forum-sidebar-left">
                    <ForumSidebarNav active={category} onSelect={setCategory} />
                </aside>

                <main className="forum-main">
                    <div className="forum-header">
                        <div className="forum-header-top">
                            <div>
                                <div className="mr-label" style={{ color: 'var(--mr-accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <MessagesSquare size={13} strokeWidth={2} />
                                    {t('ui.communityForum')}
                                </div>
                                <h1 className="forum-title">{categoryLabel}</h1>
                                <p className="forum-subtitle">{t('ui.subtitle', { count: topics.length, online: FORUM_STATS.online.toLocaleString('pt-BR') })}</p>
                            </div>
                            <div className="forum-header-actions">
                                <button type="button" className="forum-icon-btn forum-drawer-toggle" onClick={() => setDrawerOpen(true)} aria-label={t('ui.openCategories')}>
                                    <Menu size={18} strokeWidth={2} />
                                </button>
                                <Button variant="primary" icon={Plus} onClick={openCompose}>
                                    {t('ui.createTopic')}
                                </Button>
                            </div>
                        </div>

                        <div className="forum-search">
                            <Search size={16} strokeWidth={2} />
                            <input placeholder={t('ui.searchPlaceholder')} aria-label={t('ui.searchPlaceholder')} />
                            <kbd className="forum-kbd">⌘ K</kbd>
                        </div>

                        <div className="forum-tabs">
                            {TABS.map(([key, label, icon]) => {
                                const Icon = forumIcon[icon];
                                return (
                                    <button key={key} type="button" onClick={() => setTab(key)} className={`forum-tab ${tab === key ? 'active' : ''}`}>
                                        <Icon size={14} strokeWidth={2} />
                                        {t(`ui.${label}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {topics.length === 0 ? (
                        <div className="forum-empty">
                            {pensando && <img src={pensando} width={120} height={120} alt="" />}
                            <h3 style={{ color: '#fff', margin: '10px 0 4px', letterSpacing: '.0625rem' }}>{t('ui.emptyTitle')}</h3>
                            <p style={{ color: '#999', fontSize: 13, marginBottom: 14 }}>{t('ui.emptySub')}</p>
                            <Button variant="primary" icon={Plus} onClick={openCompose}>
                                {t('ui.createTopic')}
                            </Button>
                        </div>
                    ) : (
                        <div className="forum-feed">
                            {topics.map(tp => (
                                <ForumTopicCard key={tp.id} topic={tp} onOpen={() => openTopic(tp.id)} onUserHover={setHovered} onUserLeave={() => setHovered(null)} />
                            ))}
                        </div>
                    )}

                    <ForumPagination />
                </main>

                <aside className="forum-sidebar-right">
                    <ForumPanelTrending onOpenTopic={openTopic} />
                    <ForumPanelRecentComments onOpenTopic={openTopic} />
                    <ForumPanelRanking />
                    <ForumPanelEvents onNavEvents={() => navigate(ROUTES.EVENTS)} />
                    <ForumPanelStats />
                </aside>
            </div>

            {hovered && <UserHoverCard hovered={hovered} />}
        </div>
    );
};

export default Forum;
