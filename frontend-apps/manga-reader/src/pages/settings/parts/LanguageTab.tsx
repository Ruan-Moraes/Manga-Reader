import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Select } from '@ui/Select';
import { Checkbox } from '@ui/Checkbox';

import { SettingSection, SettingRow } from './settingsShared';

const LanguageTab = () => {
    const { t } = useTranslation('user');
    const [uiLang, setUiLang] = useState('pt-BR');
    const [ptbr, setPtbr] = useState(true);
    const [en, setEn] = useState(false);

    return (
        <>
            <SettingSection title={t('settings.language.interfaceSection')}>
                <SettingRow label={t('settings.language.uiLanguageLabel')}>
                    <Select
                        value={uiLang}
                        onChange={e => setUiLang(e.target.value)}
                        options={[
                            {
                                value: 'pt-BR',
                                label: t('settings.language.ptBR'),
                            },
                            {
                                value: 'en-US',
                                label: t('settings.language.enUS'),
                            },
                            { value: 'ja', label: t('settings.language.ja') },
                        ]}
                        className="w-44"
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.language.contentSection')}>
                <Checkbox label={t('settings.language.checkboxPtBR')} checked={ptbr} onChange={e => setPtbr(e.target.checked)} />
                <Checkbox label={t('settings.language.checkboxEn')} checked={en} onChange={e => setEn(e.target.checked)} />
            </SettingSection>
        </>
    );
};

export default LanguageTab;
