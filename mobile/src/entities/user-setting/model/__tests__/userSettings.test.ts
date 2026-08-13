import { DEFAULT_USER_SETTINGS, normalizeUserSettings } from '../userSettings';

describe('MOB-FEAT-001 user settings model', () => {
    it('normaliza payload parcial campo a campo', () => {
        const settings = normalizeUserSettings({
            reader: { gap: 16, saturation: 50, mode: 'PAGED', preload: 99 },
            appearance: { theme: 'LIGHT', animations: 'false' },
            locale: { timezone: 'UTC' },
        });

        expect(settings.reader).toMatchObject({ gap: 16, saturation: 50, mode: 'PAGED', preload: 3 });
        expect(settings.appearance).toMatchObject({ theme: 'LIGHT', animations: true });
        expect(settings.locale).toMatchObject({ timezone: 'UTC', dateFormat: 'D_MON' });
        expect(settings.accessibility).toEqual(DEFAULT_USER_SETTINGS.accessibility);
    });

    it('rejeita números decimais, ranges e enums desconhecidos sem perder campos válidos', () => {
        const settings = normalizeUserSettings({
            reader: { saturation: 25.5, gap: -1, quality: 'ULTRA', autoMarkRead: false },
            appearance: { fontSize: 'COMFORTABLE', density: 'TINY' },
            accessibility: { reduceMotion: true, highContrast: 'yes' },
        });

        expect(settings.reader).toMatchObject({ saturation: 100, gap: 0, quality: 'AUTO', autoMarkRead: false });
        expect(settings.appearance).toMatchObject({ fontSize: 'COMFORTABLE', density: 'COMFORTABLE' });
        expect(settings.accessibility).toEqual({ reduceMotion: true, highContrast: false });
    });
});
