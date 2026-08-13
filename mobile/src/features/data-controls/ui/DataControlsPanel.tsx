import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { type StorageMeasurementAdapter, temporaryExportStorageMeasurement } from '@/src/shared/files';
import { type LocalDataSummary, measureLocalData } from '@/src/shared/storage';
import { useTheme } from '@/src/shared/theme';
import { Button } from '@/src/shared/ui';

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
}

export function DataControlsPanel({ storageMeasurement = temporaryExportStorageMeasurement, onAuthenticationRequired }: DataControlsPanelProps) {
    const queryClient = useQueryClient();
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const { busyAction, errorKey, failedCategories, run } = useDataControlsStore();
    const { t } = useTranslation('common');
    const { spacing, tokens, typography } = useTheme();
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
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <Text accessibilityRole="header" style={{ color: tokens.text, fontSize: typography.h2 }}>
                {t('dataControls.title')}
            </Text>
            {storage && (
                <Text style={{ color: tokens.muted }}>
                    {t('dataControls.storageUsage', {
                        bytes: storage.usedBytes,
                        scope: storage.scope === 'temporary-exports' ? t('dataControls.storageScopes.temporaryExports') : storage.scope,
                    })}
                </Text>
            )}
            <Button
                loading={busyAction === 'cache'}
                disabled={busyAction !== null}
                onPress={() => confirm('cache', () => clearApplicationCache(true, { queryClient }))}
                variant="outline"
            >
                {t('dataControls.cache.action')}
            </Button>
            {offlineData && offlineData.totalBytes > 0 ? (
                <Button
                    loading={busyAction === 'offline'}
                    disabled={busyAction !== null}
                    onPress={() => confirm('offline', () => clearRegisteredLocalData(true, offlineData))}
                    variant="outline"
                >
                    {t('dataControls.offline.action', { bytes: offlineData.totalBytes })}
                </Button>
            ) : (
                <Text style={{ color: tokens.muted }}>{t('dataControls.offline.empty')}</Text>
            )}
            <Button
                loading={busyAction === 'export'}
                disabled={busyAction !== null}
                onPress={() => (isAuthenticated ? void run('export', () => shareAccountExport(true, { queryClient })) : onAuthenticationRequired?.())}
                variant="outline"
            >
                {t('dataControls.export.action')}
            </Button>
            <Button
                loading={busyAction === 'history'}
                disabled={busyAction !== null}
                onPress={() => (isAuthenticated ? confirm('history', () => clearTrackedHistory(true, true, { queryClient })) : onAuthenticationRequired?.())}
                variant="outline"
            >
                {t('dataControls.history.action')}
            </Button>
            {errorKey && (
                <Text style={{ color: tokens.danger }}>
                    {t(errorKey)}
                    {failedCategories.length > 0 ? ` ${failedCategories.map(category => t(`dataControls.cache.${category}`)).join(', ')}.` : ''}
                </Text>
            )}
        </View>
    );
}
