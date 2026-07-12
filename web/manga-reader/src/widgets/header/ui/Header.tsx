import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NavBar } from './navbar/NavBar';
import { SideMenu } from './SideMenu';
import AdminPortalShortcut from './AdminPortalShortcut';

import { useProfileSettingsModal } from '@entities/user';
import { canAccessAdminPortal, useAuth } from '@features/auth';
import useMenuData from '../model/useMenuData';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { showInfoToast } from '@shared/service/util/toastService';
import { clearCache } from '@shared/service/util/queryCache';

const Header = () => {
    const { t } = useTranslation('layout');

    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useAppNavigate();
    const { savedCount } = useMenuData(isLoggedIn);
    const { openProfileSettings } = useProfileSettingsModal();

    const [sideOpen, setSideOpen] = useState(false);

    const navUser = isLoggedIn && user ? { name: user.name, avatar: user.photo, libraryCount: savedCount } : null;

    const sideUser = isLoggedIn && user ? { name: user.name, avatar: user.photo } : null;
    const hasAdminPortalAccess = canAccessAdminPortal(user?.role);

    const handleLogout = () => {
        logout();

        showInfoToast(t('header.sessionEnded'));
    };

    return (
        <>
            <NavBar
                user={navUser}
                onNavigate={navigate}
                onOpenSideMenu={() => setSideOpen(true)}
                onSearchSubmit={q => navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(q)}`)}
                onNotificationsClick={() => {}}
                onLibraryClick={() => navigate(ROUTES.LIBRARY)}
                onProfileClick={() => navigate(ROUTES.PROFILE)}
                onSettingsClick={() => openProfileSettings()}
                onLogoutClick={handleLogout}
                onAccountClick={() => navigate(ROUTES.LOGIN)}
            />
            <SideMenu
                open={sideOpen}
                onClose={() => setSideOpen(false)}
                user={sideUser}
                isLoggedIn={isLoggedIn}
                canAccessAdminPortal={hasAdminPortalAccess}
                libraryCount={savedCount}
                onNavigate={navigate}
                onSettingsClick={() => openProfileSettings()}
                onLogoutClick={handleLogout}
                onClearCache={clearCache}
            />
            <AdminPortalShortcut visible={hasAdminPortalAccess} onNavigate={navigate} />
        </>
    );
};

export default Header;
