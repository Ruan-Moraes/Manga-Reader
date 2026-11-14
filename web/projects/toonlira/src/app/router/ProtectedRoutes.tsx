import { lazy } from 'react';
import type { ReactNode } from 'react';

import { ADMIN_PORTAL_ROLES, AuthGuard, RoleGuard } from '@features/auth';

const PublishWork = lazy(() => import('@pages/publish-work/ui/PublishWork'));
const Library = lazy(() => import('@pages/library/ui/Library'));
const MyReviews = lazy(() => import('@pages/review/ui/MyReviews'));
const Notifications = lazy(() => import('@pages/notifications/ui/Notifications'));
const AdminLayout = lazy(() => import('@widgets/admin-panel/ui/AdminLayout'));
const DashboardOverview = lazy(() => import('@pages/dashboard/ui/DashboardOverview'));
const DashboardUsers = lazy(() => import('@pages/dashboard/ui/DashboardUsers'));
const DashboardUserDetail = lazy(() => import('@pages/dashboard/ui/DashboardUserDetail'));
const DashboardTitles = lazy(() => import('@pages/dashboard/ui/DashboardTitles'));
const DashboardStores = lazy(() => import('@pages/dashboard/ui/DashboardStores'));
const DashboardChapters = lazy(() => import('@pages/dashboard/ui/DashboardChapters'));
const DashboardChapterDetail = lazy(() => import('@pages/dashboard/ui/DashboardChapterDetail'));
const DashboardChapterAnalytics = lazy(() => import('@pages/dashboard/ui/DashboardChapterAnalytics'));
const DashboardNews = lazy(() => import('@pages/dashboard/ui/DashboardNews'));
const DashboardEvents = lazy(() => import('@pages/dashboard/ui/DashboardEvents'));
const DashboardGroups = lazy(() => import('@pages/dashboard/ui/DashboardGroups'));
const DashboardGroupDetail = lazy(() => import('@pages/dashboard/ui/DashboardGroupDetail'));
const DashboardFinancial = lazy(() => import('@pages/dashboard/ui/DashboardFinancial'));
const DashboardSubscriptions = lazy(() => import('@pages/dashboard/ui/DashboardSubscriptions'));
const DashboardTags = lazy(() => import('@pages/dashboard/ui/DashboardTags'));
const DashboardAuthors = lazy(() => import('@pages/dashboard/ui/DashboardAuthors'));
const DashboardPublishers = lazy(() => import('@pages/dashboard/ui/DashboardPublishers'));

const adminOnly = (page: ReactNode) => <RoleGuard allowedRoles={['admin']}>{page}</RoleGuard>;

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
        path: 'notifications',
        element: (
            <AuthGuard>
                <Notifications />
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
                <RoleGuard allowedRoles={ADMIN_PORTAL_ROLES}>
                    <AdminLayout />
                </RoleGuard>
            </AuthGuard>
        ),
        children: [
            { index: true, element: adminOnly(<DashboardOverview />) },
            { path: 'users', element: adminOnly(<DashboardUsers />) },
            { path: 'users/:userId', element: adminOnly(<DashboardUserDetail />) },
            { path: 'titles', element: adminOnly(<DashboardTitles />) },
            { path: 'stores', element: adminOnly(<DashboardStores />) },
            { path: 'chapters', element: adminOnly(<DashboardChapters />) },
            // 'chapters/analytics' precisa vir antes de 'chapters/:chapterId'.
            { path: 'chapters/analytics', element: adminOnly(<DashboardChapterAnalytics />) },
            { path: 'chapters/:chapterId', element: adminOnly(<DashboardChapterDetail />) },
            { path: 'news', element: <DashboardNews /> },
            { path: 'events', element: adminOnly(<DashboardEvents />) },
            { path: 'groups', element: adminOnly(<DashboardGroups />) },
            { path: 'groups/:groupId', element: adminOnly(<DashboardGroupDetail />) },
            { path: 'tags', element: adminOnly(<DashboardTags />) },
            { path: 'authors', element: adminOnly(<DashboardAuthors />) },
            { path: 'publishers', element: adminOnly(<DashboardPublishers />) },
            { path: 'financial', element: adminOnly(<DashboardFinancial />) },
            { path: 'subscriptions', element: adminOnly(<DashboardSubscriptions />) },
        ],
    },
];

export default [...protectedContentRoutes, ...adminRoute];
