/**
 * Endpoints da API mapeados para todas as features.
 *
 * Em desenvolvimento, o Vite proxy redireciona `/api/*` para `localhost:8080`.
 * Em produção, `VITE_API_BASE_URL` aponta para o servidor real.
 */
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const API_URLS = {
    AUTH_SIGN_IN: `${BASE}/api/auth/sign-in`,
    AUTH_SIGN_UP: `${BASE}/api/auth/sign-up`,
    AUTH_REFRESH: `${BASE}/api/auth/refresh`,
    AUTH_ME: `${BASE}/api/auth/me`,
    AUTH_FORGOT_PASSWORD: `${BASE}/api/auth/forgot-password`,
    AUTH_RESET_PASSWORD: `${BASE}/api/auth/reset-password`,

    TITLES: `${BASE}/api/titles`,
    TITLES_SEARCH: `${BASE}/api/titles/search`,
    TITLES_BY_GENRE: `${BASE}/api/titles/genre`,
    TITLES_FILTER: `${BASE}/api/titles/filter`,

    CHAPTERS: `${BASE}/api/chapters`,

    COMMENTS: `${BASE}/api/comments`,

    RATINGS: `${BASE}/api/ratings`,

    LIBRARY: `${BASE}/api/library`,

    GROUPS: `${BASE}/api/groups`,

    TAGS: `${BASE}/api/tags`,

    NEWS: `${BASE}/api/news`,

    EVENTS: `${BASE}/api/events`,

    FORUM: `${BASE}/api/forum`,

    STORES: `${BASE}/api/stores`,

    USERS: `${BASE}/api/users`,

    ERROR_LOGS: `${BASE}/api/error-logs`,

    CONTACT_PUBLISH_WORK: `${BASE}/api/contact/publish-work`,
} as const;
