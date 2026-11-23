import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { usePrivacySettingsStore } from '@/entities/user';
import { api } from '@/shared/api';
import { ThemeProvider } from '@/shared/theme';
import { ConfirmDialog } from '@/shared/ui';

import { resetPrivacyMutationRuntime } from '../../index';
import { PrivacyControlsPanel } from '../PrivacyControlsPanel';

const privacy = {
    commentVisibility: 'PUBLIC' as const,
    viewHistoryVisibility: 'PRIVATE' as const,
    libraryVisibility: 'PUBLIC' as const,
    adultContentPreference: 'BLUR' as const,
    behaviorAnalyticsEnabled: true,
};

describe('MOB-FEAT-006 PrivacyControlsPanel', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(() => {
        apiMock.reset();
        resetPrivacyMutationRuntime();
        usePrivacySettingsStore.getState().beginIdentity(1);
        usePrivacySettingsStore.getState().hydrate(1, privacy);
    });
    afterAll(() => apiMock.restore());

    it('mapeia cada preferência para o grupo correto e identifica a seleção', () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        const comments = screen.getByLabelText('Comentários');
        const library = screen.getByLabelText('Biblioteca');
        const history = screen.getByLabelText('Histórico');
        const adult = screen.getByLabelText('Conteúdo adulto');

        expect(within(comments).getByRole('radio', { name: 'Público' }).props.accessibilityState.selected).toBe(true);
        expect(within(library).getByRole('radio', { name: 'Público' }).props.accessibilityState.selected).toBe(true);
        expect(within(history).getByRole('radio', { name: 'Privado' }).props.accessibilityState.selected).toBe(true);
        expect(within(adult).getByRole('radio', { name: 'Ocultar inicialmente' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByRole('switch', { name: 'Analytics comportamental' }).props.accessibilityState).toEqual({ checked: true, disabled: false });
    });

    it('explica e desabilita analytics quando não rastrear está confirmado', () => {
        usePrivacySettingsStore.getState().hydrate(1, { ...privacy, behaviorAnalyticsEnabled: false, viewHistoryVisibility: 'DO_NOT_TRACK' });
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        expect(screen.getByText('Indisponível enquanto “Não rastrear” estiver ativo.')).toBeOnTheScreen();
        expect(screen.getByRole('switch', { name: 'Analytics comportamental' })).toBeDisabled();
    });

    it('cancela DNT sem request e confirma em folha com explicação da limpeza (MOB-FEAT-062 AC-007)', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByRole('radio', { name: 'Não rastrear' }));
        expect(screen.getByRole('header', { name: 'Parar de rastrear o histórico?' })).toBeOnTheScreen();
        expect(screen.getByText(/posição funcional de leitura será preservada/)).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
        await act(async () => undefined);
        expect(apiMock.history.patch).toHaveLength(0);
        expect(screen.queryByTestId('confirm-sheet')).toBeNull();

        apiMock.onPatch('/users/me/privacy').reply(200, {
            data: { ...privacy, viewHistoryVisibility: 'DO_NOT_TRACK', behaviorAnalyticsEnabled: false },
        });
        fireEvent.press(screen.getByRole('radio', { name: 'Não rastrear' }));
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
        expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
            viewHistoryVisibility: 'DO_NOT_TRACK',
            behaviorAnalyticsEnabled: false,
        });
    });

    it('confirma a desativação do analytics em folha e cancelar não muda nada (MOB-FEAT-062 AC-007)', async () => {
        apiMock.onPatch('/users/me/privacy').reply(200, { data: { ...privacy, behaviorAnalyticsEnabled: false } });
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent(screen.getByRole('switch', { name: 'Analytics comportamental' }), 'valueChange', false);
        expect(screen.getByRole('header', { name: 'Desativar analytics?' })).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-backdrop'));
        await act(async () => undefined);
        expect(apiMock.history.patch).toHaveLength(0);

        fireEvent(screen.getByRole('switch', { name: 'Analytics comportamental' }), 'valueChange', false);
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
        expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({ behaviorAnalyticsEnabled: false });
    });

    it('consome falha da mutação e oferece retry sem rejeição não tratada', async () => {
        apiMock.onPatch('/users/me/privacy').reply(500);
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getAllByRole('radio', { name: 'Privado' })[0]);

        await waitFor(() => expect(screen.getByText('Tentar salvar novamente')).toBeOnTheScreen());
        expect(usePrivacySettingsStore.getState().current).toEqual(privacy);
    });

    const renderPanel = () =>
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

    it('revisão 2026-11-13: o diálogo mantém o texto do analytics enquanto fecha', async () => {
        renderPanel();

        fireEvent(screen.getByRole('switch', { name: 'Analytics comportamental' }), 'valueChange', false);
        fireEvent.press(screen.getByTestId('confirm-sheet-backdrop'));
        await act(async () => undefined);

        const dialog = screen.UNSAFE_getByType(ConfirmDialog);
        expect(dialog.props.visible).toBe(false);
        expect(dialog.props.title).toBe('Desativar analytics?');
    });

    it('revisão 2026-11-13: mostra carregamento enquanto as preferências não chegam', () => {
        usePrivacySettingsStore.getState().beginIdentity(2);
        renderPanel();

        expect(screen.getByTestId('privacy-loading')).toBeOnTheScreen();
        expect(screen.getAllByText('Carregando suas preferências de privacidade…').length).toBeGreaterThan(0);
    });
});
