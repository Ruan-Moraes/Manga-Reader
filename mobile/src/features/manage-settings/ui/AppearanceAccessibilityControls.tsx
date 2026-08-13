import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppearanceSettings, DensityPreference, FontSizePreference, ThemePreference } from '@/src/entities/user-setting';
import { FONTS, useTheme } from '@/src/shared/theme';
import { Button, ChoiceGroup, SwitchRow } from '@/src/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

type AppearanceKey = keyof AppearanceSettings;

const THEME_OPTIONS: readonly ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const FONT_OPTIONS: readonly FontSizePreference[] = ['COMPACT', 'DEFAULT', 'COMFORTABLE'];
const DENSITY_OPTIONS: readonly DensityPreference[] = ['COMFORTABLE', 'COMPACT'];

export function AppearanceAccessibilityControls() {
    const { t } = useTranslation('common');
    const { spacing, tokens, typography } = useTheme();
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
        <View style={{ gap: spacing.xl }}>
            <View style={{ gap: spacing.lg }}>
                <Text accessibilityRole="header" style={{ color: tokens.text, fontFamily: FONTS.bold, fontSize: typography.h2 }}>
                    {t('settings.appearance.title')}
                </Text>
                <ChoiceGroup
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.theme.label')}
                    onChange={value => void updateAppearance('theme', value)}
                    optionLabel={option => t(`settings.appearance.theme.options.${option}`)}
                    options={THEME_OPTIONS}
                    value={appearance.theme}
                />
                <ChoiceGroup
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.fontSize.label')}
                    onChange={value => void updateAppearance('fontSize', value)}
                    optionLabel={option => t(`settings.appearance.fontSize.options.${option}`)}
                    options={FONT_OPTIONS}
                    value={appearance.fontSize}
                />
                <ChoiceGroup
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
            </View>

            <View style={{ gap: spacing.lg }}>
                <Text accessibilityRole="header" style={{ color: tokens.text, fontFamily: FONTS.bold, fontSize: typography.h2 }}>
                    {t('settings.accessibility.title')}
                </Text>
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
            </View>

            {syncError ? (
                <View accessibilityLiveRegion="assertive" style={{ gap: spacing.sm }}>
                    <Text accessibilityRole="alert" style={{ color: tokens.danger, fontFamily: FONTS.regular, fontSize: typography.body }}>
                        {t('settings.sync.error')}
                    </Text>
                    <Button fullWidth={false} onPress={() => void retry()} variant="outline">
                        {t('settings.sync.retry')}
                    </Button>
                </View>
            ) : null}
        </View>
    );
}
