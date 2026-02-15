import Home from '@app/route/home/Home';
import Titles from '@app/route/title/Titles';
import Chapter from '@app/route/chapter/Chapter';
import Categories from '@app/route/category/Categories';
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
import AboutUs from '@app/route/about-us/AboutUs';
import TermsOfUse from '@app/route/term/TermsOfUse';
import Dmca from '@app/route/term/Dmca';
import NotFound from '@app/route/error/NotFound';
import Profile from '@app/route/profile/Profile';
import Library from '@app/route/library/Library';
import Reviews from '@app/route/review/Reviews';

const publicRoutes = [
    {
        path: '',
        element: <Home />,
    },
    {
        path: 'titles/:titleId',
        element: <Titles />,
    },
    {
        path: 'titles/:titleId/:chapter',
        element: <Chapter />,
    },
    {
        path: 'categories',
        element: <Categories />,
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
        element: <Reviews />,
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
        path: 'events/:eventId',
        element: <EventDetails />,
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
