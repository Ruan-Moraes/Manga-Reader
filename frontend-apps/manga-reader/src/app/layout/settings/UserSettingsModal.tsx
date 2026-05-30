import { useEffect, useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { USER_SETTINGS_STORAGE_KEY } from '@shared/constant/USER_SETTINGS_STORAGE_KEY';

import { sectionTitleClass, getStoredSettings, type TabKey, type UserSettings } from './settings.constants';
import AppearanceSettings from './tabs/AppearanceSettings';
import LanguageSettings from './tabs/LanguageSettings';
import NotificationSettings from './tabs/NotificationSettings';
import PrivacySettings from './tabs/PrivacySettings';
import ReadingSettings from './tabs/ReadingSettings';
import { Bell, BookOpen, Globe, Monitor, Shield } from 'lucide-react';

type UserSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
};

const UserSettingsModal = ({ isOpen, onClose, isLoggedIn }: UserSettingsModalProps) => {
    const { t } = useTranslation('user');
    const [activeTab, setActiveTab] = useState<TabKey>('reading');
    const [settings, setSettings] = useState<UserSettings>(getStoredSettings);

    const tabs = useMemo<
        Array<{
            key: TabKey;
            label: string;
            icon: React.ComponentType<{ className?: string }>;
        }>
    >(
        () => [
            {
                key: 'reading',
                label: t('settings.tabs.reading'),
                icon: BookOpen,
            },
            {
                key: 'appearance',
                label: t('settings.tabs.appearance'),
                icon: Monitor,
            },
            {
                key: 'language',
                label: t('settings.tabs.language'),
                icon: Globe,
            },
            {
                key: 'notifications',
                label: t('settings.tabs.notifications'),
                icon: Bell,
            },
            { key: 'privacy', label: t('settings.tabs.privacy'), icon: Shield },
        ],
        [t],
    );

    useEffect(() => {
        localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    return (
        <Modal open={isOpen} onClose={onClose} title={t('settings.modalTitle')} description={t('settings.modalSubtitle')} size="lg">
            <div className="grid gap-2 md:grid-cols-[200px_1fr]">
                <nav className="flex scrollbar-hidden gap-2 overflow-x-scroll border rounded-xs border-tertiary bg-secondary/40">
                    {tabs.map(tab => {
                        const Icon = tab.icon;

                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xs transition-colors',
                                    isActive
                                        ? 'bg-quaternary-default/15 text-quaternary-default md:border-l-2 md:border-quaternary-default'
                                        : 'hover:bg-tertiary/20',
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <section className="flex flex-nowrap p-3 border rounded-xs border-tertiary bg-secondary/30 max-h-[65vh] overflow-y-auto">
                    {activeTab === 'reading' && <ReadingSettings settings={settings} onUpdate={setSettings} />}
                    {activeTab === 'appearance' && <AppearanceSettings settings={settings} onUpdate={setSettings} />}
                    {activeTab === 'language' && <LanguageSettings settings={settings} onUpdate={setSettings} isLoggedIn={isLoggedIn} />}
                    {activeTab === 'notifications' && <NotificationSettings settings={settings} onUpdate={setSettings} isLoggedIn={isLoggedIn} />}
                    {activeTab === 'privacy' && <PrivacySettings settings={settings} onUpdate={setSettings} isLoggedIn={isLoggedIn} />}
                </section>
            </div>
        </Modal>
    );
};

export default UserSettingsModal;
