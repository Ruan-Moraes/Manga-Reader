import type { PageResponse } from '@shared/service/http';

/**
 * Helper genérico para construir um PageResponse a partir de um array de itens.
 *
 * Calcula automaticamente totalPages e last com base no tamanho da página
 * — útil quando o teste precisa simular paginação multi-página sem boilerplate.
 */
export const buildPage = <T>(
    items: T[],
    page = 0,
    size = 20,
): PageResponse<T> => {
    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    return {
        content: items,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
    };
};

/**
 * Helper para simular uma página vazia (totalElements = 0, totalPages = 0).
 */
export const buildEmptyPage = <T>(size = 20): PageResponse<T> => ({
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    last: true,
});
