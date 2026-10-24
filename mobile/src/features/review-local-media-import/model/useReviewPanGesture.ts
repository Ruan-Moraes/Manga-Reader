import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { REVIEW_DRAG_ACTIVATION_FAIL_OFFSET, REVIEW_DRAG_LONG_PRESS_MS, REVIEW_DRAG_PHASE, type ReviewViewMode } from '../config/reviewLayout';
import { resolveReviewTouchIndex, type ReviewSortGeometry } from './reviewSortGeometry';
import type { ReviewDragState } from './useSortableReviewDrag';

interface Props extends Omit<ReviewSortGeometry, 'rowPitch'> {
    state: ReviewDragState;
    mode: ReviewViewMode;
    busy: boolean;
    start: (index: number) => void;
    update: (x: number, y: number, absoluteY: number) => void;
    settle: (success: boolean) => void;
}

export function useReviewPanGesture({ state, mode, columnCount, itemWidth, gap, busy, start, update, settle }: Props) {
    const candidate = useSharedValue(-1);
    const scrollGesture = useMemo(() => Gesture.Native(), []);
    const gesture = useMemo(
        () =>
            Gesture.Pan()
                .enabled(!busy)
                .maxPointers(1)
                .activateAfterLongPress(REVIEW_DRAG_LONG_PRESS_MS)
                .failOffsetX([-REVIEW_DRAG_ACTIVATION_FAIL_OFFSET, REVIEW_DRAG_ACTIVATION_FAIL_OFFSET])
                .failOffsetY([-REVIEW_DRAG_ACTIVATION_FAIL_OFFSET, REVIEW_DRAG_ACTIVATION_FAIL_OFFSET])
                .shouldCancelWhenOutside(false)
                .blocksExternalGesture(scrollGesture)
                .onTouchesDown((event, manager) => {
                    if (event.numberOfTouches !== 1) {
                        candidate.value = -1;
                        settle(false);
                        manager.fail();
                        return;
                    }
                    if (state.phase.value !== REVIEW_DRAG_PHASE.idle) {
                        manager.fail();
                        return;
                    }
                    const touch = event.allTouches[0];
                    candidate.value = resolveReviewTouchIndex({
                        x: touch.x,
                        y: touch.y + state.scrollOffset.value,
                        itemCount: state.sourceIds.value.length,
                        mode,
                        columnCount,
                        itemWidth,
                        gap,
                        rowPitch: state.rowPitch.value,
                    });
                    if (candidate.value < 0) manager.fail();
                })
                .onStart(() => start(candidate.value))
                .onUpdate(event => {
                    if (event.numberOfPointers > 1) {
                        settle(false);
                        return;
                    }
                    update(event.translationX, event.translationY, event.absoluteY);
                })
                .onTouchesCancelled(() => settle(false))
                .onFinalize((_event, success) => {
                    settle(success);
                    candidate.value = -1;
                }),
        [busy, candidate, columnCount, gap, itemWidth, mode, scrollGesture, settle, start, state, update],
    );
    return { gesture, scrollGesture };
}
