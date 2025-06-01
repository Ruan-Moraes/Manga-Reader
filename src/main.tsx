import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './services/utils/cache.tsx';

import { UserModalProvider } from './context/modals/user/UserModalContext.tsx';
import { EmojiModalProvider } from './context/modals/emoji/EmojiModalContext.tsx';

import AppLayout from './components/app-layout/AppLayout.tsx';
import Home from './routes/home/Home.tsx';
import Titles from './routes/titles/Titles.tsx';
import Chapter from './routes/chapter/Chapter.tsx';
import Categories from './routes/categories/Categories.tsx';
import Groups from './routes/groups/Groups.tsx';
import News from './routes/news/News.tsx';
import Events from './routes/events/Events.tsx';
import Login from './routes/login/Login.tsx';
import SignUp from './routes/sign-up/SignUp.tsx';
import ForgotPassword from './routes/forgot-password/ForgotPassword.tsx';
import PublishWork from './routes/publish-work/PublishWork.tsx';
import AboutUs from './routes/about-us/AboutUs.tsx';
import TermsOfUse from './routes/terms/TermsOfUse.tsx';
import Dmca from './routes/terms/Dmca.tsx';
import NotFound from './routes/error/NotFound.tsx';

import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css';

import Toast from './components/toast/Toast';

// TODO: Cria dois arquivos de rotas, um para as rotas públicas e outro para as rotas privadas (com autenticação).
const routes = createBrowserRouter([
    {
        path: 'Manga-Reader',
        element: <AppLayout />,
        children: [
            {
                path: '',
                element: <Home />,
            },
            {
                path: 'titles/:title',
                element: <Titles />,
            },
            {
                path: 'titles/:title/:chapter',
                element: <Chapter />,
            },
            {
                path: 'categories',
                element: <Categories />,
            },
            {
                path: 'groups',
                element: <Groups />,
            },
            {
                path: 'news',
                element: <News />,
            },
            {
                path: 'events',
                element: <Events />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'sign-up',
                element: <SignUp />,
            },
            {
                path: 'forgot-password',
                element: <ForgotPassword />,
            },
            {
                path: 'i-want-to-publish-work',
                element: <PublishWork />,
            },
            {
                path: 'about-us',
                element: <AboutUs />,
            },
            {
                path: 'terms-of-use',
                element: <TermsOfUse />,
            },
            {
                path: 'dmca',
                element: <Dmca />,
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <UserModalProvider>
                <EmojiModalProvider>
                    <RouterProvider router={routes} />
                    <Toast />
                    {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                </EmojiModalProvider>
            </UserModalProvider>
        </QueryClientProvider>
    </StrictMode>,
);
