import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { isMediaValidationReady, type LocalMediaImportDraft, type LocalMediaImportItem } from '@/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';
import { useResponsiveLayout, useTheme } from '@/shared/theme';
import { AppText, Button, Card, MediaPreviewSheet, SegmentedControl } from '@/shared/ui';

import { useValidateLocalMedia } from '../model/useValidateLocalMedia';
import { type ValidateLocalMediaController, validateLocalMediaController } from '../model/validateLocalMedia';
import { validationIssueFor, type ValidationPresentationIssue } from '../model/validationPresentation';

type ValidationFilter = 'issues' | 'all';

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft) => void;
    onContinue?: () => void;
    controller?: ValidateLocalMediaController;
    processingIssues?: ReadonlyMap<string, ValidationPresentationIssue>;
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
    const { colorScheme, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [imageFailed, setImageFailed] = useState(false);
    const page = item.position + 1;
    const status = issue ? 'INVALID' : item.mediaValidationStatus;
    const statusColor = status === 'VALID' ? tokens.success : status === 'INVALID' ? tokens.danger : tokens.muted;
    const statusIcon = status === 'VALID' ? 'checkmark-circle' : status === 'INVALID' ? 'alert-circle' : 'time-outline';
    const statusLabel = t(`offline.validation.badges.${status}`);

    return (
        <View
            testID={`validation-thumbnail-${item.id}`}
            style={{
                backgroundColor: tokens.surface,
                borderColor: issue ? tokens.danger : tokens.separator,
                borderRadius: radii.card,
                borderWidth: issue ? 2 : 1,
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
                            aspectRatio: 0.72,
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
                        cachePolicy="memory-disk"
                        accessibilityElementsHidden
                        onError={() => setImageFailed(true)}
                        style={{ aspectRatio: 0.72, borderRadius: radii.sm, width: '100%' }}
                    />
                )}
                <View
                    testID={`validation-page-badge-${item.id}`}
                    accessibilityElementsHidden
                    style={{
                        backgroundColor: colorScheme === 'dark' ? tokens.surfaceElevated : tokens.overlay,
                        borderRadius: radii.pill,
                        left: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        position: 'absolute',
                        top: spacing.xs,
                    }}
                >
                    <AppText variant="caption" tone={colorScheme === 'dark' ? 'default' : 'inverse'}>
                        {t('offline.validation.pageNumber', { page })}
                    </AppText>
                </View>
            </Pressable>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 32 }}>
                <Ionicons accessibilityElementsHidden name={statusIcon} size={16} color={statusColor} />
                <AppText numberOfLines={2} variant="caption" style={{ color: statusColor, flex: 1 }}>
                    {statusLabel}
                </AppText>
            </View>
            {issue ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('offline.validation.replacePageLabel', { page })}
                    disabled={replacing || disabled}
                    onPress={onReplace}
                    style={{ alignItems: 'center', justifyContent: 'center', minHeight: minimumTouchTarget, paddingHorizontal: spacing.xs }}
                >
                    {replacing ? (
                        <ActivityIndicator size="small" color={tokens.danger} />
                    ) : (
                        <AppText variant="caption" tone="danger">
                            {t('offline.validation.replace')}
                        </AppText>
                    )}
                </Pressable>
            ) : null}
        </View>
    );
}

export function LocalMediaValidationPanel({ draft, onDraftChange, onContinue, controller, processingIssues }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const responsive = useResponsiveLayout();
    const actions = useValidateLocalMedia(draft, onDraftChange, controller);
    const listRef = useRef<FlatList<LocalMediaImportItem>>(null);
    const previousIssueCount = useRef(0);
    const [filter, setFilter] = useState<ValidationFilter>('all');
    const [detailItem, setDetailItem] = useState<LocalMediaImportItem | null>(null);

    const issueFor = (item: LocalMediaImportItem) => validationIssueFor(item, processingIssues?.get(item.id));
    const issues = draft.items.filter(item => issueFor(item));
    const valid = draft.items.filter(item => item.mediaValidationStatus === 'VALID' && !issueFor(item)).length;
    const pending = draft.items.length - valid - issues.length;
    const ready = isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION) && issues.length === 0;
    const columns = responsive.sizeClass === 'compact' ? 2 : responsive.sizeClass === 'regular' ? 3 : 4;
    const visibleItems = filter === 'issues' ? issues : draft.items;
    const detailIssue = detailItem ? issueFor(detailItem) : null;
    const displayedProgress = actions.progress ?? { completed: 0, total: Math.max(1, pending + issues.length) };
    const activeController = controller ?? validateLocalMediaController;
    const itemUri = (item: LocalMediaImportItem) => activeController.itemUri(draft, item);

    useEffect(() => {
        if (issues.length > 0 && previousIssueCount.current === 0) setFilter('issues');
        if (issues.length === 0) setFilter('all');
        previousIssueCount.current = issues.length;
    }, [issues.length]);

    const focusFirstIssue = () => {
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

    return (
        <View testID="local-media-validation" style={{ flex: 1, gap: spacing.md, minHeight: 0 }}>
            <Card style={{ gap: spacing.sm, padding: spacing.md }}>
                <View accessibilityRole="summary" style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <Ionicons
                        accessibilityElementsHidden
                        name={ready ? 'checkmark-circle' : issues.length ? 'alert-circle' : 'scan-circle-outline'}
                        size={24}
                        color={ready ? tokens.success : issues.length ? tokens.danger : tokens.accentText}
                    />
                    <View style={{ flex: 1, gap: spacing.xs }}>
                        <AppText variant="section">
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
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText variant="label" tone="danger">
                        {t('offline.validation.issueAlert', { count: issues.length })}
                    </AppText>
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
                </View>
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
                ref={listRef}
                key={`validation-${columns}`}
                testID="validation-thumbnail-grid"
                data={visibleItems}
                numColumns={columns}
                keyExtractor={item => item.id}
                columnWrapperStyle={columns > 1 ? { gap: spacing.sm } : undefined}
                contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                renderItem={({ item }) => (
                    <View style={{ flex: 1 / columns, maxWidth: `${100 / columns}%` as `${number}%` }}>
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

            <View style={{ borderTopColor: tokens.separator, borderTopWidth: 1, gap: spacing.sm, paddingTop: spacing.md }}>
                {actions.busy ? (
                    <Button disabled leading={<ActivityIndicator color={tokens.muted} size="small" />}>
                        {t('offline.validation.progress', { completed: displayedProgress.completed, total: displayedProgress.total })}
                    </Button>
                ) : issues.length ? (
                    <Button onPress={focusFirstIssue}>{t('offline.validation.fixIssues', { count: issues.length })}</Button>
                ) : ready ? (
                    <Button onPress={onContinue}>{t('offline.validation.continue')}</Button>
                ) : (
                    <Button onPress={() => void actions.validate()}>{t('offline.validation.action')}</Button>
                )}
            </View>

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
                        <Card style={{ gap: spacing.sm, padding: spacing.md }}>
                            <AppText variant="section" tone="danger">
                                {detailMessageKey ? t(detailMessageKey) : ''}
                            </AppText>
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
                        <Button
                            loading={actions.replacingItemId === detailItem.id}
                            disabled={actions.busy}
                            onPress={() => void replaceItem(detailItem)}
                            accessibilityLabel={t('offline.validation.replacePageLabel', { page: detailItem.position + 1 })}
                        >
                            {t('offline.validation.replace')}
                        </Button>
                    ) : undefined
                }
            />
        </View>
    );
}
