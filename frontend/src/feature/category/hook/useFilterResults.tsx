import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { type PageResponse } from '@shared/service/http';
import { type Title } from '@feature/manga';

import { filterTitles } from '@feature/manga/service/titleService';

import type { Tag } from '../type/tag.types';
import type { Sort } from '../type/sort.types';
import type { PublicationStatus } from '../type/publication-status.types';
import type { AdultContent } from '../type/adult-content.types';

interface FilterParams {
    genres: Tag[];
    sort: Sort;
    status: PublicationStatus;
    adultContent: AdultContent;
    page: number;
    size?: number;
}

const useFilterResults = ({
    genres,
    sort,
    status,
    adultContent,
    page,
    size = 20,
}: FilterParams): UseQueryResult<PageResponse<Title>> => {
    const params: Record<string, string | string[] | number | boolean> = {};

    if (genres.length > 0) {
        params.genres = genres.map(t => t.label);
    }

    if (sort) {
        params.sort = sort.toUpperCase();
    }

    if (status && status !== 'all') {
        params.status = status.toUpperCase();
    }

    if (adultContent === 'adult_content') {
        params.adult = true;
    } else if (adultContent === 'no_adult_content') {
        params.adult = false;
    }

    return useQuery<PageResponse<Title>>({
        queryKey: ['filter-titles', genres, sort, status, adultContent, page, size],
        queryFn: () => filterTitles(params, page, size),
    });
};

export default useFilterResults;
