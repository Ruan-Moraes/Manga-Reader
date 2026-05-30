import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@ui/Switch';
import { Card } from '@ui/Card';

const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <Card variant="default" className="p-5">
        {children}
    </Card>
);

const NotificationsTab = () => {
    const { t } = useTranslation('user');
    const [notifNewChap, setNotifNewChap] = useState(true);
    const [notifReply, setNotifReply] = useState(true);
    const [notifMention, setNotifMention] = useState(true);
    const [notifGroup, setNotifGroup] = useState(false);
    const [notifEmail, setNotifEmail] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <SettingCard>
                <p className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('profile.notifications.inAppSection')}</p>
                <div className="flex flex-col gap-4">
                    <Switch
                        checked={notifNewChap}
                        onChange={setNotifNewChap}
                        label={t('profile.notifications.newChapterLabel')}
                        description={t('profile.notifications.newChapterDesc')}
                    />
                    <Switch
                        checked={notifReply}
                        onChange={setNotifReply}
                        label={t('profile.notifications.replyLabel')}
                        description={t('profile.notifications.replyDesc')}
                    />
                    <Switch
                        checked={notifMention}
                        onChange={setNotifMention}
                        label={t('profile.notifications.mentionLabel')}
                        description={t('profile.notifications.mentionDesc')}
                    />
                    <Switch
                        checked={notifGroup}
                        onChange={setNotifGroup}
                        label={t('profile.notifications.groupLabel')}
                        description={t('profile.notifications.groupDesc')}
                    />
                </div>
            </SettingCard>

            <SettingCard>
                <p className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('profile.notifications.emailSection')}</p>
                <Switch
                    checked={notifEmail}
                    onChange={setNotifEmail}
                    label={t('profile.notifications.newsletterLabel')}
                    description={t('profile.notifications.newsletterDesc')}
                />
            </SettingCard>
        </div>
    );
};

export default NotificationsTab;
