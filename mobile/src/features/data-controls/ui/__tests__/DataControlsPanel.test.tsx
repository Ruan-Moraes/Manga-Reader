import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/entities/session';
import { ThemeProvider } from '@/shared/theme';

import { DataControlsPanel } from '../DataControlsPanel';

describe('MOB-FEAT-007 DataControlsPanel', () => {
    afterEach(() => jest.restoreAllMocks());

    it('explica remoções e preservações em folha antes de executar a limpeza (MOB-FEAT-062 AC-008)', () => {
        useSessionStore.setState({ isAuthenticated: false });

        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Limpar cache'));

        expect(screen.getByRole('header', { name: 'Limpar dados regeneráveis?' })).toBeOnTheScreen();
        expect(screen.getByText(/Preserva: sessão, preferências, alterações pendentes\./)).toBeOnTheScreen();
        expect(screen.getByText('Remove')).toBeOnTheScreen();
        expect(screen.getByTestId('confirm-sheet-cancel')).toBeOnTheScreen();
        expect(screen.getByTestId('confirm-sheet-confirm')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
        expect(screen.queryByTestId('confirm-sheet')).toBeNull();
    });

    it('explica irreversibilidade e preservação da posição em folha antes de limpar histórico (MOB-FEAT-062 AC-008)', () => {
        useSessionStore.setState({ isAuthenticated: true });

        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Limpar histórico rastreado'));
        expect(screen.getByRole('header', { name: 'Limpar histórico rastreado?' })).toBeOnTheScreen();
        expect(screen.getByText(/Preserva: posição de leitura, sessão, preferências\./)).toBeOnTheScreen();
    });

    it('exibe medição somente com escopo suportado e explícito', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => ({ usedBytes: 512, scope: 'temporary-exports' }) }} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        await waitFor(() => expect(screen.getByText('512 B em exportações temporárias controladas pelo app')).toBeTruthy());
    });

    it('omite a medição quando o adaptador nativo falha', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => Promise.reject(new Error('unsupported')) }} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        await waitFor(() => expect(screen.queryByText(/bytes em/)).toBeNull());
    });

    it('encaminha ações privadas do guest ao login sem confirmação ou request privado', () => {
        const authenticate = jest.fn();
        useSessionStore.setState({ isAuthenticated: false });
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel onAuthenticationRequired={authenticate} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Exportar meus dados'));
        fireEvent.press(screen.getByText('Limpar histórico rastreado'));
        expect(authenticate).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('confirm-sheet')).toBeNull();
    });
});
