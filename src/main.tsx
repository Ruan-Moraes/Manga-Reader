import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './main.css';

import AppLayout from './components/app-layout/AppLayout.tsx';
import Home from './routes/home/Home.tsx';
import Title from './routes/title/Title.tsx';
import Categories from './routes/categories/Categories.tsx';
import Groups from './routes/groups/Groups.tsx';
import News from './routes/news/News.tsx';
import Login from './routes/login/Login.tsx';
import SignUp from './routes/sign-up/SignUp.tsx';
import ForgotPassword from './routes/forgot-password/ForgotPassword.tsx';
import PublishWork from './routes/publish-work/PublishWork.tsx';
import AboutUs from './routes/about-us/AboutUs.tsx';
import TermsOfUse from './routes/terms/TermsOfUse.tsx';
import Dmca from './routes/terms/Dmca.tsx';
import NotFound from './routes/error/NotFound.tsx';

const queryClient = new QueryClient({});

export const clearCache = () => {
  queryClient.resetQueries();

  localStorage.clear();

  alert('Cache limpo com sucesso!');
};

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
        element: <Title />,
      },
      {
        path: 'titles/:title/:chapter',
        element: <Title />,
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
        element: <News />,
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
      <RouterProvider router={routes} />
    </QueryClientProvider>
  </StrictMode>
);
