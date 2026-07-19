const DEFAULT_APP_URL = 'http://localhost:5173';

export const APP_URL = (
    import.meta.env.VITE_APP_URL || DEFAULT_APP_URL
).replace(/\/$/, '');

export function appHref(path = '/') {
    return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const APP_LINKS = {
    access: appHref('/'),
    help: appHref('/help'),
    contact: appHref('/legal/contact'),
    status: appHref('/help'),
    terms: appHref('/legal/terms'),
    privacy: appHref('/legal/privacy'),
    cookies: appHref('/legal/privacy#cookies'),
} as const;
