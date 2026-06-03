import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import '@fontsource-variable/nunito-sans/wght.css';
import '@fontsource-variable/nunito-sans/wght-italic.css';
import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';

import i18n from './i18n/config';

import { QueryClientProvider } from '@tanstack/react-query';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from '@entities/user';
import { CommentSortProvider } from '@entities/comment';
import { AuthProvider } from '@features/auth';

import { queryClient } from '@shared/service/util/queryCache';

import ToastContainer from '@ui/ToastContainer';
import { ToastProvider as DSToastProvider } from '@ui/Toast';
import ErrorBoundary from '@ui/ErrorBoundary';
import RouteErrorFallback from '@ui/RouteErrorFallback';

import { initGlobalErrorHandler } from '@shared/service/errorReporting/globalErrorHandler';

import { WEB_BASE_URL } from './shared/constant/WEB_BASE_URL';

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
        import('@pages/forum/ui/Forum');
        import('@pages/news/ui/News');
        import('@pages/event/ui/Events');
        import('@pages/group/ui/Groups');
        import('@pages/title/ui/TitleDetails');
        import('@pages/trending/ui/Trending');
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
                    <AuthProvider>
                        <UserModalProvider>
                            <CommentSortProvider>
                                <RouterProvider router={routes} />
                                <ToastContainer />
                                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                            </CommentSortProvider>
                        </UserModalProvider>
                    </AuthProvider>
                </DSToastProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    </StrictMode>,
);
