import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';

import { applyUserSettingsPaths, diffUserSettings, isUserSettingsPath, mergeUserSettingsPaths } from '../deviceSettings';

describe('MOB-FEAT-009 device settings paths', () => {
    it('detecta e aplica somente folhas alteradas', () => {
        const local = {
            ...DEFAULT_USER_SETTINGS,
            appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'LIGHT' as const },
            locale: { ...DEFAULT_USER_SETTINGS.locale, timezone: 'Asia/Tokyo' as const },
        };
        const paths = diffUserSettings(DEFAULT_USER_SETTINGS, local);
        expect(paths).toEqual(['appearance.theme', 'locale.timezone']);

        const remote = {
            ...DEFAULT_USER_SETTINGS,
            appearance: { ...DEFAULT_USER_SETTINGS.appearance, density: 'COMPACT' as const },
        };
        expect(applyUserSettingsPaths(remote, local, ['appearance.theme'])).toMatchObject({
            appearance: { theme: 'LIGHT', density: 'COMPACT' },
        });
    });

    it('normaliza paths persistidos e mantém a ordem canônica', () => {
        expect(isUserSettingsPath('appearance.theme')).toBe(true);
        expect(isUserSettingsPath('language')).toBe(false);
        expect(mergeUserSettingsPaths(['locale.timezone'], ['appearance.theme', 'locale.timezone'])).toEqual(['appearance.theme', 'locale.timezone']);
    });
});
