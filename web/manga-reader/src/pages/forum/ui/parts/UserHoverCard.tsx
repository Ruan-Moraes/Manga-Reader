import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { FORUM_USERS } from '../forumData';
import { SquareAvatar } from '@ui/SquareAvatar';
import type { HoveredUser } from './ForumTopicCard';

export const UserHoverCard = ({ hovered }: { hovered: HoveredUser }) => {
    const { t } = useTranslation('forum');
    const user = FORUM_USERS[hovered.id];
    if (!user) return null;

    const top = Math.min(window.innerHeight - 220, hovered.at.bottom + 8);
    const left = Math.min(window.innerWidth - 280, hovered.at.left);

    return (
        <div className="forum-userhover" style={{ top, left }}>
            <div className="forum-userhover-head">
                <SquareAvatar initials={user.initials} color={user.color} size={48} />
                <div>
                    <div className="forum-userhover-name">{user.name}</div>
                    <div className="forum-userhover-handle">@{user.handle}</div>
                </div>
            </div>
            <div className="forum-userhover-body">
                <div className="forum-userhover-row">
                    <span className="mr-label">{t('ui.level')}</span>
                    <span className="forum-userhover-v">{user.level}</span>
                </div>
                {user.badge && (
                    <div className="forum-userhover-row">
                        <span className="mr-label">{t('ui.badge')}</span>
                        <span className="forum-userhover-badge">{user.badge}</span>
                    </div>
                )}
                {user.role && (
                    <div className="forum-userhover-row">
                        <span className="mr-label">{t('ui.role')}</span>
                        <span className={`forum-userhover-role ${user.role}`}>{user.role === 'mod' ? t('ui.roleMod') : t('ui.roleAdmin')}</span>
                    </div>
                )}
            </div>
            <div className="forum-userhover-actions">
                <Button variant="primary" block>
                    {t('ui.follow')}
                </Button>
                <Button variant="raised" block>
                    {t('ui.viewProfile')}
                </Button>
            </div>
        </div>
    );
};
