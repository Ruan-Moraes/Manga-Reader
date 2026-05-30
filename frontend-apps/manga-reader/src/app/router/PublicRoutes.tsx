import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import NotFound from '@pages/error/ui/NotFound';

const Home = lazy(() => import('@pages/home/ui/Home'));
const TitleDetailsPage = lazy(() => import('@pages/title/ui/TitleDetails'));
const Chapter = lazy(() => import('@pages/chapter/ui/Chapter'));
const Groups = lazy(() => import('@pages/group/ui/Groups'));
const GroupProfile = lazy(() => import('@pages/group/ui/GroupProfile'));
const News = lazy(() => import('@pages/news/ui/News'));
const NewsDetails = lazy(() => import('@pages/news/ui/NewsDetails'));
const Events = lazy(() => import('@pages/event/ui/Events'));
const EventDetails = lazy(() => import('@pages/event/ui/EventDetails'));
const Login = lazy(() => import('@pages/login/ui/Login'));
const SignUp = lazy(() => import('@pages/sign-up/ui/SignUp'));
const AboutUs = lazy(() => import('@pages/about-us/ui/AboutUs'));
const LegalTerms = lazy(() => import('@pages/legal/ui/Terms'));
const LegalPrivacy = lazy(() => import('@pages/legal/ui/Privacy'));
const LegalDmca = lazy(() => import('@pages/legal/ui/Dmca'));
const LegalContact = lazy(() => import('@pages/legal/ui/Contact'));
const HelpCenter = lazy(() => import('@pages/help/ui/HelpCenter'));
const UserProfile = lazy(() => import('@pages/profile/ui/UserProfile'));
const ProfileEdit = lazy(() => import('@pages/profile/ui/Profile'));
const Forum = lazy(() => import('@pages/forum/ui/Forum'));
const ForumTopic = lazy(() => import('@pages/forum/ui/ForumTopic'));
const ForumComposer = lazy(() => import('@pages/forum/ui/ForumComposer'));
const SearchResults = lazy(() => import('@pages/search/ui/SearchResults'));
const Trending = lazy(() => import('@pages/trending/ui/Trending'));
const NewReleases = lazy(() => import('@pages/releases/ui/NewReleases'));
const SystemSettings = lazy(() => import('@pages/settings/ui/SystemSettings'));
const DesignChrome = lazy(() => import('@pages/design/ui/DesignChrome'));
const DesignAuth = lazy(() => import('@pages/design/ui/DesignAuth'));
const DesignPrimitives = lazy(() => import('@pages/design/ui/DesignPrimitives'));
const ForgotPassword = lazy(() => import('@pages/forgot-password/ui/ForgotPassword'));
const ResetPassword = lazy(() => import('@pages/forgot-password/ui/ResetPassword'));
const CategoryFilters = lazy(() => import('@pages/category/ui/CategoryFilters'));

export const contentRoutes = [
    { path: '', element: <Home /> },

    // Titles (both `/title/` legacy and `/titles/` DS canonical)
    { path: 'title/:titleId', element: <TitleDetailsPage /> },
    { path: 'titles/:titleId', element: <TitleDetailsPage /> },

    // Browse
    { path: 'search', element: <SearchResults /> },
    { path: 'filter', element: <CategoryFilters /> },
    { path: 'genres', element: <CategoryFilters /> },
    { path: 'trending', element: <Trending /> },
    { path: 'releases', element: <NewReleases /> },

    // Groups
    { path: 'groups', element: <Groups /> },
    { path: 'groups/:groupId', element: <GroupProfile /> },

    // Profile
    { path: 'profile', element: <UserProfile /> },
    { path: 'profile/edit', element: <ProfileEdit /> },
    { path: 'u/:handle', element: <UserProfile /> },
    { path: 'users/:userId', element: <UserProfile /> },

    // News
    { path: 'news', element: <News /> },
    { path: 'news/:newsId', element: <NewsDetails /> },

    // Events (both legacy `event/` and DS canonical `events/`)
    { path: 'events', element: <Events /> },
    { path: 'event/:eventId', element: <EventDetails /> },
    { path: 'events/:eventId', element: <EventDetails /> },

    // Forum
    { path: 'forum', element: <Forum /> },
    { path: 'forum/new', element: <ForumComposer /> },
    { path: 'forum/:topicId', element: <ForumTopic /> },
    { path: 'forum/topic/:topicId', element: <ForumTopic /> },

    // Settings
    { path: 'settings', element: <SystemSettings /> },

    // Static / legal
    { path: 'about-us', element: <AboutUs /> },
    { path: 'terms-of-use', element: <Navigate to="/legal/terms" replace /> },
    { path: 'dmca', element: <Navigate to="/legal/dmca" replace /> },
    { path: 'legal/terms', element: <LegalTerms /> },
    { path: 'legal/privacy', element: <LegalPrivacy /> },
    { path: 'legal/dmca', element: <LegalDmca /> },
    { path: 'legal/contact', element: <LegalContact /> },
    { path: 'help', element: <HelpCenter /> },

    ...(import.meta.env.DEV
        ? [
              { path: 'design/primitives', element: <DesignPrimitives /> },
              { path: 'design/chrome', element: <DesignChrome /> },
              { path: 'design/auth', element: <DesignAuth /> },
          ]
        : []),

    { path: '*', element: <NotFound /> },
];

/** Auth routes — nested under AppLayout to receive NavBar + Footer. */
export const authRoutes = [
    { path: 'login', element: <Login /> },
    { path: 'sign-up', element: <SignUp /> },
    { path: 'forgot-password', element: <ForgotPassword /> },
    { path: 'reset-password', element: <ResetPassword /> },
];

/** Chapter routes — full-screen reader, no outer chrome. */
export const chapterRoutes = [
    { path: 'title/:titleId/chapter/:chapter', element: <Chapter /> },
    { path: 'titles/:titleId/chapters/:chapter', element: <Chapter /> },
];

export default [...contentRoutes, ...authRoutes, ...chapterRoutes];
