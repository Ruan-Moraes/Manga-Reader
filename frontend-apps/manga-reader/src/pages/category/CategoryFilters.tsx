import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';
import { SegmentedControl } from '@ui/SegmentedControl';
import { Button } from '@ui/Button';
import { Drawer } from '@ui/Drawer';
import { MangaCard } from '@ui/MangaCard';
import { Pagination } from '@ui/Pagination';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';
import { Badge } from '@ui/Badge';

import { useCategoryFilters, useFilterResults, useTagsFetch, type Sort, type PublicationStatus, type Tag } from '@features/category';

import CategoryFilterPanel from './parts/CategoryFilterPanel';

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
        { value: 'grid', label: t('filters.layout.grid') },
        { value: 'list', label: t('filters.layout.list') },
    ];

    const { selectedTags, selectedSort, selectedStatus, page, handleSelectedTags, handleSortChange, handleStatusChange, handlePageChange } =
        useCategoryFilters();
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
        <PageContainer asMain size="wide" paddingY="md">
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
                        <SegmentedControl items={layoutItems} value={layout} onChange={v => setLayout(v as Layout)} size="sm" />
                    </div>

                    {selectedTags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2" aria-live="polite">
                            {selectedTags.map(tag => (
                                <button
                                    key={tag.value}
                                    type="button"
                                    onClick={() => handleSelectedTags(selectedTags.filter(t => t.value !== tag.value))}
                                    aria-label={t('filters.filterChipRemoveAria', { label: tag.label })}
                                    className="inline-flex items-center gap-1 rounded-mr-full border border-mr-accent bg-mr-accent/10 px-3 py-1 text-mr-tiny text-mr-accent transition-colors hover:bg-mr-accent/20"
                                >
                                    {tag.label}
                                    <X className="size-3" />
                                </button>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} variant="rect" height={260} className="rounded-mr-md" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            illustration="duvida"
                            title={t('filters.emptyTitle')}
                            description={t('filters.emptyDesc')}
                            action={
                                <Button variant="raised" onClick={clearAll}>
                                    {t('filters.clearFilters')}
                                </Button>
                            }
                        />
                    ) : layout === 'grid' ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {filtered.map(m => (
                                <MangaCard
                                    key={m.id}
                                    manga={{
                                        id: m.id,
                                        title: m.name,
                                        author: m.author,
                                        cover: m.cover,
                                        rating: m.ratingAverage,
                                        chapter: m.latestChapterNumber ? Number(m.latestChapterNumber) : undefined,
                                    }}
                                    onClick={() => navigate(`/titles/${m.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filtered.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => navigate(`/titles/${m.id}`)}
                                    className="flex items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface px-4 py-3 text-left transition-colors hover:border-mr-accent"
                                >
                                    <div
                                        className="size-12 shrink-0 rounded-mr-xs bg-cover bg-center bg-mr-tertiary/20"
                                        style={
                                            m.cover
                                                ? {
                                                      backgroundImage: `url(${m.cover})`,
                                                  }
                                                : undefined
                                        }
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-mr-body font-mr-bold text-mr-fg">{m.name}</p>
                                        <p className="text-mr-tiny text-mr-fg-muted">{m.author}</p>
                                    </div>
                                    {m.latestChapterNumber && <Badge variant="neutral">Cap. {m.latestChapterNumber}</Badge>}
                                </button>
                            ))}
                        </div>
                    )}

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
