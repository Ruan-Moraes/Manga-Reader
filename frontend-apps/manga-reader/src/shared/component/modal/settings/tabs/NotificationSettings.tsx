import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const notificationItems: Array<[keyof UserSettings['notifications'], string]> =
    [
        ['newChapterFromFollowed', 'Novos capítulos dos mangás seguidos'],
        ['recommendations', 'Recomendações personalizadas'],
        ['communityNews', 'Notícias da comunidade'],
        ['events', 'Eventos e lançamentos'],
        ['email', 'Notificações por e-mail'],
        ['push', 'Notificações push no navegador'],
    ];

const NotificationSettings = ({
    settings,
    onUpdate,
    isLoggedIn,
}: SettingsTabProps) => {
    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>Notificações</h3>
            <p className="text-xs text-tertiary">
                {isLoggedIn
                    ? 'Defina quais eventos devem gerar alertas na sua conta.'
                    : 'As opções ficam salvas localmente até você entrar na conta.'}
            </p>

            {notificationItems.map(([key, label]) => (
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
                    {label}
                </label>
            ))}
        </div>
    );
};

export default NotificationSettings;
