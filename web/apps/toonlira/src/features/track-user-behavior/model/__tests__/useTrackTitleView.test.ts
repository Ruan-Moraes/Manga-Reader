import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTrackTitleView } from '../useTrackTitleView';

const mocks = vi.hoisted(() => ({
    trackBehavior: vi.fn().mockResolvedValue(undefined),
    recordQualifiedTitleView: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({
        data: {
            enabled: true,
            titleViewSeconds: 15,
            bounceMinSeconds: 2,
            chapterStartSeconds: 10,
            chapterCompletionPercent: 90,
            maxBatchSize: 100,
        },
    }),
}));
vi.mock('../../lib/behaviorQueue', () => ({ trackBehavior: mocks.trackBehavior }));
vi.mock('../../api/behaviorEvent.api', () => ({
    getBehaviorTrackingConfig: vi.fn(),
    recordQualifiedTitleView: mocks.recordQualifiedTitleView,
}));

describe('useTrackTitleView', () => {
    let visibility: DocumentVisibilityState;

    beforeEach(() => {
        vi.useFakeTimers();
        visibility = 'visible';
        vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
        mocks.trackBehavior.mockClear();
        mocks.recordQualifiedTitleView.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('records a qualified foreground view after fifteen seconds', () => {
        const view = renderHook(() => useTrackTitleView('title-1', 'SEARCH'));
        act(() => vi.advanceTimersByTime(15_000));
        view.unmount();

        expect(mocks.trackBehavior).toHaveBeenCalledWith(expect.objectContaining({
            type: 'TITLE_VIEW_QUALIFIED',
            dwellMillis: 15_000,
        }));
        expect(mocks.recordQualifiedTitleView).toHaveBeenCalledWith('title-1');
    });

    it('records a bounce only inside the configured window', () => {
        const view = renderHook(() => useTrackTitleView('title-1', 'SEARCH'));
        act(() => vi.advanceTimersByTime(2_500));
        view.unmount();

        expect(mocks.trackBehavior).toHaveBeenCalledWith(expect.objectContaining({
            type: 'TITLE_VIEW_BOUNCE',
            dwellMillis: 2_500,
        }));
    });

    it('does not count time spent in a background tab', () => {
        const view = renderHook(() => useTrackTitleView('title-1'));
        act(() => vi.advanceTimersByTime(1_000));
        visibility = 'hidden';
        act(() => document.dispatchEvent(new Event('visibilitychange')));
        act(() => vi.advanceTimersByTime(20_000));
        view.unmount();

        expect(mocks.trackBehavior).not.toHaveBeenCalled();
    });

    it('ignores a technical page unload', () => {
        const view = renderHook(() => useTrackTitleView('title-1'));
        act(() => vi.advanceTimersByTime(15_000));
        act(() => window.dispatchEvent(new Event('pagehide')));
        view.unmount();

        expect(mocks.trackBehavior).not.toHaveBeenCalled();
        expect(mocks.recordQualifiedTitleView).not.toHaveBeenCalled();
    });
});
