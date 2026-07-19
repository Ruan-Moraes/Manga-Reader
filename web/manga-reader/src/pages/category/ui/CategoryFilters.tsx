import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, LayoutGrid, LayoutList } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
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

    const filterPanelProps = {
        tags,
        selectedTags,
        onTagToggle: toggleTag,
        selectedStatus,
        onStatusChange: handleStatusChange as (v: PublicationStatus) => void,
        onClearAll: clearAll,
    };

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader
                eyebrow={t('filters.eyebrow')}
                title={t('filters.title')}
                meta={t('filters.metaSuffix', { count: totalElements })}
                className="mb-6"
            />

            <div className="mb-4 lg:hidden">
                <Button variant="raised" icon={Filter} onClick={() => setDrawerOpen(true)}>
                    {activeCount > 0
                        ? t('filters.filtersButtonCount', {
                              count: activeCount,
                          })
                        : t('filters.filtersButton')}
                </Button>
            </div>

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

            <div className="flex gap-6">
                <aside aria-label={t('filters.drawerAria')} className="hidden w-[260px] shrink-0 lg:block">
                    <CategoryFilterPanel {...filterPanelProps} />
                </aside>

                <div className="flex-1 min-w-0">
                    <div className="mb-4 flex flex-wrap gap-3">
                        <SearchField value={query} onChange={setQuery} placeholder={t('filters.searchPlaceholder')} className="flex-1 min-w-[200px]" />
                        <Select value={selectedSort} onChange={e => handleSortChange(e.target.value as Sort)} options={sortOptions} className="w-44" />
                        <SegmentedControl items={layoutItems} value={layout} onChange={v => setLayout(v as Layout)} size="md" unified={true} iconOnly />
                    </div>

                    {selectedTags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2" aria-live="polite">
                            {selectedTags.map(tag => (
                                <button
                                    key={tag.value}
                                    type="button"
                                    onClick={() => handleSelectedTags(selectedTags.filter(t => t.value !== tag.value))}
                                    aria-label={t('filters.filterChipRemoveAria', { label: tag.label })}
                                    className="inline-flex items-center gap-1 rounded-mr-full border border-mr-accent-border bg-mr-accent/10 px-3 py-1 text-mr-tiny text-mr-accent-fg transition-colors hover:bg-mr-accent/20"
                                >
                                    {tag.label}
                                    <X className="size-3" />
                                </button>
                            ))}
                        </div>
                    )}

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
