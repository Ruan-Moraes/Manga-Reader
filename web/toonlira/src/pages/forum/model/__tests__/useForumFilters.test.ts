import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useForumFilters } from '../useForumFilters';

describe('useForumFilters', () => {
    it('inicia em home/alta e expõe tópicos derivados', () => {
        const { result } = renderHook(() => useForumFilters());
        expect(result.current.category).toBe('home');
        expect(result.current.tab).toBe('alta');
        expect(Array.isArray(result.current.topics)).toBe(true);
    });

    it('atualiza categoria e aba', () => {
        const { result } = renderHook(() => useForumFilters());
        act(() => result.current.setTab('recentes'));
        act(() => result.current.setCategory('duvidas'));
        expect(result.current.tab).toBe('recentes');
        expect(result.current.category).toBe('duvidas');
    });

    it('reordena os tópicos quando a aba muda', () => {
        const { result } = renderHook(() => useForumFilters());
        const initial = result.current.topics;
        act(() => result.current.setTab('comentados'));
        // A lista derivada é recomputada (nova referência) ao trocar de aba.
        expect(result.current.topics).not.toBe(initial);
    });
});
