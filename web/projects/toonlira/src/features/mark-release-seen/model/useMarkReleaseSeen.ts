import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { showErrorToast } from '@shared/service/util/toastService';
import type { ReleaseFeed } from '@entities/release';

import { markReleaseDaySeen, markReleaseSeen } from '../api/markReleaseSeen.api';

type Snapshot = Array<[readonly unknown[], ReleaseFeed | undefined]>;

const dateKey = (value: string, timeZone: string): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(value));
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
};

export const useMarkReleaseSeen = (timeZone: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('manga');

    const snapshot = (): Snapshot => queryClient.getQueriesData<ReleaseFeed>({ queryKey: [QUERY_KEYS.RELEASES] });
    const restore = (state: Snapshot | undefined) => state?.forEach(([key, data]) =>
        queryClient.setQueryData<ReleaseFeed>(key, data));

    const chapter = useMutation({
        scope: { id: 'release-seen' },
        mutationFn: markReleaseSeen,
        onMutate: async chapterId => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.RELEASES] });
            const previous = snapshot();
            queryClient.setQueriesData<ReleaseFeed>({ queryKey: [QUERY_KEYS.RELEASES] }, current => current ? ({
                ...current,
                releases: {
                    ...current.releases,
                    content: current.releases.content.map(item => item.chapterId === chapterId ? { ...item, seen: true } : item),
                },
            }) : current);
            return previous;
        },
        onError: (_error, _chapterId, previous) => {
            restore(previous);
            showErrorToast(t('releases.markSeenError'));
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RELEASES] }),
    });

    const day = useMutation({
        scope: { id: 'release-seen' },
        mutationFn: (date: string) => markReleaseDaySeen(date, timeZone),
        onMutate: async date => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.RELEASES] });
            const previous = snapshot();
            queryClient.setQueriesData<ReleaseFeed>({ queryKey: [QUERY_KEYS.RELEASES] }, current => current ? ({
                ...current,
                releases: {
                    ...current.releases,
                    content: current.releases.content.map(item =>
                        dateKey(item.publishedAt, timeZone) === date ? { ...item, seen: true } : item),
                },
            }) : current);
            return previous;
        },
        onError: (_error, _date, previous) => {
            restore(previous);
            showErrorToast(t('releases.markSeenError'));
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RELEASES] }),
    });

    return { markChapter: chapter, markDay: day };
};
