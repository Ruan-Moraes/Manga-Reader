import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type CancelRemoteProcessingController, cancelRemoteProcessingController } from '@/src/features/cancel-remote-processing';
import { type StartRemoteProcessingController, useStartRemoteProcessing } from '@/src/features/start-remote-processing';
import { externalLinks } from '@/src/shared/config';
import { useTheme } from '@/src/shared/theme';
import { AppDialog, AppText, Button, Card, StatusMessage } from '@/src/shared/ui';

interface Props {
    startController?: StartRemoteProcessingController;
    cancelController?: CancelRemoteProcessingController;
}

export function RemoteProcessingPanel({ startController, cancelController = cancelRemoteProcessingController }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { spacing } = useTheme();
    const remote = useStartRemoteProcessing(startController);
    const [disclosureOpen, setDisclosureOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    if (remote.loading || !remote.project) return null;

    const capability = remote.capabilities;
    const attempt = remote.attempt;
    const canStart = remote.project.status === 'DRAFT' && capability?.enabled === true && !remote.error;
    const statusKey = attempt ? `status.${attempt.status}` : remote.error ? `errors.${remote.error}` : null;

    const cancel = async () => {
        if (!attempt) return;
        setCancelling(true);
        try {
            const result = await cancelController.cancel(attempt);
            setCancelError(result.error);
            await remote.reconcile();
        } finally {
            setCancelling(false);
        }
    };

    return (
        <View testID="remote-processing-panel">
            <Card variant="elevated" style={{ gap: spacing.md }}>
                <View style={{ gap: spacing.xs }}>
                    <AppText accessibilityRole="header" variant="section">
                        {t('title')}
                    </AppText>
                    <AppText tone="muted">{t('description')}</AppText>
                </View>

                {statusKey ? (
                    <StatusMessage
                        tone={attempt?.status === 'ACCEPTED' ? 'success' : attempt?.status === 'CANCELLED' ? 'info' : 'warning'}
                        title={t(statusKey)}
                        description={attempt?.remoteStatus ? t(`remoteStatus.${attempt.remoteStatus}`) : undefined}
                    />
                ) : null}
                {cancelError ? (
                    <AppText accessibilityRole="alert" tone="danger">
                        {t(`errors.${cancelError}`)}
                    </AppText>
                ) : null}

                {!attempt && canStart ? <Button onPress={() => setDisclosureOpen(true)}>{t('actions.start')}</Button> : null}
                {(attempt?.status === 'UNKNOWN' || attempt?.status === 'CANCEL_PENDING') && (
                    <Button loading={remote.busy} onPress={() => void remote.reconcile()} variant="outline">
                        {t('actions.check')}
                    </Button>
                )}
                {(attempt?.status === 'ACCEPTED' || attempt?.status === 'CANCEL_PENDING') && (
                    <Button disabled={cancelling} loading={cancelling} onPress={() => void cancel()} tone="danger" variant="outline">
                        {t('actions.cancel')}
                    </Button>
                )}
                {(attempt?.status === 'REJECTED' || attempt?.status === 'FAILED') && (
                    <Button loading={remote.busy} onPress={() => void remote.retry()}>
                        {t('actions.retry')}
                    </Button>
                )}

                {capability ? (
                    <AppDialog
                        visible={disclosureOpen}
                        title={t('disclosure.title')}
                        description={t('disclosure.description', { page: 1 })}
                        confirmLabel={t('disclosure.accept')}
                        cancelLabel={t('disclosure.decline')}
                        onCancel={() => setDisclosureOpen(false)}
                        onConfirm={() => {
                            setDisclosureOpen(false);
                            void remote.acceptAndSubmit();
                        }}
                    >
                        <View style={{ gap: spacing.sm }}>
                            <AppText>{t('disclosure.network')}</AppText>
                            <AppText>{t('disclosure.data')}</AppText>
                            <AppText>
                                {t('disclosure.operator', {
                                    operator: capability.disclosure.operatorName,
                                    contact: capability.disclosure.operatorContact,
                                })}
                            </AppText>
                            <AppText>
                                {t('disclosure.regions', {
                                    gateway: capability.disclosure.gatewayRegion,
                                    processing: capability.disclosure.processingRegions.join(', '),
                                })}
                            </AppText>
                            <AppText>
                                {t('disclosure.retention', {
                                    originalMinutes: Math.ceil(capability.disclosure.originalRetentionSeconds / 60),
                                    resultMinutes: Math.ceil(capability.disclosure.resultRetentionSeconds / 60),
                                    metadataDays: capability.disclosure.metadataRetentionDays,
                                })}
                            </AppText>
                            <AppText>{t('disclosure.training', { policy: capability.disclosure.providerTrainingPolicy })}</AppText>
                            <AppText>{t('disclosure.cancellation')}</AppText>
                            <View style={{ gap: spacing.xs }}>
                                <Button onPress={() => void externalLinks.open(capability.disclosure.privacyPolicyUrl)} variant="ghost">
                                    {t('disclosure.privacy')}
                                </Button>
                                <Button onPress={() => void externalLinks.open(capability.disclosure.termsUrl)} variant="ghost">
                                    {t('disclosure.terms')}
                                </Button>
                            </View>
                        </View>
                    </AppDialog>
                ) : null}
            </Card>
        </View>
    );
}
