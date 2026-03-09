/**
 * Endpoints da API mapeados para todas as features.
 *
 * Em desenvolvimento, o Vite proxy redireciona `/api/*` para `localhost:8080`.
 * Em produção, `VITE_API_BASE_URL` aponta para o servidor real.
 */
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const API_URLS = {
    // ── Auth ────────────────────────────────────────────────────────────
    AUTH_SIGN_IN: `${BASE}/api/auth/sign-in`,
    AUTH_SIGN_UP: `${BASE}/api/auth/sign-up`,
    AUTH_REFRESH: `${BASE}/api/auth/refresh`,
    AUTH_ME: `${BASE}/api/auth/me`,
    AUTH_FORGOT_PASSWORD: `${BASE}/api/auth/forgot-password`,
    AUTH_RESET_PASSWORD: `${BASE}/api/auth/reset-password`,

    // ── Titles ──────────────────────────────────────────────────────────
    TITLES: `${BASE}/api/titles`,
    TITLES_SEARCH: `${BASE}/api/titles/search`,
    TITLES_BY_GENRE: `${BASE}/api/titles/genre`,
    TITLES_FILTER: `${BASE}/api/titles/filter`,

    // ── Chapters ────────────────────────────────────────────────────────
    CHAPTERS: `${BASE}/api/chapters`,

    // ── Comments ────────────────────────────────────────────────────────
    COMMENTS: `${BASE}/api/comments`,

    // ── Ratings ─────────────────────────────────────────────────────────
    RATINGS: `${BASE}/api/ratings`,

    // ── Library ─────────────────────────────────────────────────────────
    LIBRARY: `${BASE}/api/library`,

    // ── Groups ──────────────────────────────────────────────────────────
    GROUPS: `${BASE}/api/groups`,

    // ── Tags ────────────────────────────────────────────────────────────
    TAGS: `${BASE}/api/tags`,

    // ── News ────────────────────────────────────────────────────────────
    NEWS: `${BASE}/api/news`,

    // ── Events ──────────────────────────────────────────────────────────
    EVENTS: `${BASE}/api/events`,

    // ── Forum ───────────────────────────────────────────────────────────
    FORUM: `${BASE}/api/forum`,

    // ── Stores ──────────────────────────────────────────────────────────
    STORES: `${BASE}/api/stores`,

    // ── Users ───────────────────────────────────────────────────────────
    USERS: `${BASE}/api/users`,
} as const;
