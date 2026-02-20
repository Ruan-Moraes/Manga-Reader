import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from '@feature/user';
import { EmojiModalProvider, CommentSortProvider } from '@feature/comment';

import { queryClient } from '@shared/service/util/queryCache';

import RootLayout from '@app/layout/RootLayout';

import publicRoutes from '@app/router/PublicRoutes';
import protectedRoutes from '@app/router/ProtectedRoutes';

import './style/index.css';
import 'react-toastify/dist/ReactToastify.css';

import ToastProvider from '@shared/component/toast/ToastProvider';

const routes = createBrowserRouter([
    {
        path: 'Manga-Reader',
        element: <RootLayout />,
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
                        <ToastProvider />
                        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                    </CommentSortProvider>
                </EmojiModalProvider>
            </UserModalProvider>
        </QueryClientProvider>
    </StrictMode>,
);
