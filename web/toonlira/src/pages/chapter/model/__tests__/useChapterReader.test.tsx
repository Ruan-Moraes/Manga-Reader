import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const saveProgress = vi.fn().mockResolvedValue(undefined);
const getProgress = vi.fn().mockResolvedValue(null);

vi.mock('@entities/chapter', () => ({
    readerProgressGateway: {
        saveProgress: (...args: unknown[]) => saveProgress(...args),
        getProgress: (...args: unknown[]) => getProgress(...args),
    },
}));

import { useChapterReader } from '../useChapterReader';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

/** Flush de microtasks pendentes (resolução do getProgress inicial) sem depender de timers reais. */
const flushMicrotasks = () =>
    act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });

describe('useChapterReader — persistência de progresso', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        saveProgress.mockClear();
        getProgress.mockClear();
        getProgress.mockResolvedValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('não persiste nada quando deslogado', async () => {
        const { result } = renderHook(() => useChapterReader('title-1', '1', undefined, 20, false), { wrapper });
        await flushMicrotasks();

        expect(getProgress).not.toHaveBeenCalled();

        act(() => result.current.setPage(5));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        expect(saveProgress).not.toHaveBeenCalled();
    });

    it('faz debounce dos saves intermediários (só a última posição é enviada)', async () => {
        const { result } = renderHook(() => useChapterReader('title-1', '1', undefined, 20, true), { wrapper });
        await flushMicrotasks();

        expect(getProgress).toHaveBeenCalledWith('title-1');

        act(() => result.current.setPage(3));
        act(() => result.current.setPage(4));
        act(() => result.current.setPage(5));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });
        expect(saveProgress).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        expect(saveProgress).toHaveBeenCalledTimes(1);
        expect(saveProgress).toHaveBeenCalledWith('title-1', '1', 5, 20, false);
    });

    it('envia a conclusão imediatamente, sem esperar o debounce', async () => {
        const { result } = renderHook(() => useChapterReader('title-1', '1', undefined, 20, true), { wrapper });
        await flushMicrotasks();

        act(() => result.current.setPage(20));

        expect(saveProgress).toHaveBeenCalledWith('title-1', '1', 20, 20, true);
    });

    it('faz flush da última posição ao trocar de capítulo (não perde por causa do debounce)', async () => {
        const { result, rerender } = renderHook(({ chapter }: { chapter: string }) => useChapterReader('title-1', chapter, undefined, 20, true), {
            wrapper,
            initialProps: { chapter: '1' },
        });
        await flushMicrotasks();

        act(() => result.current.setPage(7));
        // debounce ainda pendente (não avançamos o tempo) — trocar de capítulo deve fazer flush imediato
        act(() => rerender({ chapter: '2' }));

        expect(saveProgress).toHaveBeenCalledWith('title-1', '1', 7, 20, false);
    });

    it('restaura a posição salva antes de permitir novos saves (sem sobrescrever com page=1)', async () => {
        getProgress.mockResolvedValue({ chapter: 1, page: 12 });

        const { result } = renderHook(() => useChapterReader('title-1', '1', undefined, 20, true), { wrapper });
        await flushMicrotasks();

        expect(result.current.page).toBe(12);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        expect(saveProgress).not.toHaveBeenCalledWith('title-1', '1', 1, 20, false);
    });
});
