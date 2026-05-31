import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { type PageResponse } from '@shared/service/http';
import { type Title, filterTitles } from '@entities/manga/@x/catalog-filter';

import type { Tag } from '../model/tag.types';
import type { Sort } from '../model/sort.types';
import type { PublicationStatus } from '../model/publication-status.types';
import type { AdultContent } from '../model/adult-content.types';

interface FilterParams {
    genres: Tag[];
    sort: Sort;
    status: PublicationStatus;
    adultContent: AdultContent;
    page: number;
    size?: number;
}

const useFilterResults = ({ genres, sort, status, adultContent, page, size = 20 }: FilterParams): UseQueryResult<PageResponse<Title>> => {
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
