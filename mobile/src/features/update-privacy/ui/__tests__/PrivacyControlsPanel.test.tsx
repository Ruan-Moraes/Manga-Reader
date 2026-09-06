import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { usePrivacySettingsStore } from '@/entities/user';
import { api } from '@/shared/api';
import { ThemeProvider } from '@/shared/theme';

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

    it('cancela DNT sem request e confirma com explicação da limpeza', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ThemeProvider waitForPlatform={false}>
                    <PrivacyControlsPanel />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        fireEvent.press(screen.getByText('Não rastrear'));
        expect(alert).toHaveBeenCalledWith(
            'Parar de rastrear o histórico?',
            expect.stringContaining('posição funcional de leitura será preservada'),
            expect.any(Array),
        );
        const buttons = alert.mock.calls[0][2] ?? [];
        buttons[0]?.onPress?.();
        expect(apiMock.history.patch).toHaveLength(0);

        apiMock.onPatch('/users/me/privacy').reply(200, {
            data: { ...privacy, viewHistoryVisibility: 'DO_NOT_TRACK', behaviorAnalyticsEnabled: false },
        });
        fireEvent.press(screen.getByText('Não rastrear'));
        const confirmButtons = alert.mock.calls[1][2] ?? [];
        confirmButtons[1]?.onPress?.();
        await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
        expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
            viewHistoryVisibility: 'DO_NOT_TRACK',
            behaviorAnalyticsEnabled: false,
        });
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
});
