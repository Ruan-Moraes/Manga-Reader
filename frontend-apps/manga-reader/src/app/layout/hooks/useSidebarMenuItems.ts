import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MenuProfile } from './SidebarMenuContent';

type MenuItem = { label: string; link: string; badge?: string };

type SidebarMenuItems = {
    feedItems: MenuItem[];
    libraryItems: MenuItem[];
    communityItems: MenuItem[];
    settingsItems: MenuItem[];
    roleItems: MenuItem[];
};

export const useSidebarMenuItems = (profile: MenuProfile): SidebarMenuItems => {
    const { t } = useTranslation('layout');

    return useMemo<SidebarMenuItems>(
        () => ({
            feedItems: [
                { label: t('sidebar.feed.home'), link: '/' },
                {
                    label: t('sidebar.feed.trending'),
                    link: '/filter?sort=most_read',
                    badge: t('sidebar.feed.trendingBadge'),
                },
                { label: t('sidebar.feed.new'), link: '/news?filter=new' },
            ],

            libraryItems: [
                {
                    label: t('sidebar.library.myMangas'),
                    link: '/library',
                    badge: t('sidebar.library.savedBadge', {
                        count: profile.savedCount ?? 0,
                    }),
                },
                { label: t('sidebar.library.reviews'), link: '/reviews' },
                ...(profile.canDownload
                    ? [
                          {
                              label: t('sidebar.library.downloads'),
                              link: '/library?tab=downloads',
                          },
                      ]
                    : []),
            ],

            communityItems: [
                {
                    label: t('sidebar.community.news'),
                    link: '/news',
                    badge: profile.newsBadge,
                },
                {
                    label: t('sidebar.community.events'),
                    link: '/events',
                    badge: profile.eventBadge,
                },
                {
                    label: t('sidebar.community.translationGroups'),
                    link: '/groups',
                },
                { label: t('sidebar.community.forum'), link: '/forum' },
            ],

            settingsItems: [{ label: t('sidebar.user.profile'), link: '/profile' }],

            roleItems: [
                ...(profile.isPoster || profile.isAdmin
                    ? [
                          {
                              label: t('sidebar.admin.dashboard'),
                              link: '/dashboard',
                          },
                      ]
                    : []),
                ...(profile.isAdmin
                    ? [
                          {
                              label: t('sidebar.admin.manageNews'),
                              link: '/news?tab=manage',
                          },
                          {
                              label: t('sidebar.admin.manageEvents'),
                              link: '/events?tab=manage',
                          },
                          {
                              label: t('sidebar.admin.manageGroups'),
                              link: '/groups?tab=manage',
                          },
                          {
                              label: t('sidebar.admin.manageUsers'),
                              link: '/profile?tab=users',
                          },
                          {
                              label: t('sidebar.admin.siteSettings'),
                              link: '/profile?tab=site',
                          },
                      ]
                    : []),
            ],
        }),
        [t, profile],
    );
};
