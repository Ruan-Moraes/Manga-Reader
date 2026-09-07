import '@testing-library/jest-dom/vitest';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import i18n from '@/i18n/config';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, expect, vi } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

// A entry '/vitest' do jest-dom faz `import 'vitest'` sem declará-lo como
// dependência; com duas majors de vitest no workspace (landing 3.x / este app
// 4.x) o pnpm resolve a cópia errada e os matchers caem no expect do vitest 3
// (DT-53: "Invalid Chai property"). O extend explícito abaixo registra no
// expect DESTE runtime; o import da entry acima fica só pelos types globais.
expect.extend(jestDomMatchers);

// Accessibility assertions (axe-core) — enables `expect(...).toHaveNoViolations()`
expect.extend(toHaveNoViolations);

// jsdom does not implement IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
});

// jsdom does not implement <dialog> showModal/close — polyfill so components
// built on the native <dialog> (e.g. shared/ui/Modal) are testable.
if (typeof HTMLDialogElement !== 'undefined') {
    if (!HTMLDialogElement.prototype.showModal) {
        HTMLDialogElement.prototype.showModal = function showModal() {
            this.open = true;
        };
    }
    if (!HTMLDialogElement.prototype.close) {
        HTMLDialogElement.prototype.close = function close() {
            this.open = false;
            this.dispatchEvent(new Event('close'));
        };
    }
}

import { server } from './mocks/server';

void i18n.changeLanguage('pt-BR');

// Default global mock for `@entities/label` — useDomainLabels hook reads
// `i18n.language` via `useTranslation()` and needs QueryClientProvider.
// Modal/component tests typically don't wrap with provider; mocking the
// hook avoids the dependency. Tests that need real domain label data
// override locally with their own `vi.mock('@entities/label', () => ...)`.
vi.mock('@entities/label', () => ({
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
