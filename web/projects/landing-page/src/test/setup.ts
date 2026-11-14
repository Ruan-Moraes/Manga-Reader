import '@testing-library/jest-dom';

import { server } from './mocks/server';

import { afterAll, afterEach, beforeAll } from 'vitest';

class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(
        private callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit,
    ) {
        setTimeout(() => {
            this.callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                this,
            );
        }, 0);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}
globalThis.IntersectionObserver = MockIntersectionObserver;

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
