import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/src/shared/i18n';
import { DATE_FORMATS, SUPPORTED_TIMEZONES } from '@/src/shared/locale';
import { useTheme } from '@/src/shared/theme';
import { AppText, ChoiceCards, FormSection, SegmentedControl, SelectField } from '@/src/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

export function InterfaceLanguageRegionControls({ showTitle = true }: { showTitle?: boolean }) {
    const { t } = useTranslation('common');
    const language = useSettingsStore(state => state.language);
    const locale = useSettingsStore(state => state.settings.locale);
    const setLanguage = useSettingsStore(state => state.setLanguage);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const { spacing } = useTheme();

    return (
        <View style={{ gap: spacing.lg }}>
            {showTitle ? (
                <AppText accessibilityRole="header" variant="title">
                    {t('localeControls.title')}
                </AppText>
            ) : null}
            <FormSection title={t('localeControls.interfaceSection.title')} description={t('localeControls.interfaceSection.description')}>
                <ChoiceCards
                    label={t('localeControls.language')}
                    layout="stacked"
                    onChange={value => void setLanguage(value)}
                    optionLabel={option => t(`localeControls.option.${option}`)}
                    options={SUPPORTED_LANGUAGES}
                    value={language}
                />
            </FormSection>
            <FormSection title={t('localeControls.regionSection.title')} description={t('localeControls.regionSection.description')}>
                <SegmentedControl
                    label={t('localeControls.dateFormat')}
                    onChange={value =>
                        void updateSettings(
                            current => ({
                                ...current,
                                locale: { ...current.locale, dateFormat: value },
                            }),
                            'locale',
                        )
                    }
                    optionLabel={option => t(`localeControls.option.${option}`)}
                    options={DATE_FORMATS}
                    value={locale.dateFormat}
                />
                <SelectField
                    closeLabel={t('localeControls.closeSelection')}
                    label={t('localeControls.timezone')}
                    onChange={value =>
                        void updateSettings(
                            current => ({
                                ...current,
                                locale: { ...current.locale, timezone: value },
                            }),
                            'locale',
                        )
                    }
                    optionLabel={option => t(`localeControls.option.${option}`)}
                    options={SUPPORTED_TIMEZONES}
                    value={locale.timezone}
                />
            </FormSection>
        </View>
    );
}
