import { useEffect, useRef } from 'react';

import { trackBehavior } from '../lib/behaviorQueue';

const START_MILLIS = 10_000;
const CHECKPOINT_STEP = 10;

export const useTrackReadingSession = (input: {
    enabled: boolean;
    titleId?: string;
    chapterNumber: number;
    page: number;
    totalPages: number;
}) => {
    const started = useRef(false);
    const highestCheckpoint = useRef(0);
    const latestProgress = useRef(0);

    useEffect(() => {
        latestProgress.current = Math.min(100, Math.round((input.page / Math.max(1, input.totalPages)) * 100));
        if (!started.current) return;
        const checkpoint = Math.floor(latestProgress.current / CHECKPOINT_STEP) * CHECKPOINT_STEP;
        if (checkpoint > highestCheckpoint.current && checkpoint < 100) {
            highestCheckpoint.current = checkpoint;
            void trackBehavior({
                type: 'CHAPTER_PROGRESS_CHECKPOINT',
                titleId: input.titleId,
                chapterNumber: String(input.chapterNumber),
                progressPercent: checkpoint,
                source: 'READER',
            });
        }
    }, [input.chapterNumber, input.page, input.titleId, input.totalPages]);

    useEffect(() => {
        if (!input.enabled || !input.titleId) return;
        started.current = false;
        highestCheckpoint.current = 0;
        let remainingMillis = START_MILLIS;
        let visibleSince: number | null = null;
        let timer: number | null = null;

        const start = () => {
            if (started.current || timer !== null || document.visibilityState !== 'visible') return;
            visibleSince = performance.now();
            timer = window.setTimeout(() => {
                timer = null;
                visibleSince = null;
                remainingMillis = 0;
                started.current = true;
                void trackBehavior({
                    type: 'CHAPTER_SESSION_STARTED',
                    titleId: input.titleId,
                    chapterNumber: String(input.chapterNumber),
                    progressPercent: latestProgress.current,
                    source: 'READER',
                });
            }, remainingMillis);
        };
        const pause = () => {
            if (timer === null || visibleSince === null) return;
            window.clearTimeout(timer);
            timer = null;
            remainingMillis = Math.max(0, remainingMillis - (performance.now() - visibleSince));
            visibleSince = null;
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') start();
            else pause();
        };

        document.addEventListener('visibilitychange', handleVisibility);
        start();

        return () => {
            if (timer !== null) window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (!started.current) return;
            void trackBehavior({
                type: latestProgress.current >= 90 ? 'CHAPTER_SESSION_COMPLETED' : 'CHAPTER_SESSION_PARTIAL',
                titleId: input.titleId,
                chapterNumber: String(input.chapterNumber),
                progressPercent: latestProgress.current,
                source: 'READER',
            });
        };
    }, [input.chapterNumber, input.enabled, input.titleId]);
};
