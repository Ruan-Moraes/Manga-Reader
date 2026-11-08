import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { type StorageMeasurementAdapter, temporaryExportStorageMeasurement } from '@/shared/files';
import { formatByteSize } from '@/shared/locale';
import { type LocalDataSummary, measureLocalData } from '@/shared/storage';
import { AppText, ConfirmSheet, FormSection, ListRow, SectionStack, StatusMessage } from '@/shared/ui';

import {
    clearApplicationCache,
    clearRegisteredLocalData,
    clearTrackedHistory,
    DATA_CONTROL_CONFIRMATIONS,
    measureControlledStorage,
    shareAccountExport,
} from '../model/dataControls';
import { useDataControlsStore } from '../model/dataControlsStore';

type ConfirmKind = keyof typeof DATA_CONTROL_CONFIRMATIONS;

interface DataControlsPanelProps {
    storageMeasurement?: StorageMeasurementAdapter;
    onAuthenticationRequired?: () => void;
    showTitle?: boolean;
}

export function DataControlsPanel({
    storageMeasurement = temporaryExportStorageMeasurement,
    onAuthenticationRequired,
    showTitle = true,
}: DataControlsPanelProps) {
    const queryClient = useQueryClient();
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const { busyAction, errorKey, failedCategories, run } = useDataControlsStore();
    const { t } = useTranslation('common');
    const [pending, setPending] = useState<{ kind: ConfirmKind; operation: () => Promise<unknown> } | null>(null);
    const [storage, setStorage] = useState<{ usedBytes: number; scope: string } | null>(null);
    const [offlineData, setOfflineData] = useState<LocalDataSummary | null>({ totalBytes: 0, participantIds: [] });

    useEffect(() => {
        let mounted = true;
        void measureControlledStorage(storageMeasurement)
            .then(measurement => {
                if (mounted) setStorage(measurement);
            })
            .catch(() => {
                if (mounted) setStorage(null);
            });
        return () => {
            mounted = false;
        };
    }, [storageMeasurement]);

    useEffect(() => {
        let mounted = true;
        void measureLocalData()
            .then(summary => {
                if (mounted && summary.totalBytes > 0) setOfflineData(summary);
            })
            .catch(() => {
                if (mounted) setOfflineData(null);
            });
        return () => {
            mounted = false;
        };
    }, [busyAction]);

    const confirm = (kind: ConfirmKind, operation: () => Promise<unknown>) => setPending({ kind, operation });
    const descriptor = pending ? DATA_CONTROL_CONFIRMATIONS[pending.kind] : null;

    return (
        <SectionStack>
            {showTitle ? (
                <AppText accessibilityRole="header" variant="title">
                    {t('dataControls.title')}
                </AppText>
            ) : null}
            <FormSection contentPadding="none" title={t('dataControls.sections.device.title')} description={t('dataControls.sections.device.description')}>
                {storage ? (
                    <ListRow
                        description={t('dataControls.storageLabel')}
                        icon="pie-chart-outline"
                        showDivider
                        title={t('dataControls.storageUsage', {
                            size: formatByteSize(storage.usedBytes),
                            scope: storage.scope === 'temporary-exports' ? t('dataControls.storageScopes.temporaryExports') : storage.scope,
                        })}
                        variant="plain"
                    />
                ) : null}
                <ListRow
                    accessibilityHint={t('dataControls.cache.description')}
                    disabled={busyAction !== null}
                    description={t('dataControls.cache.description')}
                    icon="sparkles-outline"
                    loading={busyAction === 'cache'}
                    onPress={() => confirm('cache', () => clearApplicationCache(true, { queryClient }))}
                    showDivider={false}
                    tone="danger"
                    title={t('dataControls.cache.action')}
                    variant="plain"
                />
            </FormSection>
            <FormSection contentPadding="none" title={t('dataControls.offline.title')} description={t('dataControls.offline.description')}>
                {offlineData && offlineData.totalBytes > 0 ? (
                    <ListRow
                        accessibilityHint={t('dataControls.offline.description')}
                        disabled={busyAction !== null}
                        description={t('dataControls.offline.description')}
                        icon="phone-portrait-outline"
                        loading={busyAction === 'offline'}
                        onPress={() => confirm('offline', () => clearRegisteredLocalData(true, offlineData))}
                        showDivider={false}
                        tone="danger"
                        title={t('dataControls.offline.action', { size: formatByteSize(offlineData.totalBytes) })}
                        variant="plain"
                    />
                ) : (
                    <ListRow
                        description={t('dataControls.offline.empty')}
                        icon="phone-portrait-outline"
                        showDivider={false}
                        title={t('dataControls.offline.title')}
                        variant="plain"
                    />
                )}
            </FormSection>
            <FormSection contentPadding="none" title={t('dataControls.sections.account.title')} description={t('dataControls.sections.account.description')}>
                <ListRow
                    accessibilityHint={t('dataControls.export.description')}
                    disabled={busyAction !== null}
                    description={t('dataControls.export.description')}
                    icon="download-outline"
                    loading={busyAction === 'export'}
                    onPress={() => (isAuthenticated ? void run('export', () => shareAccountExport(true, { queryClient })) : onAuthenticationRequired?.())}
                    showDivider
                    title={t('dataControls.export.action')}
                    variant="plain"
                />
                <ListRow
                    accessibilityHint={t('dataControls.history.description')}
                    disabled={busyAction !== null}
                    description={t('dataControls.history.description')}
                    icon="time-outline"
                    loading={busyAction === 'history'}
                    onPress={() =>
                        isAuthenticated ? confirm('history', () => clearTrackedHistory(true, true, { queryClient })) : onAuthenticationRequired?.()
                    }
                    showDivider={false}
                    tone="danger"
                    title={t('dataControls.history.action')}
                    variant="plain"
                />
            </FormSection>
            {errorKey && (
                <StatusMessage
                    description={failedCategories.length > 0 ? failedCategories.map(category => t(`dataControls.cache.${category}`)).join(', ') : undefined}
                    title={t(errorKey)}
                    tone="danger"
                />
            )}
            <ConfirmSheet
                visible={pending !== null}
                onClose={() => setPending(null)}
                onConfirm={() => {
                    if (pending) void run(pending.kind, pending.operation);
                }}
                closeLabel={t('navigation.dismiss')}
                cancelLabel={t('dataControls.cancel')}
                confirmLabel={t('dataControls.confirm')}
                title={descriptor ? t(descriptor.titleKey) : ''}
                description={
                    descriptor
                        ? `${t(descriptor.bodyKey)}\n\n${t('dataControls.preserves')}: ${descriptor.preservesKeys.map(key => t(key)).join(', ')}.`
                        : undefined
                }
                itemsTitle={t('dataControls.removes')}
                items={descriptor ? descriptor.removesKeys.map(key => t(key)) : undefined}
            />
        </SectionStack>
    );
}
