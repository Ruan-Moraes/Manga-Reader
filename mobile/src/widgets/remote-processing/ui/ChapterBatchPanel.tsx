import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useScreenRefocus } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ConfirmDialog, Icon, PrimaryAction, StatusChip, type StatusChipStatus, StatusMessage, TextAction } from '@/shared/ui';

import { useChapterBatch } from '../model/useChapterBatch';
import { BatchDisclosureDialog } from './BatchDisclosureDialog';

type Props = {
    onActivityChange?(active: boolean): void;
    onOpenReader?(projectId: string): void;
    /** Opens the consent sheet once the batch is ready, when "Preparar e traduzir" was the user's action (056). */
    requestStart?: boolean;
} & Parameters<typeof useChapterBatch>[0];

const CHIP: Record<string, StatusChipStatus> = {
    idle: 'waiting',
    pending: 'waiting',
    processing: 'processing',
    saved: 'saved',
    ready: 'saved',
    failed: 'failed',
    unknown: 'uncertain',
};

export function ChapterBatchPanel({ onActivityChange, onOpenReader, requestStart = false, ...options }: Props) {
    const { t } = useTranslation('remoteProcessing');
    const { metrics, radii, spacing, tokens } = useTheme();
    const batch = useChapterBatch(options);
    const [disclosureOpen, setDisclosureOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const active = batch.running;
    // Back from the reader (or a retry elsewhere): show the current statuses, not the ones from before (2026-11-10).
    useScreenRefocus(() => void batch.reload());
    const requested = useRef(false);
    useEffect(() => {
        onActivityChange?.(active);
        return () => onActivityChange?.(false);
    }, [active, onActivityChange]);
    const startable = batch.capabilities?.enabled === true && batch.eligible.some(id => batch.selected.has(id)) && !batch.running;
    useEffect(() => {
        if (!requestStart || requested.current || batch.loading || !startable) return;
        requested.current = true;
        setDisclosureOpen(true);
    }, [batch.loading, requestStart, startable]);

    if (batch.loading || !batch.project) return null;
    const { project, capabilities } = batch;
    const pages = [...project.pages].sort((a, b) => a.position - b.position);
    const selectedCount = batch.eligible.filter(id => batch.selected.has(id)).length;
    const readyCount = pages.filter(page => page.status === 'READY').length;
    const canStart = capabilities?.enabled === true && selectedCount > 0 && !batch.running;

    const allOn = selectedCount === batch.eligible.length;
    const selectable = batch.eligible.length > 1 && !batch.running;
    const caption = (status: string, checked: boolean): { text: string; color: string } => {
        if (status === 'failed') return { text: t('batch.row.failed'), color: tokens.danger };
        if (status === 'unknown') return { text: t('batch.row.unknown'), color: tokens.warn };
        if (status === 'saved' || status === 'ready') return { text: t('batch.row.saved'), color: tokens.success };
        if (status === 'processing' || status === 'pending') return { text: t('batch.row.processing'), color: tokens.accentText };
        return { text: checked ? t('batch.row.selected') : t('batch.row.skipped'), color: tokens.subtle };
    };

    return (
        <View testID="chapter-batch-panel" style={{ gap: spacing.md }}>
            {!capabilities?.enabled ? <StatusMessage tone="warning" title={t('errors.capabilities-unavailable')} /> : null}
            {batch.stoppedBy ? <StatusMessage tone="warning" title={t(`errors.${batch.stoppedBy}`)} /> : null}
            {!batch.running && batch.uncertain.size > 0 ? (
                <StatusMessage
                    tone="warning"
                    title={t('batch.uncertainTitle', { count: batch.uncertain.size })}
                    description={t('batch.uncertainDescription')}
                    actionLabel={batch.checking ? undefined : t('batch.recheck')}
                    onAction={() => void batch.recheck()}
                />
            ) : null}
            <View
                style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.separator,
                    borderRadius: radii.card,
                    borderWidth: 1,
                    overflow: 'hidden',
                }}
            >
                <View style={{ borderBottomColor: tokens.separator, borderBottomWidth: 1, gap: spacing.sm, padding: spacing.md }}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                            <AppText accessibilityRole="header" accessibilityLiveRegion="polite" variant="section">
                                {batch.progress
                                    ? t('batch.progress', { done: batch.progress.completed, total: batch.progress.total })
                                    : t('batch.pageCount', { count: pages.length })}
                            </AppText>
                            {selectable ? (
                                <AppText variant="caption" tone="muted">
                                    {t('batch.selectedCount', { count: selectedCount })}
                                </AppText>
                            ) : null}
                        </View>
                        {batch.running && !batch.stopping ? <TextAction label={t('batch.stop')} tone="muted" onPress={batch.stopAfterCurrent} /> : null}
                        {selectable ? (
                            <TextAction label={allOn ? t('batch.selectNone') : t('batch.selectAll')} onPress={() => batch.selectAll(!allOn)} />
                        ) : null}
                    </View>
                    {batch.stopping ? (
                        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
                            {t('batch.stopping')}
                        </AppText>
                    ) : null}
                    {batch.progress ? (
                        <View
                            testID="chapter-batch-progress"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.pill, height: 6, overflow: 'hidden' }}
                        >
                            <View
                                style={{
                                    backgroundColor: tokens.accent,
                                    height: '100%',
                                    width: `${(100 * batch.progress.completed) / Math.max(1, batch.progress.total)}%`,
                                }}
                            />
                        </View>
                    ) : null}
                </View>
                {pages.map((page, index) => {
                    const eligible = batch.eligible.includes(page.id);
                    const status = batch.statusOf(page.id);
                    const checked = eligible && batch.selected.has(page.id);
                    const locked = !eligible || batch.running;
                    const label = t('batch.page', { page: page.position + 1 });
                    const statusLabel = t(`batch.status.${status}`);
                    const sub = caption(status, checked);
                    return (
                        <Pressable
                            key={page.id}
                            disabled={locked}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked, disabled: locked }}
                            accessibilityLabel={`${label}. ${statusLabel}`}
                            onPress={() => batch.toggle(page.id)}
                            style={{
                                alignItems: 'center',
                                borderTopColor: tokens.separator,
                                borderTopWidth: index === 0 ? 0 : 1,
                                flexDirection: 'row',
                                gap: spacing.md,
                                minHeight: 80,
                                opacity: !checked && status === 'idle' ? 0.7 : 1,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.sm,
                            }}
                        >
                            <View
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: tokens.surfaceMuted,
                                    borderColor: tokens.separator,
                                    borderRadius: radii.sm,
                                    borderWidth: 1,
                                    height: 60,
                                    justifyContent: 'center',
                                    width: 40,
                                }}
                            >
                                <Icon name="image-outline" size={metrics.icon.sm} color={tokens.subtle} />
                            </View>
                            <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                                <AppText variant="label">{label}</AppText>
                                <AppText variant="caption" style={{ color: sub.color }}>
                                    {sub.text}
                                </AppText>
                            </View>
                            {status !== 'idle' ? (
                                <StatusChip testID={`batch-status-${page.id}`} status={CHIP[status] ?? 'waiting'} label={statusLabel} />
                            ) : null}
                            {!locked ? (
                                <Icon
                                    name={checked ? 'checkbox' : 'square-outline'}
                                    size={metrics.icon.lg}
                                    color={checked ? tokens.accentText : tokens.muted}
                                />
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
            {batch.running ? (
                <>
                    <PrimaryAction>
                        <Button loading accessibilityLabel={t('actions.processing')}>
                            {t('actions.processing')}
                        </Button>
                    </PrimaryAction>
                    <TextAction align="center" tone="danger" icon="close-circle-outline" label={t('batch.cancelNow')} onPress={() => setCancelOpen(true)} />
                </>
            ) : (
                <PrimaryAction>
                    <Button disabled={!canStart} onPress={() => setDisclosureOpen(true)}>
                        {t('batch.start', { count: selectedCount })}
                    </Button>
                </PrimaryAction>
            )}
            {readyCount > 0 && onOpenReader ? (
                <Button variant="outline" onPress={() => onOpenReader(project.id)}>
                    {t('actions.openReader')}
                </Button>
            ) : null}
            <ConfirmDialog
                visible={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={batch.interrupt}
                closeLabel={t('batch.keepSending')}
                cancelLabel={t('batch.keepSending')}
                confirmLabel={t('batch.cancelConfirm')}
                title={t('batch.cancelTitle')}
                description={t('batch.cancelDescription')}
                icon="close-circle-outline"
            />
            {capabilities ? (
                <BatchDisclosureDialog
                    visible={disclosureOpen}
                    capabilities={capabilities}
                    count={selectedCount}
                    onCancel={() => setDisclosureOpen(false)}
                    onConfirm={() => {
                        setDisclosureOpen(false);
                        void batch.start();
                    }}
                />
            ) : null}
        </View>
    );
}
