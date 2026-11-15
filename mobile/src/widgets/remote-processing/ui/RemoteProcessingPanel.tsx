import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { type AcquireRemoteTranslationResultController, useAcquireRemoteTranslationResult } from '@/features/acquire-remote-translation-result';
import { type CancelRemoteProcessingController, cancelRemoteProcessingController } from '@/features/cancel-remote-processing';
import { type StartRemoteProcessingController, useStartRemoteProcessing } from '@/features/start-remote-processing';
import { useExternalLinkOpener } from '@/shared/config';
import { ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppDialog, AppText, Button, Card, ProgressSteps, StatusMessage } from '@/shared/ui';

interface Props {
    startController?: StartRemoteProcessingController;
    cancelController?: CancelRemoteProcessingController;
    acquisitionController?: AcquireRemoteTranslationResultController;
    onActivityChange?(active: boolean): void;
}

function openReader(projectId: string) {
    router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId } });
}

export function RemoteProcessingPanel({
    startController,
    cancelController = cancelRemoteProcessingController,
    acquisitionController,
    onActivityChange,
}: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { spacing } = useTheme();
    const remote = useStartRemoteProcessing(startController);
    const acquired = useAcquireRemoteTranslationResult(remote.attempt?.status === 'ACCEPTED' ? remote.attempt.id : null, acquisitionController, openReader);
    const [disclosureOpen, setDisclosureOpen] = useState(false);
    const legalLink = useExternalLinkOpener();
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const active = remote.busy || acquired?.status === 'waiting' || (remote.attempt?.status === 'ACCEPTED' && acquired === null);

    useEffect(() => {
        onActivityChange?.(active);
        return () => onActivityChange?.(false);
    }, [active, onActivityChange]);

    if (remote.loading || !remote.project) return null;

    const capability = remote.capabilities;
    const attempt = remote.attempt;
    const firstPage = [...remote.project.pages].sort((a, b) => a.position - b.position)[0];
    const canStart =
        (remote.project.status === 'DRAFT' ||
            remote.project.status === 'FAILED' ||
            (['QUEUED', 'PROCESSING'].includes(remote.project.status) && firstPage?.status === 'FAILED')) &&
        firstPage &&
        ['DRAFT', 'FAILED'].includes(firstPage.status) &&
        capability?.enabled === true &&
        remote.error !== 'capabilities-unavailable';
    const isNewExecution = attempt?.status === 'REJECTED' || attempt?.status === 'FAILED';
    const statusKey = attempt ? `status.${attempt.status}` : remote.error ? `errors.${remote.error}` : null;
    const readyProjectId = acquired?.status === 'ready' ? acquired.projectId : null;

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

                {readyProjectId ? (
                    <StatusMessage tone="success" title={t('acquisition.ready')} description={t('acquisition.readyDescription')} />
                ) : statusKey ? (
                    <StatusMessage
                        tone={attempt?.status === 'ACCEPTED' || attempt?.status === 'CANCELLED' ? 'info' : 'warning'}
                        title={t(statusKey)}
                        description={
                            attempt?.gatewayContractVersion === '2.0' && attempt.status !== 'CREATED'
                                ? t(`volatileReceipt.${attempt.volatileReceiptStatus ?? 'UNKNOWN'}`)
                                : attempt?.remoteStatus
                                  ? t(`remoteStatus.${attempt.remoteStatus}`)
                                  : undefined
                        }
                    />
                ) : null}
                {acquired && acquired.stage >= 0 ? (
                    <ProgressSteps
                        steps={['received', 'saved'].map(id => ({ id, label: t(`acquisition.stages.${id}`) }))}
                        currentIndex={acquired.stage}
                        accessibilityLabel={t('acquisition.progress')}
                    />
                ) : null}
                {acquired?.error ? <StatusMessage tone="warning" title={t('acquisition.error')} description={t('acquisition.recover')} /> : null}
                {acquired?.status === 'failed' || acquired?.status === 'cancelled' ? (
                    <Button onPress={() => void remote.reconcile()} variant="outline">
                        {t('actions.refresh')}
                    </Button>
                ) : null}
                {readyProjectId ? <Button onPress={() => openReader(readyProjectId)}>{t('actions.openReader')}</Button> : null}
                {cancelError ? (
                    <AppText accessibilityRole="alert" tone="danger">
                        {t(`errors.${cancelError}`)}
                    </AppText>
                ) : null}

                {remote.busy ? (
                    <View style={{ gap: spacing.xs }}>
                        <Button loading accessibilityLabel={t('actions.processing')}>
                            {t('actions.processing')}
                        </Button>
                        <Button onPress={remote.interrupt} tone="danger" variant="outline">
                            {t('actions.cancel')}
                        </Button>
                    </View>
                ) : null}
                {!attempt && canStart && !remote.busy ? <Button onPress={() => setDisclosureOpen(true)}>{t('actions.start')}</Button> : null}
                {!remote.busy && (attempt?.status === 'UNKNOWN' || attempt?.status === 'CANCEL_PENDING') && (
                    <Button loading={remote.busy} onPress={() => void remote.reconcile()} variant="outline">
                        {t('actions.check')}
                    </Button>
                )}
                {!remote.busy &&
                    attempt &&
                    ['CREATED', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CANCEL_PENDING'].includes(attempt.status) &&
                    acquired?.status !== 'ready' && (
                        <Button disabled={cancelling} loading={cancelling} onPress={() => void cancel()} tone="danger" variant="outline">
                            {t('actions.cancel')}
                        </Button>
                    )}
                {isNewExecution && canStart && !remote.busy && <Button onPress={() => setDisclosureOpen(true)}>{t('actions.retry')}</Button>}

                {capability ? (
                    <AppDialog
                        visible={disclosureOpen}
                        title={t('disclosure.title')}
                        description={t(isNewExecution ? 'disclosure.newExecution' : 'disclosure.description', { page: 1 })}
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
                            <AppText>{t('disclosure.retention')}</AppText>
                            <AppText>{t('disclosure.training', { policy: capability.disclosure.providerTrainingPolicy })}</AppText>
                            <AppText>{t('disclosure.cancellation')}</AppText>
                            <View style={{ gap: spacing.xs }}>
                                <Button onPress={() => void legalLink.open(capability.disclosure.privacyPolicyUrl)} variant="ghost">
                                    {t('disclosure.privacy')}
                                </Button>
                                <Button onPress={() => void legalLink.open(capability.disclosure.termsUrl)} variant="ghost">
                                    {t('disclosure.terms')}
                                </Button>
                                {legalLink.failedUrl ? (
                                    <StatusMessage
                                        tone="danger"
                                        title={t('disclosure.linkError')}
                                        actionLabel={t('disclosure.linkRetry')}
                                        onAction={legalLink.retry}
                                    />
                                ) : null}
                            </View>
                        </View>
                    </AppDialog>
                ) : null}
            </Card>
        </View>
    );
}
