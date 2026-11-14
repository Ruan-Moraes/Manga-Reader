import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { REDIRECT_AFTER_LOGIN_KEY } from '@shared/constant/REDIRECT_AFTER_LOGIN_KEY';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { useRecentTitles } from '@entities/manga';
import { useReleaseFeed, type ReleasePeriod } from '@entities/release';
import { useTrendingTitles, type TrendWindow } from '@entities/trend';
import { useAuth } from '@features/auth';
import { useMarkReleaseSeen } from '@features/mark-release-seen';

const PERIODS: ReleasePeriod[] = ['DAY', 'WEEK', 'MONTH'];
const toPage = (value: string | null) => Math.max(0, Number(value ?? 1) - 1 || 0);

export const useReleasesPage = () => {
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const navigate = useAppNavigate();
    const { isLoggedIn } = useAuth();
    const q = params.get('q') ?? '';
    const language = params.get('language') ?? '';
    const requestedPeriod = params.get('period') as ReleasePeriod | null;
    const period = requestedPeriod && PERIODS.includes(requestedPeriod) ? requestedPeriod : 'WEEK';
    const requestedLibraryOnly = params.get('libraryOnly') === 'true';
    const libraryOnly = requestedLibraryOnly && isLoggedIn;
    const page = toPage(params.get('page'));
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const queryInput = useMemo(
        () => ({
            q,
            language,
            period,
            libraryOnly,
            page,
            size: 30,
            timeZone,
        }),
        [q, language, period, libraryOnly, page, timeZone],
    );
    const releases = useReleaseFeed(queryInput);

    const recentTitles = useRecentTitles(6);

    useEffect(() => {
        if (!requestedLibraryOnly || isLoggedIn) return;
        setParams(current => {
            const next = new URLSearchParams(current);
            next.delete('libraryOnly');
            next.delete('page');
            return next;
        }, { replace: true });
    }, [isLoggedIn, requestedLibraryOnly, setParams]);

    const trendWindow: TrendWindow = period;

    const trending = useTrendingTitles(trendWindow);
    const seen = useMarkReleaseSeen(timeZone);

    const update = useCallback(
        (values: Record<string, string | number | boolean | undefined>) => {
            setParams(current => {
                const next = new URLSearchParams(current);
                Object.entries(values).forEach(([key, value]) => {
                    const isDefault = key === 'period' && value === 'WEEK';
                    if (value === undefined || value === '' || value === false || isDefault || (key === 'page' && value === 1)) next.delete(key);
                    else next.set(key, String(value));
                });
                if (!('page' in values)) next.delete('page');
                return next;
            });
        },
        [setParams],
    );

    const requireLogin = useCallback(() => {
        localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, `${location.pathname}${location.search}`);

        navigate(ROUTES.LOGIN);
    }, [location.pathname, location.search, navigate]);

    return {
        q,
        language,
        period,
        libraryOnly,
        page,
        timeZone,
        isLoggedIn,
        releases,
        recentTitles,
        trending,
        seen,
        update,
        requireLogin,
    };
};
