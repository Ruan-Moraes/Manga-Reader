import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';

import { type EventType } from '@entities/event';

import useEvents from '../model/useEvents';

import { EventFilters } from './parts/EventFilters';
import { EventList } from './parts/EventList';

const Events = () => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('event');
    const { activeTab, setActiveTab, type, setType, events, featured, isLoggedIn } = useEvents();

    const isLoading = events.length === 0 && !featured;

    const ALL_TAB_ITEMS = [
        { value: 'upcoming', label: t('page.tabs.upcoming') },
        { value: 'ongoing', label: t('page.tabs.ongoing') },
        { value: 'past', label: t('page.tabs.past') },
        { value: 'my-events', label: t('page.tabs.myEvents') },
    ];

    const tabItems = isLoggedIn ? ALL_TAB_ITEMS : ALL_TAB_ITEMS.filter(tab => tab.value !== 'my-events');

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader eyebrow={t('page.eyebrow')} title={t('page.title')} meta={t('page.eventsCount', { count: events.length })} className="mb-6" />

            <EventFilters
                activeTab={activeTab}
                tabItems={tabItems}
                type={type}
                onTab={v => setActiveTab(v as typeof activeTab)}
                onType={v => setType(v as 'all' | EventType)}
            />

            <EventList events={events} featured={featured} isLoading={isLoading} onEventClick={id => navigate(ROUTES.EVENT_DETAIL(id))} />
        </PageContainer>
    );
};

export default Events;
