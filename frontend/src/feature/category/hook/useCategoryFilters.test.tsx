import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import useCategoryFilters from './useCategoryFilters';

describe('useCategoryFilters', () => {
    it('deve iniciar com valores padrao', () => {
        const { result } = renderHook(() => useCategoryFilters());

        expect(result.current.selectedTags).toEqual([]);
        expect(result.current.selectedSort).toBe('most_read');
        expect(result.current.selectedStatus).toBe('ongoing');
        expect(result.current.selectedAdultContent).toBe('no_adult_content');
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
            result.current.handleStatusChange('completed');
        });

        expect(result.current.selectedStatus).toBe('completed');
    });

    it('deve atualizar adultContent ao chamar handleAdultContentChange', () => {
        const { result } = renderHook(() => useCategoryFilters());

        act(() => {
            result.current.handleAdultContentChange('adult_content');
        });

        expect(result.current.selectedAdultContent).toBe('adult_content');
    });

    it('deve gerar filterUrl com parametros selecionados', () => {
        const { result } = renderHook(() => useCategoryFilters());

        expect(result.current.filterUrl).toContain('sort=most_read');
        expect(result.current.filterUrl).toContain('status=ongoing');
        expect(result.current.filterUrl).toContain(
            'adult_content=no_adult_content',
        );
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
});
