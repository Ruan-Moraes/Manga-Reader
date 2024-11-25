import { ScrollRestoration, Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

export default AppLayout;
