import { useTranslation } from 'react-i18next';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const notificationKeys: Array<keyof UserSettings['notifications']> = [
    'newChapterFromFollowed',
    'recommendations',
    'communityNews',
    'events',
    'email',
    'push',
];

const NotificationSettings = ({
    settings,
    onUpdate,
    isLoggedIn,
}: SettingsTabProps) => {
    const { t } = useTranslation('user');

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>
                {t('settings.notifications.title')}
            </h3>
            <p className="text-xs text-tertiary">
                {isLoggedIn
                    ? t('settings.notifications.description')
                    : t('settings.descriptionGuest')}
            </p>

            {notificationKeys.map(key => (
                <label className={checkboxLabelClass} key={key}>
                    <input
                        type="checkbox"
                        checked={settings.notifications[key]}
                        className="accent-quaternary-default"
                        onChange={e =>
                            onUpdate(prev => ({
                                ...prev,
                                notifications: {
                                    ...prev.notifications,
                                    [key]: e.target.checked,
                                },
                            }))
                        }
                    />
                    {t(`settings.notifications.items.${key}`)}
                </label>
            ))}
        </div>
    );
};

export default NotificationSettings;
