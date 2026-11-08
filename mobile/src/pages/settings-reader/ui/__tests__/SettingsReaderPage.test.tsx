import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { useSettingsStore } from '@/features/manage-settings';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { SettingsReaderPage } from '../SettingsReaderPage';

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), canGoBack: () => true, push: jest.fn(), replace: jest.fn() },
}));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const shell = (node: ReactNode) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
        <QueryClientProvider client={client}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                {node}
            </ThemeProvider>
        </QueryClientProvider>
    </SafeAreaProvider>
);

const openSheet = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const closeSheet = () => fireEvent.press(screen.getByTestId('reader-settings-sheet-backdrop'));

describe('MOB-FEAT-062 Configurações > Leitor', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
        useSettingsStore.setState({
            settings: DEFAULT_USER_SETTINGS,
            guestSettings: DEFAULT_USER_SETTINGS,
            activeIdentityEpoch: null,
            pendingGroup: null,
            pendingVersion: null,
            syncError: null,
            syncStatus: 'local',
            localError: null,
        });
    });

    it('AC-006 mostra cinco linhas com tile e o valor atual', () => {
        render(shell(<SettingsReaderPage />));

        expect(screen.getByRole('button', { name: 'Navegação: Vertical' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Imagem: Automática' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Comportamento' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Gestos do leitor' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: /^Texto e aparência: \d+ sp$/ })).toBeOnTheScreen();
        expect(screen.queryByTestId('reader-settings-sheet')).toBeNull();
    });

    it('AC-006 Navegação mantém modo, direção e o ajuste Original', () => {
        render(shell(<SettingsReaderPage />));

        openSheet('Navegação: Vertical');
        expect(screen.getByRole('header', { name: 'Navegação' })).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'Paginado' })).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'Webtoon' })).toBeOnTheScreen();

        fireEvent.press(within(screen.getByLabelText('Ajuste')).getByRole('radio', { name: 'Original' }));
        expect(useSettingsStore.getState().settings.reader.fit).toBe('ORIGINAL');
    });

    it('AC-006 Imagem mantém a qualidade disponível de hoje e o fundo', () => {
        render(shell(<SettingsReaderPage />));

        openSheet('Imagem: Automática');
        fireEvent.press(screen.getByRole('button', { name: 'Qualidade: Automática' }));

        expect(screen.getByRole('radio', { name: 'Original' })).toBeOnTheScreen();
        expect(screen.queryByRole('radio', { name: 'Alta' })).toBeNull();
        expect(screen.queryByRole('radio', { name: 'Baixa' })).toBeNull();
    });

    it('AC-006 Gestos respeita a regra das áreas laterais no modo vertical', () => {
        render(shell(<SettingsReaderPage />));

        openSheet('Gestos do leitor');

        expect(screen.getByRole('radio', { name: 'Toque na tela' })).toBeOnTheScreen();
        expect(screen.getByRole('switch', { name: 'Áreas laterais de toque' })).toBeDisabled();
        closeSheet();
        expect(screen.queryByTestId('reader-settings-sheet')).toBeNull();
    });

    it('AC-006 Texto e aparência traz o restaurar no rodapé da folha', () => {
        useSettingsStore.setState({ textReader: { ...useSettingsStore.getState().textReader, fontSize: 24 } });
        render(shell(<SettingsReaderPage />));

        openSheet('Texto e aparência: 24 sp');

        expect(screen.getByTestId('bottom-sheet-footer')).toBeOnTheScreen();
        expect(within(screen.getByTestId('bottom-sheet-footer')).getByRole('button', { name: 'Restaurar ajustes do texto' })).toBeOnTheScreen();
        expect(screen.getAllByRole('button', { name: 'Restaurar ajustes do texto' })).toHaveLength(1);
    });
});
