import { type ReactNode, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { openLocalTranslationResultController } from '@/features/local-translation';
import { useDeveloperMode } from '@/shared/config';
import { useScreenRefocus } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import {
    AppText,
    Button,
    CenterDialog,
    ConfirmDialog,
    DialogAction,
    Icon,
    LoadingBlock,
    ProgressFill,
    StatusChip,
    type StatusChipStatus,
    StatusMessage,
    TextAction,
} from '@/shared/ui';

import { useChapterBatch } from '../model/useChapterBatch';
import { BatchDisclosureDialog } from './BatchDisclosureDialog';
import { BatchStatusStrip, type BatchStripState } from './BatchStatusStrip';

type Props = {
    onActivityChange?(active: boolean): void;
    renderLayout?(content: ReactNode, footer: ReactNode): ReactNode;
    headerContent?: ReactNode;
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
    cancelled: 'waiting',
};

export function ChapterBatchPanel({ onActivityChange, onOpenReader, renderLayout, headerContent, requestStart = false, ...options }: Props) {
    const { t } = useTranslation('remoteProcessing');

    const { metrics, radii, spacing, tokens } = useTheme();

    const batch = useChapterBatch(options);

    const [disclosureOpen, setDisclosureOpen] = useState(false);
    const [retryPage, setRetryPage] = useState<string | null>(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);

    const developer = useDeveloperMode();

    const hydrateDeveloper = developer.hydrate;

    const wasRunning = useRef(false);

    useEffect(() => {
        void hydrateDeveloper();
    }, [hydrateDeveloper]);

    useEffect(() => {
        if (wasRunning.current && !batch.running && Object.values(batch.progress?.statuses ?? {}).some(status => status === 'failed' || status === 'unknown')) {
            setCopyStatus(null);
            setErrorOpen(true);
        }

        wasRunning.current = batch.running;
    }, [batch.running, batch.progress]);

    const active = batch.running;

    // Back from the reader (or a retry elsewhere): show the current statuses, not the ones from before (2026-11-10).
    // MOB-FEAT-067/AC-003: coming back also asks the gateway again, once, when the service was unavailable.
    useScreenRefocus(() => {
        void batch.reload();
        if (batch.canRetryCapabilities) void batch.retryCapabilities();
    });

    const requested = useRef(false);

    useEffect(() => {
        onActivityChange?.(active);

        return () => onActivityChange?.(false);
    }, [active, onActivityChange]);

    const startable =
        batch.capabilities?.enabled === true &&
        batch.eligible.some(id => batch.selected.has(id)) &&
        !batch.running &&
        !batch.otherBatchRunning &&
        !batch.pausedRun;

    useEffect(() => {
        if (!requestStart || requested.current || batch.loading || !startable) return;

        requested.current = true;

        setDisclosureOpen(true);
    }, [batch.loading, requestStart, startable]);

    if (batch.loading) {
        // Project and gateway capabilities can take a while (up to 15 s per attempt): show progress, not an empty step.
        const loadingContent = (
            <>
                {headerContent}
                <LoadingBlock inline label={t('batch.loading')} testID="batch-loading" />
            </>
        );

        return renderLayout ? renderLayout(loadingContent, null) : loadingContent;
    }

    if (!batch.project) return renderLayout ? renderLayout(headerContent ?? null, null) : null;

    const { project, capabilities } = batch;

    const pages = [...project.pages].sort((a, b) => a.position - b.position);

    const originalUri = (position: number) => {
        try {
            return openLocalTranslationResultController.originalUri(project, position);
        } catch {
            return null;
        }
    };


    const selectedCount = batch.eligible.filter(id => batch.selected.has(id)).length;

    const errorItems = pages.flatMap(page => {
        const status = batch.progress?.statuses[page.id];

        if (status !== 'failed' && status !== 'unknown') return [];

        const diagnostic = batch.progress?.diagnostics?.[page.id];

        return [{ page, status, diagnostic: developer.enabled && diagnostic ? diagnostic : null }];
    });

    const errorDetails = errorItems
        .map(item =>
            t('batch.errorPage', {
                page: item.page.position + 1,
                status: t(`batch.status.${item.status}`),
                detail: item.diagnostic ? ` — ${item.diagnostic}` : '',
            }),
        )
        .join('\n');

    const errorMessage = `${t('batch.errorDescription')}\n${errorDetails}`;

    const readyCount = pages.filter(page => page.status === 'READY').length;

    // Single source for every count on screen: the rows, the summary, the percentage and the strip.
    const statuses = pages.map(page => ({ page, status: batch.statusOf(page.id) }));

    const savedCount = statuses.filter(({ status }) => status === 'ready' || status === 'saved').length;

    const failedCount = statuses.filter(({ status }) => status === 'failed').length;

    const processingPage = statuses.find(({ status }) => status === 'processing')?.page;

    const strip: BatchStripState | null = batch.running
        ? batch.stopping
            ? { kind: 'stopping', page: processingPage ? processingPage.position + 1 : null }
            : {
                  kind: 'running',
                  page: processingPage ? processingPage.position + 1 : null,
                  queued: statuses.filter(({ status }) => status === 'pending').length,
              }
        : failedCount > 0
          ? { kind: 'failed', count: failedCount }
          : pages.length > 0 && savedCount === pages.length
            ? { kind: 'completed', total: pages.length }
            : null;

    // Nothing left to translate: the start button would only ever read "Traduzir 0 páginas".
    const allTranslated = pages.length > 0 && savedCount === pages.length;

    const translatedPercent =pages.length ? Math.floor((savedCount * 100) / pages.length) : 0;

    const canStart = capabilities?.enabled === true && selectedCount > 0 && !batch.running && !batch.otherBatchRunning && !batch.pausedRun;

    const allOn = selectedCount === batch.eligible.length;

    const selectable = batch.eligible.length > 1 && !batch.running;

    const caption = (status: string, checked: boolean): { text: string; color: string } => {
        if (status === 'failed') return { text: t('batch.row.failed'), color: tokens.danger };

        if (status === 'unknown') return { text: t('batch.row.unknown'), color: tokens.warn };

        if (status === 'saved' || status === 'ready') return { text: t('batch.row.saved'), color: tokens.success };

        if (status === 'pending' || status === 'cancelled') return { text: t(`batch.status.${status}`), color: tokens.subtle };

        if (status === 'processing') return { text: t('batch.row.processing'), color: tokens.accentText };

        return { text: checked ? t('batch.row.selected') : t('batch.row.skipped'), color: tokens.subtle };
    };

    const footer = (
        <View style={{ gap: spacing.xs }}>
            {batch.running ? (
                <View testID="batch-active-actions" style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.sm, rowGap: spacing.xs }}>
                    <View style={{ flex: 1, minWidth: 145 }}>
                        <Button variant="outline" tone="danger" onPress={() => setCancelOpen(true)}>
                            {t('batch.cancelNow')}
                        </Button>
                    </View>
                    {readyCount > 0 && onOpenReader ? (
                        <View style={{ flex: 1, minWidth: 145 }}>
                            <Button variant="outline" onPress={() => onOpenReader(project.id)}>
                                {t('actions.openReader')}
                            </Button>
                        </View>
                    ) : null}
                </View>
            ) : (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    {allTranslated ? null : (
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Button
                                disabled={!canStart}
                                onPress={() => {
                                    setRetryPage(null);
                                    setDisclosureOpen(true);
                                }}
                            >
                                {t('batch.start', { count: selectedCount })}
                            </Button>
                        </View>
                    )}
                    {readyCount > 0 && onOpenReader ? (
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Button variant={allTranslated ? undefined : 'outline'} onPress={() => onOpenReader(project.id)}>
                                {t('actions.openReader')}
                            </Button>
                        </View>
                    ) : null}
                </View>
            )}
        </View>
    );

    const header = (
        <>
            <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
                {headerContent}
                {batch.otherBatchRunning ? <StatusMessage tone="warning" title={t('batch.otherBatchRunning')} /> : null}
                {batch.backgroundUnavailable ? (
                    <StatusMessage tone="warning" title={t('batch.backgroundUnavailable')} description={t('batch.backgroundUnavailableDescription')} />
                ) : null}
                {batch.pausedRun ? (
                    <View style={{ gap: spacing.sm }}>
                        <StatusMessage
                            tone="warning"
                            title={t('batch.interruptedTitle')}
                            description={batch.pausedRun.projectId === project.id ? t('batch.interruptedDescription') : t('batch.otherInterruptedDescription')}
                            actionLabel={
                                batch.pausedRun.projectId === project.id && batch.pausedRun.items.some(item => item.state === 'pending')
                                    ? t('batch.resumePending')
                                    : undefined
                            }
                            onAction={() => void batch.resumeBackground()}
                        />
                        <TextAction label={t('batch.endInterrupted')} onPress={() => setDiscardOpen(true)} />
                    </View>
                ) : null}
                {batch.verifying ? (
                    <StatusMessage tone="loading" title={t('batch.loading')} />
                ) : (
                    <>
                        {!capabilities?.enabled && !batch.stoppedBy ? (
                            <StatusMessage
                                tone="warning"
                                title={t('errors.capabilities-unavailable')}
                                actionLabel={batch.canRetryCapabilities ? t('batch.retryCapabilities') : undefined}
                                onAction={() => void batch.retryCapabilities()}
                            />
                        ) : null}
                        {batch.stoppedBy ? (
                            <StatusMessage
                                tone="warning"
                                title={t(`errors.${batch.stoppedBy}`)}
                                actionLabel={batch.canRetryCapabilities ? t('batch.retryCapabilities') : undefined}
                                onAction={() => void batch.retryCapabilities()}
                            />
                        ) : null}
                    </>
                )}
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
                    <View style={{ gap: spacing.sm, padding: spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.xs }}>
                            <AppText accessibilityRole="header" variant="label">
                                {t('batch.translationProgress')}
                            </AppText>
                            <AppText variant="section" tone="accent" accessibilityLiveRegion="polite">
                                {t('batch.translationPercent', { value: translatedPercent })}
                            </AppText>
                        </View>
                        <View
                            testID="chapter-batch-progress"
                            accessible
                            accessibilityRole="progressbar"
                            accessibilityLabel={t('batch.translationProgress')}
                            accessibilityValue={{ min: 0, max: 100, now: translatedPercent }}
                            style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.pill, height: 6, overflow: 'hidden' }}
                        >
                            <ProgressFill value={translatedPercent / 100} color={tokens.accent} testID="chapter-batch-progress-fill" />
                        </View>
                        {/* 2026-11-14: resumo em uma linha sob a barra, sem caixa aninhada dentro do cartão. */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                            <AppText variant="caption">{t('batch.pageCount', { count: pages.length })}</AppText>
                            <AppText variant="caption" tone="subtle" accessibilityElementsHidden importantForAccessibility="no">
                                ·
                            </AppText>
                            {failedCount > 0 && strip?.kind !== 'failed' ? (
                                <AppText variant="caption" tone="danger">
                                    {t('batch.summary', { saved: savedCount, total: pages.length, failed: failedCount })}
                                </AppText>
                            ) : (
                                <AppText variant="caption" tone="muted">
                                    {t('batch.summarySaved', { saved: savedCount, total: pages.length })}
                                </AppText>
                            )}
                        </View>
                        {strip ? <BatchStatusStrip state={strip} onStop={batch.stopAfterCurrent} /> : null}
                    </View>
                </View>
            </View>
            {selectable ? (
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderTopLeftRadius: radii.card,
                        borderTopRightRadius: radii.card,
                        borderWidth: 1,
                        borderBottomWidth: 0,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: spacing.sm,
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.md,
                    }}
                >
                    <AppText variant="caption" tone="muted">
                        {t('batch.selectedCount', { count: selectedCount })}
                    </AppText>
                    <TextAction label={allOn ? t('batch.selectNone') : t('batch.selectAll')} onPress={() => batch.selectAll(!allOn)} />
                </View>
            ) : null}
        </>
    );

    const content = (
        <View testID="chapter-batch-panel" style={{ flex: 1, minHeight: 0 }}>
            <FlatList
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={pages}
                keyExtractor={page => page.id}
                ListHeaderComponent={header}
                // Respiro depois da última página antes do rodapé fixo (2026-11-14).
                contentContainerStyle={{ paddingBottom: spacing.lg }}
                keyboardShouldPersistTaps="handled"
                windowSize={5}
                renderItem={({ item: page, index }) => {
                    const eligible = batch.isEligible(page.id);

                    const status = batch.statusOf(page.id);

                    const checked = eligible && batch.selected.has(page.id);

                    const locked = !eligible || batch.running;

                    const label = t('batch.page', { page: page.position + 1 });

                    const statusLabel = t(`batch.status.${status}`);

                    const sub = caption(status, checked);

                    const uri = originalUri(page.position);

                    const retryable =
                        status === 'failed' && eligible && capabilities?.enabled && !batch.running && !batch.otherBatchRunning && !batch.pausedRun;

                    return (
                        <View
                            style={{
                                backgroundColor: tokens.surface,
                                borderColor: tokens.separator,
                                borderLeftWidth: 1,
                                borderRightWidth: 1,
                                borderTopWidth: 1,
                                borderBottomWidth: index === pages.length - 1 ? 1 : 0,
                                ...(index === 0 && !selectable ? { borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card } : {}),
                                ...(index === pages.length - 1 ? { borderBottomLeftRadius: radii.card, borderBottomRightRadius: radii.card } : {}),
                            }}
                        >
                            <Pressable
                                disabled={locked}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked, disabled: locked }}
                                accessibilityLabel={`${label}. ${statusLabel}`}
                                onPress={() => batch.toggle(page.id)}
                                style={{
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    gap: spacing.md,
                                    minHeight: 64,
                                    opacity: !checked && status === 'idle' ? 0.7 : 1,
                                    paddingHorizontal: spacing.md,
                                    paddingVertical: spacing.md,
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
                                        height: 44,
                                        justifyContent: 'center',
                                        width: 34,
                                    }}
                                >
                                    <Icon name="image-outline" size={metrics.icon.sm} color={tokens.subtle} />
                                    {uri ? (
                                        <Image
                                            source={{ uri }}
                                            recyclingKey={page.id}
                                            cachePolicy="memory"
                                            contentFit="cover"
                                            style={{ position: 'absolute', width: 32, height: 42, borderRadius: radii.sm }}
                                        />
                                    ) : null}
                                </View>
                                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                    <AppText variant="label">{label}</AppText>
                                    <AppText variant="caption" style={{ color: sub.color }}>
                                        {sub.text}
                                    </AppText>
                                    {status !== 'idle' && status !== 'pending' && status !== 'cancelled' ? (
                                        <StatusChip testID={`batch-status-${page.id}`} status={CHIP[status] ?? 'waiting'} label={statusLabel} />
                                    ) : null}
                                </View>
                                {!locked ? (
                                    <Icon
                                        name={checked ? 'checkbox' : 'square-outline'}
                                        size={metrics.icon.lg}
                                        color={checked ? tokens.accentText : tokens.muted}
                                    />
                                ) : null}
                            </Pressable>
                            {retryable ? (
                                <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.md }}>
                                    <TextAction
                                        label={t('pageRetry.notice.retry')}
                                        onPress={() => {
                                            setRetryPage(page.id);
                                            setDisclosureOpen(true);
                                        }}
                                    />
                                </View>
                            ) : null}
                        </View>
                    );
                }}
            />
            <CenterDialog
                visible={errorOpen}
                onClose={() => setErrorOpen(false)}
                closeLabel={t('batch.errorClose')}
                title={t('batch.errorTitle')}
                description={t('batch.errorDescription')}
                icon="warning-outline"
                tone="warning"
                actions={
                    <>
                        <DialogAction>
                            <Button variant="outline" onPress={() => setErrorOpen(false)}>
                                {t('batch.errorClose')}
                            </Button>
                        </DialogAction>
                        <DialogAction>
                            <Button
                                onPress={() =>
                                    void Clipboard.setStringAsync(errorMessage)
                                        .then(ok => setCopyStatus(ok ? 'copied' : 'failed'))
                                        .catch(() => setCopyStatus('failed'))
                                }
                            >
                                {t('batch.errorCopy')}
                            </Button>
                        </DialogAction>
                    </>
                }
            >
                {errorItems.length > 0 ? (
                    <View
                        testID="batch-error-pages"
                        style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.separator, borderRadius: radii.card, borderWidth: 1 }}
                    >
                        {errorItems.map((item, index) => (
                            <View
                                key={item.page.id}
                                style={{
                                    alignItems: 'center',
                                    borderTopColor: tokens.separator,
                                    borderTopWidth: index === 0 ? 0 : 1,
                                    flexDirection: 'row',
                                    gap: spacing.sm,
                                    paddingHorizontal: spacing.md,
                                    paddingVertical: spacing.sm,
                                }}
                            >
                                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                    <AppText variant="label">{t('batch.page', { page: item.page.position + 1 })}</AppText>
                                    {item.diagnostic ? (
                                        <AppText variant="caption" tone="muted">
                                            {item.diagnostic}
                                        </AppText>
                                    ) : null}
                                </View>
                                <StatusChip
                                    testID={`batch-error-status-${item.page.id}`}
                                    status={CHIP[item.status] ?? 'failed'}
                                    label={t(`batch.status.${item.status}`)}
                                />
                            </View>
                        ))}
                    </View>
                ) : null}
                {copyStatus ? (
                    <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}>
                        <Icon
                            name={copyStatus === 'copied' ? 'checkmark-circle' : 'alert-circle'}
                            size={metrics.icon.sm}
                            color={copyStatus === 'copied' ? tokens.success : tokens.danger}
                            decorative
                        />
                        <AppText variant="caption" tone={copyStatus === 'copied' ? 'success' : 'danger'}>
                            {t(`batch.copy${copyStatus === 'copied' ? 'Success' : 'Failed'}`)}
                        </AppText>
                    </View>
                ) : null}
            </CenterDialog>
            <ConfirmDialog
                visible={discardOpen}
                onClose={() => setDiscardOpen(false)}
                onConfirm={() => {
                    setDiscardOpen(false);
                    void batch.discardBackground();
                }}
                closeLabel={t('batch.keepSending')}
                cancelLabel={t('batch.keepSending')}
                confirmLabel={t('batch.endInterrupted')}
                title={t('batch.endInterruptedTitle')}
                description={t('batch.endInterruptedDescription')}
                icon="warning-outline"
            />
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
                    count={retryPage ? 1 : selectedCount}
                    onCancel={() => setDisclosureOpen(false)}
                    onConfirm={() => {
                        setDisclosureOpen(false);
                        void batch.start(retryPage ?? undefined);
                    }}
                />
            ) : null}
        </View>
    );

    return renderLayout ? (
        renderLayout(content, footer)
    ) : (
        <View style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
            {content}
            {footer}
        </View>
    );
}
