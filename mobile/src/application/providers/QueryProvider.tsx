import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { LocaleQueryInvalidator } from '../gates/LocaleQueryInvalidator';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    },
});

export function QueryProvider({ children }: PropsWithChildren) {
    return (
        <QueryClientProvider client={queryClient}>
            <LocaleQueryInvalidator />
            {children}
        </QueryClientProvider>
    );
}
