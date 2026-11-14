import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createShadowStyle, useTheme } from '@/shared/theme';
import { AppText, Icon, PressableBox } from '@/shared/ui';

import { useChapterBatch } from '../model/useChapterBatch';
import { BatchDisclosureDialog } from './BatchDisclosureDialog';

type Props = { pageId: string; onTranslated?(): void } & Parameters<typeof useChapterBatch>[0];

/**
 * Notice docked to the right edge for a page without a translation (063/AC-005); retries only this page after
 * explicit consent. The host positions it below the reader top bar.
 */
export function PageRetryIndicator({ pageId, onTranslated, ...options }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const batch = useChapterBatch(options);
    const [open, setOpen] = useState(false);
    const status = batch.statusOf(pageId);
    const translated = status === 'saved' || status === 'ready';

    useEffect(() => {
        if (status === 'saved') onTranslated?.();
    }, [onTranslated, status]);

    if (batch.loading || !batch.project?.pages.some(page => page.id === pageId) || translated) return null;
    const processing = status === 'processing';
    const failed = status === 'failed';
    const uncertain = status === 'unknown';
    const canSend = !uncertain && batch.isEligible(pageId) && batch.capabilities?.enabled === true && !batch.otherBatchRunning && !batch.pausedRun;
    const canRecheck = uncertain && !batch.checking;
    const label = t(`pageRetry.notice.${processing ? 'running' : uncertain ? 'unknown' : failed ? 'failed' : 'notTranslated'}`);
    const hint = canRecheck ? t('pageRetry.notice.recheck') : canSend && !processing ? t(failed ? 'pageRetry.notice.retry' : 'pageRetry.translate') : null;
    const actionable = (canSend || canRecheck) && !batch.running;

    return (
        <View testID="page-retry-indicator">
            <PressableBox
                testID="page-retry-notice"
                accessibilityRole="button"
                accessibilityLabel={hint ? `${label}. ${hint}` : label}
                accessibilityState={{ disabled: !actionable, busy: processing || (uncertain && batch.checking) }}
                accessibilityLiveRegion="polite"
                disabled={!actionable}
                onPress={() => (canRecheck ? void batch.recheck() : setOpen(true))}
                style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? tokens.surfacePressed : tokens.surfaceElevated,
                    borderBottomLeftRadius: radii.card,
                    borderColor: tokens.borderStrong,
                    borderLeftColor: failed ? tokens.danger : tokens.borderStrong,
                    borderLeftWidth: 3,
                    borderRightWidth: 0,
                    borderTopLeftRadius: radii.card,
                    borderWidth: 1,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    maxWidth: 240,
                    minHeight: minimumTouchTarget,
                    paddingLeft: spacing.sm,
                    paddingRight: spacing.md,
                    paddingVertical: spacing.sm,
                    ...createShadowStyle('card', tokens.overlay),
                })}
            >
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: failed ? tokens.dangerSoft : tokens.surfaceMuted,
                        borderRadius: radii.pill,
                        height: 32,
                        justifyContent: 'center',
                        width: 32,
                    }}
                >
                    {processing ? (
                        <ActivityIndicator size="small" color={tokens.accentText} />
                    ) : (
                        <Icon name={failed ? 'alert-circle-outline' : uncertain ? 'time-outline' : 'document-outline'} size={metrics.icon.md} color={failed ? tokens.danger : tokens.muted} />
                    )}
                </View>
                <View style={{ flexShrink: 1, gap: 2 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {label}
                    </AppText>
                    {hint ? (
                        <AppText variant="caption" numberOfLines={2} style={{ color: tokens.accentText }}>
                            {hint}
                        </AppText>
                    ) : null}
                </View>
            </PressableBox>
            {batch.capabilities ? (
                <BatchDisclosureDialog
                    visible={open}
                    capabilities={batch.capabilities}
                    count={1}
                    onCancel={() => setOpen(false)}
                    onConfirm={() => {
                        setOpen(false);
                        void batch.start(pageId);
                    }}
                />
            ) : null}
        </View>
    );
}
