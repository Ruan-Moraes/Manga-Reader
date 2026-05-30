import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Select } from '@ui/Select';

import { useContentLocales } from '@entities/user';

import { sectionTitleClass, type SettingsTabProps, type UserSettings } from '../settings.constants';

const LanguageSettings = ({ settings, onUpdate, isLoggedIn = false }: SettingsTabProps) => {
    const { t, i18n } = useTranslation('user');
    const { query, mutation } = useContentLocales(isLoggedIn);

    useEffect(() => {
        const first = query.data?.contentLocales?.[0];
        if (!first) return;
        onUpdate(prev => {
            if (prev.language.preferredContentLanguage === first) return prev;
            return {
                ...prev,
                language: {
                    ...prev.language,
                    preferredContentLanguage: first as UserSettings['language']['preferredContentLanguage'],
                },
            };
        });
    }, [query.data, onUpdate]);

    const languageOptions = useMemo(
        () => [
            { value: 'pt-BR', label: t('language.pt-BR', { ns: 'common' }) },
            { value: 'en-US', label: t('language.en-US', { ns: 'common' }) },
            { value: 'es-ES', label: t('language.es-ES', { ns: 'common' }) },
        ],
        [t],
    );

    const handleUiLanguageChange = (value: UserSettings['language']['uiLanguage']) => {
        i18n.changeLanguage(value);
        onUpdate(prev => ({
            ...prev,
            language: { ...prev.language, uiLanguage: value },
        }));
    };

    const handleContentLanguageChange = (value: UserSettings['language']['preferredContentLanguage']) => {
        onUpdate(prev => ({
            ...prev,
            language: { ...prev.language, preferredContentLanguage: value },
        }));
        if (isLoggedIn) {
            mutation.mutate({ contentLocales: [value] });
        }
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>{t('settings.language.title')}</h3>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('settings.language.uiLanguageLabel')}</span>
                <Select
                    options={languageOptions}
                    value={settings.language.uiLanguage}
                    onChange={e => handleUiLanguageChange(e.target.value as UserSettings['language']['uiLanguage'])}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('settings.language.preferredContentLanguageLabel')}</span>
                <Select
                    options={languageOptions}
                    value={settings.language.preferredContentLanguage}
                    onChange={e => handleContentLanguageChange(e.target.value as UserSettings['language']['preferredContentLanguage'])}
                />
            </div>
        </div>
    );
};

export default LanguageSettings;
