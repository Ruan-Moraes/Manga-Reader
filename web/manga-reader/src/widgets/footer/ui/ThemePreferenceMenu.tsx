import { useEffect, useState } from 'react';
import { ChevronDown, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, type DropdownMenuItem } from '@ui/DropdownMenu';

import { useAuth } from '@features/auth';
import {
    applySystemPreferences,
    readStoredUserSettings,
    subscribeStoredUserSettings,
    type ThemePreference,
    updateStoredUserSettings,
    useUserSettings,
} from '@entities/user';

const THEME_OPTIONS: Array<{ value: ThemePreference; labelKey: string; icon: LucideIcon }> = [
    { value: 'SYSTEM', labelKey: 'themeSystem', icon: Monitor },
    { value: 'LIGHT', labelKey: 'themeLight', icon: Sun },
    { value: 'DARK', labelKey: 'themeDark', icon: Moon },
];

const ThemePreferenceMenu = () => {
    const { t } = useTranslation(['layout', 'user']);
    const { isLoggedIn, user } = useAuth();
    const { query, mutation } = useUserSettings(isLoggedIn, user?.id);
    const [settings, setSettings] = useState(readStoredUserSettings);

    useEffect(() => subscribeStoredUserSettings(setSettings), []);

    const themeLabel = (theme: ThemePreference) => {
        const option = THEME_OPTIONS.find(item => item.value === theme) ?? THEME_OPTIONS[0];
        return t(`settings.system.appearance.${option.labelKey}`, { ns: 'user' });
    };

    const selectTheme = (theme: ThemePreference) => {
        if (settings.appearance.theme === theme) return;

        const baseSettings = query.data ?? settings;
        const next = updateStoredUserSettings(() => ({
            ...baseSettings,
            appearance: { ...baseSettings.appearance, theme },
        }));

        setSettings(next);
        applySystemPreferences(next);

        if (isLoggedIn) {
            mutation.mutate(next);
        }
    };

    const currentTheme = settings.appearance.theme;
    const currentOption = THEME_OPTIONS.find(item => item.value === currentTheme) ?? THEME_OPTIONS[0];
    const TriggerIcon = currentOption.icon;

    const items: DropdownMenuItem[] = THEME_OPTIONS.map(option => ({
        label: themeLabel(option.value),
        icon: option.icon,
        selected: option.value === currentTheme,
        onSelect: () => selectTheme(option.value),
    }));

    return (
        <DropdownMenu
            trigger={
                <button
                    type="button"
                    aria-label={t('footer.preferences.themeAria', { ns: 'layout' })}
                    className="mr-focus-ring inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border border-mr-gray-700 bg-transparent px-3 py-1.5 text-[12px] font-mr-semibold text-mr-fg-muted transition-colors duration-200 hover:border-mr-accent-border hover:text-mr-accent-fg"
                >
                    <TriggerIcon className="size-[14px]" aria-hidden="true" />
                    <span>{t('footer.preferences.theme', { ns: 'layout' })}</span>
                    <span className="text-mr-fg">{themeLabel(currentTheme)}</span>
                    <ChevronDown className="size-[14px]" aria-hidden="true" />
                </button>
            }
            items={items}
            side="top"
            align="end"
        />
    );
};

export default ThemePreferenceMenu;
