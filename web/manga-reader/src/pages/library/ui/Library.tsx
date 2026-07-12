import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, LayoutGrid, LayoutList } from 'lucide-react';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Tabs } from '@ui/Tabs';
import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';
import { SegmentedControl } from '@ui/SegmentedControl';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';

import { MangaCard } from '@entities/manga';

import { useSavedMangas, type ReadingListType } from '@features/library';

type ActiveTab = ReadingListType | 'Todos';
type Layout = 'grid' | 'list';

const Library = () => {
    const navigate = useAppNavigate();

    const { t } = useTranslation('library');

    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('recent');
    const [layout, setLayout] = useState<Layout>('grid');

    const { items, counts, activeTab, loading, hasMore, changeTab, loadMore, removeFromSaved } = useSavedMangas('Todos');

    const filtered = items.filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()));

    const sorted = [...filtered].sort((a, b) => {
        if (sort === 'az') return a.name.localeCompare(b.name);
        if (sort === 'za') return b.name.localeCompare(a.name);

        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

    const sortOptions = [
        { value: 'recent', label: t('page.sort.recent') },
        { value: 'az', label: t('page.sort.az') },
        { value: 'za', label: t('page.sort.za') },
    ];

    const layoutItems = [
        { value: 'grid', label: t('page.layout.grid'), icon: LayoutGrid },
        { value: 'list', label: t('page.layout.list'), icon: LayoutList },
    ];

    const tabItems: Array<{ value: string; label: string }> = [
        { value: 'Todos', label: t('tabLabel.all', { count: counts.total }) },
        {
            value: 'Lendo',
            label: t('tabLabel.reading', { count: counts.lendo }),
        },
        {
            value: 'Quero Ler',
            label: t('tabLabel.wantToRead', { count: counts.queroLer }),
        },
        {
            value: 'Concluído',
            label: t('tabLabel.completed', { count: counts.concluido }),
        },
    ];

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader
                eyebrow={t('page.eyebrow')}
                title={t('page.title')}
                meta={t('page.worksCount', { count: counts.total })}
                action={
                    <Button variant="raised" icon={Plus}>
                        {t('page.addButton')}
                    </Button>
                }
                className="mb-4"
            />

            <div className="mb-4">
                <Tabs items={tabItems} value={activeTab} onChange={v => changeTab(v as ActiveTab)} variant="underline" />
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
                <SearchField value={query} onChange={setQuery} placeholder={t('page.searchPlaceholder')} className="flex-1 min-w-[180px]" />
                <Select value={sort} onChange={e => setSort(e.target.value)} options={sortOptions} className="w-40" />
                <SegmentedControl items={layoutItems} value={layout} onChange={v => setLayout(v as Layout)} size="md" unified={true} iconOnly />
            </div>

            {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={260} className="rounded-mr-xs" />
                    ))}
                </div>
            ) : sorted.length === 0 ? (
                query ? (
                    <EmptyState illustration="duvida" title={t('emptySearch.title')} description={t('emptySearch.description')} />
                ) : (
                    <EmptyState
                        illustration="pensando"
                        title={t('emptyCollection.title')}
                        description={t('emptyCollection.description')}
                        action={
                            <Button variant="primary" onClick={() => navigate(ROUTES.CATALOG)}>
                                {t('emptyCollection.discoverButton')}
                            </Button>
                        }
                    />
                )
            ) : layout === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {sorted.map(m => (
                        <MangaCard
                            key={m.titleId}
                            manga={{
                                id: m.titleId,
                                title: m.name,
                                cover: m.cover,
                            }}
                            size="md"
                            onClick={() => navigate(ROUTES.TITLE_DETAIL(m.titleId))}
                            inLibrary
                            onToggleLibrary={() => removeFromSaved(m.titleId)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {sorted.map(m => (
                        <div
                            key={m.titleId}
                            className="flex items-center gap-3 rounded-mr-xs border border-mr-border bg-mr-surface px-4 py-3 transition-colors hover:border-mr-accent"
                        >
                            <button type="button" className="flex flex-1 items-center gap-3 text-left" onClick={() => navigate(ROUTES.TITLE_DETAIL(m.titleId))}>
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
                                    <p className="text-mr-tiny text-mr-fg-muted">{m.type}</p>
                                </div>
                                <span className="text-mr-tiny text-mr-fg-subtle">{m.list}</span>
                            </button>
                            <Button variant="ghost" size="sm" onClick={() => removeFromSaved(m.titleId)} className="text-mr-danger shrink-0">
                                {t('page.remove')}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {hasMore && !loading && (
                <div className="mt-8 flex justify-center">
                    <Button variant="raised" onClick={loadMore}>
                        {t('page.loadMore')}
                    </Button>
                </div>
            )}
        </PageContainer>
    );
};

export default Library;
