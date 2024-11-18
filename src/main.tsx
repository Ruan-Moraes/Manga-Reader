import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './main.css';

import Index from './pages/Index';
import Categories from './pages/Categories.tsx';
import Login from './pages/Login.tsx';
import SignUp from './pages/SignUp.tsx';
import IWantToPublishWork from './pages/IWantToPublishWork.tsx';
import AboutUs from './pages/AboutUs.tsx';
import Dmca from './pages/Dmca.tsx';
import TermsOfUse from './pages/TermsOfUse.tsx';
import Error404 from './pages/Error404.tsx';

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
