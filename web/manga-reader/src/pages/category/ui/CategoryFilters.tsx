import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, LayoutGrid, LayoutList } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';
import { SegmentedControl } from '@ui/SegmentedControl';
import { Button } from '@ui/Button';
import { Drawer } from '@ui/Drawer';
import { Pagination } from '@ui/Pagination';

import { useFilterResults, useTagsFetch, type Sort, type PublicationStatus, type Tag } from '@entities/catalog-filter';

import useCatalogFilters from '../model/useCatalogFilters';
import CategoryFilterPanel from './parts/CategoryFilterPanel';
import CategoryResults from './parts/CategoryResults';

type Layout = 'grid' | 'list';

const CategoryFilters = () => {
    const { t } = useTranslation('manga');

    const navigate = useAppNavigate();

    const [query, setQuery] = useState('');
    const [layout, setLayout] = useState<Layout>('grid');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const sortOptions: { value: Sort; label: string }[] = [
        { value: 'most_read', label: t('filters.sort.most_read') },
        { value: 'most_rated', label: t('filters.sort.most_rated') },
        { value: 'most_recent', label: t('filters.sort.most_recent') },
        { value: 'alphabetical', label: t('filters.sort.alphabetical') },
        { value: 'random', label: t('filters.sort.random') },
    ];

    const layoutItems = [
        { value: 'grid', label: t('filters.layout.grid'), icon: LayoutGrid },
        { value: 'list', label: t('filters.layout.list'), icon: LayoutList },
    ];

    const { selectedTags, selectedSort, selectedStatus, page, handleSelectedTags, handleSortChange, handleStatusChange, handlePageChange } =
        useCatalogFilters();
    const { data: tagsData } = useTagsFetch();

    const tags = tagsData ?? [];

    const { data, isLoading } = useFilterResults({
        genres: selectedTags,
        sort: selectedSort,
        status: selectedStatus,
        adultContent: 'no_adult_content',
        page,
    });
    const results = data?.content ?? [];
    const totalPages = data?.totalPages ?? 1;
    const totalElements = data?.totalElements ?? 0;

    const toggleTag = (tag: Tag) => {
        const exists = selectedTags.some(t => t.value === tag.value);

        handleSelectedTags(exists ? selectedTags.filter(t => t.value !== tag.value) : [...selectedTags, tag]);
    };
    const clearAll = () => {
        handleSelectedTags([]);
        handleStatusChange('all');
    };

    const activeCount = selectedTags.length + (selectedStatus !== 'all' ? 1 : 0);
    const filtered = results.filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()));
    const activeFilters = [
        ...selectedTags.map(tag => ({
            key: `tag-${tag.value}`,
            label: tag.label,
            onRemove: () => handleSelectedTags(selectedTags.filter(selectedTag => selectedTag.value !== tag.value)),
        })),
        ...(selectedStatus !== 'all'
            ? [
                  {
                      key: `status-${selectedStatus}`,
                      label: t(`filters.statusOptions.${selectedStatus}`),
                      onRemove: () => handleStatusChange('all'),
                  },
              ]
            : []),
    ];

    const filterPanelProps = {
        tags,
        selectedTags,
        onTagToggle: toggleTag,
        selectedStatus,
        onStatusChange: handleStatusChange as (v: PublicationStatus) => void,
        onClearAll: clearAll,
        activeCount,
    };

    return (
        <PageContainer asMain size="default" paddingY="md">
            <section className="mb-5 rounded-mr-md border border-mr-border bg-mr-surface px-4 py-4 shadow-mr-elevated sm:mb-6 sm:px-6 sm:py-5">
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="mr-label mb-1 text-mr-fg-subtle">{t('filters.eyebrow')}</p>
                        <h2 className="m-0 text-mr-h2 font-mr-extrabold leading-tight tracking-mr text-mr-fg">{t('filters.title')}</h2>
                    </div>
                    <span className="shrink-0 rounded-mr-full border border-mr-accent-border bg-mr-accent/10 px-3 py-1 text-mr-tiny font-mr-bold text-mr-accent-fg">
                        {t('filters.metaSuffix', { count: totalElements })}
                    </span>
                </div>
            </section>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                side="right"
                title={t('filters.filtersButton')}
                footer={
                    <Button variant="primary" onClick={() => setDrawerOpen(false)} className="w-full">
                        {t('filters.apply')}
                    </Button>
                }
            >
                <CategoryFilterPanel {...filterPanelProps} />
            </Drawer>

            <div className="flex items-start gap-5 xl:gap-6">
                <aside aria-label={t('filters.drawerAria')} className="sticky top-[70px] hidden w-[280px] shrink-0 lg:block">
                    <CategoryFilterPanel {...filterPanelProps} />
                </aside>

                <div className="flex-1 min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                        <Button variant="raised" icon={Filter} onClick={() => setDrawerOpen(true)}>
                            {activeCount > 0
                                ? t('filters.filtersButtonCount', {
                                      count: activeCount,
                                  })
                                : t('filters.filtersButton')}
                        </Button>
                        {activeCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearAll}>
                                {t('filters.clearAll')}
                            </Button>
                        )}
                    </div>

                    <section className="mb-5 rounded-mr-md border border-mr-border bg-mr-surface p-3 shadow-mr-elevated sm:p-4" aria-label={t('filters.resultsControlsAria')}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <SearchField value={query} onChange={setQuery} placeholder={t('filters.searchPlaceholder')} className="min-w-0 flex-1" />
                            <div className="flex items-center gap-2 sm:shrink-0">
                                <Select value={selectedSort} onChange={e => handleSortChange(e.target.value as Sort)} options={sortOptions} className="min-w-0 flex-1 sm:w-44" />
                                <SegmentedControl items={layoutItems} value={layout} onChange={v => setLayout(v as Layout)} size="md" unified={true} iconOnly />
                            </div>
                        </div>

                        {activeFilters.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-mr-border pt-3" aria-live="polite">
                                <span className="mr-label text-mr-fg-subtle">{t('filters.activeFilters')}</span>
                                {activeFilters.map(filter => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={filter.onRemove}
                                    aria-label={t('filters.filterChipRemoveAria', { label: filter.label })}
                                    className="inline-flex items-center gap-1 rounded-mr-full border border-mr-accent-border bg-mr-accent/10 px-3 py-1 text-mr-tiny text-mr-accent-fg transition-colors hover:bg-mr-accent/20"
                                >
                                    {filter.label}
                                    <X className="size-3" />
                                </button>
                            ))}
                                <Button variant="ghost" size="sm" onClick={clearAll} className="ml-auto">
                                    {t('filters.clearAll')}
                                </Button>
                            </div>
                        )}
                    </section>

                    <CategoryResults
                        items={filtered}
                        isLoading={isLoading}
                        layout={layout}
                        onNavigate={id => navigate(ROUTES.TITLE_DETAIL(id))}
                        onClearAll={clearAll}
                    />

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination page={page + 1} total={totalPages} onChange={p => handlePageChange(p - 1)} />
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default CategoryFilters;
