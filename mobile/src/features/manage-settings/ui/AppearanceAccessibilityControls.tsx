import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppearanceSettings, DensityPreference, FontSizePreference, ThemePreference } from '@/src/entities/user-setting';
import { useTheme } from '@/src/shared/theme';
import { ChoiceCards, FormSection, type IconName, SegmentedControl, StatusMessage, SwitchRow } from '@/src/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

type AppearanceKey = keyof AppearanceSettings;

const THEME_OPTIONS: readonly ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const FONT_OPTIONS: readonly FontSizePreference[] = ['COMPACT', 'DEFAULT', 'COMFORTABLE'];
const DENSITY_OPTIONS: readonly DensityPreference[] = ['COMFORTABLE', 'COMPACT'];
const THEME_ICONS: Record<ThemePreference, IconName> = {
    SYSTEM: 'phone-portrait-outline',
    LIGHT: 'sunny-outline',
    DARK: 'moon-outline',
};

export function AppearanceAccessibilityControls() {
    const { t } = useTranslation('common');
    const { spacing } = useTheme();
    const appearance = useSettingsStore(state => state.settings.appearance);
    const accessibility = useSettingsStore(state => state.settings.accessibility);
    const syncError = useSettingsStore(state => state.syncError);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const retry = useSettingsStore(state => state.retry);
    const syncHint = syncError ? t('settings.sync.error') : undefined;

    const updateAppearance = <K extends AppearanceKey>(key: K, value: AppearanceSettings[K]) =>
        updateSettings(current => ({ ...current, appearance: { ...current.appearance, [key]: value } }), 'appearance');

    const updateAccessibility = (key: 'reduceMotion' | 'highContrast', value: boolean) =>
        updateSettings(current => ({ ...current, accessibility: { ...current.accessibility, [key]: value } }), 'appearance');

    return (
        <View style={{ gap: spacing.lg }}>
            <FormSection title={t('settings.appearance.title')} description={t('settings.appearance.description')}>
                <ChoiceCards
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.theme.label')}
                    onChange={value => void updateAppearance('theme', value)}
                    optionDescription={option => t(`settings.appearance.theme.descriptions.${option}`)}
                    optionIcon={option => THEME_ICONS[option]}
                    optionLabel={option => t(`settings.appearance.theme.options.${option}`)}
                    options={THEME_OPTIONS}
                    value={appearance.theme}
                />
                <SegmentedControl
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.fontSize.label')}
                    onChange={value => void updateAppearance('fontSize', value)}
                    optionLabel={option => t(`settings.appearance.fontSize.options.${option}`)}
                    options={FONT_OPTIONS}
                    value={appearance.fontSize}
                />
                <SegmentedControl
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.density.label')}
                    onChange={value => void updateAppearance('density', value)}
                    optionLabel={option => t(`settings.appearance.density.options.${option}`)}
                    options={DENSITY_OPTIONS}
                    value={appearance.density}
                />
                <SwitchRow
                    accessibilityHint={syncHint}
                    description={t('settings.appearance.animations.description')}
                    label={t('settings.appearance.animations.label')}
                    onChange={value => void updateAppearance('animations', value)}
                    value={appearance.animations}
                />
            </FormSection>

            <FormSection title={t('settings.accessibility.title')} description={t('settings.accessibility.description')}>
                <SwitchRow
                    accessibilityHint={syncHint}
                    description={t('settings.accessibility.reduceMotion.description')}
                    label={t('settings.accessibility.reduceMotion.label')}
                    onChange={value => void updateAccessibility('reduceMotion', value)}
                    value={accessibility.reduceMotion}
                />
                <SwitchRow
                    accessibilityHint={syncHint}
                    description={t('settings.accessibility.highContrast.description')}
                    label={t('settings.accessibility.highContrast.label')}
                    onChange={value => void updateAccessibility('highContrast', value)}
                    value={accessibility.highContrast}
                />
            </FormSection>

            {syncError ? (
                <StatusMessage
                    actionLabel={t('settings.sync.retry')}
                    description={t('settings.sync.error')}
                    onAction={() => void retry()}
                    title={t('settings.sync.errorTitle')}
                    tone="danger"
                />
            ) : null}
        </View>
    );
}
