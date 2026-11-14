import { Suspense } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';

import RouteSuspenseFallback from '@ui/RouteSuspenseFallback';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { MobileTabBar } from '@widgets/mobile-tab-bar';
import { ProfileSettingsModal } from '@widgets/profile-settings-modal';
import { UserModal } from '@entities/user';

const TAB_KEYS: Record<string, string> = {
    '/': 'home',
    '/search': 'search',
    '/library': 'library',
    '/profile': 'profile',
};

const getActiveTabKey = (pathname: string) => {
    if (TAB_KEYS[pathname]) return TAB_KEYS[pathname];

    if (pathname.startsWith('/search')) return 'search';

    if (pathname.startsWith('/library')) return 'library';

    if (pathname.startsWith('/profile') || pathname.startsWith('/u/')) return 'profile';

    return 'home';
};

const RootLayout = () => {
    const { pathname } = useLocation();

    const navigate = useAppNavigate();

    return (
        <>
            <ScrollRestoration />
            <Suspense fallback={<RouteSuspenseFallback />}>
                {/* pb precisa ficar em sincronia com h-[52px] do MobileTabBar em shared/ui/MobileTabBar.tsx */}
                <div className="flex min-h-screen flex-col pb-[calc(52px+env(safe-area-inset-bottom))] md:pb-0">
                    <Header />
                    <div className="flex flex-1 flex-col">
                        <Outlet />
                    </div>
                    <Footer />
                    <MobileTabBar activeKey={getActiveTabKey(pathname)} onNavigate={navigate} />
                </div>
                <ProfileSettingsModal />
                <UserModal />
            </Suspense>
        </>
    );
};

export default RootLayout;
