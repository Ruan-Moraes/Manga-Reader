import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, Upload } from 'lucide-react';

import { Button } from '@ui/Button';
import { Modal } from '@ui/Modal';
import { ProgressBar } from '@ui/ProgressBar';
import { useToast } from '@ui/Toast';

import { SettingSection } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

const CACHE_USED_MB = 186;
const CACHE_TOTAL_MB = 512;

type ConfirmKind = 'cache' | 'history' | null;

const DataRow = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
            <p className="text-mr-body font-mr-bold text-mr-fg">{title}</p>
            {desc && <p className="mt-0.5 text-mr-small text-mr-fg-subtle">{desc}</p>}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const DataTab = ({ state }: { state: SettingsState }) => {
    const { t } = useTranslation('user');

    const { toast } = useToast();

    const { isLoggedIn } = state;

    const [confirm, setConfirm] = useState<ConfirmKind>(null);
    const [importOpen, setImportOpen] = useState(false);

    const usagePct = Math.round((CACHE_USED_MB / CACHE_TOTAL_MB) * 100);

    const runConfirm = () => {
        if (confirm === 'cache') {
            toast({ tone: 'accent', title: t('settings.system.data.cacheCleared'), duration: 2200 });
        }

        if (confirm === 'history') {
            toast({ tone: 'accent', title: t('settings.system.data.historyCleared'), duration: 2200 });
        }

        setConfirm(null);
    };

    return (
        <>
            {!isLoggedIn && (
                <p className="mb-5 rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-3 text-mr-small text-mr-fg-muted">
                    {t('settings.system.data.guestNotice')}
                </p>
            )}

            <SettingSection title={t('settings.system.data.sectionStorage')}>
                <div className="flex flex-col gap-3">
                    <DataRow title={t('settings.system.data.cacheTitle')}>
                        <Button variant="ghost" danger icon={Trash2} onClick={() => setConfirm('cache')}>
                            {t('settings.system.data.clear')}
                        </Button>
                    </DataRow>
                    <div className="rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-4">
                        <div className="mb-2 flex items-center justify-between text-mr-small">
                            <span className="text-mr-fg-muted">{t('settings.system.data.cacheUsageLabel')}</span>
                            <span className="font-mr-mono tabular-nums text-mr-fg">
                                {t('settings.system.data.cacheUsage', { used: CACHE_USED_MB, total: CACHE_TOTAL_MB })}
                            </span>
                        </div>
                        <ProgressBar value={usagePct} thickness="thick" label={t('settings.system.data.cacheTitle')} />
                    </div>
                </div>
            </SettingSection>

            <SettingSection title={t('settings.system.data.sectionLibrary')}>
                <div className="flex flex-col gap-3">
                    <DataRow title={t('settings.system.data.exportTitle')} desc={t('settings.system.data.exportDesc')}>
                        <Button
                            variant="ghost"
                            icon={Download}
                            disabled={!isLoggedIn}
                            onClick={() => toast({ tone: 'accent', title: t('settings.system.data.exportStarted'), duration: 2200 })}
                        >
                            {t('settings.system.data.exportAction')}
                        </Button>
                    </DataRow>
                    <DataRow title={t('settings.system.data.importTitle')} desc={t('settings.system.data.importDesc')}>
                        <Button variant="ghost" icon={Upload} onClick={() => setImportOpen(true)}>
                            {t('settings.system.data.importAction')}
                        </Button>
                    </DataRow>
                </div>
            </SettingSection>

            <SettingSection title={t('settings.system.data.sectionHistory')}>
                <DataRow title={t('settings.system.data.historyTitle')} desc={t('settings.system.data.historyDesc')}>
                    <Button variant="ghost" danger icon={Trash2} onClick={() => setConfirm('history')}>
                        {t('settings.system.data.clear')}
                    </Button>
                </DataRow>
            </SettingSection>

            <Modal
                open={confirm !== null}
                onClose={() => setConfirm(null)}
                title={confirm === 'history' ? t('settings.system.data.historyConfirmTitle') : t('settings.system.data.cacheConfirmTitle')}
                description={confirm === 'history' ? t('settings.system.data.historyConfirmBody') : t('settings.system.data.cacheConfirmBody')}
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setConfirm(null)}>
                            {t('settings.system.data.confirmCancel')}
                        </Button>
                        <Button variant="ghost" danger icon={Trash2} onClick={runConfirm}>
                            {t('settings.system.data.confirmClear')}
                        </Button>
                    </div>
                }
            >
                <p className="text-mr-small text-mr-fg-muted">{t('settings.system.data.confirmIrreversible')}</p>
            </Modal>

            <Modal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                title={t('settings.system.data.importModalTitle')}
                description={t('settings.system.data.importModalDesc')}
                size="sm"
            >
                <div className="flex flex-col gap-2">
                    {(['mal', 'anilist', 'csv'] as const).map(src => (
                        <Button
                            key={src}
                            variant="ghost"
                            block
                            onClick={() => {
                                setImportOpen(false);
                                toast({ tone: 'accent', title: t('settings.system.data.importStarted'), duration: 2200 });
                            }}
                        >
                            {t(`settings.system.data.importSource.${src}`)}
                        </Button>
                    ))}
                </div>
            </Modal>
        </>
    );
};

export default DataTab;
