import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Tabs } from '@ui/Tabs';

import AccountTab from './parts/AccountTab';
import IdentityTab from './parts/IdentityTab';
import RecommendationsTab from './parts/RecommendationsTab';
import NotificationsTab from './parts/NotificationsTab';
import PrivacyTab from './parts/PrivacyTab';

type EditTab = 'account' | 'identity' | 'recommendations' | 'notifications' | 'privacy';

const ProfileEdit = () => {
    const { t } = useTranslation('user');
    const [tab, setTab] = useState<EditTab>('identity');

    const TAB_ITEMS = useMemo<Array<{ value: EditTab; label: string }>>(
        () => [
            { value: 'account', label: t('profile.editTabs.account') },
            { value: 'identity', label: t('profile.editTabs.identity') },
            {
                value: 'recommendations',
                label: t('profile.editTabs.recommendations'),
            },
            {
                value: 'notifications',
                label: t('profile.editTabs.notifications'),
            },
            { value: 'privacy', label: t('profile.editTabs.privacy') },
        ],
        [t],
    );

    return (
        <PageContainer asMain size="narrow" paddingY="md">
            <SectionHeader
                eyebrow={t('profile.sectionHeader.eyebrow')}
                title={t('profile.header.edit')}
                meta={t('profile.sectionHeader.meta')}
                className="mb-6"
            />

            <div className="mb-6">
                <Tabs items={TAB_ITEMS} value={tab} onChange={v => setTab(v as EditTab)} variant="underline" size="sm" />
            </div>

            {tab === 'account' && <AccountTab />}
            {tab === 'identity' && <IdentityTab />}
            {tab === 'recommendations' && <RecommendationsTab />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'privacy' && <PrivacyTab />}
        </PageContainer>
    );
};

export default ProfileEdit;
