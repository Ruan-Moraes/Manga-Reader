import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';
import type { DateFormatPreference } from '@entities/user';

import { SettingSection, SettingRow } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

const READING_LANG_OPTIONS = [
    { value: 'pt-BR', labelKey: 'settings.system.language.langPt' },
    { value: 'en-US', labelKey: 'settings.system.language.langEn' },
    { value: 'ja', labelKey: 'settings.system.language.langJa' },
] as const;

const LanguageTab = ({ state }: { state: SettingsState }) => {
    const { t } = useTranslation('user');

    const { settings, updateGroup, interfaceLang, changeInterfaceLang, readingLangs, setReadingLangs } = state;
    const l = settings.locale;

    const toggleReadingLang = (value: string, checked: boolean) => {
        const next = checked ? [...new Set([...readingLangs, value])] : readingLangs.filter(v => v !== value);

        setReadingLangs(next, t('settings.system.language.readingToast'));
    };

    return (
        <>
            <SettingSection title={t('settings.system.language.sectionInterface')}>
                <SettingRow label={t('settings.system.language.interfaceLang')} desc={t('settings.system.language.interfaceLangDesc')}>
                    <Select
                        aria-label={t('settings.system.language.interfaceLang')}
                        value={interfaceLang}
                        onChange={e => changeInterfaceLang(e.target.value, t('settings.system.language.interfaceToast'))}
                        className="w-44"
                        options={[
                            { value: 'pt-BR', label: t('settings.system.language.langPtFull') },
                            { value: 'en-US', label: t('settings.system.language.langEnFull') },
                            { value: 'ja', label: t('settings.system.language.langJaFull') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.language.readingLangs')} desc={t('settings.system.language.readingLangsDesc')} block>
                    <div className="flex flex-col gap-3 pt-1">
                        {READING_LANG_OPTIONS.map(opt => (
                            <Checkbox
                                key={opt.value}
                                variant="box"
                                label={t(opt.labelKey)}
                                checked={readingLangs.includes(opt.value)}
                                onChange={e => toggleReadingLang(opt.value, e.target.checked)}
                            />
                        ))}
                    </div>
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.language.sectionRegion')}>
                <SettingRow label={t('settings.system.language.dateFormat')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={l.dateFormat}
                        onChange={v => updateGroup('locale', { dateFormat: v as DateFormatPreference }, t('settings.system.language.dateToast'))}
                        items={[
                            { value: 'D_MON', label: t('settings.system.language.dateDMon') },
                            { value: 'D_M', label: t('settings.system.language.dateDM') },
                            { value: 'MON_D', label: t('settings.system.language.dateMonD') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.language.timezone')}>
                    <Select
                        aria-label={t('settings.system.language.timezone')}
                        value={l.timezone}
                        onChange={e => updateGroup('locale', { timezone: e.target.value }, t('settings.system.language.timezoneToast'))}
                        className="w-56"
                        options={[
                            { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
                            { value: 'America/New_York', label: 'New York (GMT-5)' },
                            { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
                            { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
                            { value: 'UTC', label: 'UTC' },
                        ]}
                    />
                </SettingRow>
            </SettingSection>
        </>
    );
};

export default LanguageTab;
