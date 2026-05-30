import { lazy } from 'react';

import NotFound from '@app/route/error/NotFound';

const Home = lazy(() => import('@app/route/home/Home'));
const TitleDetailsPage = lazy(() => import('@app/route/title/TitleDetails'));
const Chapter = lazy(() => import('@app/route/chapter/Chapter'));
const Groups = lazy(() => import('@app/route/group/Groups'));
const GroupProfile = lazy(() => import('@app/route/group/GroupProfile'));
const News = lazy(() => import('@app/route/news/News'));
const NewsDetails = lazy(() => import('@app/route/news/NewsDetails'));
const Events = lazy(() => import('@app/route/event/Events'));
const EventDetails = lazy(() => import('@app/route/event/EventDetails'));
const Login = lazy(() => import('@app/route/login/Login'));
const SignUp = lazy(() => import('@app/route/sign-up/SignUp'));
const AboutUs = lazy(() => import('@app/route/about-us/AboutUs'));
const TermsOfUse = lazy(() => import('@app/route/term/TermsOfUse'));
const LegacyDmca = lazy(() => import('@app/route/term/Dmca'));
const LegalTerms = lazy(() => import('@app/route/legal/Terms'));
const LegalPrivacy = lazy(() => import('@app/route/legal/Privacy'));
const LegalDmca = lazy(() => import('@app/route/legal/Dmca'));
const LegalContact = lazy(() => import('@app/route/legal/Contact'));
const HelpCenter = lazy(() => import('@app/route/help/HelpCenter'));
const UserProfile = lazy(() => import('@app/route/profile/UserProfile'));
const ProfileEdit = lazy(() => import('@app/route/profile/Profile'));
const Forum = lazy(() => import('@app/route/forum/Forum'));
const ForumTopic = lazy(() => import('@app/route/forum/ForumTopic'));
const ForumComposer = lazy(() => import('@app/route/forum/ForumComposer'));
const SearchResults = lazy(() => import('@app/route/search/SearchResults'));
const Trending = lazy(() => import('@app/route/trending/Trending'));
const NewReleases = lazy(() => import('@app/route/releases/NewReleases'));
const SystemSettings = lazy(() => import('@app/route/settings/SystemSettings'));
const DesignChrome = lazy(() => import('@app/route/design/DesignChrome'));
const DesignAuth = lazy(() => import('@app/route/design/DesignAuth'));
const DesignPrimitives = lazy(() => import('@app/route/design/DesignPrimitives'));
const ForgotPassword = lazy(() => import('@app/route/forgot-password/ForgotPassword'));
const ResetPassword = lazy(() => import('@app/route/forgot-password/ResetPassword'));
const CategoryFilters = lazy(() => import('@app/route/category/CategoryFilters'));

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
    { path: 'terms-of-use', element: <TermsOfUse /> },
    { path: 'dmca', element: <LegacyDmca /> },
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
