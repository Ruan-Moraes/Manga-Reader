import { type ReactNode, useState } from 'react';
import { type AccessibilityActionEvent, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { AppText } from '@/src/shared/ui';

import { REVIEW_CARD_BORDER_WIDTH, REVIEW_IMAGE_ASPECT_RATIO, REVIEW_LIST_THUMBNAIL_WIDTH, type ReviewViewMode } from '../config/reviewLayout';

interface Props {
    id: string;
    index: number;
    total: number;
    uri: string;
    duplicate: boolean;
    busy: boolean;
    mode: ReviewViewMode;
    itemMeta?: ReactNode;
    overlay?: boolean;
    onMove: (offset: -1 | 1) => void;
    onRemove: () => void;
    onPreview: () => void;
    onOpenActions: () => void;
}

function DeleteButton({ page, busy, onRemove, overlay }: { page: number; busy: boolean; onRemove: () => void; overlay: boolean }) {
    const { t } = useTranslation('launcher');

    const { minimumTouchTarget, spacing, tokens } = useTheme();
    const Surface = overlay ? View : Pressable;

    return (
        <View
            testID={`review-delete-surface-${overlay ? 'overlay-' : ''}${page}`}
            style={{
                height: minimumTouchTarget,
                width: minimumTouchTarget,
                alignSelf: 'flex-start',
                padding: spacing.xs,
                justifyContent: 'center',
            }}
        >
            <Surface
                accessibilityLabel={t('offline.review.remove', { page })}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                onPress={overlay ? undefined : onRemove}
            >
                <Ionicons name="trash-outline" size={19} color={tokens.danger} accessibilityElementsHidden />
            </Surface>
        </View>
    );
}

export function ReviewImageCard({
    id,
    index,
    total,
    uri,
    duplicate,
    busy,
    mode,
    itemMeta,
    overlay = false,
    onMove,
    onRemove,
    onPreview,
    onOpenActions,
}: Props) {
    const { t } = useTranslation('launcher');

    const { radii, spacing, tokens } = useTheme();

    const [failed, setFailed] = useState(false);

    const page = index + 1;

    const grid = mode === 'grid';
    const Surface = overlay ? View : Pressable;
    const testId = overlay ? `overlay-${id}` : id;

    const accessibilityActions = [
        ...(index > 0 ? [{ name: 'moveEarlier', label: t('offline.review.moveEarlier', { page }) }] : []),
        ...(index < total - 1 ? [{ name: 'moveLater', label: t('offline.review.moveLater', { page }) }] : []),
    ];

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        if (busy) return;

        if (event.nativeEvent.actionName === 'moveEarlier') onMove(-1);

        if (event.nativeEvent.actionName === 'moveLater') onMove(1);
    };

    const image = (
        <View testID={`review-drag-handle-${testId}`} collapsable={false} style={{ width: grid ? '100%' : REVIEW_LIST_THUMBNAIL_WIDTH }}>
            <Surface
                testID={`review-image-${testId}`}
                accessibilityActions={overlay ? undefined : accessibilityActions}
                accessibilityHint={t('offline.review.dragHint')}
                accessibilityLabel={grid ? t('offline.review.openActions', { page, total }) : t('offline.review.openPreview', { page, total })}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onAccessibilityAction={overlay ? undefined : handleAccessibilityAction}
                onPress={overlay ? undefined : grid ? onOpenActions : onPreview}
                style={{ aspectRatio: REVIEW_IMAGE_ASPECT_RATIO, width: '100%' }}
            >
                {failed ? (
                    <View
                        accessibilityRole="alert"
                        accessibilityLabel={t('offline.review.imageError', { page })}
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surfaceMuted,
                            borderRadius: radii.card,
                            flex: 1,
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons name="image-outline" size={28} color={tokens.danger} accessibilityElementsHidden />
                    </View>
                ) : (
                    <Image
                        source={{ uri }}
                        contentFit="cover"
                        cachePolicy="memory"
                        accessibilityElementsHidden
                        onError={() => setFailed(true)}
                        style={{ borderRadius: radii.card, height: '100%', width: '100%' }}
                    />
                )}
            </Surface>
        </View>
    );

    return (
        <View
            testID={`review-item-${testId}`}
            style={[
                {
                    backgroundColor: tokens.surface,
                    borderColor: duplicate ? tokens.warn : tokens.separator,
                    borderRadius: radii.card,
                    borderWidth: REVIEW_CARD_BORDER_WIDTH,
                    flexDirection: grid ? 'column' : 'row',
                    gap: grid ? 0 : spacing.sm,
                    overflow: 'visible',
                    padding: grid ? 0 : spacing.sm,
                    shadowColor: tokens.text,
                    shadowOffset: { width: 0, height: 5 },
                    shadowRadius: 12,
                },
            ]}
        >
            {image}
            {grid ? null : (
                <>
                    <View style={{ flex: 1, gap: spacing.sm, justifyContent: 'center', minWidth: 0 }}>
                        <View style={{ flexDirection: 'column', flexWrap: 'wrap', gap: spacing.sm }}>
                            {duplicate ? (
                                <AppText accessibilityRole="text" numberOfLines={2} variant="caption" style={{ color: tokens.warn }}>
                                    {t('offline.review.possibleDuplicate')}
                                </AppText>
                            ) : null}
                            <AppText numberOfLines={1} variant="section" style={{ flexShrink: 1 }}>
                                {t('offline.review.page', { page, total })}
                            </AppText>
                            {itemMeta ? (
                                <View
                                    testID={`review-status-${testId}`}
                                    style={{
                                        backgroundColor: tokens.surfaceMuted,
                                        borderRadius: radii.pill,
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: spacing.xs,
                                    }}
                                >
                                    {itemMeta}
                                </View>
                            ) : null}
                        </View>
                    </View>
                    <DeleteButton page={page} busy={busy} onRemove={onRemove} overlay={overlay} />
                </>
            )}
        </View>
    );
}
