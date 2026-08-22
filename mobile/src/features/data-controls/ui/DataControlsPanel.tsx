import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { type StorageMeasurementAdapter, temporaryExportStorageMeasurement } from '@/src/shared/files';
import { formatByteSize } from '@/src/shared/locale';
import { type LocalDataSummary, measureLocalData } from '@/src/shared/storage';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, FormSection, Icon, StatusMessage } from '@/src/shared/ui';

import {
    clearApplicationCache,
    clearRegisteredLocalData,
    clearTrackedHistory,
    DATA_CONTROL_CONFIRMATIONS,
    measureControlledStorage,
    shareAccountExport,
} from '../model/dataControls';
import { useDataControlsStore } from '../model/dataControlsStore';

const confirmationBody = (t: (key: string) => string, descriptor: (typeof DATA_CONTROL_CONFIRMATIONS)[keyof typeof DATA_CONTROL_CONFIRMATIONS]) =>
    `${t(descriptor.bodyKey)}\n\n${t('dataControls.removes')}: ${descriptor.removesKeys.map(key => t(key)).join(', ')}.\n${t('dataControls.preserves')}: ${descriptor.preservesKeys.map(key => t(key)).join(', ')}.`;

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
    const { radii, spacing, tokens } = useTheme();
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

    const confirm = (kind: 'cache' | 'history' | 'offline', operation: () => Promise<unknown>) => {
        const descriptor = DATA_CONTROL_CONFIRMATIONS[kind];
        Alert.alert(t(descriptor.titleKey), confirmationBody(t, descriptor), [
            { text: t('dataControls.cancel'), style: 'cancel' },
            { text: t('dataControls.confirm'), style: 'destructive', onPress: () => void run(kind, operation) },
        ]);
    };

    return (
        <View style={{ gap: spacing.md }}>
            {showTitle ? (
                <AppText accessibilityRole="header" variant="title">
                    {t('dataControls.title')}
                </AppText>
            ) : null}
            <FormSection title={t('dataControls.sections.device.title')} description={t('dataControls.sections.device.description')}>
                {storage ? (
                    <View style={{ backgroundColor: tokens.accentSoft, borderRadius: radii.control, gap: spacing.xs, padding: spacing.md }}>
                        <AppText variant="eyebrow" tone="accent">
                            {t('dataControls.storageLabel')}
                        </AppText>
                        <AppText variant="label">
                            {t('dataControls.storageUsage', {
                                size: formatByteSize(storage.usedBytes),
                                scope: storage.scope === 'temporary-exports' ? t('dataControls.storageScopes.temporaryExports') : storage.scope,
                            })}
                        </AppText>
                    </View>
                ) : null}
                <Button
                    accessibilityHint={t('dataControls.cache.description')}
                    disabled={busyAction !== null}
                    leading={<Icon name="sparkles-outline" decorative />}
                    loading={busyAction === 'cache'}
                    onPress={() => confirm('cache', () => clearApplicationCache(true, { queryClient }))}
                    tone="danger"
                    variant="outline"
                >
                    {t('dataControls.cache.action')}
                </Button>
                {offlineData && offlineData.totalBytes > 0 ? (
                    <Button
                        accessibilityHint={t('dataControls.offline.description')}
                        disabled={busyAction !== null}
                        leading={<Icon name="phone-portrait-outline" decorative />}
                        loading={busyAction === 'offline'}
                        onPress={() => confirm('offline', () => clearRegisteredLocalData(true, offlineData))}
                        tone="danger"
                        variant="outline"
                    >
                        {t('dataControls.offline.action', { size: formatByteSize(offlineData.totalBytes) })}
                    </Button>
                ) : (
                    <AppText tone="muted">{t('dataControls.offline.empty')}</AppText>
                )}
            </FormSection>
            <FormSection title={t('dataControls.sections.account.title')} description={t('dataControls.sections.account.description')}>
                <Button
                    accessibilityHint={t('dataControls.export.description')}
                    disabled={busyAction !== null}
                    leading={<Icon name="download-outline" decorative />}
                    loading={busyAction === 'export'}
                    onPress={() => (isAuthenticated ? void run('export', () => shareAccountExport(true, { queryClient })) : onAuthenticationRequired?.())}
                    variant="outline"
                >
                    {t('dataControls.export.action')}
                </Button>
                <Button
                    accessibilityHint={t('dataControls.history.description')}
                    disabled={busyAction !== null}
                    leading={<Icon name="time-outline" decorative />}
                    loading={busyAction === 'history'}
                    onPress={() =>
                        isAuthenticated ? confirm('history', () => clearTrackedHistory(true, true, { queryClient })) : onAuthenticationRequired?.()
                    }
                    tone="danger"
                    variant="outline"
                >
                    {t('dataControls.history.action')}
                </Button>
            </FormSection>
            {errorKey && (
                <StatusMessage
                    description={failedCategories.length > 0 ? failedCategories.map(category => t(`dataControls.cache.${category}`)).join(', ') : undefined}
                    title={t(errorKey)}
                    tone="danger"
                />
            )}
        </View>
    );
}
