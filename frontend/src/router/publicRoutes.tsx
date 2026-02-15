import Home from '../routes/home/Home.tsx';
import Titles from '../routes/titles/Titles.tsx';
import Chapter from '../routes/chapter/Chapter.tsx';
import Categories from '../routes/categories/Categories.tsx';
import Groups from '../routes/groups/Groups.tsx';
import GroupProfile from '../routes/groups/GroupProfile.tsx';
import SavedMangas from '../routes/saved-mangas/SavedMangas.tsx';
import News from '../routes/news/News.tsx';
import Events from '../routes/events/Events.tsx';
import Login from '../routes/login/Login.tsx';
import SignUp from '../routes/sign-up/SignUp.tsx';
import ForgotPassword from '../routes/forgot-password/ForgotPassword.tsx';
import AboutUs from '../routes/about-us/AboutUs.tsx';
import TermsOfUse from '../routes/terms/TermsOfUse.tsx';
import Dmca from '../routes/terms/Dmca.tsx';
import NotFound from '../routes/error/NotFound.tsx';

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
        path: 'news',
        element: <News />,
    },
    {
        path: 'events',
        element: <Events />,
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
