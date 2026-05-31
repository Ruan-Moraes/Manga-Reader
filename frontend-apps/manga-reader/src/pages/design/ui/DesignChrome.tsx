import { useState } from 'react';

import { ROUTES } from '@shared/constant/ROUTES';
import { NavBar, SideMenu } from '@widgets/header';
import { MobileTabBar } from '@widgets/mobile-tab-bar';
import { Footer } from '@widgets/footer';

const MOCK_USER = { name: 'Leitor BR', avatar: undefined, libraryCount: 12 };

const DesignChrome = () => {
    const [sideOpen, setSideOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');

    const navigate = (path: string) => {
        const key =
            path === '/'
                ? 'home'
                : path.startsWith('/search')
                  ? 'search'
                  : path.startsWith('/library')
                    ? 'library'
                    : path.startsWith('/profile')
                      ? 'profile'
                      : 'home';
        setActiveTab(key);
    };

    return (
        <div className="flex min-h-screen flex-col">
            <NavBar
                user={MOCK_USER}
                onNavigate={navigate}
                onOpenSideMenu={() => setSideOpen(true)}
                onSearchSubmit={() => {}}
                onNotificationsClick={() => {}}
                onLibraryClick={() => navigate(ROUTES.LIBRARY)}
                onProfileClick={() => navigate(ROUTES.PROFILE)}
                onSettingsClick={() => {}}
                onLogoutClick={() => {}}
                onAccountClick={() => navigate(ROUTES.LOGIN)}
            />

            <SideMenu
                open={sideOpen}
                onClose={() => setSideOpen(false)}
                user={MOCK_USER}
                isLoggedIn={true}
                libraryCount={12}
                activeKey={activeTab}
                onNavigate={navigate}
                onSettingsClick={() => {}}
                onLogoutClick={() => {}}
                onClearCache={() => {}}
            />

            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                <h1 className="text-mr-h2 font-mr-extrabold">Chrome Test Bed</h1>
                <p className="text-mr-fg-muted">NavBar + SideMenu + MobileTabBar + Footer</p>
                <p className="text-mr-small text-mr-fg-subtle">
                    Active tab: <strong>{activeTab}</strong>
                </p>
            </main>

            <Footer onNavigate={navigate} />

            <MobileTabBar activeKey={activeTab} onNavigate={navigate} />
        </div>
    );
};

export default DesignChrome;
