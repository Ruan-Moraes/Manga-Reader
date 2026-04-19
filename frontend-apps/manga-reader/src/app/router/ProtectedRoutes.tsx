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
import DashboardTitles from '@app/route/dashboard/DashboardTitles';
import DashboardTitleForm from '@app/route/dashboard/DashboardTitleForm';
import DashboardNews from '@app/route/dashboard/DashboardNews';
import DashboardNewsForm from '@app/route/dashboard/DashboardNewsForm';
import DashboardEvents from '@app/route/dashboard/DashboardEvents';
import DashboardEventForm from '@app/route/dashboard/DashboardEventForm';
import DashboardGroups from '@app/route/dashboard/DashboardGroups';
import DashboardGroupDetail from '@app/route/dashboard/DashboardGroupDetail';
import DashboardFinancial from '@app/route/dashboard/DashboardFinancial';
import DashboardSubscriptions from '@app/route/dashboard/DashboardSubscriptions';
import DashboardTags from '@app/route/dashboard/DashboardTags';

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
            { path: 'titles', element: <DashboardTitles /> },
            { path: 'titles/new', element: <DashboardTitleForm /> },
            { path: 'titles/:titleId/edit', element: <DashboardTitleForm /> },
            { path: 'news', element: <DashboardNews /> },
            { path: 'news/new', element: <DashboardNewsForm /> },
            { path: 'news/:newsId/edit', element: <DashboardNewsForm /> },
            { path: 'events', element: <DashboardEvents /> },
            { path: 'events/new', element: <DashboardEventForm /> },
            { path: 'events/:eventId/edit', element: <DashboardEventForm /> },
            { path: 'groups', element: <DashboardGroups /> },
            { path: 'groups/:groupId', element: <DashboardGroupDetail /> },
            { path: 'tags', element: <DashboardTags /> },
            { path: 'financial', element: <DashboardFinancial /> },
            { path: 'subscriptions', element: <DashboardSubscriptions /> },
        ],
    },
];

export default protectedRoutes;
