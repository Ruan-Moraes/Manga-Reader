import { useEffect, useRef, useState } from 'react';
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
    const [failedRetry, setFailedRetry] = useState(false);
    const wasRunning = useRef(false);
    const page = batch.project?.pages.find(candidate => candidate.id === pageId);
    const saved = batch.progress?.statuses[pageId] === 'saved';

    useEffect(() => {
        if (batch.running) wasRunning.current = true;
        else if (wasRunning.current) {
            wasRunning.current = false;
            if (saved) onTranslated?.();
            else setFailedRetry(true);
        }
    }, [batch.running, onTranslated, saved]);

    if (batch.loading || !page || page.status === 'READY') return null;
    const canRetry = batch.eligible.includes(pageId) && batch.capabilities?.enabled === true;
    // Uncertain page: never resent here, but the user can ask the gateway again about it (2026-11-10).
    const uncertain = batch.uncertain.has(pageId) || (!batch.eligible.includes(pageId) && page.status === 'FAILED');
    const canRecheck = !canRetry && uncertain && !batch.checking;
    const label = batch.running
        ? t('pageRetry.running')
        : !batch.eligible.includes(pageId) && page.status === 'FAILED'
          ? t('pageRetry.unknown')
          : failedRetry || page.status === 'FAILED'
            ? t('pageRetry.failed')
            : t('pageRetry.notTranslated');
    const headline = batch.running
        ? t('pageRetry.notice.running')
        : !batch.eligible.includes(pageId) && page.status === 'FAILED'
          ? t('pageRetry.notice.unknown')
          : failedRetry || page.status === 'FAILED'
            ? t('pageRetry.notice.failed')
            : t('pageRetry.notice.notTranslated');
    const hint = batch.running
        ? null
        : failedRetry
          ? t('pageRetry.notice.stillFailed')
          : canRetry
            ? t('pageRetry.notice.retry')
            : canRecheck
              ? t('pageRetry.notice.recheck')
              : null;
    const actionable = (canRetry || canRecheck) && !batch.running;

    return (
        <View testID="page-retry-indicator">
            <PressableBox
                testID="page-retry-notice"
                accessibilityRole="button"
                accessibilityLabel={[
                    failedRetry && !batch.running ? t('pageRetry.stillFailed') : label,
                    canRetry ? t('pageRetry.action') : canRecheck ? t('pageRetry.notice.recheck') : null,
                ]
                    .filter(Boolean)
                    .join('. ')}
                accessibilityState={{ disabled: !actionable, busy: batch.running || batch.checking }}
                accessibilityLiveRegion="polite"
                disabled={!actionable}
                onPress={() => (canRetry ? setOpen(true) : void batch.recheck())}
                style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? tokens.surfacePressed : tokens.surfaceElevated,
                    borderBottomLeftRadius: radii.card,
                    borderColor: tokens.borderStrong,
                    borderLeftColor: tokens.danger,
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
                        backgroundColor: tokens.dangerSoft,
                        borderRadius: radii.pill,
                        height: 32,
                        justifyContent: 'center',
                        width: 32,
                    }}
                >
                    {batch.running ? (
                        <ActivityIndicator size="small" color={tokens.danger} />
                    ) : (
                        <Icon name={canRetry ? 'refresh' : 'alert-circle-outline'} size={metrics.icon.md} color={tokens.danger} />
                    )}
                </View>
                <View style={{ flexShrink: 1, gap: 2 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {headline}
                    </AppText>
                    {hint ? (
                        <AppText variant="caption" numberOfLines={2} style={{ color: failedRetry ? tokens.danger : tokens.accentText }}>
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
                        setFailedRetry(false);
                        void batch.start(pageId);
                    }}
                />
            ) : null}
        </View>
    );
}
