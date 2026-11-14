import { Modal, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/entities/session';
import { useDeveloperMode } from '@/shared/config';
import { darkTokens, ThemeProvider } from '@/shared/theme';

import { ModuleSelectorPage } from '../ModuleSelectorPage';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ModuleSelectorPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

const openPlatformSheet = () => fireEvent.press(screen.getByRole('button', { name: /Plataforma de leitura/ }));

describe('MOB-FEAT-010 module selector', () => {
    beforeEach(() => {
        mockPush.mockClear();
        useSessionStore.setState({ isAuthenticated: false, user: null, tokens: null });
    });

    it('mostra os dois módulos e encaminha guest da plataforma ao login com retorno seguro', () => {
        renderPage();

        expect(screen.getByRole('header', { name: 'Seus capítulos, no seu ritmo.' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /Em construção/ })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /Local-first/ })).toBeOnTheScreen();

        openPlatformSheet();
        fireEvent.press(screen.getByRole('button', { name: 'Entrar na plataforma' }));
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
        openPlatformSheet();
        fireEvent.press(screen.getByRole('button', { name: 'Entrar na plataforma' }));
        expect(mockPush).toHaveBeenCalledWith('/platform/status');
    });
});

describe('MOB-FEAT-059 Início no padrão do kit', () => {
    beforeEach(() => {
        mockPush.mockClear();
        useSessionStore.setState({ isAuthenticated: false, user: null, tokens: null });
    });

    it('AC-001 usa título display, apoio muted e imagem 16:9 com raio de cartão', () => {
        renderPage();

        const title = screen.getByRole('header', { name: 'Seus capítulos, no seu ritmo.' });
        expect(StyleSheet.flatten(title.props.style)).toEqual(expect.objectContaining({ letterSpacing: -0.7 }));
        expect(screen.getByRole('button', { name: 'Configurações do aparelho' })).toBeOnTheScreen();
        expect(StyleSheet.flatten(screen.getByTestId('launcher-hero', { includeHiddenElements: true }).props.style)).toEqual(
            expect.objectContaining({ aspectRatio: 16 / 9, borderColor: darkTokens.separator, borderRadius: 16 }),
        );
    });

    it('esconde a imagem decorativa dos leitores de tela no iOS e no Android, sem descrição fixa', () => {
        renderPage();

        const hero = screen.getByTestId('launcher-hero', { includeHiddenElements: true });
        expect(hero.props.accessibilityElementsHidden).toBe(true);
        expect(hero.props.importantForAccessibility).toBe('no-hide-descendants');
        expect(screen.queryByLabelText(/Garota lendo/, { includeHiddenElements: true })).toBeNull();
    });

    it('AC-002 cartões com tile de 48, status real com ponto e altura mínima de 88', () => {
        renderPage();

        const card = screen.getByTestId('module-card-platform');
        expect(StyleSheet.flatten(card.props.style)).toEqual(expect.objectContaining({ borderWidth: 1, minHeight: 88 }));
        expect(StyleSheet.flatten(screen.getByTestId('module-card-tile-platform').props.style)).toEqual(expect.objectContaining({ height: 48, width: 48 }));
        expect(StyleSheet.flatten(screen.getByTestId('module-card-status-dot-platform').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.warn, height: 6 }),
        );
        expect(StyleSheet.flatten(screen.getByTestId('module-card-status-dot-offline-translation').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.accentText }),
        );
        expect(screen.getByText('Em construção')).toBeOnTheScreen();
        expect(screen.getByText('Local-first')).toBeOnTheScreen();
    });

    it('AC-003 a plataforma abre uma folha explicativa antes de navegar', () => {
        renderPage();

        openPlatformSheet();

        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByRole('header', { name: 'Estamos preparando a plataforma' })).toBeOnTheScreen();
        expect(screen.getByText(/Catálogo, leitura, comentários e avaliações/)).toBeOnTheScreen();
    });

    it.each([
        ['Agora não', () => fireEvent.press(screen.getByRole('button', { name: 'Agora não' }))],
        ['fechar', () => fireEvent.press(screen.getAllByRole('button', { name: 'Fechar' })[1])],
        ['scrim', () => fireEvent.press(screen.getByTestId('platform-sheet-backdrop'))],
        ['voltar', () => act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose())],
    ])('AC-003 %s só fecha a folha', (_label, close) => {
        renderPage();

        openPlatformSheet();
        close();

        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.queryByTestId('platform-sheet')).toBeNull();
    });

    it('AC-004 abre a biblioteca local pelo atalho', () => {
        renderPage();

        fireEvent.press(screen.getByRole('button', { name: 'Abrir biblioteca local' }));

        expect(mockPush).toHaveBeenCalledWith('/translation-library');
    });

    it('exibe o atalho de prévia apenas com o modo desenvolvedor ativado', () => {
        renderPage();
        const label = 'Abrir preview de novel (desenvolvimento)';
        expect(screen.queryByText(label)).toBeNull();

        act(() => useDeveloperMode.setState({ hydrated: true, enabled: true }));
        try {
            expect(screen.getByText(label)).toBeOnTheScreen();
        } finally {
            act(() => useDeveloperMode.setState({ enabled: false }));
        }
    });

    it('AC-005 sem __DEV__ não mostra atalho de desenvolvimento', () => {
        const globalWithDev = global as unknown as { __DEV__: boolean };
        const previous = globalWithDev.__DEV__;
        globalWithDev.__DEV__ = false;

        try {
            renderPage();
            expect(screen.queryByText('Abrir preview de novel (desenvolvimento)')).toBeNull();
        } finally {
            globalWithDev.__DEV__ = previous;
        }
    });
});
