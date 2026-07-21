import { useTranslation } from 'react-i18next';

import { FORUM_CATEGORIES } from '../forumData';
import { forumIcon } from '../forumIcons';

interface ForumSidebarNavProps {
    active: string;
    onSelect: (key: string) => void;
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export const ForumSidebarNav = ({ active, onSelect }: ForumSidebarNavProps) => {
    const { t } = useTranslation('forum');

    return (
        <nav className="forum-cats">
            {FORUM_CATEGORIES.map(c => {
                const Icon = forumIcon[c.icon] ?? forumIcon.forum;
                return (
                    <button key={c.key} type="button" onClick={() => onSelect(c.key)} className={`forum-cat ${active === c.key ? 'active' : ''}`}>
                        <span className="forum-cat-icon">
                            <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="forum-cat-label">{c.label}</span>
                        <span className="forum-cat-count">{compact(c.count)}</span>
                    </button>
                );
            })}
            <div className="forum-cats-foot">
                <div className="mr-label" style={{ color: 'var(--mr-tertiary)', marginBottom: 6 }}>
                    {t('ui.rules')}
                </div>
                <p style={{ fontSize: 11, color: 'var(--mr-fg-subtle)', lineHeight: 1.5, margin: 0 }}>
                    {t('ui.rulesBefore')} <span style={{ color: 'var(--mr-danger)', fontWeight: 700 }}>[spoiler]</span> {t('ui.rulesAfter')}
                </p>
            </div>
        </nav>
    );
};
