import type { PublicStats } from '@toonlira/types';

export function buildStats(overrides: Partial<PublicStats> = {}): PublicStats {
    return {
        totalTitles: 250,
        totalChapters: 4820,
        ...overrides,
    };
}
