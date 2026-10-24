import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/entities/session';
import { ThemeProvider } from '@/shared/theme';

import { DataControlsPanel } from '../DataControlsPanel';

describe('MOB-FEAT-007 DataControlsPanel', () => {
    afterEach(() => jest.restoreAllMocks());

    it('explica remoções e preservações antes de executar a limpeza', () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        useSessionStore.setState({ isAuthenticated: false });

        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Limpar cache'));

        expect(alert).toHaveBeenCalledWith(
            'Limpar dados regeneráveis?',
            expect.stringContaining('Preserva: sessão, preferências, alterações pendentes.'),
            expect.arrayContaining([expect.objectContaining({ style: 'cancel' }), expect.objectContaining({ style: 'destructive' })]),
        );
    });

    it('explica irreversibilidade e preservação da posição antes de limpar histórico', () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        useSessionStore.setState({ isAuthenticated: true });

        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Limpar histórico rastreado'));
        expect(alert).toHaveBeenCalledWith(
            'Limpar histórico rastreado?',
            expect.stringContaining('Preserva: posição de leitura, sessão, preferências.'),
            expect.arrayContaining([expect.objectContaining({ style: 'cancel' }), expect.objectContaining({ style: 'destructive' })]),
        );
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
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
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
        expect(alert).not.toHaveBeenCalled();
    });
});
