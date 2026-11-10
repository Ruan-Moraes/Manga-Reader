import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { type StorageMeasurementAdapter, temporaryExportStorageMeasurement } from '@/shared/files';
import { formatByteSize } from '@/shared/locale';
import { type LocalDataSummary, measureLocalData } from '@/shared/storage';
import { AppText, ConfirmDialog, FormSection, ListRow, SectionStack, showToast } from '@/shared/ui';

import {
    clearApplicationCache,
    clearRegisteredLocalData,
    clearTrackedHistory,
    DATA_CONTROL_CONFIRMATIONS,
    measureControlledStorage,
    shareAccountExport,
} from '../model/dataControls';
import { type DataControlAction, useDataControlsStore } from '../model/dataControlsStore';

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
    const { busyAction, run } = useDataControlsStore();
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
    }, [storageMeasurement, busyAction]);

    useEffect(() => {
        let mounted = true;
        void measureLocalData()
            .then(summary => {
                if (mounted) setOfflineData(summary);
            })
            .catch(() => {
                if (mounted) setOfflineData(null);
            });
        return () => {
            mounted = false;
        };
    }, [busyAction]);

    // Result of an action as a temporary toast (2026-11-10); the screen layout never moves.
    const runWithFeedback = async (kind: DataControlAction, operation: () => Promise<unknown>) => {
        const succeeded = await run(kind, operation);
        const state = useDataControlsStore.getState();
        if (succeeded) {
            if (kind !== 'export') {
                showToast({ tone: 'success', title: t(`dataControls.success.${kind}.title`), description: t(`dataControls.success.${kind}.description`) });
            }
        } else if (state.errorKey) {
            showToast({
                tone: 'danger',
                title: t(state.errorKey),
                description:
                    state.failedCategories.length > 0 ? state.failedCategories.map(category => t(`dataControls.cache.${category}`)).join(', ') : undefined,
            });
        }
    };

    const confirm = (kind: ConfirmKind, operation: () => Promise<unknown>) => {
        setPending({ kind, operation });
    };
    // Keep the last confirmation's text while the sheet animates out, so it never closes empty.
    const lastKind = useRef<ConfirmKind | null>(null);
    if (pending) lastKind.current = pending.kind;
    const descriptor = lastKind.current ? DATA_CONTROL_CONFIRMATIONS[lastKind.current] : null;

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
                    onPress={() =>
                        isAuthenticated ? void runWithFeedback('export', () => shareAccountExport(true, { queryClient })) : onAuthenticationRequired?.()
                    }
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
            <ConfirmDialog
                visible={pending !== null}
                onClose={() => setPending(null)}
                onConfirm={() => {
                    if (!pending) return;
                    const { kind, operation } = pending;
                    void runWithFeedback(kind, operation);
                }}
                closeLabel={t('navigation.dismiss')}
                cancelLabel={t('dataControls.cancel')}
                confirmLabel={t('dataControls.confirm')}
                title={descriptor ? t(descriptor.titleKey) : ''}
                description={descriptor ? t(descriptor.bodyKey) : undefined}
                itemsTitle={t('dataControls.removes')}
                items={descriptor ? descriptor.removesKeys.map(key => t(key)) : undefined}
                preservedTitle={t('dataControls.preserves')}
                preservedItems={descriptor ? descriptor.preservesKeys.map(key => t(key)) : undefined}
            />
        </SectionStack>
    );
}
