import { parseSettingsAuthReturnRoute, ROUTES, type SettingsAuthReturnRoute, type SettingsRoute } from '@/src/shared/navigation';

export const SETTINGS_SECTION_IDS = [
    'appearance-accessibility',
    'interface-language-region',
    'content-languages',
    'reader',
    'privacy',
    'data',
    'about',
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];
export type SettingsAccess = 'local' | 'mixed' | 'private';
export type SettingsGroup = 'app' | 'reading' | 'device' | 'account';
type SettingsSectionCopyId = 'appearance' | 'locale' | 'contentLanguages' | 'reader' | 'privacy' | 'data' | 'about';
type SettingsSectionCopyKey = `sections.${SettingsSectionCopyId}.${'title' | 'description'}`;

export interface SettingsSection {
    id: SettingsSectionId;
    titleKey: SettingsSectionCopyKey;
    descriptionKey: SettingsSectionCopyKey;
    route: Exclude<SettingsRoute, typeof ROUTES.SETTINGS.INDEX>;
    access: SettingsAccess;
    group: SettingsGroup;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
    {
        id: 'appearance-accessibility',
        titleKey: 'sections.appearance.title',
        descriptionKey: 'sections.appearance.description',
        route: ROUTES.SETTINGS.APPEARANCE,
        access: 'local',
        group: 'app',
    },
    {
        id: 'interface-language-region',
        titleKey: 'sections.locale.title',
        descriptionKey: 'sections.locale.description',
        route: ROUTES.SETTINGS.LOCALE,
        access: 'local',
        group: 'app',
    },
    {
        id: 'content-languages',
        titleKey: 'sections.contentLanguages.title',
        descriptionKey: 'sections.contentLanguages.description',
        route: ROUTES.SETTINGS.CONTENT_LANGUAGES,
        access: 'private',
        group: 'account',
    },
    {
        id: 'reader',
        titleKey: 'sections.reader.title',
        descriptionKey: 'sections.reader.description',
        route: ROUTES.SETTINGS.READER,
        access: 'local',
        group: 'reading',
    },
    {
        id: 'privacy',
        titleKey: 'sections.privacy.title',
        descriptionKey: 'sections.privacy.description',
        route: ROUTES.SETTINGS.PRIVACY,
        access: 'private',
        group: 'account',
    },
    {
        id: 'data',
        titleKey: 'sections.data.title',
        descriptionKey: 'sections.data.description',
        route: ROUTES.SETTINGS.DATA,
        access: 'mixed',
        group: 'device',
    },
    {
        id: 'about',
        titleKey: 'sections.about.title',
        descriptionKey: 'sections.about.description',
        route: ROUTES.SETTINGS.ABOUT,
        access: 'local',
        group: 'device',
    },
] as const;

export type SettingsAccessResolution =
    | { kind: 'open'; route: SettingsSection['route'] }
    | { kind: 'authenticate'; route: typeof ROUTES.AUTH.LOGIN; returnTo: SettingsAuthReturnRoute };

export function resolveSettingsAccess(section: SettingsSection, authenticated: boolean): SettingsAccessResolution {
    if (section.access !== 'private' || authenticated) return { kind: 'open', route: section.route };

    const returnTo = parseSettingsAuthReturnRoute(section.route);
    if (!returnTo) throw new Error(`Private settings route is not registered as an auth return target: ${section.route}`);
    return { kind: 'authenticate', route: ROUTES.AUTH.LOGIN, returnTo };
}

export function resolveSettingsReturnTo(value: unknown): SettingsAuthReturnRoute | null {
    return parseSettingsAuthReturnRoute(value);
}
