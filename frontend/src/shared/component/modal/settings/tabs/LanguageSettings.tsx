import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const uiLanguageOptions = [
    { value: 'pt-BR', label: 'Português (BR)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' },
];

const contentLanguageOptions = [
    { value: 'pt-BR', label: 'Português (BR)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'es-ES', label: 'Español' },
];

const LanguageSettings = ({ settings, onUpdate }: SettingsTabProps) => {
    const updateLanguage = <K extends keyof UserSettings['language']>(
        key: K,
        value: UserSettings['language'][K],
    ) => {
        onUpdate(prev => ({
            ...prev,
            language: { ...prev.language, [key]: value },
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>Idioma</h3>

            <BaseSelect
                label="Idioma da interface"
                options={uiLanguageOptions}
                value={settings.language.uiLanguage}
                onChange={e =>
                    updateLanguage(
                        'uiLanguage',
                        e.target
                            .value as UserSettings['language']['uiLanguage'],
                    )
                }
            />

            <BaseSelect
                label="Idioma preferido dos capítulos"
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
