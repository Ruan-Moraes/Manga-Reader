import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import RouteSuspenseFallback from '@shared/component/loading/RouteSuspenseFallback';

const RootLayout = () => {
    return (
        <>
            <ScrollRestoration />
            <Suspense fallback={<RouteSuspenseFallback />}>
                <Outlet />
            </Suspense>
        </>
    );
};

export default RootLayout;
