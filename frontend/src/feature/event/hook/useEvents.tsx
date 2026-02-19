import { useMemo, useState } from 'react';

import { useAuth } from '@feature/auth';
import { filterEvents } from '../service/eventService';
import type { EventType } from '../type/event.types';

const tabs = [
    { id: 'upcoming', label: 'Próximos Eventos' },
    { id: 'ongoing', label: 'Eventos em Andamento' },
    { id: 'past', label: 'Eventos Passados' },
    { id: 'my-events', label: 'Meus Eventos' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const useEvents = () => {
    const { isLoggedIn, user } = useAuth();
    const hasCreatePermission = Boolean(
        user?.moderator?.isModerator || user?.member?.isMember,
    );

    const [activeTab, setActiveTab] = useState<TabId>('upcoming');
    const [query, setQuery] = useState('');
    const [type, setType] = useState<'all' | EventType>('all');
    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>(
        'all',
    );
    const [sort, setSort] = useState<'date' | 'popularity' | 'relevance'>(
        'date',
    );

    const events = useMemo(
        () =>
            filterEvents({
                tab: activeTab,
                query,
                type,
                period,
                sort,
                isLoggedIn,
            }),
        [activeTab, isLoggedIn, period, query, sort, type],
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
