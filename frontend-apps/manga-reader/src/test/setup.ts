import '@testing-library/jest-dom/vitest';
import i18n from '@/i18n/config';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

import { server } from './mocks/server';

void i18n.changeLanguage('pt-BR');

// Default global mock for `@feature/label` — useDomainLabels hook reads
// `i18n.language` via `useTranslation()` and needs QueryClientProvider.
// Modal/component tests typically don't wrap with provider; mocking the
// hook avoids the dependency. Tests that need real domain label data
// override locally with their own `vi.mock('@feature/label', () => ...)`.
vi.mock('@feature/label', () => ({
    useDomainLabels: () => ({ data: [] }),
    LABEL_TYPES: {
        PUBLICATION_STATUS: 'publication_status',
        NEWS_CATEGORY: 'news_category',
        EVENT_TYPE: 'event_type',
        EVENT_STATUS: 'event_status',
        EVENT_TIMELINE: 'event_timeline',
        CURRENCY: 'currency',
    },
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
    cleanup();
    server.resetHandlers();
    localStorage.clear();
});

afterAll(() => server.close());
