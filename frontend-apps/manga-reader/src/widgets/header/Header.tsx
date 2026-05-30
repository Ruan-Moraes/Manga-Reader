import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NavBar } from './navbar/NavBar';
import { SideMenu } from './SideMenu';
import UserSettingsModal from './settings/UserSettingsModal';

import { useAuth } from '@feature/auth';
import useMenuData from './hooks/useMenuData';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { showInfoToast } from '@shared/service/util/toastService';
import { clearCache } from '@shared/service/util/queryCache';

const Header = () => {
    const { t } = useTranslation('layout');

    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useAppNavigate();
    const { savedCount } = useMenuData(isLoggedIn);

    const [sideOpen, setSideOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const navUser = isLoggedIn && user ? { name: user.name, avatar: user.photo, libraryCount: savedCount } : null;

    const sideUser = isLoggedIn && user ? { name: user.name, avatar: user.photo } : null;

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
                onSearchSubmit={q => navigate(`/search?q=${encodeURIComponent(q)}`)}
                onNotificationsClick={() => {}}
                onLibraryClick={() => navigate('/library')}
                onProfileClick={() => navigate('/profile')}
                onSettingsClick={() => setSettingsOpen(true)}
                onLogoutClick={handleLogout}
                onAccountClick={() => navigate('/login')}
            />
            <SideMenu
                open={sideOpen}
                onClose={() => setSideOpen(false)}
                user={sideUser}
                isLoggedIn={isLoggedIn}
                libraryCount={savedCount}
                onNavigate={navigate}
                onSettingsClick={() => setSettingsOpen(true)}
                onLogoutClick={handleLogout}
                onClearCache={clearCache}
            />
            <UserSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} isLoggedIn={isLoggedIn} />
        </>
    );
};

export default Header;
