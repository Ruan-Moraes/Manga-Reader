import { lazy, ReactNode, useEffect } from 'react';
import { ROUTES } from '@shared/constant/ROUTES';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { showErrorToast } from '@shared/service/util/toastService';
import { WEB_BASE_URL } from '../../shared/constant/WEB_BASE_URL';
import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';

import { getStoredSession } from '@shared/service/session';

import { mapAuthResponseToUser } from '@features/auth';
import { type UserRole } from '@entities/user';

const PublishWork = lazy(() => import('@pages/publish-work/ui/PublishWork'));
const Library = lazy(() => import('@pages/library/ui/Library'));
const MyReviews = lazy(() => import('@pages/review/ui/MyReviews'));
const AdminLayout = lazy(() => import('@widgets/admin-panel/ui/AdminLayout'));
const DashboardOverview = lazy(() => import('@pages/dashboard/ui/DashboardOverview'));
const DashboardUsers = lazy(() => import('@pages/dashboard/ui/DashboardUsers'));
const DashboardUserDetail = lazy(() => import('@pages/dashboard/ui/DashboardUserDetail'));
const DashboardTitles = lazy(() => import('@pages/dashboard/ui/DashboardTitles'));
const DashboardTitleForm = lazy(() => import('@features/admin').then(m => ({ default: m.AdminTitleForm })));
const DashboardNews = lazy(() => import('@pages/dashboard/ui/DashboardNews'));
const DashboardNewsForm = lazy(() => import('@features/admin').then(m => ({ default: m.AdminNewsForm })));
const DashboardEvents = lazy(() => import('@pages/dashboard/ui/DashboardEvents'));
const DashboardEventForm = lazy(() => import('@features/admin').then(m => ({ default: m.AdminEventForm })));
const DashboardGroups = lazy(() => import('@pages/dashboard/ui/DashboardGroups'));
const DashboardGroupDetail = lazy(() => import('@pages/dashboard/ui/DashboardGroupDetail'));
const DashboardGroupForm = lazy(() => import('@features/admin').then(m => ({ default: m.AdminGroupForm })));
const DashboardFinancial = lazy(() => import('@pages/dashboard/ui/DashboardFinancial'));
const DashboardSubscriptions = lazy(() => import('@pages/dashboard/ui/DashboardSubscriptions'));
const DashboardTags = lazy(() => import('@pages/dashboard/ui/DashboardTags'));

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
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
    }

    return <>{children}</>;
};

const RoleGuard = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: UserRole[] }) => {
    const { t } = useTranslation('common');
    const session = getStoredSession();

    const role = session ? (mapAuthResponseToUser(session).role ?? 'user') : 'user';

    if (!session) {
        return <Navigate to={`${WEB_BASE_URL}${ROUTES.LOGIN}`} replace />;
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
