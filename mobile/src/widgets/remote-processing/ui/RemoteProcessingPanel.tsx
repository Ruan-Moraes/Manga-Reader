import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type AcquireRemoteResultController, REMOTE_STAGES, remoteStageIndex, useRemoteResultPolling } from '@/features/acquire-remote-result';
import { type CancelRemoteProcessingController, cancelRemoteProcessingController } from '@/features/cancel-remote-processing';
import { type StartRemoteProcessingController, useStartRemoteProcessing } from '@/features/start-remote-processing';
import { externalLinks } from '@/shared/config';
import { useTheme } from '@/shared/theme';
import { AppDialog, AppText, Button, Card, ProgressSteps, StatusMessage } from '@/shared/ui';

interface Props {
    startController?: StartRemoteProcessingController;
    cancelController?: CancelRemoteProcessingController;
    acquireController?: AcquireRemoteResultController;
    /** Opens the local reader; called once per project when its first result is persisted, or from "Read". */
    onOpenResult?(projectId: string): void;
}

export function RemoteProcessingPanel({ startController, cancelController = cancelRemoteProcessingController, acquireController, onOpenResult }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { spacing } = useTheme();
    const remote = useStartRemoteProcessing(startController);
    // Followed while any page of the project was accepted and its result is still owed.
    const following = remote.pages.some(item => item.attempt?.status === 'ACCEPTED' && item.attempt.resultAcknowledgedAt === null);
    const polling = useRemoteResultPolling(
        {
            enabled: following,
            // Each round may free the queue window: the next page goes as soon as the queue allows.
            onRound: () => void remote.refresh().then(remote.advance),
            onOpen: projectId => onOpenResult?.(projectId),
        },
        acquireController,
    );
    const [disclosureOpen, setDisclosureOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    if (remote.loading || !remote.project) return null;

    const capability = remote.capabilities;
    const attempt = remote.attempt;
    const canStart = remote.project.status === 'DRAFT' && capability?.enabled === true && !remote.error;
    // The quota pause has its own banner below; it is not repeated as the status.
    const statusKey = attempt ? `status.${attempt.status}` : remote.error && remote.error !== 'quota-exceeded' ? `errors.${remote.error}` : null;
    const page = remote.project.pages.find(candidate => candidate.id === attempt?.pageId);
    const saved = page?.status === 'READY';
    const total = remote.pages.length;
    const ready = remote.pages.filter(item => item.page.status === 'READY').length;
    const sent = remote.pages.filter(item => item.page.status !== 'DRAFT').length;
    const paused = remote.pausedUntil !== null || remote.error === 'quota-exceeded';
    const started = remote.project.status !== 'DRAFT';
    const cancellable = remote.pages.flatMap(item =>
        item.attempt && (item.attempt.status === 'ACCEPTED' || item.attempt.status === 'CANCEL_PENDING') && item.page.status !== 'READY' ? [item.attempt] : [],
    );
    const stage = attempt?.status === 'ACCEPTED' ? remoteStageIndex(attempt.remoteStatus, saved) : null;
    const stageSteps = REMOTE_STAGES.map(id => ({ id, label: t(`stages.${id}`) }));

    // Cancelling stops the project: every page still running is cancelled; pages not sent stay as they are.
    const cancel = async () => {
        if (cancellable.length === 0) return;
        setCancelling(true);
        try {
            let error: string | null = null;
            for (const running of cancellable) error = (await cancelController.cancel(running)).error ?? error;
            setCancelError(error);
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
                    {started && total > 0 ? <AppText variant="caption">{t('progress.summary', { ready, sent, total })}</AppText> : null}
                </View>

                {statusKey ? (
                    <StatusMessage
                        tone={attempt?.status === 'ACCEPTED' ? 'success' : attempt?.status === 'CANCELLED' ? 'info' : 'warning'}
                        title={t(statusKey)}
                        description={saved ? t('saved') : attempt?.remoteStatus ? t(`remoteStatus.${attempt.remoteStatus}`) : undefined}
                    />
                ) : null}
                {stage !== null ? <ProgressSteps steps={stageSteps} currentIndex={stage} accessibilityLabel={t('stagesLabel')} /> : null}
                {polling?.error && following ? (
                    <AppText accessibilityRole="alert" tone="muted">
                        {t(`errors.${polling.error}`)}
                    </AppText>
                ) : null}
                {cancelError ? (
                    <AppText accessibilityRole="alert" tone="danger">
                        {t(`errors.${cancelError}`)}
                    </AppText>
                ) : null}

                {paused && sent < total ? (
                    <StatusMessage tone="info" title={t('errors.quota-exceeded')} description={t('progress.paused', { sent, total })} />
                ) : null}
                {started && total > 1 ? (
                    <View accessibilityLabel={t('progress.pagesLabel')} style={{ gap: spacing.xs }}>
                        {remote.pages.map(item => (
                            <View key={item.page.id} style={{ gap: spacing.xs }}>
                                <AppText variant="caption">
                                    {t('progress.page', { number: item.page.position + 1, status: t(`pageStatus.${item.page.status}`) })}
                                </AppText>
                                {item.page.status === 'FAILED' ? (
                                    <Button loading={remote.busy} onPress={() => void remote.retryPage(item.page.id)} variant="outline">
                                        {t('actions.retryPage', { number: item.page.position + 1 })}
                                    </Button>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : null}
                {ready > 0 && onOpenResult ? <Button onPress={() => onOpenResult(remote.project!.id)}>{t('actions.read')}</Button> : null}
                {!attempt && canStart ? <Button onPress={() => setDisclosureOpen(true)}>{t('actions.start')}</Button> : null}
                {(attempt?.status === 'UNKNOWN' || attempt?.status === 'CANCEL_PENDING') && (
                    <Button loading={remote.busy} onPress={() => void remote.reconcile()} variant="outline">
                        {t('actions.check')}
                    </Button>
                )}
                {cancellable.length > 0 && (
                    <Button disabled={cancelling} loading={cancelling} onPress={() => void cancel()} tone="danger" variant="outline">
                        {t('actions.cancel')}
                    </Button>
                )}
                {total === 1 && attempt?.status === 'FAILED' && page?.status === 'FAILED' ? (
                    <Button loading={remote.busy} onPress={() => void remote.retryPage(page.id)}>
                        {t('actions.retry')}
                    </Button>
                ) : null}
                {attempt?.status === 'REJECTED' && !paused && (
                    <Button loading={remote.busy} onPress={() => void remote.retry()}>
                        {t('actions.retry')}
                    </Button>
                )}

                {capability ? (
                    <AppDialog
                        visible={disclosureOpen}
                        title={t('disclosure.title')}
                        description={t('disclosure.description', { count: total })}
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
                                    ocr: capability.disclosure.ocrRegion,
                                    translation: capability.disclosure.translationLocation,
                                })}
                            </AppText>
                            {capability.disclosure.languageModelLocation ? (
                                <AppText>{t('disclosure.languageModel', { location: capability.disclosure.languageModelLocation })}</AppText>
                            ) : null}
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
