import { Outlet, ScrollRestoration } from 'react-router-dom';

const RootLayout = () => {
    return (
        <>
            <ScrollRestoration />
            <Outlet />
        </>
    );
};

export default RootLayout;
