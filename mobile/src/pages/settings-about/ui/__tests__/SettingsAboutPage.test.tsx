import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { setItemAsync } from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDeveloperMode } from '@/shared/config';
import { ThemeProvider } from '@/shared/theme';

import { SettingsAboutPage } from '../SettingsAboutPage';

import '@/shared/i18n';

let mockMetadata: { version?: string; build?: string } = {};
let mockLinks: Record<string, string> = {};
const mockOpen = jest.fn();

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(async () => undefined) }));

jest.mock('@/shared/config', () => ({
    ...jest.requireActual('@/shared/config'),
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
        useDeveloperMode.setState({ hydrated: true, unlocked: false, enabled: false });
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

    it('mantém a linha estável e ignora novos toques enquanto salva o modo desenvolvedor', async () => {
        useDeveloperMode.setState({ unlocked: true });
        const storageWrite = jest.mocked(setItemAsync);
        storageWrite.mockClear();
        let finishWrite!: () => void;
        storageWrite.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finishWrite = resolve;
                }),
        );
        renderPage();
        const control = screen.getByRole('switch', { name: 'Modo desenvolvedor' });

        fireEvent(control, 'valueChange', true);
        await waitFor(() => expect(storageWrite).toHaveBeenCalledTimes(1));
        expect(control).toBeEnabled();
        expect(control).not.toBeChecked();
        fireEvent(control, 'valueChange', true);
        await act(async () => finishWrite());

        expect(storageWrite).toHaveBeenCalledTimes(1);
        expect(control).toBeChecked();
    });

    it('exige as duas esperas e mantém o controle disponível após desativar', async () => {
        mockMetadata = { version: '2.4.0' };
        const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
        renderPage();
        const tap = (count: number) => {
            for (let i = 0; i < count; i += 1) fireEvent.press(screen.getByText('Versão'));
        };

        tap(7);
        clock.mockReturnValue(4_999);
        tap(1);
        expect(screen.queryByRole('switch')).toBeNull();

        tap(7);
        clock.mockReturnValue(9_999);
        tap(7);
        expect(screen.queryByRole('switch')).toBeNull();
        clock.mockReturnValue(14_999);
        tap(1);

        const control = await screen.findByRole('switch', { name: 'Modo desenvolvedor' });
        expect(control).not.toBeChecked();
        fireEvent(control, 'valueChange', true);
        await waitFor(() => expect(screen.getByRole('switch')).toBeChecked());
        fireEvent(screen.getByRole('switch'), 'valueChange', false);
        await waitFor(() => expect(screen.getByRole('switch')).not.toBeChecked());
        clock.mockRestore();
    });

    it('revisão 2026-11-13: a linha da versão não mostra seta e os links têm descrição fiel', () => {
        mockMetadata = { version: '2.4.0' };
        mockLinks = { terms: 'https://toonlira-rm.web.app/legal/terms' };
        renderPage();

        const version = screen.getByRole('button', { name: /Versão/ });
        expect(within(version).UNSAFE_queryAllByProps({ name: 'chevron-forward' })).toHaveLength(0);
        const terms = screen.getByRole('button', { name: /Termos de uso/ });
        expect(within(terms).UNSAFE_queryAllByProps({ name: 'chevron-forward' }).length).toBeGreaterThan(0);
        expect(screen.getByText('Documentos e páginas oficiais do projeto.')).toBeOnTheScreen();
    });
});
