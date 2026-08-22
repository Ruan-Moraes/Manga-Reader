import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/src/entities/session';
import { usePrivacySettingsStore } from '@/src/entities/user';
import { useDataControlsStore } from '@/src/features/data-controls';
import { useContentLanguagesStore } from '@/src/features/manage-content-languages';
import { useSettingsStore } from '@/src/features/manage-settings';
import i18n from '@/src/shared/i18n';
import { ThemeProvider } from '@/src/shared/theme';

import { SettingsIndexPage } from '../SettingsIndexPage';

describe('MOB-FEAT-008 settings index integration', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
        useSessionStore.setState({ isAuthenticated: false, identityEpoch: 0 });
        useSettingsStore.setState({ activeIdentityEpoch: null, pendingGroup: null, pendingVersion: null, syncStatus: 'local' });
        useContentLanguagesStore.getState().beginGuest('pt-BR');
        usePrivacySettingsStore.getState().beginIdentity(null);
        useDataControlsStore.setState({ busyAction: null, errorKey: null, failedCategories: [] });
    });

    it('renderiza exatamente as sete capacidades reais e nenhuma superfície Web/placeholder', () => {
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
                <ThemeProvider initialOverride="light" waitForPlatform={false}>
                    <SettingsIndexPage />
                </ThemeProvider>
            </SafeAreaProvider>,
        );

        for (const title of [
            'Aparência e acessibilidade',
            'Idioma e região',
            'Idiomas do conteúdo',
            'Leitor',
            'Privacidade',
            'Dados e armazenamento',
            'Sobre',
        ]) {
            expect(screen.getByText(title)).toBeOnTheScreen();
        }
        for (const forbidden of ['Notificações', 'Newsletter', 'Importar', 'Recarregar']) {
            expect(screen.queryByText(forbidden)).toBeNull();
        }
        expect(screen.getByText('Do seu jeito.')).toBeOnTheScreen();
        expect(screen.getByText('Aparência, acessibilidade, idioma e região.')).toBeOnTheScreen();
        expect(screen.getByText('Defina como as páginas ocupam e avançam na tela.')).toBeOnTheScreen();
        expect(screen.getByText('Controle o armazenamento e consulte informações do app.')).toBeOnTheScreen();
        expect(screen.getByText('Preferências sincronizadas e protegidas pela sua conta.')).toBeOnTheScreen();
        expect(screen.getAllByRole('button')).toHaveLength(8);
        expect(screen.getByRole('button', { name: 'Voltar aos módulos' })).toBeOnTheScreen();
        expect(screen.getAllByText('Login necessário')).toHaveLength(2);
    });
});
