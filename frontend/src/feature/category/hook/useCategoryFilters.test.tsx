import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import useCategoryFilters from './useCategoryFilters';

describe('useCategoryFilters', () => {
    it('deve iniciar com valores padrao', () => {
        const { result } = renderHook(() => useCategoryFilters());

        expect(result.current.selectedTags).toEqual([]);
        expect(result.current.selectedSort).toBe('most_read');
        expect(result.current.selectedStatus).toBe('all');
        expect(result.current.selectedAdultContent).toBe('no_adult_content');
        expect(result.current.page).toBe(0);
    });

    it('deve atualizar sort ao chamar handleSortChange', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handleSortChange('newest');
        });

        expect(result.current.selectedSort).toBe('newest');
    });

    it('deve atualizar status ao chamar handleStatusChange', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handleStatusChange('complete');
        });

        expect(result.current.selectedStatus).toBe('complete');
    });

    it('deve atualizar adultContent ao chamar handleAdultContentChange', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handleAdultContentChange('adult_content');
        });

        expect(result.current.selectedAdultContent).toBe('adult_content');
    });

    it('deve atualizar tags ao chamar handleSelectedTags', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handleSelectedTags([
                { value: 1, label: 'Action' },
            ] as never[]);
        });

        expect(result.current.selectedTags).toHaveLength(1);
    });

    it('deve gerenciar paginacao', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handlePageChange(3);
        });

        expect(result.current.page).toBe(3);
    });

    it('deve resetar pagina quando filtro muda', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handlePageChange(5);
        });
        expect(result.current.page).toBe(5);

        act(() => {
            result.current.handleSortChange('alphabetical');
        });
        expect(result.current.page).toBe(0);
    });
});
