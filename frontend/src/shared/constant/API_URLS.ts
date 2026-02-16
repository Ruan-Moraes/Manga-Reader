const BASE = import.meta.env.VITE_API_BASE_URL;

export const API_URLS = {
    BASE_URL: BASE,
    TITLE_URL: BASE,
    COMMENTS_URL: BASE,
} as const;
