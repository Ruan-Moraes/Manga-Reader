import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/src/entities/session';
import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { useSettingsStore } from '@/src/features/manage-settings';
import { api } from '@/src/shared/api';

import { PlatformStatusPage } from '../PlatformStatusPage';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

describe('MOB-FEAT-010 platform status', () => {
    const apiMock = new AxiosMockAdapter(api);
    const renderPage = () =>
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <PlatformStatusPage />
            </SafeAreaProvider>,
        );

    beforeEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('mostra identidade, sync e indisponibilidade da plataforma sem expor tabs', () => {
        useSessionStore.setState({
            isAuthenticated: true,
            user: { id: 'user-1', name: 'Ruan', email: 'ruan@example.com', role: 'MEMBER' },
        });
        useSettingsStore.setState({ settings: DEFAULT_USER_SETTINGS, syncStatus: 'synced' });

        renderPage();

        expect(screen.getByRole('header', { name: 'Conta conectada' })).toBeOnTheScreen();
        expect(screen.getByText('Ruan')).toBeOnTheScreen();
        expect(screen.getByText('ruan@example.com')).toBeOnTheScreen();
        expect(screen.getByText('Preferências sincronizadas')).toBeOnTheScreen();
        expect(screen.getByText('Estamos preparando a plataforma')).toBeOnTheScreen();
        expect(screen.queryByText('Biblioteca')).toBeNull();
    });

    it('rehidrata a conta no cold start e oferece retry sem trocar de identidade', async () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 9, user: null });
        useSettingsStore.setState({ settings: DEFAULT_USER_SETTINGS, syncStatus: 'synced' });
        apiMock
            .onGet('/auth/me')
            .replyOnce(500)
            .onGet('/auth/me')
            .reply(200, {
                data: {
                    userId: 'user-2',
                    name: 'Conta recuperada',
                    email: 'cold@example.com',
                    role: 'MEMBER',
                    accessToken: null,
                    refreshToken: null,
                    photoUrl: null,
                    adultContentPreference: null,
                },
            });

        renderPage();
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os dados da conta.'));
        fireEvent.press(screen.getByRole('button', { name: 'Tentar carregar a conta novamente' }));

        await waitFor(() => expect(screen.getByText('Conta recuperada')).toBeOnTheScreen());
        expect(useSessionStore.getState()).toMatchObject({ identityEpoch: 9, user: { id: 'user-2', email: 'cold@example.com' } });
    });
});
