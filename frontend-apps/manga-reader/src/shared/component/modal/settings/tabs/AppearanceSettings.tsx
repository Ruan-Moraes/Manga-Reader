import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const AppearanceSettings = ({ settings, onUpdate }: SettingsTabProps) => {
    const { t } = useTranslation('user');

    const themeOptions = useMemo(
        () => [
            { value: 'system', label: t('settings.appearance.theme.system') },
            { value: 'light', label: t('settings.appearance.theme.light') },
            { value: 'dark', label: t('settings.appearance.theme.dark') },
        ],
        [t],
    );

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
            <h3 className={sectionTitleClass}>
                {t('settings.appearance.title')}
            </h3>

            <BaseSelect
                label={t('settings.appearance.themeLabel')}
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
                {t('settings.appearance.compactMode')}
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
                {t('settings.appearance.matureBlur')}
            </label>
        </div>
    );
};

export default AppearanceSettings;
