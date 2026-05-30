import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { SearchField } from '@ui/SearchField';
import { MangaCard } from '@ui/MangaCard';
import { Pagination } from '@ui/Pagination';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import { useSearchTitles } from '@entities/manga';

const CARDS_PER_PAGE = 20;

const SearchResults = () => {
    const { t } = useTranslation('manga');
    const navigate = useAppNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') ?? '';
    const [page, setPage] = useState(0);

    const { data, isLoading, isError } = useSearchTitles(query, page, CARDS_PER_PAGE);

    const handleQueryChange = (value: string) => {
        setPage(0);
        setSearchParams(value ? { q: value } : {});
    };

    const handlePageChange = (p: number) => {
        setPage(p - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PageContainer asMain size="wide" paddingY="md">
            <SectionHeader
                eyebrow={t('search.eyebrow')}
                title={query ? t('search.titleWithQuery', { query }) : t('search.titleEmpty')}
                meta={data?.totalElements ? t('search.resultsMeta', { count: data.totalElements }) : undefined}
                className="mb-6"
            />

            <div className="mb-6">
                <SearchField value={query} onChange={handleQueryChange} placeholder={t('search.placeholder')} className="max-w-[480px]" autoFocus />
            </div>

            {!query && <EmptyState illustration="pensando" title={t('search.emptyTitle')} description={t('search.emptyDescription')} />}

            {query && isLoading && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <Skeleton variant="rect" height={220} className="rounded-mr-md" />
                            <Skeleton variant="text" lines={2} />
                        </div>
                    ))}
                </div>
            )}

            {query && isError && <EmptyState illustration="triste" title={t('search.errorTitle')} description={t('search.errorDescription')} />}

            {query && !isLoading && !isError && data && data.content.length === 0 && (
                <EmptyState
                    illustration="duvida"
                    title={t('search.noResultsTitle')}
                    description={t('search.noResultsDescription', {
                        query,
                    })}
                />
            )}

            {query && !isLoading && !isError && data && data.content.length > 0 && (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                        {data.content.map(title => (
                            <MangaCard
                                key={title.id}
                                manga={{
                                    id: title.id,
                                    title: title.name,
                                    author: title.author,
                                    cover: title.cover,
                                    rating: title.ratingAverage,
                                    chapter: title.latestChapterNumber ? Number(title.latestChapterNumber) : undefined,
                                }}
                                onClick={() => navigate(`/titles/${title.id}`)}
                            />
                        ))}
                    </div>

                    {data.totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination page={page + 1} total={data.totalPages} onChange={handlePageChange} />
                        </div>
                    )}
                </>
            )}
        </PageContainer>
    );
};

export default SearchResults;
