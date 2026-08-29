import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/src/shared/theme';

import { SettingsAboutPage } from '../SettingsAboutPage';

import '@/src/shared/i18n';

let mockMetadata: { version?: string; build?: string } = {};
let mockLinks: Record<string, string> = {};
const mockOpen = jest.fn();

jest.mock('@/src/shared/config', () => ({
    appMetadata: { read: () => mockMetadata },
    externalLinks: { read: () => mockLinks, open: (url: string) => mockOpen(url) },
}));

const renderPage = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <SettingsAboutPage />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('MOB-FEAT-008/AC-007/009 About', () => {
    beforeEach(() => {
        mockMetadata = {};
        mockLinks = {};
        mockOpen.mockReset();
    });

    it('mostra somente metadados e links configurados e recupera falha nativa localmente', async () => {
        mockMetadata = { version: '2.4.0', build: '87' };
        mockLinks = { support: 'https://support.example/help' };
        mockOpen.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
        renderPage();

        expect(screen.getByText('Versão')).toBeOnTheScreen();
        expect(screen.getByText('2.4.0')).toBeOnTheScreen();
        expect(screen.getByText('Build')).toBeOnTheScreen();
        expect(screen.getByText('87')).toBeOnTheScreen();
        expect(screen.getByText('Encontre ajuda para usar o aplicativo.')).toBeOnTheScreen();
        expect(screen.queryByText('Termos de uso')).toBeNull();
        fireEvent.press(screen.getByText('Suporte'));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir este link.'));
        fireEvent.press(screen.getByText('Tentar abrir novamente'));
        await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(2));
        expect(mockOpen).toHaveBeenLastCalledWith('https://support.example/help');
    });

    it('não inventa versão, build ou link quando a configuração está vazia', () => {
        renderPage();
        expect(screen.queryByText(/^Versão:/)).toBeNull();
        expect(screen.queryByText(/^Build:/)).toBeNull();
        expect(screen.queryByText('Suporte')).toBeNull();
        expect(screen.queryByText('Projeto')).toBeNull();
    });
});
