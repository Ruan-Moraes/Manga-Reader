import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getAuthorBySlug, getAuthorWorks } from '../api/authorService';

export const useAuthor = (slug?: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.AUTHOR_DETAIL, slug],
        queryFn: ({ signal }) => getAuthorBySlug(slug!, signal),
        enabled: Boolean(slug),
        staleTime: 5 * 60 * 1000,
    });

export const useAuthorWorks = (authorId: number | undefined, page: number, kind?: 'AUTHOR' | 'ARTIST', size = 20) =>
    useQuery({
        queryKey: [QUERY_KEYS.AUTHOR_WORKS, authorId, kind, page, size],
        queryFn: ({ signal }) => getAuthorWorks(authorId!, page, size, kind, signal),
        enabled: authorId != null,
        placeholderData: previous => previous,
    });
