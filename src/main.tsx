import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

import './main.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AppLayout from './components/app-layout/AppLayout.tsx';

import Home from './pages/home/Home.tsx';
import Title from './pages/title/Title.tsx';
import Categories from './pages/categories/Categories.tsx';
import Login from './pages/login/Login.tsx';
import SignUp from './pages/sign-up/SignUp.tsx';
import ForgotPassword from './pages/forgot-password/ForgotPassword.tsx';
import PublishWork from './pages/publish-work/PublishWork.tsx';
import AboutUs from './pages/about-us/AboutUs.tsx';
import TermsOfUse from './pages/terms/TermsOfUse.tsx';
import Dmca from './pages/terms/Dmca.tsx';
import NotFound from './pages/error/NotFound.tsx';

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
        path: 'title/:title',
        element: <Title />,
      },
      {
        path: 'categories',
        element: <Categories />,
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
