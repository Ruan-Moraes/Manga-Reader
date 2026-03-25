import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import useTitleModals from './useTitleModals';

describe('useTitleModals', () => {
    it('deve iniciar com todos os modais fechados', () => {
        const { result } = renderHook(() => useTitleModals());

        expect(result.current.isRatingModalOpen).toBe(false);
        expect(result.current.isGroupsModalOpen).toBe(false);
        expect(result.current.isCartModalOpen).toBe(false);
    });

    it('deve abrir e fechar modal de rating', () => {
        const { result } = renderHook(() => useTitleModals());

        act(() => result.current.openRatingModal());
        expect(result.current.isRatingModalOpen).toBe(true);

        act(() => result.current.closeRatingModal());
        expect(result.current.isRatingModalOpen).toBe(false);
    });

    it('deve abrir e fechar modal de groups', () => {
        const { result } = renderHook(() => useTitleModals());

        act(() => result.current.openGroupsModal());
        expect(result.current.isGroupsModalOpen).toBe(true);

        act(() => result.current.closeGroupsModal());
        expect(result.current.isGroupsModalOpen).toBe(false);
    });

    it('deve abrir e fechar modal de cart', () => {
        const { result } = renderHook(() => useTitleModals());

        act(() => result.current.openCartModal());
        expect(result.current.isCartModalOpen).toBe(true);

        act(() => result.current.closeCartModal());
        expect(result.current.isCartModalOpen).toBe(false);
    });
});
