import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './style/index.css';
import 'react-toastify/dist/ReactToastify.css';

import { QueryClientProvider } from '@tanstack/react-query';

// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from '@feature/user';
import { CommentSortProvider } from '@feature/comment';

import { queryClient } from '@shared/service/util/queryCache';

import ToastProvider from '@shared/component/toast/ToastProvider';
import ErrorBoundary from '@shared/component/errorBoundary/ErrorBoundary';
import RouteErrorFallback from '@shared/component/errorBoundary/RouteErrorFallback';

import { initGlobalErrorHandler } from '@shared/service/errorReporting/globalErrorHandler';

import RootLayout from '@app/layout/RootLayout';

import publicRoutes from '@app/router/PublicRoutes';
import protectedRoutes from '@app/router/ProtectedRoutes';

initGlobalErrorHandler();

const routes = createBrowserRouter([
    {
        path: 'Manga-Reader',
        element: <RootLayout />,
        errorElement: <RouteErrorFallback />,
        children: [...publicRoutes, ...protectedRoutes],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <UserModalProvider>
                    <CommentSortProvider>
                        <RouterProvider router={routes} />
                        <ToastProvider />
                        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                    </CommentSortProvider>
                </UserModalProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    </StrictMode>,
);
