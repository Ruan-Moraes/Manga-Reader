import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Chapter } from '@feature/chapter';

import useChapterSort from './useChapterSort';

const buildChapters = (): Chapter[] => [
    {
        number: '3',
        title: 'Capitulo 3',
        releaseDate: '2025-01-03',
        pages: '20',
    },
    {
        number: '1',
        title: 'Capitulo 1',
        releaseDate: '2025-01-01',
        pages: '18',
    },
    {
        number: '2',
        title: 'Capitulo 2',
        releaseDate: '2025-01-02',
        pages: '22',
    },
];

describe('useChapterSort', () => {
    it('deve iniciar com ordenacao ascendente', () => {
        const { result } = renderHook(() => useChapterSort(buildChapters()));

        expect(result.current.isAscending).toBe(true);
        expect(result.current.filteredAndSortedChapters[0].number).toBe('1');
        expect(result.current.filteredAndSortedChapters[2].number).toBe('3');
    });

    it('deve inverter ordenacao ao chamar handleSortClick', () => {
        const { result } = renderHook(() => useChapterSort(buildChapters()));

        act(() => {
            result.current.handleSortClick();
        });

        expect(result.current.isAscending).toBe(false);
        expect(result.current.filteredAndSortedChapters[0].number).toBe('3');
        expect(result.current.filteredAndSortedChapters[2].number).toBe('1');
    });

    it('deve filtrar capitulos por termo de busca no numero', () => {
        const { result } = renderHook(() => useChapterSort(buildChapters()));

        act(() => {
            result.current.setSearchTerm('2');
        });

        expect(result.current.filteredAndSortedChapters).toHaveLength(1);
        expect(result.current.filteredAndSortedChapters[0].number).toBe('2');
    });

    it('deve filtrar capitulos por termo de busca no titulo', () => {
        const { result } = renderHook(() => useChapterSort(buildChapters()));

        act(() => {
            result.current.setSearchTerm('Capitulo 3');
        });

        expect(result.current.filteredAndSortedChapters).toHaveLength(1);
    });

    it('deve retornar todos os capitulos quando searchTerm esta vazio', () => {
        const { result } = renderHook(() => useChapterSort(buildChapters()));

        act(() => {
            result.current.setSearchTerm('   ');
        });

        expect(result.current.filteredAndSortedChapters).toHaveLength(3);
    });
});
