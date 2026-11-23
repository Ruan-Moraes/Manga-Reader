import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { trackBehavior } from '../lib/behaviorQueue';
import { getBehaviorTrackingConfig, recordQualifiedTitleView } from '../api/behaviorEvent.api';

export const useTrackTitleView = (titleId?: string, source = 'DIRECT') => {
    const { data: config } = useQuery({
        queryKey: ['behavior-tracking-config'],
        queryFn: getBehaviorTrackingConfig,
        enabled: Boolean(titleId),
        staleTime: Infinity,
    });
    const qualifiedMillis = (config?.titleViewSeconds ?? 0) * 1_000;
    const bounceMinMillis = (config?.bounceMinSeconds ?? 0) * 1_000;

    useEffect(() => {
        if (!titleId || !config?.enabled) return;
        let visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
        let visibleMillis = 0;
        let technicalExit = false;

        const accumulate = () => {
            if (visibleSince !== null) visibleMillis += performance.now() - visibleSince;
            visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
        };
        const markTechnicalExit = () => {
            technicalExit = true;
        };
        document.addEventListener('visibilitychange', accumulate);
        window.addEventListener('pagehide', markTechnicalExit);
        return () => {
            accumulate();
            document.removeEventListener('visibilitychange', accumulate);
            window.removeEventListener('pagehide', markTechnicalExit);
            if (technicalExit) return;
            if (visibleMillis >= qualifiedMillis) {
                void trackBehavior({ type: 'TITLE_VIEW_QUALIFIED', titleId, source, dwellMillis: Math.round(visibleMillis) });
                void recordQualifiedTitleView(titleId).catch(() => undefined);
            } else if (visibleMillis >= bounceMinMillis) {
                void trackBehavior({ type: 'TITLE_VIEW_BOUNCE', titleId, source, dwellMillis: Math.round(visibleMillis) });
            }
        };
    }, [bounceMinMillis, config, qualifiedMillis, source, titleId]);
};
