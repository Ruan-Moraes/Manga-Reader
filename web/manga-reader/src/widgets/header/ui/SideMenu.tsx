import { Home, TrendingUp, Newspaper, BookOpen, Star, Download, Calendar, Users, MessageCircle, User, Bell, Settings, LogOut, Trash2, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SideMenu as DSSideMenu } from '@ui/SideMenu';
import type { SideMenuSection } from '@ui/SideMenu';
import { Button } from '@ui/Button';
import { ROUTES } from '@shared/constant/ROUTES';

export interface LayoutSideMenuUser {
    name: string;
    avatar?: string;
}

export interface LayoutSideMenuProps {
    open: boolean;
    onClose: () => void;
    user: LayoutSideMenuUser | null;
    isLoggedIn: boolean;
    canAccessAdminPortal?: boolean;
    libraryCount?: number | null;
    activeKey?: string;
    onNavigate: (path: string) => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    onClearCache?: () => void;
}

export const SideMenu = ({
    open,
    onClose,
    user,
    isLoggedIn,
    canAccessAdminPortal = false,
    libraryCount,
    activeKey,
    onNavigate,
    onSettingsClick,
    onLogoutClick,
    onClearCache,
}: LayoutSideMenuProps) => {
    const { t } = useTranslation('layout');

    const go = (path: string) => {
        onNavigate(path);
        onClose();
    };

    const sections: SideMenuSection[] = [
        {
            title: t('sidebar.section.feed'),
            items: [
                {
                    key: 'home',
                    label: t('sidebar.menu.home'),
                    icon: Home,
                    onClick: () => go('/'),
                },
                {
                    key: 'trending',
                    label: t('sidebar.menu.trending'),
                    icon: TrendingUp,
                    onClick: () => go('/trending'),
                },
                {
                    key: 'releases',
                    label: t('sidebar.menu.releases'),
                    icon: Newspaper,
                    onClick: () => go('/releases'),
                },
            ],
        },
        ...(isLoggedIn
            ? [
                  {
                      title: t('sidebar.section.library'),
                      items: [
                          {
                              key: 'library',
                              label: t('sidebar.menu.myMangas'),
                              icon: BookOpen,
                              badge: libraryCount ?? undefined,
                              onClick: () => go('/library'),
                          },
                          {
                              key: 'reviews',
                              label: t('sidebar.menu.reviews'),
                              icon: Star,
                              onClick: () => go('/reviews'),
                          },
                          {
                              key: 'downloads',
                              label: t('sidebar.menu.downloads'),
                              icon: Download,
                              onClick: () => go('/library?tab=downloads'),
                          },
                      ],
                  },
              ]
            : []),
        {
            title: t('sidebar.section.community'),
            items: [
                {
                    key: 'news',
                    label: t('sidebar.menu.news'),
                    icon: Newspaper,
                    onClick: () => go('/news'),
                },
                {
                    key: 'events',
                    label: t('sidebar.menu.events'),
                    icon: Calendar,
                    onClick: () => go('/events'),
                },
                {
                    key: 'groups',
                    label: t('sidebar.menu.groups'),
                    icon: Users,
                    onClick: () => go('/groups'),
                },
                {
                    key: 'forum',
                    label: t('sidebar.menu.forum'),
                    icon: MessageCircle,
                    onClick: () => go('/forum'),
                },
            ],
        },
        ...(isLoggedIn
            ? [
                  {
                      title: t('sidebar.section.account'),
                      items: [
                          {
                              key: 'profile',
                              label: t('sidebar.menu.profile'),
                              icon: User,
                              onClick: () => go('/profile'),
                          },
                          {
                              key: 'notifications',
                              label: t('sidebar.menu.notifications'),
                              icon: Bell,
                              onClick: () => go(ROUTES.NOTIFICATIONS),
                          },
                      ],
                  },
              ]
            : []),
        ...(canAccessAdminPortal
            ? [
                  {
                      title: t('sidebar.section.panel'),
                      items: [
                          {
                              key: 'dashboard',
                              label: t('sidebar.menu.dashboard'),
                              icon: LayoutDashboard,
                              onClick: () => go(ROUTES.DASHBOARD),
                          },
                      ],
                  },
              ]
            : []),
    ];

    const footer = isLoggedIn ? (
        <div className="flex flex-col gap-1">
            <button
                type="button"
                onClick={() => {
                    onClose();
                    onSettingsClick?.();
                }}
                className="flex h-10 items-center gap-3 rounded-mr-xs px-3 text-mr-small font-mr-bold text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg transition-colors duration-mr-default"
            >
                <Settings className="size-4" aria-hidden="true" />
                {t('sidebar.action.settings')}
            </button>
            <button
                type="button"
                onClick={onClearCache}
                className="flex h-10 items-center gap-3 rounded-mr-xs px-3 text-mr-small font-mr-bold text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg transition-colors duration-mr-default"
            >
                <Trash2 className="size-4" aria-hidden="true" />
                {t('sidebar.action.clearCache')}
            </button>
            <button
                type="button"
                onClick={() => {
                    onLogoutClick?.();
                    onClose();
                }}
                className="flex h-10 items-center gap-3 rounded-mr-xs px-3 text-mr-small font-mr-bold text-mr-danger hover:bg-mr-danger/10 transition-colors duration-mr-default"
            >
                <LogOut className="size-4" aria-hidden="true" />
                {t('sidebar.action.logout')}
            </button>
        </div>
    ) : (
        <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={() => go('/login')} className="w-full">
                {t('sidebar.loginCta')}
            </Button>
            <Button variant="raised" onClick={() => go('/sign-up')} className="w-full">
                {t('sidebar.signUpCta')}
            </Button>
        </div>
    );

    return (
        <DSSideMenu
            open={open}
            onClose={onClose}
            sections={sections}
            user={user ? { name: user.name, avatar: user.avatar } : null}
            activeKey={activeKey}
            footer={footer}
        />
    );
};

export default SideMenu;
