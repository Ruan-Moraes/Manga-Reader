import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';

import { normalizeReaderSettings, selectableQualities } from '../../index';

describe('MOB-FEAT-005/AC-003 reader configuration', () => {
    it('normalizes boundaries through the single settings contract', () => {
        expect(normalizeReaderSettings({ gap: 32, preload: 10, saturation: 0 }, DEFAULT_USER_SETTINGS)).toMatchObject({ gap: 32, preload: 10, saturation: 0 });
        expect(normalizeReaderSettings({ gap: 33, preload: 11, saturation: -1 }, DEFAULT_USER_SETTINGS)).toMatchObject({ gap: 0, preload: 3, saturation: 100 });
    });

    it('does not expose synthetic LOW/MEDIUM/HIGH variants', () => {
        expect(selectableQualities({ low: false, medium: false, high: false })).toEqual(['AUTO', 'ORIGINAL']);
        expect(selectableQualities({ low: true, medium: true, high: true })).toEqual(['AUTO', 'LOW', 'MEDIUM', 'HIGH', 'ORIGINAL']);
    });
});
