import '@testing-library/jest-dom/vitest';
import i18n from '@/i18n/config';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

import { server } from './mocks/server';

void i18n.changeLanguage('pt-BR');

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
    cleanup();
    server.resetHandlers();
    localStorage.clear();
});

afterAll(() => server.close());
