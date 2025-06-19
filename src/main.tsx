import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UserModalProvider } from './context/modals/user/UserModalContext.tsx';
import { EmojiModalProvider } from './context/modals/emoji/EmojiModalContext.tsx';
import { CommentSortProvider } from './context/comments/CommentSortContext.tsx';

import { queryClient } from './services/utils/cache.tsx';

import AppLayout from './components/app-layout/AppLayout.tsx';

import publicRoutes from './router/publicRoutes.tsx';
import protectedRoutes from './router/protectedRoutes.tsx';

import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';

import Toast from './components/toast/Toast';

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
