import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { Label } from '@ui/Label';
import { Card } from '@ui/Card';

const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <Card variant="default" className="p-5">
        {children}
    </Card>
);

const IdentityTab = () => {
    const { t } = useTranslation('user');
    const [name, setName] = useState('Leitor BR');
    const [handle, setHandle] = useState('leitor_br');
    const [bio, setBio] = useState('Leitor ávido de mangás desde 2010.');
    const [pronoun, setPronoun] = useState('');
    const [location, setLocation] = useState('');

    const pronounOptions = [
        { value: '', label: t('profile.identity.pronouns.preferNotToSay') },
        { value: 'he', label: t('profile.identity.pronouns.he') },
        { value: 'she', label: t('profile.identity.pronouns.she') },
        { value: 'they', label: t('profile.identity.pronouns.they') },
        { value: 'other', label: t('profile.identity.pronouns.other') },
    ];

    return (
        <div className="flex flex-col gap-4">
            <SettingCard>
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <Label htmlFor="edit-name">{t('profile.identity.displayNameLabel')}</Label>
                            <span className="text-mr-tiny text-mr-fg-subtle">{name.length}/60</span>
                        </div>
                        <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="edit-handle" className="mb-1 block">
                            {t('profile.identity.handleLabel')}
                        </Label>
                        <Input id="edit-handle" value={handle} onChange={e => setHandle(e.target.value)} />
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <Label htmlFor="edit-bio">{t('profile.identity.bioLabel')}</Label>
                            <span className="text-mr-tiny text-mr-fg-subtle">{bio.length}/280</span>
                        </div>
                        <Textarea id="edit-bio" rows={3} value={bio} onChange={e => setBio(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="edit-pronoun" className="mb-1 block">
                            {t('profile.identity.pronounLabel')}
                        </Label>
                        <Select id="edit-pronoun" value={pronoun} onChange={e => setPronoun(e.target.value)} options={pronounOptions} />
                    </div>
                    <div>
                        <Label htmlFor="edit-location" className="mb-1 block">
                            {t('profile.identity.locationLabel')}
                        </Label>
                        <Input
                            id="edit-location"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder={t('profile.identity.locationPlaceholder')}
                        />
                    </div>
                </div>
            </SettingCard>
        </div>
    );
};

export default IdentityTab;
