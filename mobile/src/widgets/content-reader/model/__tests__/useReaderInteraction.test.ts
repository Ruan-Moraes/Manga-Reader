import { type GestureResponderEvent } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { DEFAULT_READER_GESTURES } from '@/entities/user-setting';

import { useReaderInteraction } from '../useReaderInteraction';

const event = (x: number, y: number, count = 1) => ({ nativeEvent: { pageX: x, pageY: y, touches: Array(count).fill({}) } }) as GestureResponderEvent;

describe('MOB-FEAT-052 interaction lifecycle', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());
    it('cancels out-and-back movement, multitouch, long press and cancelled touches', () => {
        const { result } = renderHook(() => useReaderInteraction(DEFAULT_READER_GESTURES, false, false, jest.fn()));
        for (const cancel of [
            () => result.current.touchHandlers.onTouchMove(event(20, 90)),
            () => result.current.touchHandlers.onTouchStart(event(20, 20, 2)),
            () => result.current.touchHandlers.onTouchCancel(),
            () => jest.advanceTimersByTime(301),
        ]) {
            act(() => {
                result.current.touchHandlers.onTouchStart(event(20, 20));
                cancel();
                result.current.touchHandlers.onTouchEnd(event(20, 20));
            });
            expect(result.current.state.visible).toBe(false);
        }
        act(() => {
            result.current.touchHandlers.onTouchStart(event(20, 20));
            result.current.touchHandlers.onTouchEnd(event(20, 20));
        });
        expect(result.current.state.visible).toBe(true);
    });
    it('never reveals between end-drag and momentum, including a tap stopping momentum', () => {
        const { result } = renderHook(() => useReaderInteraction({ ...DEFAULT_READER_GESTURES, controlsMode: 'VISIBLE' }, false, false, jest.fn()));
        act(() => {
            result.current.onScrollPhase('dragStart');
            result.current.onScrollPhase('dragEnd');
        });
        expect(result.current.state.visible).toBe(false);
        act(() => {
            result.current.onScrollPhase('momentumStart');
            jest.advanceTimersByTime(100);
        });
        expect(result.current.state.visible).toBe(false);
        act(() => {
            result.current.touchHandlers.onTouchStart(event(20, 20));
            result.current.onScrollPhase('momentumEnd');
            result.current.touchHandlers.onTouchEnd(event(20, 20));
        });
        expect(result.current.state.visible).toBe(true);
    });
    it('settles a drag without momentum and clears timers on unmount', () => {
        const { result, unmount } = renderHook(() => useReaderInteraction({ ...DEFAULT_READER_GESTURES, controlsMode: 'VISIBLE' }, false, false, jest.fn()));
        act(() => {
            result.current.onScrollPhase('dragStart');
            result.current.onScrollPhase('dragEnd');
            jest.advanceTimersByTime(80);
        });
        expect(result.current.state.visible).toBe(true);
        act(() => {
            result.current.onScrollPhase('dragStart');
            result.current.onScrollPhase('dragEnd');
        });
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
    it('applies preference changes without resetting visible controls', () => {
        const { result, rerender } = renderHook(
            ({ mode }: { mode: 'TAP' | 'SWIPE' }) => useReaderInteraction({ ...DEFAULT_READER_GESTURES, controlsMode: mode }, false, false, jest.fn()),
            { initialProps: { mode: 'TAP' as 'TAP' | 'SWIPE' } },
        );
        act(() => result.current.dispatch({ type: 'reveal' }));
        rerender({ mode: 'SWIPE' });
        expect(result.current.state.visible).toBe(true);
    });
});
