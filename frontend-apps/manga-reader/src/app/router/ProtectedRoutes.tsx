import { lazy, ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { showErrorToast } from '@shared/service/util/toastService';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';

import {
    getStoredSession,
    mapAuthResponseToUser,
} from '@feature/auth/service/authService';
import { type UserRole } from '@feature/user';

const PublishWork = lazy(() => import('@app/route/publish-work/PublishWork'));
const Library = lazy(() => import('@app/route/library/Library'));
const MyReviews = lazy(() => import('@app/route/review/MyReviews'));
const AdminLayout = lazy(() => import('@app/layout/AdminLayout'));
const DashboardOverview = lazy(
    () => import('@app/route/dashboard/DashboardOverview'),
);
const DashboardUsers = lazy(
    () => import('@app/route/dashboard/DashboardUsers'),
);
const DashboardUserDetail = lazy(
    () => import('@app/route/dashboard/DashboardUserDetail'),
);
const DashboardTitles = lazy(
    () => import('@app/route/dashboard/DashboardTitles'),
);
const DashboardTitleForm = lazy(
    () => import('@app/route/dashboard/DashboardTitleForm'),
);
const DashboardNews = lazy(() => import('@app/route/dashboard/DashboardNews'));
const DashboardNewsForm = lazy(
    () => import('@app/route/dashboard/DashboardNewsForm'),
);
const DashboardEvents = lazy(
    () => import('@app/route/dashboard/DashboardEvents'),
);
const DashboardEventForm = lazy(
    () => import('@app/route/dashboard/DashboardEventForm'),
);
const DashboardGroups = lazy(
    () => import('@app/route/dashboard/DashboardGroups'),
);
const DashboardGroupDetail = lazy(
    () => import('@app/route/dashboard/DashboardGroupDetail'),
);
const DashboardGroupForm = lazy(
    () => import('@app/route/dashboard/DashboardGroupForm'),
);
const DashboardFinancial = lazy(
    () => import('@app/route/dashboard/DashboardFinancial'),
);
const DashboardSubscriptions = lazy(
    () => import('@app/route/dashboard/DashboardSubscriptions'),
);
const DashboardTags = lazy(() => import('@app/route/dashboard/DashboardTags'));

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
        return <Navigate to={`${WEB_BASE_URL}/login`} replace />;
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
        return <Navigate to={`${WEB_BASE_URL}/login`} replace />;
    }

    if (!allowedRoles.includes(role)) {
        showErrorToast('Você não possui permissão para acessar o dashboard.', {
            toastId: 'dashboard-role-error',
        });

        return <Navigate to={`${WEB_BASE_URL}/`} replace />;
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
            { path: 'groups/:groupId/edit', element: <DashboardGroupForm /> },
            { path: 'tags', element: <DashboardTags /> },
            { path: 'financial', element: <DashboardFinancial /> },
            { path: 'subscriptions', element: <DashboardSubscriptions /> },
        ],
    },
];

export default protectedRoutes;
