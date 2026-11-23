import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@/shared/i18n';
import { DATE_FORMATS, formatDate, SUPPORTED_TIMEZONES } from '@/shared/locale';
import { AppText, ChoiceRow, FormSection, SectionStack } from '@/shared/ui';

import { useSettingsStore } from '../model/settingsStore';

const DATE_EXAMPLE = new Date(Date.UTC(2026, 10, 8, 12));

export function InterfaceLanguageRegionControls({ showTitle = true }: { showTitle?: boolean }) {
    const { t } = useTranslation('common');
    const language = useSettingsStore(state => state.language);
    const locale = useSettingsStore(state => state.settings.locale);
    const setLanguage = useSettingsStore(state => state.setLanguage);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    return (
        <SectionStack>
            {showTitle ? (
                <AppText accessibilityRole="header" variant="title">
                    {t('localeControls.title')}
                </AppText>
            ) : null}
            <FormSection title={t('localeControls.interfaceSection.title')} description={t('localeControls.interfaceSection.description')}>
                <ChoiceRow
                    testID="locale-language-row"
                    closeLabel={t('localeControls.closeSelection')}
                    label={t('localeControls.language')}
                    onChange={value => void setLanguage(value)}
                    optionLabel={option => t(`localeControls.option.${option}`)}
                    options={SUPPORTED_LANGUAGES}
                    value={language}
                />
            </FormSection>
            <FormSection title={t('localeControls.regionSection.title')} description={t('localeControls.regionSection.description')}>
                <ChoiceRow
                    testID="locale-date-format-row"
                    closeLabel={t('localeControls.closeSelection')}
                    label={t('localeControls.dateFormat')}
                    optionDescription={option =>
                        t('localeControls.dateExample', {
                            value: formatDate(DATE_EXAMPLE, { dateFormat: option, includeYear: false, language, timezone: locale.timezone }),
                        })
                    }
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
                <ChoiceRow
                    testID="locale-timezone-row"
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
        </SectionStack>
    );
}
