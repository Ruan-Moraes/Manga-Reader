import { ROUTES } from '@/src/shared/navigation';

import { resolveSettingsAccess, resolveSettingsReturnTo, SETTINGS_SECTION_IDS, SETTINGS_SECTIONS } from '../../index';

describe('MOB-FEAT-008/AC-001 settings manifest', () => {
    it('contains each of the seven implemented capabilities exactly once', () => {
        expect(SETTINGS_SECTION_IDS).toEqual([
            'appearance-accessibility',
            'interface-language-region',
            'content-languages',
            'reader',
            'privacy',
            'data',
            'about',
        ]);
        expect(SETTINGS_SECTIONS.map(section => section.id)).toEqual(SETTINGS_SECTION_IDS);
        expect(new Set(SETTINGS_SECTIONS.map(section => section.id)).size).toBe(7);
        expect(new Set(SETTINGS_SECTIONS.map(section => section.route)).size).toBe(7);
        expect(SETTINGS_SECTIONS.map(section => [section.titleKey, section.descriptionKey])).toEqual([
            ['sections.appearance.title', 'sections.appearance.description'],
            ['sections.locale.title', 'sections.locale.description'],
            ['sections.contentLanguages.title', 'sections.contentLanguages.description'],
            ['sections.reader.title', 'sections.reader.description'],
            ['sections.privacy.title', 'sections.privacy.description'],
            ['sections.data.title', 'sections.data.description'],
            ['sections.about.title', 'sections.about.description'],
        ]);
    });

    it('does not expose web-only or unimplemented capabilities', () => {
        const serialized = JSON.stringify(SETTINGS_SECTIONS);
        for (const forbidden of ['notifications', 'import', 'newsletter', 'shortcut', 'footer', 'reload', 'quota']) {
            expect(serialized).not.toContain(forbidden);
        }
    });
});

describe('MOB-FEAT-008/AC-004 settings access and return-to', () => {
    it('classifies the implemented capabilities without importing another feature', () => {
        expect(Object.fromEntries(SETTINGS_SECTIONS.map(section => [section.id, section.access]))).toEqual({
            'appearance-accessibility': 'local',
            'interface-language-region': 'local',
            'content-languages': 'private',
            reader: 'local',
            privacy: 'private',
            data: 'mixed',
            about: 'local',
        });
    });

    it.each(SETTINGS_SECTIONS.filter(section => section.access !== 'private'))('opens $id directly for a guest', section => {
        expect(resolveSettingsAccess(section, false)).toEqual({ kind: 'open', route: section.route });
    });

    it.each(SETTINGS_SECTIONS.filter(section => section.access === 'private'))('sends guest $id to login with a typed return target', section => {
        expect(resolveSettingsAccess(section, false)).toEqual({
            kind: 'authenticate',
            route: ROUTES.AUTH.LOGIN,
            returnTo: section.route,
        });
        expect(resolveSettingsAccess(section, true)).toEqual({ kind: 'open', route: section.route });
    });

    it('rejects external, auth, unknown and non-returnable local destinations', () => {
        expect(resolveSettingsReturnTo(ROUTES.SETTINGS.PRIVACY)).toBe(ROUTES.SETTINGS.PRIVACY);
        expect(resolveSettingsReturnTo(ROUTES.SETTINGS.DATA)).toBe(ROUTES.SETTINGS.DATA);
        expect(resolveSettingsReturnTo(ROUTES.SETTINGS.APPEARANCE)).toBeNull();
        expect(resolveSettingsReturnTo(ROUTES.AUTH.LOGIN)).toBeNull();
        expect(resolveSettingsReturnTo('/settings/unknown')).toBeNull();
        expect(resolveSettingsReturnTo('https://attacker.example')).toBeNull();
    });
});
