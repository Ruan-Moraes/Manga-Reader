import { useTranslation } from 'react-i18next';

import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';

import type { GroupStatus } from '@feature/group';

type SortBy = 'popularity' | 'members' | 'titles' | 'rating';

interface GroupFiltersProps {
    query: string;
    sortBy: SortBy;
    statusFilter: 'all' | GroupStatus;
    onQuery: (q: string) => void;
    onSort: (s: SortBy) => void;
    onStatus: (s: 'all' | GroupStatus) => void;
}

export type { SortBy };

export const GroupFilters = ({ query, sortBy, statusFilter, onQuery, onSort, onStatus }: GroupFiltersProps) => {
    const { t } = useTranslation('group');

    const sortOptions = [
        { value: 'popularity', label: t('filters.sortMostActive') },
        { value: 'members', label: t('filters.sortMostFollowers') },
        { value: 'titles', label: t('filters.sortMostWorks') },
        { value: 'rating', label: t('filters.sortBestRated') },
    ];

    const statusChips: Array<{ value: 'all' | GroupStatus; label: string }> = [
        { value: 'all', label: t('filters.statusAll') },
        { value: 'active', label: t('filters.statusActive') },
        { value: 'hiatus', label: t('filters.statusHiatus') },
        { value: 'inactive', label: t('filters.statusInactive') },
    ];

    return (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            <SearchField value={query} onChange={onQuery} placeholder={t('filters.searchPlaceholder')} className="flex-1 min-w-[200px]" />
            <Select value={sortBy} onChange={e => onSort(e.target.value as SortBy)} options={sortOptions} className="w-44" />
            <div className="flex gap-2 flex-wrap">
                {statusChips.map(chip => (
                    <button
                        key={chip.value}
                        type="button"
                        onClick={() => onStatus(chip.value)}
                        className={`rounded-mr-full border px-3 py-1 text-mr-tiny font-mr-bold transition-colors ${
                            statusFilter === chip.value
                                ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                : 'border-mr-border text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent'
                        }`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
