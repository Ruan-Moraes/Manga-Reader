import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { Group } from '@entities/group';

import { useGroupFilters } from '../useGroupFilters';

const makeGroup = (over: Partial<Group>): Group =>
    ({
        id: 'x',
        name: 'Grupo',
        genres: [],
        supporters: [],
        translatedWorks: [],
        ...over,
    }) as Group;

const groups: Group[] = [
    makeGroup({ id: 'a', name: 'Alpha Scan', genres: ['Ação'], supporters: [{}, {}] as Group['supporters'], translatedWorks: [{ chapters: 10 }] as Group['translatedWorks'] }),
    makeGroup({ id: 'b', name: 'Beta Team', genres: ['Romance'], supporters: [{}] as Group['supporters'], translatedWorks: [{ chapters: 50 }] as Group['translatedWorks'] }),
    makeGroup({ id: 'c', name: 'Gamma', genres: ['Ação', 'Comédia'], supporters: [] as Group['supporters'], translatedWorks: [] as Group['translatedWorks'] }),
];

describe('useGroupFilters', () => {
    it('ordena por seguidores por padrão (desc)', () => {
        const { result } = renderHook(() => useGroupFilters(groups));
        expect(result.current.visible.map(g => g.id)).toEqual(['a', 'b', 'c']);
    });

    it('ordena por capítulos traduzidos', () => {
        const { result } = renderHook(() => useGroupFilters(groups));
        act(() => result.current.setSortBy('chapters'));
        expect(result.current.visible.map(g => g.id)).toEqual(['b', 'a', 'c']);
    });

    it('ordena alfabeticamente', () => {
        const { result } = renderHook(() => useGroupFilters(groups));
        act(() => result.current.setSortBy('alpha'));
        expect(result.current.visible.map(g => g.id)).toEqual(['a', 'b', 'c']);
    });

    it('filtra por nome (case-insensitive)', () => {
        const { result } = renderHook(() => useGroupFilters(groups));
        act(() => result.current.setQuery('beta'));
        expect(result.current.visible.map(g => g.id)).toEqual(['b']);
    });

    it('filtra por gênero', () => {
        const { result } = renderHook(() => useGroupFilters(groups));
        act(() => result.current.setQuery('ação'));
        expect(result.current.visible.map(g => g.id).sort()).toEqual(['a', 'c']);
    });
});
