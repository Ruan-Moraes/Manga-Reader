import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Styles imports
import './main.css';

// Pages imports
import Index from './pages/Index';
import Error404 from './pages/Error404.tsx';
import Login from './pages/Login.tsx';
import SignUp from './pages/Sign_Up.tsx';
import Categories from './pages/Categories.tsx';

// Routes
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
    path: '*',
    element: <Error404 />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={routes} />
  </StrictMode>
);
