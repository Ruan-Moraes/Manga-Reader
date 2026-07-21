/**
 * Fonte canônica de rotas do app (DT-25.9).
 *
 * Paths **relativos**, com `/` inicial e SEM `WEB_BASE_URL` — o prefixo de base é
 * aplicado por `useAppNavigate` / `AppLink`. Estáticas são strings; rotas com
 * parâmetro são funções builder (tipadas).
 *
 * Onde há rota duplicada no router (ex.: `/title` e `/titles`), o builder emite
 * apenas o **canônico** (plural / `forum/topic`); os aliases seguem no router só
 * para back-compat de links externos.
 */
export const ROUTES = {
    // Conteúdo público
    HOME: '/',
    SEARCH: '/search',
    CATALOG: '/genres',
    CATALOG_SORT: (sort: string) => `/genres?sort=${sort}`,
    TRENDING: '/trending',
    RELEASES: '/releases',

    TITLE_DETAIL: (titleId: string) => `/titles/${titleId}`,
    CHAPTER: (titleId: string, chapter: string | number) => `/titles/${titleId}/chapters/${chapter}`,

    GROUPS: '/groups',
    GROUP_DETAIL: (groupId: string) => `/groups/${groupId}`,

    PROFILE: '/profile',
    PROFILE_EDIT: '/profile/edit',
    USER_BY_HANDLE: (handle: string) => `/u/${handle}`,
    USER_DETAIL: (userId: string) => `/users/${userId}`,

    NEWS: '/news',
    NEWS_DETAIL: (newsId: string) => `/news/${newsId}`,

    EVENTS: '/events',
    EVENT_DETAIL: (eventId: string) => `/events/${eventId}`,

    FORUM: '/forum',
    FORUM_NEW: '/forum/new',
    FORUM_TOPIC: (topicId: string) => `/forum/topic/${topicId}`,

    SETTINGS: '/settings',
    ABOUT_US: '/about-us',
    HELP: '/help',
    HELP_ARTICLE: (articleId: string) => `/help/article/${articleId}`,

    LEGAL_TERMS: '/legal/terms',
    LEGAL_PRIVACY: '/legal/privacy',
    LEGAL_DMCA: '/legal/dmca',
    LEGAL_CONTACT: '/legal/contact',

    // Auth
    LOGIN: '/login',
    SIGN_UP: '/sign-up',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',

    // Protegidas (usuário)
    LIBRARY: '/library',
    REVIEWS: '/reviews',
    PUBLISH_WORK: '/i-want-to-publish-work',
    NOTIFICATIONS: '/notifications',

    // Dashboard (admin)
    DASHBOARD: '/dashboard',
    DASHBOARD_USERS: '/dashboard/users',
    DASHBOARD_USER_DETAIL: (userId: string) => `/dashboard/users/${userId}`,
    DASHBOARD_TITLES: '/dashboard/titles',
    DASHBOARD_STORES: '/dashboard/stores',
    DASHBOARD_CHAPTERS: '/dashboard/chapters',
    DASHBOARD_CHAPTERS_BY_TITLE: (titleId: string) => `/dashboard/chapters?titleId=${titleId}`,
    DASHBOARD_CHAPTERS_ANALYTICS: '/dashboard/chapters/analytics',
    DASHBOARD_CHAPTER_DETAIL: (chapterId: string) => `/dashboard/chapters/${chapterId}`,
    DASHBOARD_NEWS: '/dashboard/news',
    DASHBOARD_EVENTS: '/dashboard/events',
    DASHBOARD_GROUPS: '/dashboard/groups',
    DASHBOARD_GROUP_DETAIL: (groupId: string) => `/dashboard/groups/${groupId}`,
    DASHBOARD_TAGS: '/dashboard/tags',
    DASHBOARD_AUTHORS: '/dashboard/authors',
    DASHBOARD_PUBLISHERS: '/dashboard/publishers',
    DASHBOARD_FINANCIAL: '/dashboard/financial',
    DASHBOARD_SUBSCRIPTIONS: '/dashboard/subscriptions',
} as const;
