import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './main.css';

import Index from './pages/index/Index.tsx';
import Categories from './pages/categories/Categories.tsx';
import Login from './pages/login/Login.tsx';
import SignUp from './pages/sign_up/SignUp.tsx';
import ForgotPassword from './pages/forgot_password/ForgotPassword.tsx';
import IWantToPublishWork from './pages/i_want_to_publish_work/IWantToPublishWork.tsx';
import AboutUs from './pages/about_us/AboutUs.tsx';
import Dmca from './pages/dmca/Dmca.tsx';
import TermsOfUse from './pages/terms_of_use/TermsOfUse.tsx';
import Error404 from './pages/error404/Error404.tsx';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const routes = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/categories',
    element: <Categories />,
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
    path: 'forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/i-want-to-publish-work',
    element: <IWantToPublishWork />,
  },
  {
    path: '/about-us',
    element: <AboutUs />,
  },
  {
    path: '/dmca',
    element: <Dmca />,
  },
  {
    path: '/terms-of-use',
    element: <TermsOfUse />,
  },
  {
    path: '*',
    element: <Error404 />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={routes} />
  </StrictMode>
);
