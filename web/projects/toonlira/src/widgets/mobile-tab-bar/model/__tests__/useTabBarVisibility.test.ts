import { act, renderHook } from '@testing-library/react';

import useTabBarVisibility from '../useTabBarVisibility';

const setScrollY = (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
};

const fireScroll = () => {
    act(() => {
        window.dispatchEvent(new Event('scroll'));
    });
};

describe('useTabBarVisibility', () => {
    beforeEach(() => {
        setScrollY(0);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts visible at the top of the page', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        expect(result.current).toBe(true);
    });

    it('hides after scrolling down past the threshold', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));

        expect(result.current).toBe(false);
    });

    it('becomes visible again after scrolling up', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));
        expect(result.current).toBe(false);

        setScrollY(150);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));

        expect(result.current).toBe(true);
    });

    it('stays hidden before the idle reappearance delay', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));
        expect(result.current).toBe(false);

        act(() => vi.advanceTimersByTime(2495));

        expect(result.current).toBe(false);
    });

    it('becomes visible again once scrolling stays idle for the configured delay', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));

        expect(result.current).toBe(false);

        act(() => vi.runOnlyPendingTimers());

        expect(result.current).toBe(true);
    });

    it('restarts the idle timer after a new scroll interaction', () => {
        const { result } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));

        act(() => vi.advanceTimersByTime(2000));
        setScrollY(300);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));

        act(() => vi.advanceTimersByTime(495));
        expect(result.current).toBe(false);

        act(() => vi.runOnlyPendingTimers());
        expect(result.current).toBe(true);
    });

    it('cleans up the pending timer when unmounted', () => {
        const { result, unmount } = renderHook(() => useTabBarVisibility());

        setScrollY(200);
        fireScroll();
        act(() => vi.advanceTimersByTime(20));
        unmount();

        act(() => vi.advanceTimersByTime(2500));

        expect(result.current).toBe(false);
    });
});
