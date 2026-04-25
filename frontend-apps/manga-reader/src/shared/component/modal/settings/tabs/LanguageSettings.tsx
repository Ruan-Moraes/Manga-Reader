import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const LanguageSettings = ({ settings, onUpdate }: SettingsTabProps) => {
    const { t, i18n } = useTranslation('user');

    const uiLanguageOptions = useMemo(
        () => [
            { value: 'pt-BR', label: t('language.pt-BR', { ns: 'common' }) },
            { value: 'en-US', label: t('language.en-US', { ns: 'common' }) },
            { value: 'es-ES', label: t('language.es-ES', { ns: 'common' }) },
        ],
        [t],
    );

    const contentLanguageOptions = useMemo(
        () => [
            { value: 'pt-BR', label: t('language.pt-BR', { ns: 'common' }) },
            { value: 'en-US', label: t('language.en-US', { ns: 'common' }) },
            { value: 'ja-JP', label: '日本語' },
            { value: 'es-ES', label: t('language.es-ES', { ns: 'common' }) },
        ],
        [t],
    );

    const updateLanguage = <K extends keyof UserSettings['language']>(
        key: K,
        value: UserSettings['language'][K],
    ) => {
        onUpdate(prev => ({
            ...prev,
            language: { ...prev.language, [key]: value },
        }));
    };

    const handleUiLanguageChange = (
        value: UserSettings['language']['uiLanguage'],
    ) => {
        i18n.changeLanguage(value);
        updateLanguage('uiLanguage', value);
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>
                {t('settings.language.title')}
            </h3>

            <BaseSelect
                label={t('settings.language.uiLanguageLabel')}
                options={uiLanguageOptions}
                value={settings.language.uiLanguage}
                onChange={e =>
                    handleUiLanguageChange(
                        e.target
                            .value as UserSettings['language']['uiLanguage'],
                    )
                }
            />

            <BaseSelect
                label={t('settings.language.preferredContentLanguageLabel')}
                options={contentLanguageOptions}
                value={settings.language.preferredContentLanguage}
                onChange={e =>
                    updateLanguage(
                        'preferredContentLanguage',
                        e.target
                            .value as UserSettings['language']['preferredContentLanguage'],
                    )
                }
            />
        </div>
    );
};

export default LanguageSettings;
