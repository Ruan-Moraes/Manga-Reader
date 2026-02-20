import Home from '@app/route/home/Home';
import TitleDetailsPage from '@app/route/title/TitleDetails';
import Chapter from '@app/route/chapter/Chapter';
import CategoryFilters from '@app/route/category/CategoryFilters';
import Groups from '@app/route/group/Groups';
import GroupProfile from '@app/route/group/GroupProfile';
import SavedMangas from '@app/route/saved-manga/SavedMangas';
import News from '@app/route/news/News';
import NewsDetails from '@app/route/news/NewsDetails';
import Events from '@app/route/event/Events';
import EventDetails from '@app/route/event/EventDetails';
import Login from '@app/route/login/Login';
import SignUp from '@app/route/sign-up/SignUp';
import ForgotPassword from '@app/route/forgot-password/ForgotPassword';
import ResetPassword from '@app/route/forgot-password/ResetPassword';
import AboutUs from '@app/route/about-us/AboutUs';
import TermsOfUse from '@app/route/term/TermsOfUse';
import Dmca from '@app/route/term/Dmca';
import NotFound from '@app/route/error/NotFound';
import Profile from '@app/route/profile/Profile';
import Library from '@app/route/library/Library';
import MyReviews from '@app/route/review/MyReviews';
import Forum from '@app/route/forum/Forum';
import ForumTopic from '@app/route/forum/ForumTopic';

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
        path: 'title/:titleId/:chapter',
        element: <Chapter />,
    },
    {
        path: 'categories',
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
        path: 'saved-mangas',
        element: <SavedMangas />,
    },
    {
        path: 'library',
        element: <Library />,
    },
    {
        path: 'profile',
        element: <Profile />,
    },
    {
        path: 'reviews',
        element: <MyReviews />,
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
