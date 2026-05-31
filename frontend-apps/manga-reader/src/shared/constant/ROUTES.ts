export enum ROUTES {
    LOGIN = '/login',
    SIGN_UP = '/sign-up',
    FORGOT_PASSWORD = '/forgot-password',

    EVENTS = '/events',
    EVENT_DETAIL = '/event/:eventId',

    FILTER_MOST_READ = '/filter?sort=most_read',
    FILTER_ASCENSION = '/filter?sort=ascension',
    FILTER_RANDOM = '/filter?sort=random',
    FILTER_MOST_RECENT = '/filter?sort=most_recent',

    DASHBOARD = '/dashboard',
    DASHBOARD_USERS = '/dashboard/users',
    DASHBOARD_TITLE_FORM = '/dashboard/titles/new',
    DASHBOARD_NEWS = '/dashboard/news',
    DASHBOARD_NEWS_FORM = '/dashboard/news/new',
    DASHBOARD_EVENTS = '/dashboard/events',
    DASHBOARD_GROUPS = '/dashboard/groups',
}
