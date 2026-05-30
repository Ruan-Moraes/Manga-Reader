import { useTranslation } from 'react-i18next';

import { SegmentedControl, type SegmentItem } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';

import type { EventType } from '@entities/event';

interface EventFiltersProps {
    activeTab: string;
    tabItems: SegmentItem[];
    type: 'all' | EventType;
    onTab: (t: string) => void;
    onType: (t: 'all' | EventType) => void;
}

export const EventFilters = ({ activeTab, tabItems, type, onTab, onType }: EventFiltersProps) => {
    const { t } = useTranslation('event');

    const TYPE_OPTIONS = [
        { value: 'all', label: t('page.typeOptions.all') },
        { value: 'Convenção', label: t('types.convention') },
        { value: 'Lançamento', label: t('types.launch') },
        { value: 'Live', label: t('types.live') },
        { value: 'Workshop', label: t('types.workshop') },
        { value: 'Meetup', label: t('types.meetup') },
    ];

    return (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <SegmentedControl items={tabItems} value={activeTab} onChange={onTab} size="sm" />
            <Select value={type} onChange={e => onType(e.target.value as 'all' | EventType)} options={TYPE_OPTIONS} className="w-48" />
        </div>
    );
};
