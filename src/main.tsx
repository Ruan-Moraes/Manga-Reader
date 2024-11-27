import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './main.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AppLayout from './components/app_layout/AppLayout.tsx';

import Home from './pages/home/Home.tsx';
import CategoryList from './pages/categories/CategoryList.tsx';
import Login from './pages/login/Login.tsx';
import SignUp from './pages/sign_up/SignUp.tsx';
import ForgotPassword from './pages/forgot_password/ForgotPassword.tsx';
import PublishWork from './pages/publish_work/PublishWork.tsx';
import AboutUs from './pages/about_us/AboutUs.tsx';
import TermsOfUse from './pages/terms/TermsOfUse.tsx';
import Dmca from './pages/terms/Dmca.tsx';
import NotFound from './pages/error/NotFound.tsx';

const routes = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/categories',
        element: <CategoryList />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/sign-up',
        element: <SignUp />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/i-want-to-publish-work',
        element: <PublishWork />,
      },
      {
        path: '/about-us',
        element: <AboutUs />,
      },
      {
        path: '/terms-of-use',
        element: <TermsOfUse />,
      },
      {
        path: '/dmca',
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
    <RouterProvider router={routes} />
  </StrictMode>
);
