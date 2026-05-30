import { lazy, ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { showErrorToast } from '@shared/service/util/toastService';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';

import { getStoredSession } from '@shared/service/session';

import { mapAuthResponseToUser } from '@feature/auth';
import { type UserRole } from '@feature/user';

const PublishWork = lazy(() => import('@app/route/publish-work/PublishWork'));
const Library = lazy(() => import('@app/route/library/Library'));
const MyReviews = lazy(() => import('@app/route/review/MyReviews'));
const AdminLayout = lazy(() => import('@app/layout/AdminLayout'));
const DashboardOverview = lazy(() => import('@app/route/dashboard/DashboardOverview'));
const DashboardUsers = lazy(() => import('@app/route/dashboard/DashboardUsers'));
const DashboardUserDetail = lazy(() => import('@app/route/dashboard/DashboardUserDetail'));
const DashboardTitles = lazy(() => import('@app/route/dashboard/DashboardTitles'));
const DashboardTitleForm = lazy(() => import('@feature/admin').then(m => ({ default: m.AdminTitleForm })));
const DashboardNews = lazy(() => import('@app/route/dashboard/DashboardNews'));
const DashboardNewsForm = lazy(() => import('@feature/admin').then(m => ({ default: m.AdminNewsForm })));
const DashboardEvents = lazy(() => import('@app/route/dashboard/DashboardEvents'));
const DashboardEventForm = lazy(() => import('@feature/admin').then(m => ({ default: m.AdminEventForm })));
const DashboardGroups = lazy(() => import('@app/route/dashboard/DashboardGroups'));
const DashboardGroupDetail = lazy(() => import('@app/route/dashboard/DashboardGroupDetail'));
const DashboardGroupForm = lazy(() => import('@feature/admin').then(m => ({ default: m.AdminGroupForm })));
const DashboardFinancial = lazy(() => import('@app/route/dashboard/DashboardFinancial'));
const DashboardSubscriptions = lazy(() => import('@app/route/dashboard/DashboardSubscriptions'));
const DashboardTags = lazy(() => import('@app/route/dashboard/DashboardTags'));

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { t } = useTranslation('common');
    const session = getStoredSession();
    const isAuthenticated = Boolean(session);

    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, location.pathname);

            showErrorToast(t('guard.authRequired'), { toastId: 'auth-error' });
        }
    }, [isAuthenticated, location, t]);

    if (!isAuthenticated) {
        return <Navigate to={`${WEB_BASE_URL}/login`} replace />;
    }

    return <>{children}</>;
};

const RoleGuard = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) => {
    const { t } = useTranslation('common');
    const session = getStoredSession();

    const role = session ? (mapAuthResponseToUser(session).role ?? 'user') : 'user';

    if (!session) {
        return <Navigate to={`${WEB_BASE_URL}/login`} replace />;
    }

    if (!allowedRoles.includes(role)) {
        showErrorToast(t('guard.dashboardForbidden'), {
            toastId: 'dashboard-role-error',
        });

        return <Navigate to={`${WEB_BASE_URL}/`} replace />;
    }

    return <>{children}</>;
};

export const protectedContentRoutes = [
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
];

export const adminRoute = [
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

export default [...protectedContentRoutes, ...adminRoute];
