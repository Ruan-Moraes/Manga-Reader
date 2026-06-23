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
            { path: 'authors', element: <DashboardAuthors /> },
            { path: 'publishers', element: <DashboardPublishers /> },
            { path: 'financial', element: <DashboardFinancial /> },
            { path: 'subscriptions', element: <DashboardSubscriptions /> },
        ],
    },
];

export default [...protectedContentRoutes, ...adminRoute];
