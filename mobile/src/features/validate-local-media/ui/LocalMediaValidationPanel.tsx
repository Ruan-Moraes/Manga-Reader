import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft, type LocalMediaImportItem } from '@/src/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/src/shared/media-inspection';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button } from '@/src/shared/ui';

import { useValidateLocalMedia } from '../model/useValidateLocalMedia';
import type { ValidateLocalMediaController } from '../model/validateLocalMedia';

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft) => void;
    controller?: ValidateLocalMediaController;
}

export function LocalMediaValidationItemStatus({ item }: { item: LocalMediaImportItem }) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const color = item.mediaValidationStatus === 'VALID' ? tokens.success : item.mediaValidationStatus === 'INVALID' ? tokens.danger : tokens.muted;

    return (
        <View accessibilityRole="summary" style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <Ionicons
                accessibilityElementsHidden
                color={color}
                name={
                    item.mediaValidationStatus === 'VALID' ? 'checkmark-circle' : item.mediaValidationStatus === 'INVALID' ? 'alert-circle' : 'ellipse-outline'
                }
                size={18}
            />
            <AppText variant="caption" style={{ color }}>
                {t(`offline.validation.status.${item.mediaValidationStatus}`)}
            </AppText>
            {item.mediaValidationError && (
                <AppText variant="caption" tone="danger">
                    {t(`offline.validation.itemErrors.${item.mediaValidationError}`)}
                </AppText>
            )}
        </View>
    );
}

export function LocalMediaValidationPanel({ draft, onDraftChange, controller }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const actions = useValidateLocalMedia(draft, onDraftChange, controller);
    const valid = draft.items.filter(item => item.mediaValidationStatus === 'VALID').length;
    const invalid = draft.items.filter(item => item.mediaValidationStatus === 'INVALID').length;
    const ready = isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION);

    return (
        <View testID="local-media-validation" style={{ borderTopColor: tokens.separator, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="section">{t('offline.validation.title')}</AppText>
                <AppText variant="caption" tone="muted">
                    {t('offline.validation.description')}
                </AppText>
            </View>

            <View accessibilityRole="summary" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                <AppText variant="label" tone={ready ? 'success' : 'default'}>
                    {t('offline.validation.validCount', { valid, total: draft.items.length })}
                </AppText>
                {invalid > 0 && (
                    <AppText variant="label" tone="danger">
                        {t('offline.validation.invalidCount', { count: invalid })}
                    </AppText>
                )}
            </View>

            {actions.busy && actions.progress && (
                <AppText accessibilityLiveRegion="polite" variant="caption" tone="muted">
                    {t('offline.validation.progress', { completed: actions.progress.completed, total: actions.progress.total })}
                </AppText>
            )}
            {actions.error && (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText tone="danger">{t(`offline.validation.errors.${actions.error}`)}</AppText>
                    <Button variant="outline" disabled={actions.busy} onPress={() => void actions.retry()}>
                        {t('offline.validation.retry')}
                    </Button>
                </View>
            )}
            {ready && (
                <AppText variant="label" tone="success">
                    {t('offline.validation.ready')}
                </AppText>
            )}
            <Button disabled={actions.busy || ready} loading={actions.busy} onPress={() => void actions.validate()}>
                {ready ? t('offline.validation.validatedAction') : invalid > 0 ? t('offline.validation.retryInvalid') : t('offline.validation.action')}
            </Button>
        </View>
    );
}
