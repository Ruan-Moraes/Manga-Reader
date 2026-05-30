import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Settings, Trash2 } from 'lucide-react';

import { WEB_BASE_URL } from '../../shared/constant/WEB_BASE_URL';
import { clearCache } from '@shared/service/util/queryCache';

import UserSettingsModal from './settings/UserSettingsModal';
import SidebarProfileCard from './SidebarProfileCard';
import { useSidebarMenuItems } from './hooks/useSidebarMenuItems';

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

type Props = {
    profile: MenuProfile;
    isLoggedIn: boolean;
    onLogout: () => void;
    onNavigate: () => void;
};

type MenuItem = { label: string; link: string; badge?: string };

const sectionTitleClass = 'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

const menuItemClass =
    'flex items-center justify-between px-3 py-2 rounded-xs text-sm font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default';

const MenuNavLink = ({ label, link, badge, onNavigate }: MenuItem & { onNavigate: () => void }) => (
    <Link to={`${WEB_BASE_URL}${link}`} className={menuItemClass} onClick={onNavigate}>
        <span>{label}</span>
        {badge && <span className="px-2 py-0.5 text-[0.68rem] font-semibold rounded-xs bg-secondary border border-tertiary text-tertiary">{badge}</span>}
    </Link>
);

const MenuSection = ({ title, items, onNavigate }: { title: string; items: MenuItem[]; onNavigate: () => void }) => (
    <section className="flex flex-col gap-1.5">
        <h3 className={sectionTitleClass}>{title}</h3>
        {items.map(item => (
            <MenuNavLink key={item.label} {...item} onNavigate={onNavigate} />
        ))}
    </section>
);

const SidebarMenuContent = ({ profile, isLoggedIn, onLogout, onNavigate }: Props) => {
    const { t } = useTranslation('layout');
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

    const { feedItems, libraryItems, communityItems, settingsItems, roleItems } = useSidebarMenuItems(profile);

    return (
        <div className="flex flex-col h-full gap-4 px-4 pb-4 overflow-y-auto">
            <SidebarProfileCard profile={profile} isLoggedIn={isLoggedIn} onNavigate={onNavigate} />

            <MenuSection title={t('sidebar.section.feed')} items={feedItems} onNavigate={onNavigate} />

            {isLoggedIn && <MenuSection title={t('sidebar.section.library')} items={libraryItems} onNavigate={onNavigate} />}

            <MenuSection title={t('sidebar.section.community')} items={communityItems} onNavigate={onNavigate} />

            {isLoggedIn && <MenuSection title={t('sidebar.section.user')} items={settingsItems} onNavigate={onNavigate} />}

            {(profile.isPoster || profile.isAdmin) && <MenuSection title={t('sidebar.section.panel')} items={roleItems} onNavigate={onNavigate} />}

            <div className="flex flex-col gap-2 p-2 mt-auto border bg-secondary rounded-xs border-tertiary">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsUserSettingsOpen(true)}
                        className="flex-1 h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-primary-default hover:bg-tertiary/20 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <Settings /> {t('sidebar.action.settings')}
                    </button>
                    <button
                        type="button"
                        onClick={clearCache}
                        className="flex-1 h-10 px-4 text-xs font-semibold border rounded-xs border-tertiary bg-primary-default hover:bg-tertiary/20 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <Trash2 /> {t('sidebar.action.clearCache')}
                    </button>
                </div>
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full h-10 px-4 text-xs font-semibold border rounded-xs border-quinary-default text-quinary-default bg-primary-default hover:bg-quinary-default hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <LogOut /> {t('sidebar.action.logout')}
                    </button>
                )}
            </div>

            <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} isLoggedIn={isLoggedIn} />
        </div>
    );
};

export default SidebarMenuContent;
