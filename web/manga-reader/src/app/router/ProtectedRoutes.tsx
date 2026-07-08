import { lazy } from 'react';

import { AuthGuard, RoleGuard } from '@features/auth';

const PublishWork = lazy(() => import('@pages/publish-work/ui/PublishWork'));
const Library = lazy(() => import('@pages/library/ui/Library'));
const MyReviews = lazy(() => import('@pages/review/ui/MyReviews'));
const AdminLayout = lazy(() => import('@widgets/admin-panel/ui/AdminLayout'));
const DashboardOverview = lazy(() => import('@pages/dashboard/ui/DashboardOverview'));
const DashboardUsers = lazy(() => import('@pages/dashboard/ui/DashboardUsers'));
const DashboardUserDetail = lazy(() => import('@pages/dashboard/ui/DashboardUserDetail'));
const DashboardTitles = lazy(() => import('@pages/dashboard/ui/DashboardTitles'));
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
            { path: 'chapters', element: <DashboardChapters /> },
            // 'chapters/analytics' precisa vir antes de 'chapters/:chapterId'.
            { path: 'chapters/analytics', element: <DashboardChapterAnalytics /> },
            { path: 'chapters/:chapterId', element: <DashboardChapterDetail /> },
            { path: 'news', element: <DashboardNews /> },
            { path: 'events', element: <DashboardEvents /> },
            { path: 'groups', element: <DashboardGroups /> },
            { path: 'groups/:groupId', element: <DashboardGroupDetail /> },
            { path: 'tags', element: <DashboardTags /> },
            { path: 'authors', element: <DashboardAuthors /> },
            { path: 'publishers', element: <DashboardPublishers /> },
            { path: 'financial', element: <DashboardFinancial /> },
            { path: 'subscriptions', element: <DashboardSubscriptions /> },
        ],
    },
];

export default [...protectedContentRoutes, ...adminRoute];
