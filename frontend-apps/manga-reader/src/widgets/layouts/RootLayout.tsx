import { Suspense } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';

import RouteSuspenseFallback from '@shared/component/loading/RouteSuspenseFallback';
import useAppNavigate from '@shared/hook/useAppNavigate';

import Header from '@widgets/header/Header';
import Footer from '@widgets/footer/Footer';
import { MobileTabBar } from '@widgets/mobile-tab-bar/MobileTabBar';

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
                <div className="flex min-h-screen flex-col">
                    <Header />
                    <div className="flex flex-1 flex-col">
                        <Outlet />
                    </div>
                    <Footer />
                    <MobileTabBar activeKey={getActiveTabKey(pathname)} onNavigate={navigate} />
                </div>
            </Suspense>
        </>
    );
};

export default RootLayout;
