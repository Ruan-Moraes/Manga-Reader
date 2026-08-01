import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Building2, ChevronRight, Palette, PenTool, Sparkles, Users } from 'lucide-react';

import {
    CatalogResultCard,
    useCatalogSearch,
    useGlobalSearchSuggestions,
    type GlobalSearchEntityType,
    type GlobalSearchResult,
} from '@features/search-catalog';
import { trackBehavior } from '@features/track-user-behavior';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { useDebouncedValue } from '@shared/hook/useDebouncedValue';
import { cn } from '@shared/lib/cn';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { PageContainer } from '@ui/PageContainer';
import { Pagination } from '@ui/Pagination';
import { SearchField } from '@ui/SearchField';
import { SectionHeader } from '@ui/SectionHeader';
import { Skeleton } from '@ui/Skeleton';

const PAGE_SIZE = 20;
const OVERVIEW_LIMIT = 6;
const TYPES: Array<'ALL' | GlobalSearchEntityType> = ['ALL', 'TITLE', 'AUTHOR', 'ARTIST', 'PUBLISHER', 'GROUP'];
const TYPE_ICONS = {
    ALL: Sparkles,
    TITLE: BookOpen,
    AUTHOR: PenTool,
    ARTIST: Palette,
    PUBLISHER: Building2,
    GROUP: Users,
} satisfies Record<'ALL' | GlobalSearchEntityType, typeof Sparkles>;

const SearchResults = () => {
    const { t } = useTranslation('manga');
    const navigate = useAppNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') ?? '';
    const [searchInput, setSearchInput] = useState(query);
    const debouncedSearchInput = useDebouncedValue(searchInput, 350);
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    const type = parseType(searchParams.get('type'));
    const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0);
    const isValid = normalizedQuery.length >= 2 && normalizedQuery.length <= 100;
    const overview = useGlobalSearchSuggestions(type === 'ALL' && isValid ? normalizedQuery : '', OVERVIEW_LIMIT);
    const results = useCatalogSearch(normalizedQuery, type === 'ALL' ? undefined : type, page, PAGE_SIZE);
    const trackedQuery = useRef('');
    const total = type === 'ALL' ? overview.data?.totalElements : results.data?.totalElements;

    useEffect(() => setSearchInput(query), [query]);

    useEffect(() => {
        if (debouncedSearchInput === query) return;
        setSearchParams(debouncedSearchInput ? { q: debouncedSearchInput, type: 'ALL' } : {}, { replace: true });
    }, [debouncedSearchInput, query, setSearchParams]);

    useEffect(() => {
        if (!isValid || total == null || trackedQuery.current === `${normalizedQuery}:${type}`) return;
        trackedQuery.current = `${normalizedQuery}:${type}`;
        void trackBehavior({ type: 'SEARCH_PERFORMED', searchTerm: normalizedQuery, resultCount: total, source: 'SEARCH' });
        if (total === 0) void trackBehavior({ type: 'SEARCH_NO_RESULTS', searchTerm: normalizedQuery, resultCount: 0, source: 'SEARCH' });
    }, [isValid, normalizedQuery, total, type]);

    const setType = (next: 'ALL' | GlobalSearchEntityType) => {
        setSearchParams({ q: normalizedQuery, type: next });
    };
    const setPage = (next: number) => {
        setSearchParams({ q: normalizedQuery, type, page: String(next) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const loading = type === 'ALL' ? overview.isLoading : results.isLoading;
    const error = type === 'ALL' ? overview.isError : results.isError;
    const retry = type === 'ALL' ? overview.refetch : results.refetch;
    const empty = type === 'ALL'
        ? overview.data?.sections.length === 0
        : results.data?.content.length === 0;

    return (
        <PageContainer asMain size="default" paddingY="md">
            <div className="relative mb-7 overflow-hidden rounded-mr-lg border border-mr-separator bg-mr-surface px-4 py-5 shadow-sm sm:px-6 sm:py-7">
                <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-mr-full bg-mr-accent-10 blur-3xl" />
                <div className="relative">
                    <SectionHeader
                        eyebrow={t('search.eyebrow')}
                        title={query ? t('search.titleWithQuery', { query }) : t('search.titleEmpty')}
                        meta={total != null ? t('search.resultsMeta', { count: total }) : undefined}
                        className="mb-5"
                    />
                    <SearchField value={searchInput} onChange={setSearchInput} placeholder={t('search.placeholder')} className="max-w-[560px]" autoFocus />
                </div>
            </div>

            {isValid && (
                <div className="mb-8 overflow-x-auto pb-1">
                    <div className="flex w-max gap-2 rounded-mr-full border border-mr-separator bg-mr-surface p-1" role="tablist" aria-label={t('search.filtersAria')}>
                        {TYPES.map(item => {
                            const Icon = TYPE_ICONS[item];
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    role="tab"
                                    aria-selected={type === item}
                                    onClick={() => setType(item)}
                                    className={cn(
                                        'mr-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-mr-full px-3 py-2 text-mr-small font-mr-bold motion-safe:transition-all motion-safe:duration-mr-default',
                                        type === item ? 'bg-mr-primary text-mr-on-primary shadow-sm' : 'text-mr-fg-muted hover:bg-mr-accent-10 hover:text-mr-fg',
                                    )}
                                >
                                    <Icon className="size-3.5" aria-hidden="true" />
                                    {t(`search.filter.${item}`)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!query && <EmptyState illustration="pensando" title={t('search.emptyTitle')} description={t('search.emptyDescription')} />}
            {query && !isValid && <EmptyState illustration="pensando" title={t('search.titleEmpty')} description={t('search.tooShortDescription')} />}
            {isValid && loading && <ResultsSkeleton />}
            {isValid && error && (
                <EmptyState
                    illustration="triste"
                    title={t('search.errorTitle')}
                    description={t('search.errorDescription')}
                    action={<Button variant="ghost" onClick={() => void retry()}>{t('search.retry')}</Button>}
                />
            )}
            {isValid && !loading && !error && empty && (
                <EmptyState illustration="duvida" title={t('search.noResultsTitle')} description={t('search.noResultsDescription', { query: normalizedQuery })} />
            )}

            {isValid && !loading && !error && type === 'ALL' && overview.data && (
                <div className="space-y-9">
                    {overview.data.sections.map(section => {
                        const Icon = TYPE_ICONS[section.type];
                        return (
                        <section key={section.type} aria-labelledby={`search-section-${section.type}`}>
                            <div className="mb-4 flex items-center justify-between gap-4 border-b border-mr-separator pb-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 items-center justify-center rounded-mr-sm bg-mr-accent-10 text-mr-accent-fg">
                                        <Icon className="size-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                    <h2 id={`search-section-${section.type}`} className="text-xl font-mr-extrabold text-mr-fg">{t(`search.type.${section.type}`)}</h2>
                                    <p className="text-mr-small text-mr-fg-muted">{t('search.categoryCount', { count: section.totalElements, category: t(`search.filter.${section.type}`) })}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => setType(section.type)} className="group">
                                    {t('search.viewCategory', { category: t(`search.filter.${section.type}`) })}
                                    <ChevronRight className="ml-1 size-3.5 motion-safe:transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                </Button>
                            </div>
                            <ResultGrid items={section.items} onOpen={result => openResult(result, navigate, normalizedQuery)} />
                        </section>
                        );
                    })}
                </div>
            )}

            {isValid && !loading && !error && type !== 'ALL' && results.data && results.data.content.length > 0 && (
                <>
                    <ResultGrid items={results.data.content} onOpen={result => openResult(result, navigate, normalizedQuery)} />
                    {results.data.totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination page={page + 1} total={results.data.totalPages} onChange={value => setPage(value - 1)} />
                        </div>
                    )}
                </>
            )}
        </PageContainer>
    );
};

const ResultGrid = ({ items, onOpen }: { items: GlobalSearchResult[]; onOpen: (result: GlobalSearchResult) => void }) => {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(result => (
                <CatalogResultCard
                    key={`${result.entityType}-${result.id}`}
                    result={result}
                    onOpen={() => onOpen(result)}
                />
            ))}
        </div>
    );
};

const ResultsSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex gap-4 rounded-mr-xs border border-mr-separator p-3">
                <Skeleton variant="rect" width={64} height={80} className="rounded-mr-xs" />
                <Skeleton variant="text" lines={3} className="flex-1" />
            </div>
        ))}
    </div>
);

const parseType = (value: string | null): 'ALL' | GlobalSearchEntityType =>
    TYPES.includes(value as 'ALL' | GlobalSearchEntityType) ? (value as 'ALL' | GlobalSearchEntityType) : 'ALL';

const openResult = (
    result: GlobalSearchResult,
    navigate: (path: string) => void,
    query: string,
) => {
    if (result.entityType === 'TITLE') {
        void trackBehavior({ type: 'SEARCH_RESULT_CLICKED', searchTerm: query, titleId: result.id, source: 'SEARCH' });
        navigate(ROUTES.TITLE_DETAIL(result.id));
        return;
    }
    if (result.entityType === 'AUTHOR') navigate(ROUTES.AUTHOR_DETAIL(result.slug ?? result.id));
    else if (result.entityType === 'ARTIST') navigate(ROUTES.ARTIST_DETAIL(result.slug ?? result.id));
    else if (result.entityType === 'PUBLISHER') navigate(ROUTES.PUBLISHER_DETAIL(result.slug ?? result.id));
    else navigate(ROUTES.GROUP_DETAIL(result.id));
};

export default SearchResults;
