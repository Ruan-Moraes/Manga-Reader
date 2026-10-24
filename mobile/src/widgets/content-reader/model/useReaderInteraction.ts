import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import type { ReaderGesturePreferences } from '@/entities/user-setting';

import { createReaderInteraction, READER_GESTURE_LIMITS, type ReaderInteractionEvent, readerInteractionReducer, resolveReaderTap } from './readerInteraction';

export type ReaderScrollPhase = 'dragStart' | 'dragEnd' | 'momentumStart' | 'momentumEnd';
export type ReaderScrollHandler = (phase: ReaderScrollPhase, event?: NativeSyntheticEvent<NativeScrollEvent>) => void;

export function useReaderInteraction(preferences: ReaderGesturePreferences, paged: boolean, rtl: boolean, navigate: (direction: 'next' | 'previous') => void) {
    const [state, setState] = useState(() => createReaderInteraction(preferences.controlsMode));
    const current = useRef(state);
    const touch = useRef<{ x: number; y: number; time: number } | null>(null);
    const surface = useRef({ x: 0, width: 1 });
    const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dispatch = useCallback((event: ReaderInteractionEvent) => {
        current.current = readerInteractionReducer(current.current, event);
        setState(current.current);
    }, []);
    const clearSettle = useCallback(() => {
        if (settle.current !== null) clearTimeout(settle.current);
        settle.current = null;
    }, []);
    useEffect(() => {
        dispatch({ type: 'preference', mode: preferences.controlsMode });
    }, [dispatch, preferences.controlsMode]);
    useEffect(() => {
        const listener = AppState.addEventListener('change', value => {
            touch.current = null;
            clearSettle();
            dispatch({ type: value === 'active' ? 'foreground' : 'background' });
        });
        return () => {
            listener.remove();
            clearSettle();
        };
    }, [clearSettle, dispatch]);
    const onScrollPhase = useCallback<ReaderScrollHandler>(
        phase => {
            touch.current = null;
            if (phase === 'dragEnd') {
                // Native end-drag precedes momentum-start. Keep the interaction locked across that handoff.
                clearSettle();
                settle.current = setTimeout(() => {
                    settle.current = null;
                    dispatch({ type: 'dragEnd' });
                }, READER_GESTURE_LIMITS.settleDelay);
            } else {
                if (phase === 'dragStart' || phase === 'momentumEnd') clearSettle();
                dispatch({ type: phase });
                if (phase === 'momentumEnd') dispatch({ type: 'dragEnd' });
            }
        },
        [clearSettle, dispatch],
    );
    const busy = () => current.current.dragging || current.current.momentum || !current.current.active;
    const cancelTouch = () => {
        touch.current = null;
    };
    const onTouchStart = (event: GestureResponderEvent) => {
        const e = event.nativeEvent;
        touch.current = busy() || (e.touches?.length ?? 1) !== 1 ? null : { x: e.pageX, y: e.pageY, time: Date.now() };
    };
    const onTouchMove = (event: GestureResponderEvent) => {
        const start = touch.current;
        const e = event.nativeEvent;
        if (start && ((e.touches?.length ?? 1) !== 1 || Math.hypot(e.pageX - start.x, e.pageY - start.y) > READER_GESTURE_LIMITS.tapSlop)) cancelTouch();
    };
    const onTouchEnd = (event: GestureResponderEvent) => {
        const start = touch.current;
        cancelTouch();
        if (!start || busy()) return;
        const e = event.nativeEvent;
        if (Math.hypot(e.pageX - start.x, e.pageY - start.y) > READER_GESTURE_LIMITS.tapSlop || Date.now() - start.time > READER_GESTURE_LIMITS.tapDuration)
            return;
        const action = resolveReaderTap({
            x: e.pageX - surface.current.x,
            width: surface.current.width,
            visible: current.current.visible,
            mode: current.current.mode,
            sideNavigation: preferences.sideTapNavigation,
            paged,
            rtl,
        });
        if (action === 'next' || action === 'previous') navigate(action);
        else if (action !== 'none') dispatch({ type: action });
    };
    return { state, surface, dispatch, busy, cancelTouch, onScrollPhase, touchHandlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: cancelTouch } };
}
