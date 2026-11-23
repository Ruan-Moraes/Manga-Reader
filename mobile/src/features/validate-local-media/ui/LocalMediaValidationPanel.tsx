import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft, type LocalMediaImportItem } from '@/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { useTheme } from '@/shared/theme';
import { AppText, BottomSheet, Button, Card, Icon, MediaPreviewSheet, PageNumberBadge, PrimaryAction, SegmentedControl } from '@/shared/ui';

import { useValidateLocalMedia } from '../model/useValidateLocalMedia';
import { type ValidateLocalMediaController, validateLocalMediaController } from '../model/validateLocalMedia';
import { validationIssueFor, type ValidationPresentationIssue } from '../model/validationPresentation';

type ValidationFilter = 'issues' | 'all';
const THUMBNAIL_ASPECT_RATIO = 3 / 4;

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft) => void;
    onContinue?: () => void;
    controller?: ValidateLocalMediaController;
    processingIssues?: ReadonlyMap<string, ValidationPresentationIssue>;
    /** Starts validation once when shown with nothing validated yet (056: validation is no longer a step). */
    autoStart?: boolean;
    /** Shows only the status and the primary action while no page has an issue; the gallery appears to fix pages (056). */
    issuesOnly?: boolean;
    /** Removes an invalid page from the selection (the host owns page editing); offered beside "replace". */
    onRemoveItem?: (item: LocalMediaImportItem) => Promise<void>;
}

interface ThumbnailProps {
    item: LocalMediaImportItem;
    total: number;
    uri: string;
    issue: ValidationPresentationIssue | null;
    replacing: boolean;
    disabled: boolean;
    onOpen: () => void;
    onReplace: () => void;
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
        </View>
    );
}

function ValidationThumbnailCard({ item, total, uri, issue, replacing, disabled, onOpen, onReplace }: ThumbnailProps) {
    const { t } = useTranslation('launcher');
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [imageFailed, setImageFailed] = useState(false);
    const page = item.position + 1;
    const status = issue ? 'INVALID' : item.mediaValidationStatus;
    const statusColor = status === 'VALID' ? tokens.success : status === 'INVALID' ? tokens.danger : tokens.muted;
    const statusIcon = status === 'VALID' ? 'checkmark-circle' : status === 'INVALID' ? 'alert-circle' : 'time-outline';
    const statusLabel = t(`offline.validation.badges.${status}`);
    const issueReason = issue ? t(`offline.validation.itemErrors.${issue.code}`) : null;
    const isReady = status === 'VALID';

    return (
        <View
            testID={`validation-thumbnail-${item.id}`}
            style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flex: 1,
                gap: spacing.xs,
                overflow: 'hidden',
                padding: spacing.xs,
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('offline.validation.thumbnailLabel', { page, total, status: statusLabel })}
                accessibilityHint={issue ? t('offline.validation.openIssueHint') : t('offline.validation.openPreviewHint')}
                onPress={onOpen}
                style={{ minHeight: minimumTouchTarget }}
            >
                {imageFailed ? (
                    <View
                        accessibilityElementsHidden
                        style={{
                            alignItems: 'center',
                            aspectRatio: THUMBNAIL_ASPECT_RATIO,
                            backgroundColor: tokens.surfaceMuted,
                            borderRadius: radii.sm,
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="image-outline" size={28} color={tokens.muted} />
                    </View>
                ) : (
                    <Image
                        source={{ uri }}
                        contentFit="cover"
                        // Local private pages: keep them out of the disk cache, like the other flow thumbnails.
                        cachePolicy="memory"
                        accessibilityElementsHidden
                        onError={() => setImageFailed(true)}
                        style={{ aspectRatio: THUMBNAIL_ASPECT_RATIO, borderRadius: radii.sm, width: '100%' }}
                    />
                )}
                <PageNumberBadge testID={`validation-page-badge-${item.id}`}>{t('offline.validation.pageNumber', { page })}</PageNumberBadge>
            </Pressable>
            {issue ? (
                <View style={{ gap: spacing.xs }}>
                    <View style={{ backgroundColor: tokens.dangerSoft, borderRadius: radii.control }}>
                        <Button
                            variant="ghost"
                            tone="danger"
                            size="compact"
                            leading={<Icon name="alert-circle-outline" size={18} color={tokens.danger} decorative />}
                            accessibilityLabel={issueReason ?? statusLabel}
                            accessibilityHint={t('offline.validation.openIssueHint')}
                            onPress={onOpen}
                        >
                            {t('offline.validation.viewIssue')}
                        </Button>
                    </View>
                    <View style={{ backgroundColor: tokens.accentSoft, borderRadius: radii.control }}>
                        {replacing ? (
                            <ActivityIndicator
                                accessibilityLabel={t('offline.validation.replacePageLabel', { page })}
                                color={tokens.accentText}
                                size="small"
                                style={{ minHeight: minimumTouchTarget }}
                            />
                        ) : (
                            <Button
                                variant="ghost"
                                size="compact"
                                leading={<Icon name="swap-horizontal-outline" size={18} color={tokens.accentText} decorative />}
                                accessibilityLabel={t('offline.validation.replacePageLabel', { page })}
                                disabled={disabled}
                                onPress={onReplace}
                            >
                                {t('offline.validation.replaceShort')}
                            </Button>
                        )}
                    </View>
                </View>
            ) : (
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: isReady ? tokens.successSoft : tokens.surfaceMuted,
                        borderRadius: radii.sm,
                        flexDirection: 'row',
                        gap: spacing.xs,
                        justifyContent: 'center',
                        minHeight: minimumTouchTarget,
                        paddingHorizontal: spacing.sm,
                    }}
                >
                    <Ionicons accessibilityElementsHidden name={statusIcon} size={16} color={statusColor} />
                    <AppText variant="label" style={{ color: statusColor, flexShrink: 1 }}>
                        {statusLabel}
                    </AppText>
                </View>
            )}
        </View>
    );
}

export function LocalMediaValidationPanel({
    draft,
    onDraftChange,
    onContinue,
    controller,
    processingIssues,
    autoStart = false,
    issuesOnly = false,
    onRemoveItem,
}: Props) {
    const { t } = useTranslation('launcher');
    const { metrics, radii, spacing, tokens } = useTheme();
    const actions = useValidateLocalMedia(draft, onDraftChange, controller);
    const listRef = useRef<FlatList<LocalMediaImportItem>>(null);
    const previousIssueCount = useRef(0);
    const [filter, setFilter] = useState<ValidationFilter>('all');
    const [issueSummaryOpen, setIssueSummaryOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<LocalMediaImportItem | null>(null);
    const [removing, setRemoving] = useState(false);

    const issueFor = (item: LocalMediaImportItem) => validationIssueFor(item, processingIssues?.get(item.id));
    const issueEntries = draft.items.flatMap(item => {
        const issue = issueFor(item);
        return issue ? [{ item, issue }] : [];
    });
    const issues = issueEntries.map(({ item }) => item);
    const valid = draft.items.filter(item => item.mediaValidationStatus === 'VALID' && !issueFor(item)).length;
    const pending = draft.items.length - valid - issues.length;
    const ready = isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION) && issues.length === 0;
    const visibleItems = filter === 'issues' ? issues : draft.items;
    const detailIssue = detailItem ? issueFor(detailItem) : null;
    const displayedProgress = actions.progress ?? { completed: 0, total: Math.max(1, pending + issues.length) };
    const activeController = controller ?? validateLocalMediaController;
    const itemUri = (item: LocalMediaImportItem) => activeController.itemUri(draft, item);

    useEffect(() => {
        if (actions.busy) return;
        if (issues.length > 0 && previousIssueCount.current === 0) {
            setFilter('issues');
            setIssueSummaryOpen(true);
        }
        if (issues.length === 0) {
            setFilter('all');
            setIssueSummaryOpen(false);
        }
        previousIssueCount.current = issues.length;
    }, [actions.busy, issues.length]);

    const autoStarted = useRef(false);
    useEffect(() => {
        if (!autoStart || autoStarted.current || actions.busy || ready || issues.length > 0) return;
        autoStarted.current = true;
        void actions.validate();
    }, [actions, autoStart, issues.length, ready]);

    const focusFirstIssue = () => {
        setIssueSummaryOpen(false);
        setFilter('issues');
        requestAnimationFrame(() => listRef.current?.scrollToOffset({ animated: true, offset: 0 }));
    };

    const replaceItem = async (item: LocalMediaImportItem) => {
        const replaced = await actions.replaceItem(item.id);
        if (replaced) {
            setDetailItem(null);
        }
    };

    const detailMessageKey = detailIssue ? `offline.validation.issueMessages.${detailIssue.code}` : null;

    const primaryAction = (
        <PrimaryAction>
            {actions.busy ? (
                <Button disabled leading={<ActivityIndicator color={tokens.muted} size="small" />}>
                    {t('offline.validation.progress', { completed: displayedProgress.completed, total: displayedProgress.total })}
                </Button>
            ) : issues.length ? (
                <Button onPress={() => setIssueSummaryOpen(true)}>{t('offline.validation.fixIssues', { count: issues.length })}</Button>
            ) : ready ? (
                <Button onPress={onContinue}>{t('offline.validation.continue')}</Button>
            ) : (
                <Button onPress={() => void actions.validate()}>{t('offline.validation.action')}</Button>
            )}
        </PrimaryAction>
    );

    if (issuesOnly && issues.length === 0) {
        return (
            <View testID="local-media-validation" style={{ gap: spacing.sm }}>
                {actions.error ? (
                    <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                        <AppText tone="danger">{t(`offline.validation.errors.${actions.error}`)}</AppText>
                        <Button variant="outline" disabled={actions.busy} onPress={() => void actions.retry()}>
                            {t('offline.validation.retry')}
                        </Button>
                    </View>
                ) : null}
                {primaryAction}
            </View>
        );
    }

    return (
        <View testID="local-media-validation" style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
            <Card style={{ gap: spacing.sm, padding: spacing.md }}>
                <View accessibilityRole="summary" style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <Ionicons
                        accessibilityElementsHidden
                        name={ready ? 'checkmark-circle' : issues.length ? 'alert-circle' : 'scan-circle-outline'}
                        size={20}
                        color={ready ? tokens.success : issues.length ? tokens.danger : tokens.accentText}
                    />
                    <View style={{ flex: 1, gap: spacing.xs }}>
                        <AppText variant="label">
                            {issues.length
                                ? t('offline.validation.summaryIssues', { valid, invalid: issues.length })
                                : t('offline.validation.summaryReady', { valid, total: draft.items.length })}
                        </AppText>
                        {pending > 0 ? (
                            <AppText variant="caption" tone="muted">
                                {t('offline.validation.pendingCount', { count: pending })}
                            </AppText>
                        ) : null}
                    </View>
                </View>
                {actions.busy ? (
                    <AppText accessibilityLiveRegion="polite" variant="caption" tone="muted">
                        {t('offline.validation.progress', { completed: displayedProgress.completed, total: displayedProgress.total })}
                    </AppText>
                ) : null}
            </Card>

            {issues.length ? (
                <SegmentedControl
                    label={t('offline.validation.filterLabel')}
                    value={filter}
                    options={['issues', 'all'] as const}
                    optionLabel={value =>
                        value === 'issues'
                            ? t('offline.validation.filterIssues', { count: issues.length })
                            : t('offline.validation.filterAll', { count: draft.items.length })
                    }
                    onChange={setFilter}
                />
            ) : null}

            {actions.error ? (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText tone="danger">{t(`offline.validation.errors.${actions.error}`)}</AppText>
                    <Button variant="outline" disabled={actions.busy} onPress={() => void actions.retry()}>
                        {t('offline.validation.retry')}
                    </Button>
                </View>
            ) : null}

            <FlatList
                showsHorizontalScrollIndicator={false}
                ref={listRef}
                testID="validation-thumbnail-grid"
                data={visibleItems}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.id}
                columnWrapperStyle={{ gap: spacing.sm }}
                contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                renderItem={({ item }) => (
                    <View style={{ flex: 0.5, maxWidth: '50%' }}>
                        <ValidationThumbnailCard
                            item={item}
                            total={draft.items.length}
                            uri={itemUri(item)}
                            issue={issueFor(item)}
                            replacing={actions.replacingItemId === item.id}
                            disabled={actions.busy}
                            onOpen={() => setDetailItem(item)}
                            onReplace={() => void replaceItem(item)}
                        />
                    </View>
                )}
                ListEmptyComponent={<AppText tone="muted">{t('offline.validation.noIssues')}</AppText>}
                style={{ flex: 1, minHeight: 0 }}
            />

            {/* The action renders in the sticky footer, which already draws its own top border. */}
            {primaryAction}

            <BottomSheet
                visible={issueSummaryOpen && issues.length > 0}
                onClose={() => setIssueSummaryOpen(false)}
                closeLabel={t('offline.validation.close')}
                title={t('offline.validation.issueSummaryTitle')}
                description={t('offline.validation.summaryIssues', { valid, invalid: issues.length })}
                testIDs={{ sheet: 'validation-issue-summary' }}
                footer={<Button onPress={focusFirstIssue}>{t('offline.validation.reviewIssues')}</Button>}
            >
                <View style={{ gap: spacing.sm }}>
                    {issueEntries.map(({ item, issue }) => (
                        <Card key={item.id} variant="muted" style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
                            <View style={{ backgroundColor: tokens.dangerSoft, borderRadius: radii.pill, padding: spacing.sm }}>
                                <Icon name="alert-circle-outline" size={metrics.icon.sm} color={tokens.danger} decorative />
                            </View>
                            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                <AppText variant="eyebrow" tone="danger">
                                    {t('offline.validation.pageNumber', { page: item.position + 1 })}
                                </AppText>
                                <AppText variant="label">{t(`offline.validation.issueMessages.${issue.code}`)}</AppText>
                                {issue.technicalDetail ? (
                                    <AppText tone="muted">{t(`offline.validation.technicalDetails.${issue.technicalDetail}`)}</AppText>
                                ) : null}
                                <AppText variant="caption" tone="muted">
                                    {t(`offline.validation.issueOrigin.${issue.origin}`)}
                                </AppText>
                            </View>
                        </Card>
                    ))}
                </View>
            </BottomSheet>
            <MediaPreviewSheet
                visible={!!detailItem}
                uri={detailItem ? itemUri(detailItem) : null}
                eyebrow={detailItem ? t('offline.validation.detailEyebrow', { page: detailItem.position + 1 }) : ''}
                title={detailIssue ? t('offline.validation.detailIssueTitle') : t('offline.validation.detailPreviewTitle')}
                imageAccessibilityLabel={detailItem ? t('offline.validation.previewLabel', { page: detailItem.position + 1 }) : ''}
                unavailableAccessibilityLabel={t('offline.validation.previewUnavailable')}
                closeAccessibilityLabel={t('offline.validation.close')}
                closeLabel={t('offline.validation.close')}
                onClose={() => setDetailItem(null)}
                tone={detailIssue ? 'danger' : 'accent'}
                details={
                    detailIssue ? (
                        <Card style={{ backgroundColor: tokens.dangerSoft, gap: spacing.xs, padding: spacing.md }}>
                            <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
                                <Icon name="alert-circle-outline" size={metrics.icon.md} color={tokens.danger} decorative />
                                <AppText variant="label" tone="danger" style={{ flex: 1 }}>
                                    {detailMessageKey ? t(detailMessageKey) : ''}
                                </AppText>
                            </View>
                            <AppText variant="caption" tone="muted">
                                {t(`offline.validation.issueOrigin.${detailIssue.origin}`)}
                            </AppText>
                            {detailIssue.technicalDetail ? (
                                <AppText tone="muted">{t(`offline.validation.technicalDetails.${detailIssue.technicalDetail}`)}</AppText>
                            ) : null}
                        </Card>
                    ) : undefined
                }
                actions={
                    detailItem && detailIssue ? (
                        <View style={{ gap: spacing.xs }}>
                            <Button
                                loading={actions.replacingItemId === detailItem.id}
                                disabled={actions.busy || removing}
                                onPress={() => void replaceItem(detailItem)}
                                accessibilityLabel={t('offline.validation.replacePageLabel', { page: detailItem.position + 1 })}
                            >
                                {t('offline.validation.replace')}
                            </Button>
                            {onRemoveItem ? (
                                <Button
                                    variant="ghost"
                                    tone="danger"
                                    loading={removing}
                                    disabled={actions.busy}
                                    onPress={() => {
                                        setRemoving(true);
                                        void onRemoveItem(detailItem)
                                            .then(() => setDetailItem(null))
                                            .finally(() => setRemoving(false));
                                    }}
                                    accessibilityLabel={t('offline.validation.removePageLabel', { page: detailItem.position + 1 })}
                                >
                                    {t('offline.validation.removePage')}
                                </Button>
                            ) : null}
                        </View>
                    ) : undefined
                }
            />
        </View>
    );
}
