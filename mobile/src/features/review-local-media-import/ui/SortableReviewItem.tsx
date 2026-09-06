import { type ReactNode, useLayoutEffect } from 'react';
import { type ListRenderItemInfo, StyleSheet, type View } from 'react-native';
import Reanimated, { type AnimatedRef, Easing, useAnimatedRef, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { LocalMediaImportItem } from '@/entities/local-media-import';
import { useTheme } from '@/shared/theme';

import { REVIEW_DRAG_PHASE, REVIEW_DROP_INDICATOR_WIDTH, REVIEW_ITEM_SHIFT_MS } from '../config/reviewLayout';
import { projectReviewIndex, resolveReviewSlot } from '../model/reviewSortGeometry';
import type { ReviewDragState } from '../model/useSortableReviewDrag';

export interface SortableRenderItemInfo extends ListRenderItemInfo<LocalMediaImportItem> {
    overlay?: boolean;
}

interface Props {
    item: LocalMediaImportItem;
    index: number;
    columnCount: number;
    itemWidth: number;
    state: ReviewDragState;
    overlay?: boolean;
    landingRef?: AnimatedRef<View>;
    layoutCommitted?: boolean;
    onRowHeightChange?: (height: number) => void;
    onOverlayLayout?: () => void;
    renderItem: (info: SortableRenderItemInfo) => ReactNode;
}

export function SortableReviewItem({
    item,
    index,
    columnCount,
    itemWidth,
    state,
    overlay = false,
    layoutCommitted = false,
    landingRef,
    onRowHeightChange,
    onOverlayLayout,
    renderItem,
}: Props) {
    const { effectiveReduceMotion, spacing, tokens } = useTheme();
    const itemRef = useAnimatedRef<View>();
    // List cells survive reordering. Reanimated 4.1 does not forward a newly supplied
    // ref until its native child remounts, so register the already-mounted ref explicitly.
    useLayoutEffect(() => {
        if (landingRef && itemRef.current) landingRef(itemRef.current);
    }, [itemRef, landingRef]);
    const duration = effectiveReduceMotion ? 0 : REVIEW_ITEM_SHIFT_MS;
    const id = item.id;
    const animatedStyle = useAnimatedStyle(() => {
        const idle = state.phase.value === REVIEW_DRAG_PHASE.idle;
        const originIndex = state.sourceIds.value.indexOf(id);
        const active = !idle && originIndex === state.activeIndex.value;
        const pitch = idle ? state.rowPitch.value : state.sessionPitch.value;
        const base = resolveReviewSlot(index, columnCount, itemWidth, spacing.sm, pitch);
        const origin = resolveReviewSlot(Math.max(0, originIndex), columnCount, itemWidth, spacing.sm, pitch);
        const destinationIndex = idle || originIndex < 0 ? index : projectReviewIndex(originIndex, state.activeIndex.value, state.targetIndex.value);
        const destination = resolveReviewSlot(destinationIndex, columnCount, itemWidth, spacing.sm, pitch);
        const dragging = state.phase.value === REVIEW_DRAG_PHASE.dragging;
        const x = dragging
            ? state.translationX.value
            : state.settleFromX.value + (state.settleToX.value - state.settleFromX.value) * state.settleProgress.value;
        const y = dragging
            ? state.translationY.value
            : state.settleFromY.value + (state.settleToY.value - state.settleFromY.value) * state.settleProgress.value;
        const floating = overlay || (active && !state.overlayReady.value);
        return {
            minHeight: pitch - spacing.sm,
            opacity: overlay ? (state.overlayReady.value ? 1 : 0) : active && state.overlayReady.value ? 0 : 1,
            transform: [
                // Native cells already occupy their new slots at handoff; animating old offsets to zero would move them twice.
                {
                    translateX: floating
                        ? origin.x + x - (overlay ? 0 : base.x)
                        : layoutCommitted
                          ? 0
                          : withTiming(destination.x - base.x, { duration, easing: Easing.out(Easing.cubic) }),
                },
                {
                    translateY: floating
                        ? origin.y + y - (overlay ? state.scrollOffset.value : base.y)
                        : layoutCommitted
                          ? 0
                          : withTiming(destination.y - base.y, { duration, easing: Easing.out(Easing.cubic) }),
                },
                { scale: floating && !effectiveReduceMotion ? 1 + state.lift.value * 0.025 : 1 },
            ],
            zIndex: floating ? 100 : 0,
            elevation: floating ? state.lift.value * 8 : 0,
            shadowOpacity: floating ? state.lift.value * 0.22 : 0,
        };
    });

    return (
        <Reanimated.View
            ref={itemRef}
            collapsable={false}
            testID={overlay ? 'review-drag-overlay' : `review-sortable-item-${id}`}
            pointerEvents={overlay ? 'none' : undefined}
            accessibilityElementsHidden={overlay}
            importantForAccessibility={overlay ? 'no-hide-descendants' : 'auto'}
            onLayout={event => {
                if (landingRef && itemRef.current) landingRef(itemRef.current);
                if (overlay) {
                    onOverlayLayout?.();
                    return;
                }
                const measuredPitch = event.nativeEvent.layout.height + spacing.sm;
                onRowHeightChange?.(measuredPitch);
            }}
            style={[
                overlay ? StyleSheet.absoluteFill : undefined,
                { bottom: undefined, right: undefined, width: itemWidth, shadowColor: tokens.text, shadowOffset: { width: 0, height: 8 }, shadowRadius: 12 },
                animatedStyle,
            ]}
        >
            {renderItem({ item, index, overlay, separators: { highlight: () => undefined, unhighlight: () => undefined, updateProps: () => undefined } })}
        </Reanimated.View>
    );
}

export function ReviewDropIndicator({ state, columnCount, itemWidth }: Pick<Props, 'state' | 'columnCount' | 'itemWidth'>) {
    const { radii, spacing, tokens } = useTheme();
    const style = useAnimatedStyle(() => {
        const slot = resolveReviewSlot(Math.max(0, state.targetIndex.value), columnCount, itemWidth, spacing.sm, state.sessionPitch.value);
        return {
            height: state.sessionPitch.value - spacing.sm,
            opacity: state.feedback.value,
            transform: [{ translateX: slot.x }, { translateY: slot.y - state.scrollOffset.value }],
        };
    });
    return (
        <Reanimated.View
            testID="review-drop-indicator"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
                {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: itemWidth,
                    borderColor: tokens.accent,
                    borderWidth: REVIEW_DROP_INDICATOR_WIDTH,
                    borderRadius: radii.card,
                },
                style,
            ]}
        />
    );
}
