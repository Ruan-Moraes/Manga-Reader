import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';

import { usePlans } from '../usePlans';
import { renderHookWithProviders } from '@/test/testUtils';

describe('usePlans', () => {
    it('fetches subscription plans from MSW', async () => {
        const { result } = renderHookWithProviders(() => usePlans());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data!.length).toBe(3);
    });

    it('returns plans with correct period types', async () => {
        const { result } = renderHookWithProviders(() => usePlans());

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const periods = result.current.data!.map(p => p.period);
        expect(periods).toContain('DAILY');
        expect(periods).toContain('MONTHLY');
        expect(periods).toContain('ANNUAL');
    });
});
