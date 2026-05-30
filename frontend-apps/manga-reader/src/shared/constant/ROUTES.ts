export enum ROUTES {
    HOME = '/',
    LOGIN = '/login',
    SIGN_UP = '/sign-up',
    FORGOT_PASSWORD = '/forgot-password',
    SEARCH = '/search',
    PROFILE = '/profile',

    TITLE = '/title',
    TITLE_DETAIL = '/title/:titleId',

    NEWS = '/news',
    NEWS_DETAIL = '/news/:newsId',

    EVENTS = '/events',
    EVENT_DETAIL = '/event/:eventId',

    GROUPS = '/groups',
    GROUP_DETAIL = '/groups/:groupId',

    USERS = '/users',
    USER_DETAIL = '/users/:userId',

    FILTER_MOST_READ = '/filter?sort=most_read',
    FILTER_ASCENSION = '/filter?sort=ascension',
    FILTER_RANDOM = '/filter?sort=random',
    FILTER_MOST_RECENT = '/filter?sort=most_recent',

    FORUM = '/forum',
    FORUM_TOPIC = '/forum/:topicId',

    DASHBOARD = '/dashboard',
    DASHBOARD_USERS = '/dashboard/users',
    DASHBOARD_USER_DETAIL = '/dashboard/users/:userId',
    DASHBOARD_TITLES = '/dashboard/titles',
    DASHBOARD_TITLE_FORM = '/dashboard/titles/new',
    DASHBOARD_TITLE_EDIT = '/dashboard/titles/:titleId/edit',
    DASHBOARD_NEWS = '/dashboard/news',
    DASHBOARD_NEWS_FORM = '/dashboard/news/new',
    DASHBOARD_NEWS_EDIT = '/dashboard/news/:newsId/edit',
    DASHBOARD_EVENTS = '/dashboard/events',
    DASHBOARD_EVENT_FORM = '/dashboard/events/new',
    DASHBOARD_EVENT_EDIT = '/dashboard/events/:eventId/edit',
    DASHBOARD_GROUPS = '/dashboard/groups',
    DASHBOARD_GROUP_DETAIL = '/dashboard/groups/:groupId',
    DASHBOARD_FINANCIAL = '/dashboard/financial',
    DASHBOARD_SUBSCRIPTIONS = '/dashboard/subscriptions',
    DASHBOARD_TAGS = '/dashboard/tags',
}
