import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@ui/Switch';
import { RadioGroup } from '@ui/Radio';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';

const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <Card variant="default" className="p-5">
        {children}
    </Card>
);

const PrivacyTab = () => {
    const { t } = useTranslation('user');
    const [publicProfile, setPublicProfile] = useState(true);
    const [libraryVis, setLibraryVis] = useState('public');
    const [activityVis, setActivityVis] = useState(true);

    const privacyOptions = [
        { value: 'public', label: t('settings.privacy.visPublic') },
        { value: 'friends', label: t('settings.privacy.visFriends') },
        { value: 'private', label: t('settings.privacy.visPrivate') },
    ];

    return (
        <div className="flex flex-col gap-4">
            <SettingCard>
                <Switch
                    checked={publicProfile}
                    onChange={setPublicProfile}
                    label={t('settings.privacy.publicProfile')}
                    description={t('settings.privacy.publicProfileDesc')}
                />
            </SettingCard>

            <SettingCard>
                <p className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('settings.privacy.libraryVisibility')}</p>
                <RadioGroup name="library-vis" value={libraryVis} onChange={setLibraryVis} options={privacyOptions} />
            </SettingCard>

            <SettingCard>
                <Switch
                    checked={activityVis}
                    onChange={setActivityVis}
                    label={t('settings.privacy.publicActivity')}
                    description={t('settings.privacy.publicActivityDesc')}
                />
            </SettingCard>

            <SettingCard>
                <p className="mb-2 text-mr-small font-mr-bold text-mr-fg">{t('settings.privacy.yourData')}</p>
                <Button variant="raised" onClick={() => {}}>
                    {t('settings.privacy.downloadData')}
                </Button>
            </SettingCard>
        </div>
    );
};

export default PrivacyTab;
