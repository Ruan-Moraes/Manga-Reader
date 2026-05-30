import { useTranslation } from 'react-i18next';

import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';

import { forumCategories, forumSortOptions, type ForumCategory, type ForumSort } from '@entities/forum';

interface ForumFiltersProps {
    query: string;
    sort: ForumSort;
    activeCategory: 'all' | ForumCategory;
    onQuery: (q: string) => void;
    onSort: (s: ForumSort) => void;
    onCategory: (c: 'all' | ForumCategory) => void;
}

export const ForumFilters = ({ query, sort, activeCategory, onQuery, onSort, onCategory }: ForumFiltersProps) => {
    const { t } = useTranslation('forum');

    return (
        <>
            <div className="mb-6 flex flex-wrap gap-3">
                <SearchField value={query} onChange={onQuery} placeholder={t('page.searchPlaceholder')} className="flex-1 min-w-[200px]" />
                <Select value={sort} onChange={e => onSort(e.target.value as ForumSort)} options={forumSortOptions} className="w-44" />
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {(['all', ...forumCategories] as ('all' | ForumCategory)[]).map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onCategory(cat)}
                        className={`rounded-mr-full border px-3 py-1 text-mr-tiny font-mr-bold transition-colors ${
                            activeCategory === cat
                                ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                : 'border-mr-border text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent'
                        }`}
                    >
                        {cat === 'all' ? t('page.allCategoriesLabel') : cat}
                    </button>
                ))}
            </div>
        </>
    );
};
