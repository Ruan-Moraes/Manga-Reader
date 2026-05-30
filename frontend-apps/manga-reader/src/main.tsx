import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import '@fontsource-variable/nunito-sans/wght.css';
import '@fontsource-variable/nunito-sans/wght-italic.css';
import './style/index.css';
import 'react-toastify/dist/ReactToastify.css';

import i18n from './i18n/config';

import { QueryClientProvider } from '@tanstack/react-query';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from '@features/user';
import { CommentSortProvider } from '@features/comment';

import { queryClient } from '@shared/service/util/queryCache';

import ToastProvider from '@shared/component/toast/ToastProvider';
import { ToastProvider as DSToastProvider } from '@ui/Toast';
import ErrorBoundary from '@shared/component/errorBoundary/ErrorBoundary';
import RouteErrorFallback from '@shared/component/errorBoundary/RouteErrorFallback';

import { initGlobalErrorHandler } from '@shared/service/errorReporting/globalErrorHandler';

import { WEB_BASE_URL } from '@shared/constant/baseUrl';

import { RootLayout, ChapterLayout } from '@widgets/layouts';

import { contentRoutes, authRoutes, chapterRoutes } from '@app/router/PublicRoutes';
import { protectedContentRoutes, adminRoute } from '@app/router/ProtectedRoutes';

initGlobalErrorHandler();

const IDLE_CALLBACK_TIMEOUT_MS = 3000;
const IDLE_FALLBACK_DELAY_MS = 1500;

const prefetchOnIdle = () => {
    const scheduleIdle = (fn: () => void) =>
        'requestIdleCallback' in window
            ? window.requestIdleCallback(fn, {
                  timeout: IDLE_CALLBACK_TIMEOUT_MS,
              })
            : setTimeout(fn, IDLE_FALLBACK_DELAY_MS);

    scheduleIdle(() => {
        import('@pages/forum/Forum');
        import('@pages/news/News');
        import('@pages/event/Events');
        import('@pages/group/Groups');
        import('@pages/title/TitleDetails');
        import('@pages/trending/Trending');
    });
};

prefetchOnIdle();

// i18n — ao trocar idioma, invalida cache React Query.
// Backend resolve LocalizedString por Accept-Language e particiona UGC,
// então respostas em cache do idioma anterior não servem.
i18n.on('languageChanged', () => {
    queryClient.invalidateQueries();
});

const routes = createBrowserRouter([
    {
        path: WEB_BASE_URL.replace(/^\//, ''),
        errorElement: <RouteErrorFallback />,
        children: [
            {
                element: <RootLayout />,
                children: [...contentRoutes, ...protectedContentRoutes, ...authRoutes],
            },
            {
                element: <ChapterLayout />,
                children: [...chapterRoutes],
            },
            ...adminRoute,
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <DSToastProvider>
                    <UserModalProvider>
                        <CommentSortProvider>
                            <RouterProvider router={routes} />
                            <ToastProvider />
                            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                        </CommentSortProvider>
                    </UserModalProvider>
                </DSToastProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    </StrictMode>,
);
