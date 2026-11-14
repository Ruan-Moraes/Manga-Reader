import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTrackReadingSession } from '../useTrackReadingSession';

const { trackBehavior } = vi.hoisted(() => ({
    trackBehavior: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/behaviorQueue', () => ({ trackBehavior }));

describe('useTrackReadingSession', () => {
    let visibility: DocumentVisibilityState;

    beforeEach(() => {
        vi.useFakeTimers();
        visibility = 'visible';
        vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
        trackBehavior.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('counts only foreground time before starting the session', () => {
        renderHook(() => useTrackReadingSession({
            enabled: true,
            titleId: 'title-1',
            chapterNumber: 2,
            page: 1,
            totalPages: 10,
        }));

        act(() => vi.advanceTimersByTime(6_000));
        visibility = 'hidden';
        act(() => document.dispatchEvent(new Event('visibilitychange')));
        act(() => vi.advanceTimersByTime(20_000));
        expect(trackBehavior).not.toHaveBeenCalled();

        visibility = 'visible';
        act(() => document.dispatchEvent(new Event('visibilitychange')));
        act(() => vi.advanceTimersByTime(4_000));

        expect(trackBehavior).toHaveBeenCalledWith(expect.objectContaining({
            type: 'CHAPTER_SESSION_STARTED',
            titleId: 'title-1',
            chapterNumber: '2',
        }));
    });

    it('does not emit a positive reading event for a short session', () => {
        const view = renderHook(() => useTrackReadingSession({
            enabled: true,
            titleId: 'title-1',
            chapterNumber: 2,
            page: 1,
            totalPages: 10,
        }));

        act(() => vi.advanceTimersByTime(1_999));
        view.unmount();

        expect(trackBehavior).not.toHaveBeenCalled();
    });
});
