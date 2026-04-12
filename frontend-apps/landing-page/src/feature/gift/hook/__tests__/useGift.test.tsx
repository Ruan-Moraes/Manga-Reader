import { describe, expect, it } from 'vitest';

import { useCreateGift, useRedeemGift } from '../useGift';
import { renderHookWithProviders } from '@/test/testUtils';

describe('useCreateGift', () => {
    it('returns a mutation function', () => {
        const { result } = renderHookWithProviders(() => useCreateGift());

        expect(result.current.mutateAsync).toBeDefined();
        expect(result.current.isIdle).toBe(true);
    });
});

describe('useRedeemGift', () => {
    it('returns a mutation function', () => {
        const { result } = renderHookWithProviders(() => useRedeemGift());

        expect(result.current.mutateAsync).toBeDefined();
        expect(result.current.isIdle).toBe(true);
    });
});
