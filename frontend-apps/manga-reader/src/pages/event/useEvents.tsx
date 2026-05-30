import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { useAuth } from '@features/auth';
import { filterEvents, getEvents, type EventType } from '@entities/event';

const tabs = [
    { id: 'upcoming', labelKey: 'page.tabs.upcoming' },
    { id: 'ongoing', labelKey: 'page.tabs.ongoing' },
    { id: 'past', labelKey: 'page.tabs.past' },
    { id: 'my-events', labelKey: 'page.tabs.myEvents' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const THIRTY_MINUTES = 1000 * 60 * 30;
const EVENTS_PAGE_SIZE = 100;

const useEvents = () => {
    const { isLoggedIn, user } = useAuth();
    const hasCreatePermission = Boolean(user?.moderator?.isModerator || user?.member?.isMember);

    const [activeTab, setActiveTab] = useState<TabId>('upcoming');
    const [query, setQuery] = useState('');
    const [type, setType] = useState<'all' | EventType>('all');
    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [sort, setSort] = useState<'date' | 'popularity' | 'relevance'>('date');

    const { data } = useQuery({
        queryKey: [QUERY_KEYS.EVENTS, 0, EVENTS_PAGE_SIZE],
        queryFn: () => getEvents(0, EVENTS_PAGE_SIZE),
        staleTime: THIRTY_MINUTES,
    });

    const allEvents = useMemo(() => data?.content ?? [], [data]);

    const events = useMemo(
        () =>
            filterEvents(allEvents, {
                tab: activeTab,
                query,
                type,
                period,
                sort,
                isLoggedIn,
            }),
        [allEvents, activeTab, isLoggedIn, period, query, sort, type],
    );

    const featured = events.find(event => event.isFeatured) ?? events[0];

    return {
        tabs,
        isLoggedIn,
        hasCreatePermission,
        activeTab,
        setActiveTab,
        query,
        setQuery,
        type,
        setType,
        period,
        setPeriod,
        sort,
        setSort,
        events,
        featured,
    };
};

export default useEvents;
