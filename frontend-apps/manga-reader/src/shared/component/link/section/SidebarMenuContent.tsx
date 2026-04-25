import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    IoLogOutOutline,
    IoSettingsOutline,
    IoTrashOutline,
} from 'react-icons/io5';

import UserSettingsModal from '@shared/component/modal/settings/UserSettingsModal';
import { clearCache } from '@shared/service/util/queryCache';

export type MenuProfile = {
    id: string;
    label: string;
    fullName?: string;
    email?: string;
    planBadge?: string;
    savedCount?: number;
    unreadNotifications?: number;
    newsBadge?: string;
    eventBadge?: string;
    canDownload?: boolean;
    isAdmin?: boolean;
    isPoster?: boolean;
};

type MenuLinkBlockProps = {
    profile: MenuProfile;
    isLoggedIn: boolean;
    onLogout: () => void;
    onNavigate: () => void;
};

type MenuItem = {
    label: string;
    link: string;
    badge?: string;
};

const sectionTitleClass =
    'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

const menuItemClass =
    'flex items-center justify-between px-3 py-2 rounded-xs text-sm font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default';

const MenuNavLink = ({
    label,
    link,
    badge,
    onNavigate,
}: MenuItem & { onNavigate: () => void }) => {
    return (
        <Link
            to={`/Manga-Reader${link}`}
            className={menuItemClass}
            onClick={onNavigate}
        >
            <span>{label}</span>
            {badge && (
                <span className="px-2 py-0.5 text-[0.68rem] font-semibold rounded-xs bg-secondary border border-tertiary text-tertiary">
                    {badge}
                </span>
            )}
        </Link>
    );
};

const SidebarMenuContent = ({
    profile,
    isLoggedIn,
    onLogout,
    onNavigate,
}: MenuLinkBlockProps) => {
    const { t } = useTranslation('layout');
    const [isUserSettingsOpen, setIsUserSettingsOpen] =
        useState<boolean>(false);

    const feedItems: MenuItem[] = [
        { label: t('sidebar.feed.home'), link: '/' },
        {
            label: t('sidebar.feed.trending'),
            link: '/filter?sort=most_read',
            badge: t('sidebar.feed.trendingBadge'),
        },
        { label: t('sidebar.feed.new'), link: '/news?filter=new' },
    ];

    const libraryItems: MenuItem[] = [
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
    ];

    const communityItems: MenuItem[] = [
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
    ];

    const settingsItems: MenuItem[] = [
        { label: t('sidebar.user.profile'), link: '/profile' },
    ];

    const roleItems: MenuItem[] = [
        ...(profile.isPoster || profile.isAdmin
            ? [{ label: t('sidebar.admin.dashboard'), link: '/dashboard' }]
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
    ];

    return (
        <div className="flex flex-col h-full gap-4 px-4 pb-4 overflow-y-auto">
            <div className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary bg-secondary/40">
                {isLoggedIn ? (
                    <>
                        <p className={sectionTitleClass}>
                            {t('sidebar.section.account')}
                        </p>
                        <p className="text-sm font-semibold">
                            {profile.fullName}
                        </p>
                        <p className="text-xs text-tertiary">
                            {profile.email?.replace(
                                /(.{4}).*(@.*)/,
                                '$1••••$2',
                            )}
                        </p>
                        {profile.planBadge && (
                            <p className="text-xs font-semibold text-quaternary-default">
                                {profile.planBadge}
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <p className={sectionTitleClass}>
                            {t('sidebar.section.welcome')}
                        </p>
                        <p className="text-sm font-semibold">
                            {t('sidebar.welcomeMessage')}
                        </p>
                        <div className="flex gap-2 pt-1">
                            <Link
                                to="/Manga-Reader/login"
                                onClick={onNavigate}
                                className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                            >
                                {t('sidebar.loginCta')}
                            </Link>
                            <Link
                                to="/Manga-Reader/sign-up"
                                onClick={onNavigate}
                                className="px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary hover:bg-secondary"
                            >
                                {t('sidebar.signUpCta')}
                            </Link>
                        </div>
                    </>
                )}
            </div>

            <section className="flex flex-col gap-1.5">
                <h3 className={sectionTitleClass}>
                    {t('sidebar.section.feed')}
                </h3>
                {feedItems.map(item => (
                    <MenuNavLink
                        key={item.label}
                        {...item}
                        onNavigate={onNavigate}
                    />
                ))}
            </section>

            {isLoggedIn && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>
                        {t('sidebar.section.library')}
                    </h3>
                    {libraryItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            <section className="flex flex-col gap-1.5">
                <h3 className={sectionTitleClass}>
                    {t('sidebar.section.community')}
                </h3>
                {communityItems.map(item => (
                    <MenuNavLink
                        key={item.label}
                        {...item}
                        onNavigate={onNavigate}
                    />
                ))}
            </section>

            {isLoggedIn && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>
                        {t('sidebar.section.user')}
                    </h3>
                    {settingsItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            {(profile.isPoster || profile.isAdmin) && (
                <section className="flex flex-col gap-1.5">
                    <h3 className={sectionTitleClass}>
                        {t('sidebar.section.panel')}
                    </h3>
                    {roleItems.map(item => (
                        <MenuNavLink
                            key={item.label}
                            {...item}
                            onNavigate={onNavigate}
                        />
                    ))}
                </section>
            )}

            <div className="flex flex-col gap-2 p-2 mt-auto border bg-secondary rounded-xs border-tertiary">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsUserSettingsOpen(true)}
                        className="flex-1 h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-primary-default hover:bg-tertiary/20 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <IoSettingsOutline /> {t('sidebar.action.settings')}
                    </button>
                    <button
                        type="button"
                        onClick={clearCache}
                        className="flex-1 h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-primary-default hover:bg-tertiary/20 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <IoTrashOutline /> {t('sidebar.action.clearCache')}
                    </button>
                </div>
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full h-10 px-4 text-xs font-semibold border rounded-xs border-quinary-default text-quinary-default bg-primary-default hover:bg-quinary-default hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <IoLogOutOutline /> {t('sidebar.action.logout')}
                    </button>
                )}
            </div>

            <UserSettingsModal
                isOpen={isUserSettingsOpen}
                onClose={() => setIsUserSettingsOpen(false)}
                isLoggedIn={isLoggedIn}
            />
        </div>
    );
};

export default SidebarMenuContent;
