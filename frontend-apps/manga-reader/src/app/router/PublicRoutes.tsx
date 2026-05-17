import { lazy } from 'react';

import NotFound from '@app/route/error/NotFound';

const Home = lazy(() => import('@app/route/home/Home'));
const TitleDetailsPage = lazy(() => import('@app/route/title/TitleDetails'));
const Chapter = lazy(() => import('@app/route/chapter/Chapter'));
const CategoryFilters = lazy(
    () => import('@app/route/category/CategoryFilters'),
);
const Groups = lazy(() => import('@app/route/group/Groups'));
const GroupProfile = lazy(() => import('@app/route/group/GroupProfile'));
const News = lazy(() => import('@app/route/news/News'));
const NewsDetails = lazy(() => import('@app/route/news/NewsDetails'));
const Events = lazy(() => import('@app/route/event/Events'));
const EventDetails = lazy(() => import('@app/route/event/EventDetails'));
const Login = lazy(() => import('@app/route/login/Login'));
const SignUp = lazy(() => import('@app/route/sign-up/SignUp'));
const ForgotPassword = lazy(
    () => import('@app/route/forgot-password/ForgotPassword'),
);
const ResetPassword = lazy(
    () => import('@app/route/forgot-password/ResetPassword'),
);
const AboutUs = lazy(() => import('@app/route/about-us/AboutUs'));
const TermsOfUse = lazy(() => import('@app/route/term/TermsOfUse'));
const Dmca = lazy(() => import('@app/route/term/Dmca'));
const UserProfile = lazy(() => import('@app/route/profile/UserProfile'));
const Forum = lazy(() => import('@app/route/forum/Forum'));
const ForumTopic = lazy(() => import('@app/route/forum/ForumTopic'));
const SearchResults = lazy(() => import('@app/route/search/SearchResults'));

const publicRoutes = [
    {
        path: '',
        element: <Home />,
    },
    {
        path: 'title/:titleId',
        element: <TitleDetailsPage />,
    },
    {
        path: 'title/:titleId/chapter/:chapter',
        element: <Chapter />,
    },
    {
        path: 'search',
        element: <SearchResults />,
    },
    {
        path: 'filter',
        element: <CategoryFilters />,
    },
    {
        path: 'groups',
        element: <Groups />,
    },
    {
        path: 'groups/:groupId',
        element: <GroupProfile />,
    },
    {
        path: 'profile',
        element: <UserProfile />,
    },
    {
        path: 'news',
        element: <News />,
    },
    {
        path: 'news/:newsId',
        element: <NewsDetails />,
    },
    {
        path: 'events',
        element: <Events />,
    },
    {
        path: 'event/:eventId',
        element: <EventDetails />,
    },
    {
        path: 'forum',
        element: <Forum />,
    },
    {
        path: 'forum/:topicId',
        element: <ForumTopic />,
    },

    {
        path: 'users/:userId',
        element: <UserProfile />,
    },
    {
        path: 'login',
        element: <Login />,
    },
    {
        path: 'sign-up',
        element: <SignUp />,
    },
    {
        path: 'forgot-password',
        element: <ForgotPassword />,
    },
    {
        path: 'reset-password',
        element: <ResetPassword />,
    },
    {
        path: 'about-us',
        element: <AboutUs />,
    },
    {
        path: 'terms-of-use',
        element: <TermsOfUse />,
    },
    {
        path: 'dmca',
        element: <Dmca />,
    },
    {
        path: '*',
        element: <NotFound />,
    },
];

export default publicRoutes;
