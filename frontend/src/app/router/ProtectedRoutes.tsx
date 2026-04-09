import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { showErrorToast } from '@shared/service/util/toastService';

import PublishWork from '@app/route/publish-work/PublishWork';
import Library from '@app/route/library/Library';
import MyReviews from '@app/route/review/MyReviews';
import AdminLayout from '@app/layout/AdminLayout';
import DashboardOverview from '@app/route/dashboard/DashboardOverview';
import DashboardUsers from '@app/route/dashboard/DashboardUsers';
import DashboardUserDetail from '@app/route/dashboard/DashboardUserDetail';

import {
    getStoredSession,
    mapAuthResponseToUser,
} from '@feature/auth/service/authService';
import { type UserRole } from '@feature/user';

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const session = getStoredSession();
    const isAuthenticated = Boolean(session);

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

const RoleGuard = ({
    children,
    allowedRoles,
}: {
    children: ReactNode;
    allowedRoles: UserRole[];
}) => {
    const session = getStoredSession();
    const role = session
        ? (mapAuthResponseToUser(session).role ?? 'user')
        : 'user';

    if (!session) {
        return <Navigate to="/Manga-Reader/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        showErrorToast('Você não possui permissão para acessar o dashboard.', {
            toastId: 'dashboard-role-error',
        });

        return <Navigate to="/Manga-Reader/" replace />;
    }

    return <>{children}</>;
};

const protectedRoutes = [
    {
        path: 'library',
        element: (
            <AuthGuard>
                <Library />
            </AuthGuard>
        ),
    },
    {
        path: 'reviews',
        element: (
            <AuthGuard>
                <MyReviews />
            </AuthGuard>
        ),
    },
    {
        path: 'i-want-to-publish-work',
        element: (
            <AuthGuard>
                <PublishWork />
            </AuthGuard>
        ),
    },
    {
        path: 'dashboard',
        element: (
            <AuthGuard>
                <RoleGuard allowedRoles={['admin', 'poster']}>
                    <AdminLayout />
                </RoleGuard>
            </AuthGuard>
        ),
        children: [
            { index: true, element: <DashboardOverview /> },
            { path: 'users', element: <DashboardUsers /> },
            { path: 'users/:userId', element: <DashboardUserDetail /> },
        ],
    },
];

export default protectedRoutes;
