import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { useExternalLinkOpener } from '@/shared/config';
import { useTheme } from '@/shared/theme';
import { AppText, Button, CenterDialog, DialogAction, Icon, type IconName, TextAction } from '@/shared/ui';

interface Props {
    visible: boolean;
    capabilities: RemoteProcessingCapabilities;
    count: number;
    onCancel(): void;
    onConfirm(): void;
}

const SUMMARY: readonly { key: string; icon: IconName }[] = [
    { key: 'leaves', icon: 'cloud-upload-outline' },
    { key: 'retention', icon: 'server-outline' },
    { key: 'uncertain', icon: 'shield-checkmark-outline' },
];

/**
 * Layered consent (056/AC-011) in a centered dialog (2026-11-10): three short items first, the full text from 017 under
 * "Ver detalhes". Nothing is sent before accepting; accepting twice in the same frame is ignored.
 */
export function BatchDisclosureDialog({ visible, capabilities, count, onCancel, onConfirm }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { metrics, radii, spacing, tokens } = useTheme();
    const [details, setDetails] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const legalLink = useExternalLinkOpener();
    useEffect(() => {
        if (!visible) {
            setDetails(false);
            setAccepted(false);
        }
    }, [visible]);
    const accept = () => {
        if (accepted) return;
        setAccepted(true);
        onConfirm();
    };
    return (
        <CenterDialog
            visible={visible}
            onClose={onCancel}
            closeLabel={t('disclosure.decline')}
            title={t('batch.consentTitle')}
            description={t('batch.disclosureDescription', { count })}
            icon="cloud-upload-outline"
            contentBottomSpacing={spacing.xs}
            showHeaderDivider={false}
            testIDs={{ card: 'batch-consent-dialog' }}
            actions={
                <>
                    <DialogAction>
                        <Button variant="outline" onPress={onCancel}>
                            {t('disclosure.decline')}
                        </Button>
                    </DialogAction>
                    <DialogAction>
                        <Button onPress={accept} disabled={accepted}>
                            {t('disclosure.accept')}
                        </Button>
                    </DialogAction>
                </>
            }
        >
            <View style={{ gap: spacing.xs }}>
                <View
                    testID="batch-consent-summary"
                    style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.card, gap: spacing.md, padding: spacing.md }}
                >
                    {SUMMARY.map(item => (
                        <View key={item.key} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm + 4 }}>
                            <Icon name={item.icon} size={metrics.icon.md} color={tokens.accentText} style={{ marginTop: 2 }} />
                            <View style={{ flex: 1, gap: 2 }}>
                                <AppText variant="label">{t(`batch.consentItem.${item.key}`)}</AppText>
                                <AppText variant="caption" tone="muted">
                                    {t(`batch.consent.${item.key}`)}
                                </AppText>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ gap: spacing.sm }}>
                    <TextAction
                        label={details ? t('batch.consentHideDetails') : t('batch.consentDetails')}
                        icon={details ? 'chevron-up' : 'chevron-down'}
                        onPress={() => setDetails(value => !value)}
                    />
                    {details ? (
                        <View testID="batch-consent-details" style={{ gap: spacing.sm }}>
                            <AppText variant="caption" tone="muted">
                                {t('disclosure.network')}
                            </AppText>
                            <AppText variant="caption" tone="muted">
                                {t('disclosure.data')}
                            </AppText>
                            <AppText>
                                {t('disclosure.operator', { operator: capabilities.disclosure.operatorName, contact: capabilities.disclosure.operatorContact })}
                            </AppText>
                            <AppText>
                                {t('disclosure.regions', {
                                    gateway: capabilities.disclosure.gatewayRegion,
                                    ocr: capabilities.disclosure.ocrRegion,
                                    translation: capabilities.disclosure.translationLocation,
                                })}
                            </AppText>
                            {capabilities.disclosure.languageModelLocation ? (
                                <AppText variant="caption" tone="muted">
                                    {t('disclosure.languageModel', { location: capabilities.disclosure.languageModelLocation })}
                                </AppText>
                            ) : null}
                            <AppText variant="caption" tone="muted">
                                {t('disclosure.retention')}
                            </AppText>
                            <AppText variant="caption" tone="muted">
                                {t('disclosure.training', { policy: capabilities.disclosure.providerTrainingPolicy })}
                            </AppText>
                            <AppText variant="caption" tone="muted">
                                {t('batch.cost')}
                            </AppText>
                            <AppText variant="caption" tone="muted">
                                {t('disclosure.cancellation')}
                            </AppText>
                            {/* Política e termos como links dentro do texto, não como botões. */}
                            <AppText testID="batch-consent-links">
                                {t('batch.links.intro')}
                                <AppText
                                    accessibilityRole="link"
                                    onPress={() => void legalLink.open(capabilities.disclosure.privacyPolicyUrl)}
                                    style={{ color: tokens.accentText, textDecorationLine: 'underline' }}
                                >
                                    {t('batch.links.privacy')}
                                </AppText>
                                {t('batch.links.join')}
                                <AppText
                                    accessibilityRole="link"
                                    onPress={() => void legalLink.open(capabilities.disclosure.termsUrl)}
                                    style={{ color: tokens.accentText, textDecorationLine: 'underline' }}
                                >
                                    {t('batch.links.terms')}
                                </AppText>
                                {t('batch.links.end')}
                            </AppText>
                            {legalLink.failedUrl ? (
                                <View accessibilityLiveRegion="assertive" style={{ alignItems: 'flex-start' }}>
                                    <AppText accessibilityRole="alert" variant="caption" tone="danger">
                                        {t('disclosure.linkError')}
                                    </AppText>
                                    <TextAction label={t('disclosure.linkRetry')} onPress={legalLink.retry} />
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>
        </CenterDialog>
    );
}
