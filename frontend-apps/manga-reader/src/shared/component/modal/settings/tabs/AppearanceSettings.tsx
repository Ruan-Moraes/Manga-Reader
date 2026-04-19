import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const themeOptions = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
];

const AppearanceSettings = ({ settings, onUpdate }: SettingsTabProps) => {
    const updateAppearance = <K extends keyof UserSettings['appearance']>(
        key: K,
        value: UserSettings['appearance'][K],
    ) => {
        onUpdate(prev => ({
            ...prev,
            appearance: { ...prev.appearance, [key]: value },
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>Aparência</h3>

            <BaseSelect
                label="Tema"
                options={themeOptions}
                value={settings.appearance.theme}
                onChange={e =>
                    updateAppearance(
                        'theme',
                        e.target.value as UserSettings['appearance']['theme'],
                    )
                }
            />

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.appearance.compactMode}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updateAppearance('compactMode', e.target.checked)
                    }
                />
                Layout compacto na biblioteca/listagens
            </label>

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.appearance.showMatureThumbnailsBlur}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updateAppearance(
                            'showMatureThumbnailsBlur',
                            e.target.checked,
                        )
                    }
                />
                Aplicar blur em miniaturas maduras
            </label>
        </div>
    );
};

export default AppearanceSettings;
