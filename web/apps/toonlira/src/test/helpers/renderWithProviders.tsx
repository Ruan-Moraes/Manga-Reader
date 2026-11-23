import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { type ReactElement, type ReactNode } from 'react';

import { CommentSortProvider } from '@entities/comment';
import { UserModalProvider, ProfileSettingsModalProvider } from '@entities/user';
import { AuthProvider } from '@features/auth';

export const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

interface TestProvidersProps {
    children: ReactNode;
    client?: QueryClient;
}

// Espelha a árvore de providers do main.tsx (sem router) — para testes que
// precisam do próprio MemoryRouter, envolva-o com <TestProviders>.
export const TestProviders = ({ children, client }: TestProvidersProps) => (
    <QueryClientProvider client={client ?? createTestQueryClient()}>
        <AuthProvider>
            <UserModalProvider>
                <ProfileSettingsModalProvider>
                    <CommentSortProvider>{children}</CommentSortProvider>
                </ProfileSettingsModalProvider>
            </UserModalProvider>
        </AuthProvider>
    </QueryClientProvider>
);

const AllProviders = ({ children }: { children: ReactNode }) => (
    <TestProviders>
        <BrowserRouter>{children}</BrowserRouter>
    </TestProviders>
);

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => render(ui, { wrapper: AllProviders, ...options });
