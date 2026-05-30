import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, AlertTriangle } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { Input } from '@ui/Input';
import { Avatar } from '@ui/Avatar';
import { Button } from '@ui/Button';
import { Label } from '@ui/Label';
import { Card } from '@ui/Card';

const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <Card variant="default" className="p-5">
        {children}
    </Card>
);

const AccountTab = () => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('user');
    const [name] = useState('Leitor BR');

    return (
        <div className="flex flex-col gap-4">
            <SettingCard>
                <div className="flex items-center gap-4">
                    <Avatar name={name} size={64} />
                    <div className="flex flex-col gap-2">
                        <Button variant="raised" onClick={() => {}}>
                            {t('profile.account.changePhoto')}
                        </Button>
                        <Button variant="ghost" onClick={() => {}}>
                            {t('profile.account.removePhoto')}
                        </Button>
                    </div>
                </div>
            </SettingCard>

            <SettingCard>
                <Label className="mb-1 block">{t('profile.account.emailLabel')}</Label>
                <div className="flex items-center gap-3">
                    <Input value="leitor@email.com" readOnly className="flex-1" />
                    <Button variant="ghost" onClick={() => {}}>
                        {t('profile.account.changeEmail')}
                    </Button>
                </div>
            </SettingCard>

            <SettingCard>
                <p className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('profile.account.securitySection')}</p>
                <Button variant="raised" onClick={() => {}}>
                    {t('profile.account.changePassword')}
                </Button>
            </SettingCard>

            <SettingCard>
                <p className="mb-1 text-mr-small font-mr-bold text-mr-danger">{t('profile.account.dangerZone')}</p>
                <p className="mb-3 text-mr-tiny text-mr-fg-muted">{t('profile.account.dangerZoneDesc')}</p>
                <div className="flex gap-2">
                    <Button variant="ghost" icon={LogOut} onClick={() => navigate('/login')}>
                        {t('profile.account.logout')}
                    </Button>
                    <Button variant="ghost" icon={AlertTriangle} onClick={() => {}}>
                        <span className="text-mr-danger">{t('profile.account.deleteAccount')}</span>
                    </Button>
                </div>
            </SettingCard>
        </div>
    );
};

export default AccountTab;
