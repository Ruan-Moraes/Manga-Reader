import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft, LocalMediaImportItem } from '@/src/entities/local-media-import';
import { useResponsiveLayout, useTheme } from '@/src/shared/theme';
import { AppText, Button, MediaPreviewSheet, SegmentedControl } from '@/src/shared/ui';

import type { ReviewViewMode } from '../config/reviewLayout';
import { possibleDuplicateItemIds, type ReviewLocalMediaImportController, reviewLocalMediaImportController } from '../model/reviewLocalMediaImport';
import { useReviewLocalMediaImport } from '../model/useReviewLocalMediaImport';
import { ReviewImageActionsSheet } from './ReviewImageActionsSheet';
import { ReviewImageCard } from './ReviewImageCard';
import { SortableReviewList } from './SortableReviewList';

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft | null) => void;
    controller?: ReviewLocalMediaImportController;
    afterReview?: ReactNode;
    renderItemMeta?: (item: LocalMediaImportItem) => ReactNode;
}

const VIEW_MODES = ['grid', 'list'] as const;
const normalizePositions = (items: LocalMediaImportItem[]): LocalMediaImportItem[] => items.map((item, position) => ({ ...item, position }));

export function LocalMediaReviewPanel({ draft, onDraftChange, controller, afterReview, renderItemMeta }: Props) {
    const { t } = useTranslation('launcher');

    const { spacing, tokens } = useTheme();
    const { reviewColumns } = useResponsiveLayout();

    const reviewController = controller ?? reviewLocalMediaImportController;

    const actions = useReviewLocalMediaImport(draft, onDraftChange, reviewController);

    const [viewMode, setViewMode] = useState<ReviewViewMode>('grid');
    const [orderedItems, setOrderedItems] = useState(() => normalizePositions(draft.items));
    const [actionItem, setActionItem] = useState<LocalMediaImportItem | null>(null);
    const [previewItem, setPreviewItem] = useState<LocalMediaImportItem | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const dragGestureRef = useRef({ active: false, endedAt: 0 });

    const duplicates = possibleDuplicateItemIds(draft);

    const itemUri = (item: LocalMediaImportItem) => reviewController.itemUri(draft, item);

    const canOpenImage = () => !dragGestureRef.current.active && Date.now() - dragGestureRef.current.endedAt > 350;

    useEffect(() => {
        setOrderedItems(normalizePositions(draft.items));
    }, [draft.items]);

    const closePreview = () => setPreviewItem(null);
    const handleReorder = (items: LocalMediaImportItem[]) => {
        const nextItems = normalizePositions(items);

        const nextIds = nextItems.map(item => item.id);
        const currentIds = orderedItems.map(item => item.id);

        if (nextIds.every((id, index) => id === currentIds[index])) return;

        setOrderedItems(nextItems);

        void actions.reorderItems(nextIds).then(persisted => {
            if (persisted === false) setOrderedItems(normalizePositions(draft.items));
        });
    };

    const footer = (
        <View testID="local-media-review-footer" style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
            {actions.error ? (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText variant="section" tone="danger">
                        {t('offline.review.errorTitle')}
                    </AppText>
                    <AppText tone="muted">{t(`offline.review.errors.${actions.error}`)}</AppText>
                    <Button variant="outline" onPress={() => void actions.retry()} disabled={actions.busy || draggingId !== null}>
                        {t('offline.review.retry')}
                    </Button>
                </View>
            ) : null}
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
                    disabled={actions.busy || draggingId !== null}
                    onPress={() => void actions.addImages()}
                    accessibilityLabel={t('offline.review.add')}
                    leading={<Ionicons name="add-circle-outline" size={20} color={tokens.accentText} accessibilityElementsHidden />}
                >
                    {t('offline.review.add')}
                </Button>
                <Button
                    disabled={actions.busy || draggingId !== null || !!draft.confirmedAt}
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
            <View style={{ flex: 1, gap: spacing.sm, minHeight: 0 }}>
                <SegmentedControl
                    label={t('offline.review.viewLabel')}
                    description={t('offline.review.dragHint')}
                    value={viewMode}
                    options={VIEW_MODES}
                    optionLabel={mode => (mode === 'grid' ? t('offline.review.viewGrid') : t('offline.review.viewList'))}
                    onChange={setViewMode}
                    disabled={actions.busy || draggingId !== null}
                />
                <SortableReviewList
                    items={orderedItems}
                    mode={viewMode}
                    columns={reviewColumns}
                    busy={actions.busy}
                    footer={footer}
                    onReorder={handleReorder}
                    onDragStart={item => {
                        dragGestureRef.current.active = true;

                        setDraggingId(item.id);
                    }}
                    onDragEnd={() => {
                        dragGestureRef.current = { active: false, endedAt: Date.now() };

                        setDraggingId(null);
                    }}
                    renderItem={({ item, index, overlay }) => (
                        <ReviewImageCard
                            id={item.id}
                            index={index}
                            total={orderedItems.length}
                            uri={itemUri(item)}
                            duplicate={duplicates.has(item.id)}
                            busy={actions.busy || draggingId !== null}
                            mode={viewMode}
                            overlay={overlay}
                            onMove={offset => void actions.moveItem(item.id, offset)}
                            onRemove={() => void actions.removeItem(item.id)}
                            onPreview={() => {
                                if (!canOpenImage()) return;

                                setPreviewItem(item);
                            }}
                            onOpenActions={() => {
                                if (canOpenImage()) setActionItem(item);
                            }}
                            itemMeta={renderItemMeta?.(item)}
                        />
                    )}
                />
            </View>

            <ReviewImageActionsSheet
                visible={!!actionItem}
                page={actionItem ? orderedItems.findIndex(item => item.id === actionItem.id) + 1 : 0}
                total={orderedItems.length}
                duplicate={actionItem ? duplicates.has(actionItem.id) : false}
                busy={actions.busy}
                itemMeta={actionItem ? renderItemMeta?.(actionItem) : undefined}
                onPreview={() => {
                    if (!actionItem) return;

                    setPreviewItem(actionItem);

                    setActionItem(null);
                }}
                onRemove={() => {
                    if (!actionItem) return;

                    const itemId = actionItem.id;

                    setActionItem(null);

                    void actions.removeItem(itemId);
                }}
                onClose={() => setActionItem(null)}
            />

            <MediaPreviewSheet
                testID="local-media-preview-modal"
                headerTestID="local-media-preview-header"
                visible={!!previewItem}
                uri={previewItem ? itemUri(previewItem) : null}
                eyebrow={previewItem ? t('offline.review.previewTitle', { page: previewItem.position + 1, total: draft.items.length }) : ''}
                title={t('offline.review.previewAction')}
                imageAccessibilityLabel={previewItem ? t('offline.review.previewImage', { page: previewItem.position + 1, total: draft.items.length }) : ''}
                unavailableAccessibilityLabel={previewItem ? t('offline.review.imageError', { page: previewItem.position + 1 }) : ''}
                closeAccessibilityLabel={t('offline.review.closePreview')}
                closeLabel={t('offline.review.closePreview')}
                onClose={closePreview}
            />
        </>
    );
}
