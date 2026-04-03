import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, type RenderHookOptions } from '@testing-library/react';
import type { ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}

export function createWrapper() {
    const queryClient = createTestQueryClient();
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export function renderHookWithProviders<TResult, TProps>(
    hook: (props: TProps) => TResult,
    options?: Omit<RenderHookOptions<TProps>, 'wrapper'>,
) {
    return renderHook(hook, { wrapper: createWrapper(), ...options });
}

export function seedAuthSession(
    overrides: Partial<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        name: string;
        email: string;
        role: string;
    }> = {},
) {
    localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
            userId: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'MEMBER',
            ...overrides,
        }),
    );
}
