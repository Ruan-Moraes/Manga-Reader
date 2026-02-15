import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { showErrorToast } from '@shared/service/util/toastUtils';

import PublishWork from '@app/route/publish-work/PublishWork';

// TODO: Implementar a autenticação real
const AuthGuard = ({ children }: { children: ReactNode }) => {
    const isAuthenticated = false;

    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('redirectAfterLogin', location.pathname);

            showErrorToast(
                'Acesso negado. Você precisa estar autenticado para acessar esta página.',
                { toastId: 'auth-error' },
            );
        }
    }, [isAuthenticated, location]);

    if (!isAuthenticated) {
        return <Navigate to="/Manga-Reader/login" replace />;
    }

    return <>{children}</>;
};

const protectedRoutes = [
    {
        path: 'i-want-to-publish-work',
        element: (
            <AuthGuard>
                <PublishWork />
            </AuthGuard>
        ),
    },
];

export default protectedRoutes;
