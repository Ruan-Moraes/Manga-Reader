import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, type FlatList, type LayoutChangeEvent, View } from 'react-native';
import {
    cancelAnimation,
    Easing,
    measure,
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useFrameCallback,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import type { LocalMediaImportItem } from '@/entities/local-media-import';

import { REVIEW_AUTO_SCROLL_ACCELERATION_MS, REVIEW_DRAG_LIFT_MS, REVIEW_DRAG_PHASE, REVIEW_DRAG_SETTLE_MS, type ReviewViewMode } from '../config/reviewLayout';
import {
    reorderReviewItems,
    resolveReviewDropIndex,
    resolveReviewEdgeVelocity,
    resolveReviewScrollOffset,
    resolveReviewSlot,
    type ReviewSortGeometry,
} from './reviewSortGeometry';

interface Props extends ReviewSortGeometry {
    items: LocalMediaImportItem[];
    mode: ReviewViewMode;
    busy: boolean;
    reduceMotion: boolean;
    onReorder: (items: LocalMediaImportItem[]) => void;
    onDragStart: (item: LocalMediaImportItem) => void;
    onDragEnd: () => void;
}

interface Presentation {
    token: number;
    item: LocalMediaImportItem;
    index: number;
    items: LocalMediaImportItem[];
    handoff: boolean;
    reconciled: boolean;
}

export function useSortableReviewDrag({
    items,
    columnCount,
    itemWidth,
    gap,
    rowPitch: initialRowPitch,
    busy,
    reduceMotion,
    onReorder,
    onDragStart,
    onDragEnd,
}: Props) {
    const listRef = useAnimatedRef<FlatList<LocalMediaImportItem>>();
    const containerRef = useAnimatedRef<View>();
    const landingRef = useAnimatedRef<View>();
    const callbacks = useRef({ items, onReorder, onDragStart, onDragEnd });
    callbacks.current = { items, onReorder, onDragStart, onDragEnd };
    const session = useRef<{ token: number; committed: boolean } | null>(null);
    const mounted = useRef(true);
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const phase = useSharedValue<number>(REVIEW_DRAG_PHASE.idle);
    const token = useSharedValue(0);
    const blocked = useSharedValue(busy);
    const sourceIds = useSharedValue<string[]>([]);
    const activeIndex = useSharedValue(-1);
    const targetIndex = useSharedValue(-1);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const fingerTranslationY = useSharedValue(0);
    const scrollOffset = useSharedValue(0);
    const startScrollOffset = useSharedValue(0);
    const viewportTop = useSharedValue(0);
    const viewportHeight = useSharedValue(0);
    const contentHeight = useSharedValue(0);
    const edgeVelocity = useSharedValue(0);
    const requestedVelocity = useSharedValue(0);
    const rowPitch = useSharedValue(initialRowPitch);
    const sessionPitch = useSharedValue(initialRowPitch);
    const lift = useSharedValue(0);
    const feedback = useSharedValue(0);
    const settleProgress = useSharedValue(0);
    const settleFromX = useSharedValue(0);
    const settleFromY = useSharedValue(0);
    const settleToX = useSharedValue(0);
    const settleToY = useSharedValue(0);
    const overlayReady = useSharedValue(false);
    const handoff = useSharedValue(false);

    const reset = useCallback(() => {
        cancelAnimation(settleProgress);
        cancelAnimation(lift);
        cancelAnimation(feedback);
        cancelAnimation(edgeVelocity);
        phase.set(REVIEW_DRAG_PHASE.idle);
        activeIndex.set(-1);
        targetIndex.set(-1);
        edgeVelocity.set(0);
        requestedVelocity.set(0);
        overlayReady.set(false);
        handoff.set(false);
        translationX.set(0);
        translationY.set(0);
        lift.set(0);
        feedback.set(0);
    }, [activeIndex, edgeVelocity, feedback, handoff, lift, overlayReady, phase, requestedVelocity, settleProgress, targetIndex, translationX, translationY]);

    const complete = useCallback(
        (sessionToken: number) => {
            if (!mounted.current || session.current?.token !== sessionToken) return;
            session.current = null;
            reset();
            setPresentation(null);
            callbacks.current.onDragEnd();
        },
        [reset],
    );

    const begin = useCallback(
        (sessionToken: number, index: number) => {
            if (!mounted.current || token.get() !== sessionToken) return;
            const current = callbacks.current;
            if (!current.items[index]) return;
            session.current = { token: sessionToken, committed: false };
            setPresentation({ token: sessionToken, item: current.items[index], index, items: current.items, handoff: false, reconciled: false });
            current.onDragStart(current.items[index]);
        },
        [token],
    );

    const commit = useCallback(
        (sessionToken: number, fromIndex: number, toIndex: number) => {
            if (!mounted.current || session.current?.token !== sessionToken || session.current.committed || token.get() !== sessionToken) return;
            session.current.committed = true;
            if (fromIndex !== toIndex) callbacks.current.onReorder(reorderReviewItems(callbacks.current.items, fromIndex, toIndex));
        },
        [token],
    );

    const finishAnimation = useCallback(
        (sessionToken: number) => {
            if (!mounted.current || session.current?.token !== sessionToken || token.get() !== sessionToken) return;
            // Keep the floating copy until Fabric has laid out the new, ID-keyed cells.
            setPresentation(current =>
                current?.token === sessionToken ? { ...current, items: callbacks.current.items, handoff: true, reconciled: true } : current,
            );
        },
        [token],
    );

    const retarget = useCallback(
        (destinationIndex: number, sessionToken: number) => {
            'worklet';
            if (token.value !== sessionToken || phase.value === REVIEW_DRAG_PHASE.idle) return;
            cancelAnimation(settleProgress);
            handoff.value = false;
            settleFromX.value += (settleToX.value - settleFromX.value) * settleProgress.value;
            settleFromY.value += (settleToY.value - settleFromY.value) * settleProgress.value;
            const origin = resolveReviewSlot(activeIndex.value, columnCount, itemWidth, gap, sessionPitch.value);
            const destination = resolveReviewSlot(destinationIndex, columnCount, itemWidth, gap, sessionPitch.value);
            targetIndex.value = destinationIndex;
            settleToX.value = destination.x - origin.x;
            settleToY.value = destination.y - origin.y;
            settleProgress.value = 0;
            settleProgress.value = withTiming(1, { duration: reduceMotion ? 0 : REVIEW_DRAG_SETTLE_MS, easing: Easing.out(Easing.cubic) }, finished => {
                if (finished && token.value === sessionToken) scheduleOnRN(finishAnimation, sessionToken);
            });
        },
        [
            activeIndex,
            columnCount,
            finishAnimation,
            gap,
            handoff,
            itemWidth,
            phase,
            reduceMotion,
            sessionPitch,
            settleFromX,
            settleFromY,
            settleProgress,
            settleToX,
            settleToY,
            targetIndex,
            token,
        ],
    );

    const updatePosition = useCallback(() => {
        'worklet';
        translationY.value = fingerTranslationY.value + scrollOffset.value - startScrollOffset.value;
        targetIndex.value = resolveReviewDropIndex({
            fromIndex: activeIndex.value,
            previousIndex: targetIndex.value,
            itemCount: sourceIds.value.length,
            columnCount,
            itemWidth,
            gap,
            rowPitch: sessionPitch.value,
            translation: { x: translationX.value, y: translationY.value },
        });
    }, [
        activeIndex,
        columnCount,
        fingerTranslationY,
        gap,
        itemWidth,
        scrollOffset,
        sessionPitch,
        sourceIds,
        startScrollOffset,
        targetIndex,
        translationX,
        translationY,
    ]);

    const stopScroll = useCallback(() => {
        'worklet';
        cancelAnimation(edgeVelocity);
        requestedVelocity.value = 0;
        edgeVelocity.value = 0;
    }, [edgeVelocity, requestedVelocity]);

    const settle = useCallback(
        (success: boolean) => {
            'worklet';
            if (phase.value !== REVIEW_DRAG_PHASE.dragging) return;
            stopScroll();
            phase.value = success ? REVIEW_DRAG_PHASE.settling : REVIEW_DRAG_PHASE.cancelling;
            if (!success) targetIndex.value = activeIndex.value;
            const origin = resolveReviewSlot(activeIndex.value, columnCount, itemWidth, gap, sessionPitch.value);
            const destination = resolveReviewSlot(targetIndex.value, columnCount, itemWidth, gap, sessionPitch.value);
            settleFromX.value = translationX.value;
            settleFromY.value = translationY.value;
            settleToX.value = destination.x - origin.x;
            settleToY.value = destination.y - origin.y;
            const sessionToken = token.value;
            if (success) scheduleOnRN(commit, sessionToken, activeIndex.value, targetIndex.value);
            settleProgress.value = 0;
            lift.value = withTiming(0, { duration: reduceMotion ? 0 : REVIEW_DRAG_SETTLE_MS, easing: Easing.out(Easing.cubic) });
            feedback.value = withTiming(0, { duration: reduceMotion ? 0 : REVIEW_DRAG_SETTLE_MS, easing: Easing.out(Easing.cubic) });
            settleProgress.value = withTiming(1, { duration: reduceMotion ? 0 : REVIEW_DRAG_SETTLE_MS, easing: Easing.out(Easing.cubic) }, finished => {
                if (finished && token.value === sessionToken) scheduleOnRN(finishAnimation, sessionToken);
            });
        },
        [
            activeIndex,
            columnCount,
            commit,
            feedback,
            finishAnimation,
            gap,
            itemWidth,
            lift,
            phase,
            reduceMotion,
            sessionPitch,
            settleFromX,
            settleFromY,
            settleProgress,
            settleToX,
            settleToY,
            stopScroll,
            targetIndex,
            token,
            translationX,
            translationY,
        ],
    );

    const start = useCallback(
        (index: number) => {
            'worklet';
            if (blocked.value || phase.value !== REVIEW_DRAG_PHASE.idle || index < 0) return;
            token.value += 1;
            phase.value = REVIEW_DRAG_PHASE.dragging;
            activeIndex.value = index;
            targetIndex.value = index;
            sessionPitch.value = rowPitch.value;
            startScrollOffset.value = scrollOffset.value;
            translationX.value = 0;
            translationY.value = 0;
            fingerTranslationY.value = 0;
            overlayReady.value = false;
            handoff.value = false;
            feedback.value = 1;
            lift.value = withTiming(reduceMotion ? 0 : 1, { duration: reduceMotion ? 0 : REVIEW_DRAG_LIFT_MS, easing: Easing.out(Easing.cubic) });
            scheduleOnRN(begin, token.value, index);
        },
        [
            activeIndex,
            begin,
            blocked,
            feedback,
            fingerTranslationY,
            handoff,
            lift,
            overlayReady,
            phase,
            reduceMotion,
            rowPitch,
            scrollOffset,
            sessionPitch,
            startScrollOffset,
            targetIndex,
            token,
            translationX,
            translationY,
        ],
    );

    const update = useCallback(
        (x: number, y: number, absoluteY: number) => {
            'worklet';
            if (phase.value !== REVIEW_DRAG_PHASE.dragging) return;
            translationX.value = x;
            fingerTranslationY.value = y;
            updatePosition();
            const nextVelocity = resolveReviewEdgeVelocity(absoluteY - viewportTop.value, viewportHeight.value);
            if (nextVelocity === 0) stopScroll();
            else if (nextVelocity !== requestedVelocity.value) {
                // Identical move events must not restart acceleration.
                if (Math.sign(nextVelocity) !== Math.sign(requestedVelocity.value)) edgeVelocity.value = 0;
                requestedVelocity.value = nextVelocity;
                edgeVelocity.value = withTiming(nextVelocity, { duration: REVIEW_AUTO_SCROLL_ACCELERATION_MS, easing: Easing.linear });
            }
        },
        [edgeVelocity, fingerTranslationY, phase, requestedVelocity, stopScroll, translationX, updatePosition, viewportHeight, viewportTop],
    );

    const onScroll = useAnimatedScrollHandler(event => {
        scrollOffset.value = Math.max(0, event.contentOffset.y);
        if (phase.value === REVIEW_DRAG_PHASE.dragging) updatePosition();
    });

    useFrameCallback(({ timeSincePreviousFrame }) => {
        if (handoff.value) {
            const slot = resolveReviewSlot(targetIndex.value, columnCount, itemWidth, gap, sessionPitch.value);
            const y = slot.y - scrollOffset.value;
            const offscreen = y + sessionPitch.value <= 0 || y >= viewportHeight.value;
            // Reanimated 4.1 checks -1, but a Fabric ref awaiting attachment returns null.
            // Passing that null wrapper to _measure aborts the iOS process before it can return null.
            const landing = offscreen || landingRef() == null ? null : measure(landingRef);
            const viewport = offscreen || containerRef() == null ? null : measure(containerRef);
            if (
                offscreen ||
                (landing &&
                    viewport &&
                    Math.abs(landing.pageX - viewport.pageX - slot.x) < 1 &&
                    Math.abs(landing.pageY - viewport.pageY - y) < 1 &&
                    Math.abs(landing.width - itemWidth) < 1)
            ) {
                handoff.value = false;
                scheduleOnRN(complete, token.value);
            }
            return;
        }
        if (phase.value !== REVIEW_DRAG_PHASE.dragging || edgeVelocity.value === 0) return;
        const nextOffset = resolveReviewScrollOffset(
            scrollOffset.value,
            edgeVelocity.value,
            timeSincePreviousFrame ?? 16,
            1,
            Math.max(0, contentHeight.value - viewportHeight.value),
        );
        if (nextOffset === scrollOffset.value) return;
        scrollOffset.value = nextOffset;
        updatePosition();
        scrollTo(listRef, 0, nextOffset, false);
    });

    useLayoutEffect(() => {
        blocked.set(busy);
        if (phase.get() === REVIEW_DRAG_PHASE.idle) sourceIds.set(items.map(item => item.id));
    }, [blocked, busy, items, phase, presentation, sourceIds]);

    useLayoutEffect(() => {
        if (!presentation?.handoff) return;
        const ids = presentation.items.map(item => item.id);
        const latest = items.map(item => item.id);
        if (ids.join('\0') !== latest.join('\0')) {
            setPresentation(current => (current ? { ...current, items } : null));
            return;
        }
        // A fast rollback may change the landing slot while the animation is running.
        const destination = items.findIndex(item => item.id === presentation.item.id);
        if (destination < 0) {
            complete(presentation.token);
            return;
        }
        if (destination !== targetIndex.get()) {
            setPresentation(current => (current ? { ...current, handoff: false } : null));
            scheduleOnUI(retarget, destination, presentation.token);
            return;
        }
        handoff.set(true);
    }, [complete, handoff, items, presentation, retarget, targetIndex]);

    const interrupt = useCallback(() => {
        token.set(value => value + 1);
        const hadSession = session.current !== null;
        session.current = null;
        reset();
        sourceIds.set(callbacks.current.items.map(item => item.id));
        if (hadSession) callbacks.current.onDragEnd();
    }, [reset, sourceIds, token]);

    useLayoutEffect(() => {
        mounted.current = true;
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') {
                interrupt();
                setPresentation(null);
            }
        });
        return () => {
            mounted.current = false;
            subscription.remove();
            interrupt();
        };
    }, [interrupt]);

    const onLayout = useCallback(
        (event: LayoutChangeEvent) => {
            if (viewportHeight.get() > 0 && Math.abs(viewportHeight.get() - event.nativeEvent.layout.height) > 0.5 && phase.get() !== REVIEW_DRAG_PHASE.idle) {
                interrupt();
                setPresentation(null);
            }
            viewportHeight.set(event.nativeEvent.layout.height);
            containerRef.current?.measureInWindow((_x, y) => viewportTop.set(y));
        },
        [containerRef, interrupt, phase, viewportHeight, viewportTop],
    );
    const onRowHeightChange = useCallback(
        (height: number) => {
            if (height <= rowPitch.get() + 0.5) return;
            if (phase.get() !== REVIEW_DRAG_PHASE.idle) {
                interrupt();
                setPresentation(null);
            }
            rowPitch.set(height);
        },
        [interrupt, phase, rowPitch],
    );
    const onContentSizeChange = useCallback((_width: number, height: number) => contentHeight.set(height), [contentHeight]);
    const showOverlay = useCallback(
        (sessionToken: number) => {
            if (mounted.current && session.current?.token === sessionToken) overlayReady.set(true);
        },
        [overlayReady],
    );

    const state = useMemo(
        () => ({
            phase,
            token,
            sourceIds,
            activeIndex,
            targetIndex,
            translationX,
            translationY,
            scrollOffset,
            rowPitch,
            sessionPitch,
            lift,
            feedback,
            settleProgress,
            settleFromX,
            settleFromY,
            settleToX,
            settleToY,
            overlayReady,
        }),
        [
            phase,
            token,
            sourceIds,
            activeIndex,
            targetIndex,
            translationX,
            translationY,
            scrollOffset,
            rowPitch,
            sessionPitch,
            lift,
            feedback,
            settleProgress,
            settleFromX,
            settleFromY,
            settleToX,
            settleToY,
            overlayReady,
        ],
    );

    return {
        listRef,
        containerRef,
        landingRef,
        presentation,
        displayItems: presentation?.items ?? items,
        dragging: presentation !== null,
        state,
        start,
        update,
        settle,
        showOverlay,
        onScroll,
        onLayout,
        onRowHeightChange,
        onContentSizeChange,
    };
}

export type ReviewDragState = ReturnType<typeof useSortableReviewDrag>['state'];
