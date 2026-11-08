import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppearanceSettings, DensityPreference, FontSizePreference, ThemePreference } from '@/entities/user-setting';
import { darkTokens, lightTokens, useResponsiveLayout, useTheme } from '@/shared/theme';
import { AppText, FormSection, SectionStack, SegmentedControl, StatusMessage, SwitchRow } from '@/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

type AppearanceKey = keyof AppearanceSettings;

const THEME_OPTIONS: readonly ThemePreference[] = ['SYSTEM', 'LIGHT', 'DARK'];
const FONT_OPTIONS: readonly FontSizePreference[] = ['COMPACT', 'DEFAULT', 'COMFORTABLE'];
const DENSITY_OPTIONS: readonly DensityPreference[] = ['COMFORTABLE', 'COMPACT'];
const THEME_PREVIEW_HEIGHT = 44;
const THEME_PREVIEW_ACCENT_HEIGHT = 4;
const THEME_PREVIEW_PADDING = 4;
const LARGE_FONT_SCALE = 1.6;

export function resolveThemeTilesStacked(sizeClass: ReturnType<typeof useResponsiveLayout>['sizeClass'], fontScale: number): boolean {
    return sizeClass === 'compact' || fontScale >= LARGE_FONT_SCALE;
}

function ThemePreview({ option }: { option: ThemePreference }) {
    const { radii, tokens } = useTheme();
    const left = option === 'DARK' ? darkTokens : lightTokens;
    const right = option === 'LIGHT' ? lightTokens : darkTokens;
    return (
        <View
            accessibilityElementsHidden
            style={{
                alignSelf: 'stretch',
                borderColor: tokens.borderStrong,
                borderRadius: radii.sm,
                borderWidth: 1,
                flexDirection: 'row',
                height: THEME_PREVIEW_HEIGHT,
                overflow: 'hidden',
            }}
        >
            {[left, right].map((preview, index) => (
                <View key={`${option}-${index}`} style={{ backgroundColor: preview.bg, flex: 1, justifyContent: 'flex-end', padding: THEME_PREVIEW_PADDING }}>
                    <View style={{ backgroundColor: preview.accent, borderRadius: radii.pill, height: THEME_PREVIEW_ACCENT_HEIGHT, width: '100%' }} />
                </View>
            ))}
        </View>
    );
}

interface ThemeTilesProps {
    label: string;
    value: ThemePreference;
    optionLabel: (option: ThemePreference) => string;
    optionDescription: (option: ThemePreference) => string;
    onChange: (option: ThemePreference) => void;
    accessibilityHint?: string;
}

function ThemeTiles({ label, value, optionLabel, optionDescription, onChange, accessibilityHint }: ThemeTilesProps) {
    const { sizeClass } = useResponsiveLayout();
    const { fontScale, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const stacked = resolveThemeTilesStacked(sizeClass, fontScale);

    return (
        <View style={{ gap: spacing.sm }}>
            <AppText variant="label">{label}</AppText>
            <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: stacked ? 'column' : 'row', gap: spacing.sm }}>
                {THEME_OPTIONS.map(option => {
                    const selected = option === value;

                    return (
                        <Pressable
                            key={option}
                            testID={`theme-tile-${option}`}
                            accessibilityHint={accessibilityHint}
                            accessibilityLabel={optionLabel(option)}
                            accessibilityRole="radio"
                            accessibilityState={{ disabled: false, selected }}
                            onPress={() => onChange(option)}
                            style={({ pressed }) => ({
                                backgroundColor: selected ? tokens.surfaceSelected : pressed ? tokens.surfacePressed : tokens.surface,
                                borderColor: selected ? tokens.accentBorder : tokens.separator,
                                borderRadius: radii.control,
                                borderWidth: 2,
                                flex: stacked ? undefined : 1,
                                gap: spacing.sm,
                                minHeight: minimumTouchTarget,
                                padding: spacing.sm,
                            })}
                        >
                            <ThemePreview option={option} />
                            <AppText variant="label" tone={selected ? 'accent' : 'default'} style={{ textAlign: 'center' }}>
                                {optionLabel(option)}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
            <AppText testID="theme-tiles-description" variant="caption" tone="muted">
                {optionDescription(value)}
            </AppText>
        </View>
    );
}

export function AppearanceAccessibilityControls() {
    const { t } = useTranslation('common');
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
        <SectionStack>
            <FormSection title={t('settings.appearance.title')} description={t('settings.appearance.description')}>
                <ThemeTiles
                    accessibilityHint={syncHint}
                    label={t('settings.appearance.theme.label')}
                    onChange={value => void updateAppearance('theme', value)}
                    optionDescription={option => t(`settings.appearance.theme.descriptions.${option}`)}
                    optionLabel={option => t(`settings.appearance.theme.options.${option}`)}
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
        </SectionStack>
    );
}
