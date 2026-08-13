import {
    AUTH_RETURN_ROUTES,
    isSettingsRoute,
    parseAuthReturnRoute,
    parseSettingsAuthReturnRoute,
    PUBLIC_ROUTES,
    ROUTES,
    SETTINGS_AUTH_RETURN_ROUTES,
    SETTINGS_ROUTES,
} from '../routes';

describe('MOB-FEAT-008/AC-002 typed settings routes', () => {
    it('recognizes only registered settings paths', () => {
        expect(SETTINGS_ROUTES).toHaveLength(8);
        expect(isSettingsRoute(ROUTES.SETTINGS.ABOUT)).toBe(true);
        expect(isSettingsRoute('/settings/unknown')).toBe(false);
        expect(isSettingsRoute('https://example.com/settings/privacy')).toBe(false);
    });

    it('allows only explicitly registered auth return targets', () => {
        expect(SETTINGS_AUTH_RETURN_ROUTES).toEqual([ROUTES.SETTINGS.CONTENT_LANGUAGES, ROUTES.SETTINGS.PRIVACY, ROUTES.SETTINGS.DATA]);
        expect(parseSettingsAuthReturnRoute(ROUTES.SETTINGS.PRIVACY)).toBe(ROUTES.SETTINGS.PRIVACY);
        expect(parseSettingsAuthReturnRoute([ROUTES.SETTINGS.DATA, ROUTES.SETTINGS.PRIVACY])).toBe(ROUTES.SETTINGS.DATA);
        expect(parseSettingsAuthReturnRoute(ROUTES.SETTINGS.APPEARANCE)).toBeNull();
        expect(parseSettingsAuthReturnRoute(ROUTES.AUTH.LOGIN)).toBeNull();
        expect(parseSettingsAuthReturnRoute('https://attacker.example')).toBeNull();
        expect(parseSettingsAuthReturnRoute('//attacker.example')).toBeNull();
    });
});

describe('MOB-FEAT-010 public and auth routes', () => {
    it('declara launcher, offline e settings como superfícies públicas', () => {
        expect(PUBLIC_ROUTES).toEqual([ROUTES.ROOT, ROUTES.READER, ROUTES.OFFLINE_TRANSLATION, ...SETTINGS_ROUTES]);
        expect(PUBLIC_ROUTES).not.toContain(ROUTES.PLATFORM.STATUS);
    });

    it('aceita o status e destinos privados de settings sem permitir URL arbitrária', () => {
        expect(AUTH_RETURN_ROUTES).toContain(ROUTES.PLATFORM.STATUS);
        expect(parseAuthReturnRoute(ROUTES.PLATFORM.STATUS)).toBe(ROUTES.PLATFORM.STATUS);
        expect(parseAuthReturnRoute('https://attacker.example/platform/status')).toBeNull();
        expect(parseAuthReturnRoute('/platform/unknown')).toBeNull();
    });
});
