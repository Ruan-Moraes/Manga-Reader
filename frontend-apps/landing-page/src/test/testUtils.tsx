import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n/config';

import type { ReactNode } from 'react';

i18n.changeLanguage('pt-BR');

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}

export function TestProviders({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </I18nextProvider>
    );
}

export function renderHookWithProviders<T>(hook: () => T) {
    return renderHook(hook, { wrapper: TestProviders });
}
