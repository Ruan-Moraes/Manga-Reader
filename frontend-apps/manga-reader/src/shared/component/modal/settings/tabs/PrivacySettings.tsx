import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const PrivacySettings = ({
    settings,
    onUpdate,
    isLoggedIn,
}: SettingsTabProps) => {
    const { t } = useTranslation('user');

    const adultContentOptions = useMemo(
        () => [
            { value: 'hide', label: t('settings.privacy.adultContent.hide') },
            { value: 'blur', label: t('settings.privacy.adultContent.blur') },
            { value: 'show', label: t('settings.privacy.adultContent.show') },
        ],
        [t],
    );

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
            <h3 className={sectionTitleClass}>{t('settings.privacy.title')}</h3>
            <p className="text-xs text-tertiary">
                {isLoggedIn
                    ? t('settings.privacy.description')
                    : t('settings.descriptionGuest')}
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
                {t('settings.privacy.showReadingHistory')}
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
                {t('settings.privacy.showOnlineStatus')}
            </label>

            <BaseSelect
                label={t('settings.privacy.adultContentLabel')}
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
