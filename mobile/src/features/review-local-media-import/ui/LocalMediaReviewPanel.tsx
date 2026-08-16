import { type ReactNode, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LocalMediaImportDraft, LocalMediaImportItem } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Card } from '@/src/shared/ui';

import { possibleDuplicateItemIds, type ReviewLocalMediaImportController, reviewLocalMediaImportController } from '../model/reviewLocalMediaImport';
import { useReviewLocalMediaImport } from '../model/useReviewLocalMediaImport';

const THUMBNAIL_SIZE = 76;
const KANBAN_THUMBNAIL_HEIGHT = 112;

type ViewMode = 'kanban' | 'scroll';

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft | null) => void;
    controller?: ReviewLocalMediaImportController;
    afterReview?: ReactNode;
    renderItemMeta?: (item: LocalMediaImportItem) => ReactNode;
}

interface ItemProps {
    draft: LocalMediaImportDraft;
    item: LocalMediaImportItem;
    duplicate: boolean;
    busy: boolean;
    mode: ViewMode;
    uri: string;
    onMove: (offset: -1 | 1) => void;
    onRemove: () => void;
    onPreview: () => void;
    itemMeta?: ReactNode;
}

function ReviewItem({ draft, item, duplicate, busy, mode, uri, onMove, onRemove, onPreview, itemMeta }: ItemProps) {
    const { t } = useTranslation('launcher');
    const { radii, spacing, tokens } = useTheme();
    const [failed, setFailed] = useState(false);
    const page = item.position + 1;
    const total = draft.items.length;
    const kanban = mode === 'kanban';

    return (
        <View
            testID={`review-item-${item.id}`}
            style={{
                alignItems: kanban ? 'stretch' : 'center',
                borderColor: duplicate ? tokens.warn : tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flexDirection: kanban ? 'column' : 'row',
                gap: spacing.sm,
                padding: spacing.xs,
                width: kanban ? '48%' : undefined,
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('offline.review.openPreview', { page, total })}
                onPress={onPreview}
                style={{ width: kanban ? '100%' : THUMBNAIL_SIZE }}
            >
                {failed ? (
                    <View
                        accessibilityRole="alert"
                        accessibilityLabel={t('offline.review.imageError', { page })}
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surfaceMuted,
                            borderRadius: radii.sm,
                            height: kanban ? KANBAN_THUMBNAIL_HEIGHT : THUMBNAIL_SIZE,
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <Ionicons name="image-outline" size={28} color={tokens.danger} />
                    </View>
                ) : (
                    <Image
                        source={{ uri }}
                        contentFit="cover"
                        cachePolicy="memory"
                        accessibilityElementsHidden
                        onError={() => setFailed(true)}
                        style={{ borderRadius: radii.sm, height: kanban ? KANBAN_THUMBNAIL_HEIGHT : THUMBNAIL_SIZE, width: '100%' }}
                    />
                )}
            </Pressable>

            <View style={{ flex: kanban ? undefined : 1, gap: spacing.xs }}>
                <AppText variant={kanban ? 'label' : 'section'}>{t('offline.review.page', { page, total })}</AppText>
                {duplicate && (
                    <AppText accessibilityRole="text" variant="caption" style={{ color: tokens.warn }}>
                        {t('offline.review.possibleDuplicate')}
                    </AppText>
                )}
                {itemMeta}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    <Button
                        size="compact"
                        variant="outline"
                        fullWidth={false}
                        disabled={busy || item.position === 0}
                        accessibilityLabel={t('offline.review.moveEarlier', { page })}
                        onPress={() => onMove(-1)}
                    >
                        <Ionicons name="arrow-up" size={20} color={tokens.accentText} accessibilityElementsHidden />
                    </Button>
                    <Button
                        size="compact"
                        variant="outline"
                        fullWidth={false}
                        disabled={busy || item.position === total - 1}
                        accessibilityLabel={t('offline.review.moveLater', { page })}
                        onPress={() => onMove(1)}
                    >
                        <Ionicons name="arrow-down" size={20} color={tokens.accentText} accessibilityElementsHidden />
                    </Button>
                    <Button
                        size="compact"
                        variant="outline"
                        tone="danger"
                        fullWidth={kanban}
                        disabled={busy}
                        accessibilityLabel={t('offline.review.remove', { page })}
                        onPress={onRemove}
                        leading={<Ionicons name="trash-outline" size={18} color={tokens.danger} accessibilityElementsHidden />}
                    >
                        {t('offline.review.removeAction')}
                    </Button>
                </View>
            </View>
        </View>
    );
}

interface ViewModeButtonProps {
    icon: 'grid-outline' | 'list-outline';
    label: string;
    selected: boolean;
    onPress: () => void;
}

function ViewModeButton({ icon, label, selected, onPress }: ViewModeButtonProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={onPress}
            style={{
                alignItems: 'center',
                backgroundColor: selected ? tokens.accent : tokens.surfaceMuted,
                borderColor: selected ? tokens.accent : tokens.separator,
                borderRadius: radii.control,
                borderWidth: 1,
                flex: 1,
                flexDirection: 'row',
                gap: spacing.xs,
                justifyContent: 'center',
                minHeight: minimumTouchTarget,
                paddingHorizontal: spacing.sm,
            }}
        >
            <Ionicons name={icon} size={18} color={selected ? tokens.onAccent : tokens.accentText} accessibilityElementsHidden />
            <AppText variant="label" style={{ color: selected ? tokens.onAccent : tokens.accentText }}>
                {label}
            </AppText>
        </Pressable>
    );
}

export function LocalMediaReviewPanel({ draft, onDraftChange, controller, afterReview, renderItemMeta }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const reviewController = controller ?? reviewLocalMediaImportController;
    const actions = useReviewLocalMediaImport(draft, onDraftChange, reviewController);
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [previewItem, setPreviewItem] = useState<LocalMediaImportItem | null>(null);
    const [previewFailed, setPreviewFailed] = useState(false);
    const duplicates = possibleDuplicateItemIds(draft);
    const itemUri = (item: LocalMediaImportItem) => reviewController.itemUri(draft, item);
    const closePreview = () => {
        setPreviewItem(null);
        setPreviewFailed(false);
    };
    const footer = (
        <View testID="local-media-review-footer" style={{ gap: spacing.sm }}>
            {actions.error && (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText variant="section" tone="danger">
                        {t('offline.review.errorTitle')}
                    </AppText>
                    <AppText tone="muted">{t(`offline.review.errors.${actions.error}`)}</AppText>
                    <Button variant="outline" onPress={() => void actions.retry()} disabled={actions.busy}>
                        {t('offline.review.retry')}
                    </Button>
                </View>
            )}

            {draft.confirmedAt ? (
                <View accessibilityRole="summary" style={{ gap: spacing.xs }}>
                    <AppText variant="section" tone="success">
                        {t('offline.review.confirmedTitle')}
                    </AppText>
                    <AppText tone="muted">{t('offline.review.confirmedDescription')}</AppText>
                </View>
            ) : (
                <AppText tone="muted">{t('offline.review.editing')}</AppText>
            )}

            <View style={{ gap: spacing.sm }}>
                <Button
                    variant="outline"
                    disabled={actions.busy}
                    onPress={() => void actions.addImages()}
                    accessibilityLabel={t('offline.review.add')}
                    leading={<Ionicons name="add-circle-outline" size={20} color={tokens.accentText} />}
                >
                    {t('offline.review.add')}
                </Button>
                <Button
                    disabled={actions.busy || !!draft.confirmedAt}
                    loading={actions.busy}
                    onPress={() => void actions.confirm()}
                    accessibilityLabel={draft.confirmedAt ? t('offline.review.confirmedAction') : t('offline.review.confirm')}
                >
                    {draft.confirmedAt ? t('offline.review.confirmedAction') : t('offline.review.confirm')}
                </Button>
            </View>
            {afterReview}
        </View>
    );

    return (
        <>
            <Card variant="elevated" style={{ flex: 1, gap: spacing.sm, minHeight: 0, padding: spacing.md }}>
                <View style={{ gap: spacing.xs }}>
                    <AppText variant="section">{t('offline.review.title')}</AppText>
                    <AppText variant="caption" tone="muted">
                        {t('offline.review.description', { count: draft.items.length })}
                    </AppText>
                </View>

                <View accessibilityLabel={t('offline.review.viewLabel')} style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <ViewModeButton
                        icon="grid-outline"
                        label={t('offline.review.viewKanban')}
                        selected={viewMode === 'kanban'}
                        onPress={() => setViewMode('kanban')}
                    />
                    <ViewModeButton
                        icon="list-outline"
                        label={t('offline.review.viewScroll')}
                        selected={viewMode === 'scroll'}
                        onPress={() => setViewMode('scroll')}
                    />
                </View>

                <FlatList
                    key={viewMode}
                    testID={`local-media-review-list-${viewMode}`}
                    data={draft.items}
                    keyExtractor={item => item.id}
                    numColumns={viewMode === 'kanban' ? 2 : 1}
                    columnWrapperStyle={viewMode === 'kanban' ? { gap: spacing.sm } : undefined}
                    initialNumToRender={viewMode === 'kanban' ? 8 : 6}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews
                    style={{ flex: 1, minHeight: 0 }}
                    contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
                    ListFooterComponent={footer}
                    renderItem={({ item }) => (
                        <ReviewItem
                            draft={draft}
                            item={item}
                            duplicate={duplicates.has(item.id)}
                            busy={actions.busy}
                            mode={viewMode}
                            uri={itemUri(item)}
                            onMove={offset => void actions.moveItem(item.id, offset)}
                            onRemove={() => void actions.removeItem(item.id)}
                            onPreview={() => {
                                setPreviewFailed(false);
                                setPreviewItem(item);
                            }}
                            itemMeta={renderItemMeta?.(item)}
                        />
                    )}
                />
            </Card>

            <Modal testID="local-media-preview-modal" visible={!!previewItem} animationType="fade" presentationStyle="fullScreen" onRequestClose={closePreview}>
                <SafeAreaView style={{ backgroundColor: tokens.overlay, flex: 1 }}>
                    <View
                        style={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: spacing.sm,
                            justifyContent: 'space-between',
                            padding: spacing.md,
                        }}
                    >
                        <AppText variant="section" tone="inverse">
                            {previewItem ? t('offline.review.previewTitle', { page: previewItem.position + 1, total: draft.items.length }) : ''}
                        </AppText>
                        <Button
                            size="compact"
                            fullWidth={false}
                            variant="outline"
                            accessibilityLabel={t('offline.review.closePreview')}
                            onPress={closePreview}
                            leading={<Ionicons name="close" size={20} color={tokens.accentText} accessibilityElementsHidden />}
                        >
                            {t('offline.review.closePreview')}
                        </Button>
                    </View>
                    {previewItem && !previewFailed ? (
                        <Image
                            source={{ uri: itemUri(previewItem) }}
                            contentFit="contain"
                            cachePolicy="memory"
                            accessibilityLabel={t('offline.review.previewImage', {
                                page: previewItem.position + 1,
                                total: draft.items.length,
                            })}
                            onError={() => setPreviewFailed(true)}
                            style={{ flex: 1, width: '100%' }}
                        />
                    ) : (
                        <View accessibilityRole="alert" style={{ alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center' }}>
                            <Ionicons name="image-outline" size={42} color={tokens.danger} accessibilityElementsHidden />
                            <AppText tone="inverse">{previewItem ? t('offline.review.imageError', { page: previewItem.position + 1 }) : ''}</AppText>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </>
    );
}
