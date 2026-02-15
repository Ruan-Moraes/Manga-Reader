import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from '@feature/auth';
import { EmojiModalProvider, CommentSortProvider } from '@feature/comment';

import { queryClient } from '@shared/service/util/cache';

import AppLayout from '@app/layout/AppLayout';

import publicRoutes from '@app/router/PublicRoutes';
import protectedRoutes from '@app/router/ProtectedRoutes';

import './style/index.css';
import 'react-toastify/dist/ReactToastify.css';

import Toast from '@shared/component/toast/Toast';

const routes = createBrowserRouter([
    {
        path: 'Manga-Reader',
        element: <AppLayout />,
        children: [...publicRoutes, ...protectedRoutes],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <UserModalProvider>
                <EmojiModalProvider>
                    <CommentSortProvider>
                        <RouterProvider router={routes} />
                        <Toast />
                        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                    </CommentSortProvider>
                </EmojiModalProvider>
            </UserModalProvider>
        </QueryClientProvider>
    </StrictMode>,
);
