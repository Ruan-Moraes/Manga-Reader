import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import RouteSuspenseFallback from '@ui/RouteSuspenseFallback';

const ChapterLayout = () => (
    <>
        <ScrollRestoration />
        <Suspense fallback={<RouteSuspenseFallback />}>
            <Outlet />
        </Suspense>
    </>
);

export default ChapterLayout;
