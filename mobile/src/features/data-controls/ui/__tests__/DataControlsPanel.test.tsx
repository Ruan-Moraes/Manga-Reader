import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { useSessionStore } from '@/entities/session';
import { clearLocalData, measureLocalData } from '@/shared/storage';
import { ThemeProvider } from '@/shared/theme';
import { ToastHost } from '@/shared/ui';

import { DataControlsPanel } from '../DataControlsPanel';

jest.mock('@/shared/storage', () => {
    const actual = jest.requireActual('@/shared/storage');
    return { ...actual, clearLocalData: jest.fn(actual.clearLocalData), measureLocalData: jest.fn(actual.measureLocalData) };
});

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
        expect(screen.getByText('Preserva')).toBeOnTheScreen();
        expect(within(screen.getByTestId('confirm-sheet-preserved')).getByText('alterações pendentes')).toBeOnTheScreen();
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
        expect(within(screen.getByTestId('confirm-sheet-preserved')).getByText('posição de leitura')).toBeOnTheScreen();
    });

    it('exibe medição somente com escopo suportado e explícito', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => ({ usedBytes: 512, scope: 'temporary-exports' }) }} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        // revisão 2026-11-13: nome simples com o tamanho ao lado.
        await waitFor(() => expect(screen.getByText('Exportações temporárias')).toBeTruthy());
        expect(screen.getByText('512 B')).toBeTruthy();
    });

    it('omite a medição quando o adaptador nativo falha', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => Promise.reject(new Error('unsupported')) }} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        await waitFor(() => expect(screen.queryByText('Exportações temporárias')).toBeNull());
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

    it('confirma a limpeza offline com notificação temporária de sucesso e atualiza o tamanho sem sair da tela (MOB-FEAT-062 AC-008)', async () => {
        const measure = jest
            .mocked(measureLocalData)
            .mockResolvedValueOnce({ totalBytes: 2048, participantIds: ['project-1'] })
            .mockResolvedValue({ totalBytes: 0, participantIds: [] });
        const clear = jest.mocked(clearLocalData).mockResolvedValue(undefined as never);
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => ({ usedBytes: 0, scope: 'temporary-exports' }) }} />
                    <ToastHost />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(await screen.findByText('Limpar dados offline (2 KB)'));
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));

        expect(await screen.findByText('Dados offline removidos')).toBeOnTheScreen();
        // Notificação temporária: fora do fluxo da tela.
        expect(screen.getByTestId('toast')).toBeOnTheScreen();
        expect(clear).toHaveBeenCalledWith(['project-1']);
        await waitFor(() => expect(screen.queryByText(/Limpar dados offline \(/)).toBeNull());
        expect(screen.getByText('Nenhum projeto ou arquivo offline foi armazenado neste aparelho.')).toBeOnTheScreen();
        expect(measure.mock.calls.length).toBeGreaterThan(1);
    });

    const renderPanel = () =>
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider>
                    <DataControlsPanel storageMeasurement={{ measure: async () => ({ usedBytes: 0, scope: 'temporary-exports' }) }} />
                </ThemeProvider>
            </QueryClientProvider>,
        );

    it('revisão 2026-11-13: enquanto mede, não afirma que não há dados offline', async () => {
        let resolve: (value: { totalBytes: number; participantIds: string[] }) => void = () => undefined;
        jest.mocked(measureLocalData).mockReturnValue(new Promise(done => (resolve = done)));
        renderPanel();

        expect(screen.queryByText('Nenhum projeto ou arquivo offline foi armazenado neste aparelho.')).toBeNull();
        expect(screen.getAllByText('Dados offline', { includeHiddenElements: true }).length).toBeGreaterThan(1);

        resolve({ totalBytes: 2048, participantIds: ['project-1'] });
        expect(await screen.findByText('Limpar dados offline (2 KB)')).toBeOnTheScreen();
        // A descrição da seção não se repete na linha.
        expect(screen.getAllByText('Remove projetos e arquivos locais registrados neste aparelho.')).toHaveLength(1);
    });

    it('revisão 2026-11-13: falha na medição avisa a falha em vez de dizer que está vazio', async () => {
        jest.mocked(measureLocalData).mockRejectedValue(new Error('io'));
        renderPanel();

        expect(await screen.findByText('Não foi possível medir os dados offline deste aparelho.')).toBeOnTheScreen();
        expect(screen.queryByText('Nenhum projeto ou arquivo offline foi armazenado neste aparelho.')).toBeNull();
    });
});
