import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';

import { usePublicStats } from '../usePublicStats';
import { renderHookWithProviders } from '@/test/testUtils';

describe('usePublicStats', () => {
    it('fetches public stats from MSW', async () => {
        const { result } = renderHookWithProviders(() => usePublicStats());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual({
            totalTitles: 250,
            totalChapters: 4820,
        });
    });

    it('starts in loading state', () => {
        const { result } = renderHookWithProviders(() => usePublicStats());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });
});
