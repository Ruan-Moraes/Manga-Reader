import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    applyThemePreference,
    initializeThemePreference,
    readThemePreference,
    setThemePreference,
    SETTINGS_STORAGE_KEY,
    subscribeThemePreference,
} from '../theme';

describe('theme preference', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';
        initializeThemePreference();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses the system theme by default', () => {
        expect(readThemePreference()).toBe('SYSTEM');
        expect(document.documentElement).toHaveClass('ui-theme-system');
    });

    it('reads the portal theme contract', () => {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({ appearance: { theme: 'LIGHT' } }),
        );

        expect(initializeThemePreference()).toBe('LIGHT');
        expect(document.documentElement).toHaveClass('ui-theme-light');
    });

    it('preserves every unrelated portal setting when writing the theme', () => {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({
                reader: { mode: 'PAGED', gap: 16 },
                appearance: { theme: 'DARK', animations: false },
                locale: { timezone: 'America/Sao_Paulo' },
            }),
        );

        setThemePreference('LIGHT');

        expect(
            JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'),
        ).toEqual({
            reader: { mode: 'PAGED', gap: 16 },
            appearance: { theme: 'LIGHT', animations: false },
            locale: { timezone: 'America/Sao_Paulo' },
        });
    });

    it('falls back safely when stored data is invalid', () => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, '{invalid');

        expect(initializeThemePreference()).toBe('SYSTEM');
        expect(document.documentElement).toHaveClass('ui-theme-system');
    });

    it('falls back to system when the stored preference is unsupported', () => {
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({ appearance: { theme: 'SEPIA' } }),
        );

        expect(initializeThemePreference()).toBe('SYSTEM');
        expect(document.documentElement).toHaveClass('ui-theme-system');
    });

    it('keeps the selected theme in memory when storage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Storage unavailable');
        });

        setThemePreference('DARK');

        expect(document.documentElement).toHaveClass('ui-theme-dark');
    });

    it('keeps exactly one theme class applied', () => {
        document.documentElement.className =
            'other-class ui-theme-system ui-theme-light';

        applyThemePreference('DARK');

        expect(document.documentElement).toHaveClass('other-class');
        expect(document.documentElement).toHaveClass('ui-theme-dark');
        expect(document.documentElement).not.toHaveClass('ui-theme-system');
        expect(document.documentElement).not.toHaveClass('ui-theme-light');
    });

    it('applies theme changes received from another tab', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeThemePreference(listener);
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({ appearance: { theme: 'LIGHT' } }),
        );

        window.dispatchEvent(
            new StorageEvent('storage', { key: SETTINGS_STORAGE_KEY }),
        );

        expect(document.documentElement).toHaveClass('ui-theme-light');
        expect(listener).toHaveBeenCalledOnce();
        unsubscribe();
    });
});
