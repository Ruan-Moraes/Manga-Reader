import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/src/shared/i18n';
import { DATE_FORMATS, SUPPORTED_TIMEZONES } from '@/src/shared/locale';
import { useTheme } from '@/src/shared/theme';
import { AppText, ChoiceGroup } from '@/src/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

export function InterfaceLanguageRegionControls() {
    const { t } = useTranslation('common');
    const language = useSettingsStore(state => state.language);
    const locale = useSettingsStore(state => state.settings.locale);
    const setLanguage = useSettingsStore(state => state.setLanguage);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const { spacing } = useTheme();

    const group = <T extends string>(label: string, options: readonly T[], selected: T, onChange: (value: T) => void) => (
        <ChoiceGroup label={label} onChange={onChange} optionLabel={option => t(`localeControls.option.${option}`)} options={options} value={selected} />
    );

    return (
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
            <AppText accessibilityRole="header" variant="title">
                {t('localeControls.title')}
            </AppText>
            {group(t('localeControls.language'), SUPPORTED_LANGUAGES, language, value => void setLanguage(value))}
            {group(
                t('localeControls.dateFormat'),
                DATE_FORMATS,
                locale.dateFormat,
                value =>
                    void updateSettings(
                        current => ({
                            ...current,
                            locale: { ...current.locale, dateFormat: value },
                        }),
                        'locale',
                    ),
            )}
            {group(
                t('localeControls.timezone'),
                SUPPORTED_TIMEZONES,
                locale.timezone,
                value =>
                    void updateSettings(
                        current => ({
                            ...current,
                            locale: { ...current.locale, timezone: value },
                        }),
                        'locale',
                    ),
            )}
        </View>
    );
}
