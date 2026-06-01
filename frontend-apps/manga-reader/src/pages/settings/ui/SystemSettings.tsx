import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Tabs } from '@ui/Tabs';

import ReaderTab from './parts/ReaderTab';
import AppearanceTab from './parts/AppearanceTab';
import LanguageTab from './parts/LanguageTab';
import AccessibilityTab from './parts/AccessibilityTab';
import DataTab from './parts/DataTab';
import SettingsAboutTab from './parts/SettingsAboutTab';

type SettingTab = 'reader' | 'appearance' | 'language' | 'accessibility' | 'data' | 'about';

const SystemSettings = () => {
    const { t } = useTranslation('user');
    const [tab, setTab] = useState<SettingTab>('reader');

    const TAB_ITEMS: Array<{ value: SettingTab; label: string }> = [
        { value: 'reader', label: t('settings.system.tabs.reader') },
        { value: 'appearance', label: t('settings.system.tabs.appearance') },
        { value: 'language', label: t('settings.system.tabs.language') },
        {
            value: 'accessibility',
            label: t('settings.system.tabs.accessibility'),
        },
        { value: 'data', label: t('settings.system.tabs.data') },
        { value: 'about', label: t('settings.system.tabs.about') },
    ];

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader eyebrow={t('settings.system.eyebrow')} title={t('settings.system.title')} meta={t('settings.system.meta')} className="mb-6" />

            <div className="mb-6">
                <Tabs items={TAB_ITEMS} value={tab} onChange={v => setTab(v as SettingTab)} variant="underline" size="sm" />
            </div>

            {tab === 'reader' && <ReaderTab />}
            {tab === 'appearance' && <AppearanceTab />}
            {tab === 'language' && <LanguageTab />}
            {tab === 'accessibility' && <AccessibilityTab onNavigateToAbout={() => setTab('about')} />}
            {tab === 'data' && <DataTab />}
            {tab === 'about' && <SettingsAboutTab />}
        </PageContainer>
    );
};

export default SystemSettings;
