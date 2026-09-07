export const ROUTES = {
    ROOT: '/',
    READER: '/reader',
    OFFLINE_TRANSLATION: '/offline-translation',
    PLATFORM: {
        STATUS: '/platform/status',
        TABS: '/platform/(tabs)',
        HOME: '/platform/(tabs)/',
        LIBRARY: '/platform/(tabs)/library',
        FORUM: '/platform/(tabs)/forum',
        PROFILE: '/platform/(tabs)/profile',
    },
    SETTINGS: {
        INDEX: '/settings',
        APPEARANCE: '/settings/appearance',
        LOCALE: '/settings/locale',
        CONTENT_LANGUAGES: '/settings/content-languages',
        READER: '/settings/reader',
        PRIVACY: '/settings/privacy',
        DATA: '/settings/data',
        ABOUT: '/settings/about',
    },
    AUTH: {
        LOGIN: '/(auth)/login',
        REGISTER: '/(auth)/register',
        FORGOT: '/(auth)/forgot',
    },
} as const;

export const SETTINGS_ROUTES = [
    ROUTES.SETTINGS.INDEX,
    ROUTES.SETTINGS.APPEARANCE,
    ROUTES.SETTINGS.LOCALE,
    ROUTES.SETTINGS.CONTENT_LANGUAGES,
    ROUTES.SETTINGS.READER,
    ROUTES.SETTINGS.PRIVACY,
    ROUTES.SETTINGS.DATA,
    ROUTES.SETTINGS.ABOUT,
] as const;

export const PUBLIC_ROUTES = [ROUTES.ROOT, ROUTES.READER, ROUTES.OFFLINE_TRANSLATION, ...SETTINGS_ROUTES] as const;
export type SettingsRoute = (typeof SETTINGS_ROUTES)[number];

export const SETTINGS_AUTH_RETURN_ROUTES = [ROUTES.SETTINGS.CONTENT_LANGUAGES, ROUTES.SETTINGS.PRIVACY, ROUTES.SETTINGS.DATA] as const;
export type SettingsAuthReturnRoute = (typeof SETTINGS_AUTH_RETURN_ROUTES)[number];

export function isSettingsRoute(value: unknown): value is SettingsRoute {
    return typeof value === 'string' && (SETTINGS_ROUTES as readonly string[]).includes(value);
}

export function parseSettingsAuthReturnRoute(value: unknown): SettingsAuthReturnRoute | null {
    const candidate = Array.isArray(value) ? value[0] : value;
    return typeof candidate === 'string' && (SETTINGS_AUTH_RETURN_ROUTES as readonly string[]).includes(candidate)
        ? (candidate as SettingsAuthReturnRoute)
        : null;
}

export const AUTH_RETURN_ROUTES = [ROUTES.PLATFORM.STATUS, ...SETTINGS_AUTH_RETURN_ROUTES] as const;
export type AuthReturnRoute = (typeof AUTH_RETURN_ROUTES)[number];

export function parseAuthReturnRoute(value: unknown): AuthReturnRoute | null {
    const candidate = Array.isArray(value) ? value[0] : value;
    return typeof candidate === 'string' && (AUTH_RETURN_ROUTES as readonly string[]).includes(candidate) ? (candidate as AuthReturnRoute) : null;
}
