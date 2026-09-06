import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/entities/session';
import { usePrivacySettingsStore } from '@/entities/user';
import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { useContentLanguagesStore } from '@/features/manage-content-languages';
import { useSettingsStore } from '@/features/manage-settings';
import { usePrivacyMutationStore } from '@/features/update-privacy';
import { SettingsIndexPage } from '@/pages/settings-index';
import { api } from '@/shared/api';
import i18n from '@/shared/i18n';
import { ROUTES } from '@/shared/navigation';
import { ThemeProvider } from '@/shared/theme';

import { ProfilePage } from '../../../profile';
import { SettingsAboutPage } from '../../../settings-about';
import { SettingsAppearancePage } from '../../../settings-appearance';
import { SettingsContentLanguagesPage } from '../../../settings-content-languages';
import { SettingsDataPage } from '../../../settings-data';
import { SettingsLocalePage } from '../../../settings-locale';
import { SettingsPrivacyPage } from '../../../settings-privacy';
import { SettingsReaderPage } from '../../../settings-reader';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    router: { back: () => mockBack(), canGoBack: () => true, push: (value: unknown) => mockPush(value), replace: jest.fn() },
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
const shell = (node: ReactNode) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
        <QueryClientProvider client={client}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                {node}
            </ThemeProvider>
        </QueryClientProvider>
    </SafeAreaProvider>
);

describe('MOB-FEAT-008 Router/pages integration', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(async () => {
        mockPush.mockClear();
        mockBack.mockClear();
        apiMock.reset();
        client.clear();
        await i18n.changeLanguage('pt-BR');
        useSessionStore.setState({ isAuthenticated: false, identityEpoch: 0, tokens: null, user: null });
        useSettingsStore.setState({
            activeIdentityEpoch: null,
            guestSettings: DEFAULT_USER_SETTINGS,
            settings: DEFAULT_USER_SETTINGS,
            pendingGroup: null,
            pendingVersion: null,
            syncError: null,
            syncStatus: 'local',
        });
        useContentLanguagesStore.getState().beginGuest('pt-BR');
        usePrivacySettingsStore.getState().beginIdentity(null);
    });

    afterAll(() => apiMock.restore());

    it('navega Profile → índice → cada subrota e usa back nativo', () => {
        useSessionStore.setState({
            isAuthenticated: true,
            identityEpoch: 1,
            user: { id: 'u1', name: 'Ruan', email: 'ruan@example.com', role: 'MEMBER' },
        });
        useSettingsStore.setState({ activeIdentityEpoch: 1, syncStatus: 'synced' });
        useContentLanguagesStore.setState({ identityEpoch: 1, hydrationStatus: 'ready' });
        usePrivacySettingsStore.setState({ identityEpoch: 1 });
        usePrivacyMutationStore.setState({ syncStatus: 'idle' });

        const profile = render(shell(<ProfilePage />));
        fireEvent.press(screen.getByRole('button', { name: /Configurações/ }));
        expect(mockPush).toHaveBeenLastCalledWith(ROUTES.SETTINGS.INDEX);
        profile.unmount();

        const index = render(shell(<SettingsIndexPage />));
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(8);
        buttons.slice(1).forEach(button => fireEvent.press(button));
        expect(mockPush.mock.calls.slice(-7).map(call => call[0])).toEqual([
            ROUTES.SETTINGS.APPEARANCE,
            ROUTES.SETTINGS.LOCALE,
            ROUTES.SETTINGS.READER,
            ROUTES.SETTINGS.DATA,
            ROUTES.SETTINGS.ABOUT,
            ROUTES.SETTINGS.CONTENT_LANGUAGES,
            ROUTES.SETTINGS.PRIVACY,
        ]);
        index.unmount();

        render(shell(<SettingsAppearancePage />));
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('preserva edição confirmada ao desmontar e remontar uma subrota', async () => {
        const first = render(shell(<SettingsAppearancePage />));
        fireEvent.press(screen.getByRole('radio', { name: 'Escuro' }));
        await waitFor(() =>
            expect(screen.getByRole('radio', { name: 'Escuro' }).props.accessibilityState).toEqual(expect.objectContaining({ selected: true })),
        );
        first.unmount();

        render(shell(<SettingsAppearancePage />));
        expect(screen.getByRole('radio', { name: 'Escuro' }).props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    });

    it('mantém fundo e intervalos do leitor após a interação', async () => {
        render(shell(<SettingsReaderPage />));

        fireEvent.press(screen.getByRole('radio', { name: 'Papel' }));
        fireEvent(screen.getByRole('adjustable', { name: 'Saturação' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'decrement' },
        });
        fireEvent(screen.getByRole('adjustable', { name: 'Espaçamento' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'increment' },
        });
        fireEvent(screen.getByRole('adjustable', { name: 'Pré-carregamento' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'increment' },
        });

        await waitFor(() =>
            expect(useSettingsStore.getState().settings.reader).toEqual(expect.objectContaining({ background: 'PAPER', gap: 1, preload: 4, saturation: 95 })),
        );
        expect(screen.getByRole('radio', { name: 'Papel' }).props.accessibilityState.selected).toBe(true);
    });

    it('compõe diretamente as sete subrotas localizadas com identidade alinhada', () => {
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 9 });
        useSettingsStore.setState({ activeIdentityEpoch: 9, syncStatus: 'synced' });
        useContentLanguagesStore.setState({ identityEpoch: 9, hydrationStatus: 'ready' });
        usePrivacySettingsStore.setState({ identityEpoch: 9 });
        usePrivacyMutationStore.setState({ syncStatus: 'idle' });
        const routes = [
            [SettingsAppearancePage, 'Aparência e acessibilidade'],
            [SettingsLocalePage, 'Idioma e região'],
            [SettingsContentLanguagesPage, 'Idiomas do conteúdo'],
            [SettingsReaderPage, 'Leitor'],
            [SettingsPrivacyPage, 'Privacidade'],
            [SettingsDataPage, 'Dados e armazenamento'],
            [SettingsAboutPage, 'Sobre'],
        ] as const;

        routes.forEach(([Page, title]) => {
            const route = render(shell(createElement(Page)));
            expect(screen.getAllByText(title).length).toBeGreaterThan(0);
            fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
            route.unmount();
        });
        expect(mockBack).toHaveBeenCalledTimes(routes.length);
    });

    it('abre subrotas privadas/mistas em guest sem qualquer request /users/me', () => {
        const content = render(shell(<SettingsContentLanguagesPage />));
        expect(screen.getByText('Entrar')).toBeOnTheScreen();
        content.unmount();

        const privacy = render(shell(<SettingsPrivacyPage />));
        expect(screen.getByText('Entrar')).toBeOnTheScreen();
        privacy.unmount();

        render(shell(<SettingsDataPage />));
        fireEvent.press(screen.getByText('Exportar meus dados'));
        fireEvent.press(screen.getByText('Limpar histórico rastreado'));
        expect(mockPush).toHaveBeenCalledWith({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.DATA } });
        const privateRequests = [...apiMock.history.get, ...apiMock.history.post, ...apiMock.history.patch, ...apiMock.history.put].filter(request =>
            request.url?.includes('/users/me'),
        );
        expect(privateRequests).toHaveLength(0);
    });
});
