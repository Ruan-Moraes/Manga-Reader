import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/src/entities/session';

import { ModuleSelectorPage } from '../ModuleSelectorPage';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('MOB-FEAT-010 module selector', () => {
    const renderPage = () =>
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <ModuleSelectorPage />
            </SafeAreaProvider>,
        );
    beforeEach(() => {
        mockPush.mockClear();
        useSessionStore.setState({ isAuthenticated: false, user: null, tokens: null });
    });

    it('mostra os dois módulos e encaminha guest da plataforma ao login', () => {
        renderPage();

        expect(screen.getByRole('header', { name: 'Seus capítulos, no seu ritmo.' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /Em construção/ })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /Local-first/ })).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: /Plataforma de leitura/ }));
        expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { returnTo: '/platform/status' } });
    });

    it('abre a importação local e usa o status quando já autenticado', () => {
        const view = renderPage();
        fireEvent.press(screen.getByRole('button', { name: /Traduzir capítulo/ }));
        expect(mockPush).toHaveBeenCalledWith('/offline-translation');

        view.unmount();
        mockPush.mockClear();
        useSessionStore.setState({ isAuthenticated: true });
        renderPage();
        fireEvent.press(screen.getByRole('button', { name: /Plataforma de leitura/ }));
        expect(mockPush).toHaveBeenCalledWith('/platform/status');
    });
});
