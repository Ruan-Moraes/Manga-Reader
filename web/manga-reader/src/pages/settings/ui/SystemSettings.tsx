import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accessibility, AlertCircle, BookOpen, CheckCircle2, Database, Globe, Info, LoaderCircle, Palette, RefreshCw } from 'lucide-react';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Tabs } from '@ui/Tabs';
import { Button } from '@ui/Button';
import { useMediaQuery } from '@shared/lib/useMediaQuery';

import ReaderTab from './parts/ReaderTab';
import AppearanceTab from './parts/AppearanceTab';
import LanguageTab from './parts/LanguageTab';
import AccessibilityTab from './parts/AccessibilityTab';
import DataTab from './parts/DataTab';
import SettingsAboutTab from './parts/SettingsAboutTab';
import useSettingsState from '../model/useSettingsState';

type SettingTab = 'reader' | 'appearance' | 'language' | 'accessibility' | 'data' | 'about';

const SystemSettings = () => {
    const { t } = useTranslation('user');
    const [tab, setTab] = useState<SettingTab>('reader');
    const state = useSettingsState();
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const tabItems = [
        { value: 'reader', label: t('settings.system.tabs.reader'), icon: BookOpen },
        { value: 'appearance', label: t('settings.system.tabs.appearance'), icon: Palette },
        { value: 'language', label: t('settings.system.tabs.language'), icon: Globe },
        { value: 'accessibility', label: t('settings.system.tabs.accessibility'), icon: Accessibility },
        { value: 'data', label: t('settings.system.tabs.data'), icon: Database },
        { value: 'about', label: t('settings.system.tabs.about'), icon: Info },
    ];

    const syncMeta = {
        local: {
            label: t('settings.system.metaLocal'),
            icon: Info,
            indicator: 'bg-mr-fg-subtle',
            iconClassName: 'text-mr-fg-subtle',
        },
        idle: {
            label: t('settings.system.metaSyncing'),
            icon: LoaderCircle,
            indicator: 'bg-mr-accent',
            iconClassName: 'animate-spin text-mr-accent',
        },
        syncing: {
            label: t('settings.system.metaSyncing'),
            icon: LoaderCircle,
            indicator: 'bg-mr-accent',
            iconClassName: 'animate-spin text-mr-accent',
        },
        synced: {
            label: t('settings.system.metaSynced'),
            icon: CheckCircle2,
            indicator: 'bg-mr-accent',
            iconClassName: 'text-mr-accent',
        },
        error: {
            label: t('settings.system.metaError'),
            icon: AlertCircle,
            indicator: 'bg-mr-danger',
            iconClassName: 'text-mr-danger',
        },
    }[state.syncStatus];
    const SyncIcon = syncMeta.icon;

    const meta = (
        <span className="flex items-center gap-2">
            <span className={`inline-block size-2 shrink-0 rounded-mr-full ${syncMeta.indicator}`} aria-hidden="true" />
            <SyncIcon className={`size-4 shrink-0 ${syncMeta.iconClassName}`} aria-hidden="true" />
            <span>
                {t('settings.system.metaPrefix')} · {syncMeta.label}
            </span>
        </span>
    );

    const panel = (
        <>
            {tab === 'reader' && <ReaderTab state={state} />}
            {tab === 'appearance' && <AppearanceTab state={state} />}
            {tab === 'language' && <LanguageTab state={state} />}
            {tab === 'accessibility' && <AccessibilityTab state={state} onNavigateToAbout={() => setTab('about')} />}
            {tab === 'data' && <DataTab state={state} />}
            {tab === 'about' && <SettingsAboutTab />}
        </>
    );

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader eyebrow={t('settings.system.eyebrow')} title={t('settings.system.title')} meta={meta} className="mb-6" />

            {state.needsReload && (
                <div className="mb-6 flex flex-col gap-3 rounded-mr-xs border border-mr-accent-50 bg-mr-accent-10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-mr-small text-mr-fg">
                        <RefreshCw className="size-4 shrink-0 text-mr-accent" aria-hidden="true" />
                        {t('settings.system.reloadBanner')}
                    </p>
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={state.reload} className="shrink-0">
                        {t('settings.system.reloadAction')}
                    </Button>
                </div>
            )}

            {state.syncStatus === 'error' && (
                <div className="mb-6 flex flex-col gap-3 rounded-mr-xs border border-mr-danger bg-mr-danger-15 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-mr-small text-mr-fg">
                        <AlertCircle className="size-4 shrink-0 text-mr-danger" aria-hidden="true" />
                        {t('settings.system.syncErrorBanner')}
                    </p>
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={state.retrySync} className="shrink-0">
                        {t('settings.system.syncRetry')}
                    </Button>
                </div>
            )}

            <div className={isDesktop ? 'grid grid-cols-[232px_1fr] gap-11' : ''}>
                <div className={isDesktop ? 'sticky top-5 self-start' : 'mb-6'}>
                    <Tabs
                        items={tabItems}
                        value={tab}
                        onChange={v => setTab(v as SettingTab)}
                        variant="underline"
                        size="sm"
                        orientation={isDesktop ? 'vertical' : 'horizontal'}
                    />
                </div>

                <div>{panel}</div>
            </div>
        </PageContainer>
    );
};

export default SystemSettings;
