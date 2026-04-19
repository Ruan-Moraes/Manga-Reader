import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const adultContentOptions = [
    { value: 'hide', label: 'Ocultar' },
    { value: 'blur', label: 'Desfocar' },
    { value: 'show', label: 'Exibir' },
];

const PrivacySettings = ({
    settings,
    onUpdate,
    isLoggedIn,
}: SettingsTabProps) => {
    const updatePrivacy = <K extends keyof UserSettings['privacy']>(
        key: K,
        value: UserSettings['privacy'][K],
    ) => {
        onUpdate(prev => ({
            ...prev,
            privacy: { ...prev.privacy, [key]: value },
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>Privacidade</h3>
            <p className="text-xs text-tertiary">
                {isLoggedIn
                    ? 'Controle o que outros usuários podem ver no seu perfil.'
                    : 'As opções ficam salvas localmente até você entrar na conta.'}
            </p>

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.privacy.showReadingHistory}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updatePrivacy('showReadingHistory', e.target.checked)
                    }
                />
                Exibir histórico de leitura no perfil
            </label>

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.privacy.showOnlineStatus}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updatePrivacy('showOnlineStatus', e.target.checked)
                    }
                />
                Mostrar status online
            </label>

            <BaseSelect
                label="Conteúdo adulto"
                options={adultContentOptions}
                value={settings.privacy.adultContent}
                onChange={e =>
                    updatePrivacy(
                        'adultContent',
                        e.target
                            .value as UserSettings['privacy']['adultContent'],
                    )
                }
            />
        </div>
    );
};

export default PrivacySettings;
