import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_USER_SETTINGS } from '../../model/userSettings.types';
import {
    applySystemPreferences,
    mergeUserSettings,
    readStoredUserSettings,
    subscribeStoredUserSettings,
    updateStoredUserSettings,
    writeStoredUserSettings,
    SETTINGS_STORAGE_KEY,
} from '../accessibility';

describe('system preferences storage', () => {
    afterEach(() => {
        document.documentElement.className = '';
    });

    it('merges stored partial settings with defaults', () => {
        const merged = mergeUserSettings({
            reader: { gap: 16 },
            accessibility: { reduceMotion: true },
        });

        expect(merged.reader.gap).toBe(16);
        expect(merged.reader.mode).toBe(DEFAULT_USER_SETTINGS.reader.mode);
        expect(merged.accessibility.reduceMotion).toBe(true);
        expect(merged.appearance.theme).toBe(DEFAULT_USER_SETTINGS.appearance.theme);
    });

    it('reads and writes the canonical settings storage key', () => {
        const settings = mergeUserSettings({
            reader: { mode: 'PAGED', direction: 'LTR', background: 'PAPER' },
        });

        writeStoredUserSettings(settings);

        expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}').reader.mode).toBe('PAGED');
        expect(readStoredUserSettings().reader.background).toBe('PAPER');
    });

    it('notifies same-tab subscribers when settings are updated', async () => {
        const listener = vi.fn();
        const unsubscribe = subscribeStoredUserSettings(listener);

        updateStoredUserSettings(current => ({
            ...current,
            reader: { ...current.reader, gap: 24 },
        }));

        await new Promise(resolve => window.queueMicrotask(resolve));

        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ reader: expect.objectContaining({ gap: 24 }) }));

        unsubscribe();
    });

    it('applies global preference classes to html', () => {
        applySystemPreferences(
            mergeUserSettings({
                appearance: { animations: false, fontSize: 'COMFORTABLE', density: 'COMPACT', theme: 'SYSTEM' },
                accessibility: { reduceMotion: true, highContrast: true },
            }),
        );

        expect(document.documentElement.classList.contains('mr-reduce-motion')).toBe(true);
        expect(document.documentElement.classList.contains('mr-no-animations')).toBe(true);
        expect(document.documentElement.classList.contains('mr-font-comfortable')).toBe(true);
        expect(document.documentElement.classList.contains('mr-density-compact')).toBe(true);
        expect(document.documentElement.classList.contains('mr-high-contrast')).toBe(true);
        expect(document.documentElement.classList.contains('mr-theme-system')).toBe(true);
    });
});
