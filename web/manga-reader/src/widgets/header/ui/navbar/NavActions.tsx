import { Bell, BookOpen, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';
import { Button } from '@ui/Button';
import { DropdownMenu } from '@ui/DropdownMenu';
import { IconButton } from '@ui/IconButton';
import { cn } from '@shared/lib/cn';
import type { LayoutNavBarUser } from './navBar.types';

type Props = {
    user: LayoutNavBarUser | null;
    compact?: boolean;
    iconSize?: number;
    onNotificationsClick?: () => void;
    onLibraryClick?: () => void;
    onProfileClick?: () => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    onAccountClick?: () => void;
};

const NavActions = ({
    user,
    compact = false,
    iconSize = 42,
    onNotificationsClick,
    onLibraryClick,
    onProfileClick,
    onSettingsClick,
    onLogoutClick,
    onAccountClick,
}: Props) => {
    const { t } = useTranslation('layout');

    const accountItems = user
        ? [
              { label: t('nav.action.profile'), onSelect: onProfileClick },
              { label: t('nav.action.settings'), onSelect: onSettingsClick },
              { type: 'separator' as const },
              {
                  label: t('nav.action.logout'),
                  destructive: true,
                  onSelect: onLogoutClick,
              },
          ]
        : [];

    const iconBtnBase =
        'group relative items-center justify-center rounded-mr-xs border border-transparent text-mr-fg transition-colors duration-mr-default hover:bg-mr-secondary hover:border-mr-gray-700 focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2';

    const dim = { width: iconSize, height: iconSize } as const;

    const badgeBase = 'absolute -right-1 -top-1 inline-flex items-center justify-center rounded-mr-full text-[10px] font-mr-extrabold leading-none';
    const badgeStyle = {
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        border: '2px solid var(--mr-primary)',
    } as const;

    return (
        <div className="flex items-center gap-[6px]">
            {user && (
                <>
                    <button
                        type="button"
                        aria-label={t('nav.aria.notifications')}
                        onClick={onNotificationsClick}
                        className={cn(iconBtnBase, 'hidden lg:inline-flex')}
                        style={dim}
                    >
                        <Bell className="size-[20px]" strokeWidth={2} aria-hidden="true" />
                        {!!user.unreadNews && (
                            <span className={cn(badgeBase, 'bg-mr-danger text-mr-fg')} style={badgeStyle}>
                                {user.unreadNews > 9 ? '9+' : user.unreadNews}
                            </span>
                        )}
                    </button>
                    {!compact && (
                        <button
                            type="button"
                            aria-label={t('nav.aria.library')}
                            onClick={onLibraryClick}
                            className={cn(iconBtnBase, 'inline-flex')}
                            style={dim}
                        >
                            <BookOpen className="size-[20px]" strokeWidth={2} aria-hidden="true" />
                            {!!user.libraryCount && (
                                <span className={cn(badgeBase, 'bg-mr-accent text-mr-primary')} style={badgeStyle}>
                                    {user.libraryCount > 99 ? '99+' : user.libraryCount}
                                </span>
                            )}
                        </button>
                    )}
                    <DropdownMenu
                        trigger={
                            <button
                                type="button"
                                aria-label={t('nav.action.accountOf', { name: user.name })}
                                className="inline-flex items-center justify-center rounded-mr-xs transition-colors duration-mr-default hover:border-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
                                style={dim}
                            >
                                <Avatar src={user.avatar} name={user.name} size={40} />
                            </button>
                        }
                        items={accountItems}
                        side="bottom"
                        align="end"
                    />
                </>
            )}
            {!user && compact && (
                <IconButton
                    icon={LogIn}
                    variant="primary"
                    aria-label={t('nav.action.login')}
                    onClick={onAccountClick}
                    style={{ width: iconSize, height: iconSize }}
                />
            )}
            {!user && !compact && (
                <Button
                    variant="primary"
                    size="md"
                    onClick={onAccountClick}
                    className="font-mr-extrabold uppercase"
                    style={{ height: iconSize, letterSpacing: '0.1em' }}
                >
                    {t('nav.action.login')}
                </Button>
            )}
        </div>
    );
};

export default NavActions;
