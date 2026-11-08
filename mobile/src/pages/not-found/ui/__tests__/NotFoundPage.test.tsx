import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { NotFoundPage } from '../NotFoundPage';

import '@/shared/i18n';

const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    router: {
        canGoBack: () => mockCanGoBack(),
        replace: (href: string) => mockReplace(href),
        back: () => mockBack(),
    },
    Stack: { Screen: () => null },
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <NotFoundPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('MOB-FEAT-058 página não encontrada', () => {
    beforeEach(() => {
        mockCanGoBack.mockReset();
        mockReplace.mockReset();
        mockBack.mockReset();
    });

    it('AC-001 mostra o estado 404 e volta ao início substituindo a rota', () => {
        mockCanGoBack.mockReturnValue(false);
        renderPage();

        expect(screen.getByText('Erro 404')).toBeOnTheScreen();
        expect(screen.getByRole('header', { name: 'Página não encontrada' })).toBeOnTheScreen();
        expect(screen.getByText(/não existe ou foi removido/)).toBeOnTheScreen();
        expect(screen.queryByText('Buscar obras')).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));

        expect(mockReplace).toHaveBeenCalledWith('/');
        expect(mockBack).not.toHaveBeenCalled();
    });

    it('AC-002 sem histórico não mostra voltar nem botão de voltar do cabeçalho', () => {
        mockCanGoBack.mockReturnValue(false);
        renderPage();

        expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();
    });

    it('AC-002 com histórico oferece voltar no conteúdo e no cabeçalho', () => {
        mockCanGoBack.mockReturnValue(true);
        renderPage();

        const backButtons = screen.getAllByRole('button', { name: 'Voltar' });
        expect(backButtons).toHaveLength(2);

        fireEvent.press(backButtons[0]);
        fireEvent.press(backButtons[1]);

        expect(mockBack).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('button', { name: 'Voltar ao início' })).toBeOnTheScreen();
    });
});
