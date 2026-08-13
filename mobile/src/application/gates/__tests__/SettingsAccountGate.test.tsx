import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/src/entities/session';
import { useSettingsStore } from '@/src/features/manage-settings';
import { ThemeProvider } from '@/src/shared/theme';

import { SettingsAccountBoundary, SettingsAccountGate } from '../SettingsAccountGate';

const withTheme = (node: React.ReactNode) => render(<ThemeProvider waitForPlatform={false}>{node}</ThemeProvider>);

describe('MOB-FEAT-008 SettingsAccountGate', () => {
    beforeEach(() => {
        useSessionStore.setState({ isAuthenticated: false, identityEpoch: 0 });
        useSettingsStore.setState({ activeIdentityEpoch: null, pendingVersion: null, pendingGroup: null, syncError: null, syncStatus: 'local' });
    });

    it('não monta valores guest/default durante hidratação autenticada retardada', async () => {
        let release!: () => void;
        const remote = new Promise<void>(resolve => {
            release = resolve;
        });
        const activateAccount = jest.fn(async (identityEpoch: number) => {
            useSettingsStore.setState({ activeIdentityEpoch: identityEpoch, pendingVersion: null, syncStatus: 'syncing' });
            await remote;
            useSettingsStore.setState({ syncStatus: 'synced' });
        });
        useSettingsStore.setState({ activateAccount, deactivateAccount: jest.fn(), flush: jest.fn().mockResolvedValue(undefined) });
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 7 });

        withTheme(
            <SettingsAccountGate>
                <Text>valor remoto selecionável</Text>
            </SettingsAccountGate>,
        );

        await waitFor(() => expect(activateAccount).toHaveBeenCalledWith(7));
        expect(screen.queryByText('valor remoto selecionável')).toBeNull();
        release();
        await waitFor(() => expect(screen.getByText('valor remoto selecionável')).toBeOnTheScreen());
    });

    it('oculta sincronicamente dados A antes do effect de ativação de B', () => {
        useSettingsStore.setState({ activeIdentityEpoch: 10, pendingVersion: null, syncStatus: 'synced' });
        const view = withTheme(
            <SettingsAccountBoundary identityEpoch={10} isAuthenticated>
                <Text>dados A</Text>
            </SettingsAccountBoundary>,
        );
        expect(screen.getByText('dados A')).toBeOnTheScreen();

        view.rerender(
            <ThemeProvider waitForPlatform={false}>
                <SettingsAccountBoundary identityEpoch={11} isAuthenticated>
                    <Text>dados A</Text>
                </SettingsAccountBoundary>
            </ThemeProvider>,
        );
        expect(screen.queryByText('dados A')).toBeNull();
    });

    it('mantém a superfície navegável com a projeção local quando a Core está offline', () => {
        const retry = jest.fn().mockResolvedValue(undefined);
        useSettingsStore.setState({ activeIdentityEpoch: 3, pendingVersion: null, retry, syncError: 'offline', syncStatus: 'error' });
        withTheme(
            <SettingsAccountBoundary identityEpoch={3} isAuthenticated>
                <Text>default incorreto</Text>
            </SettingsAccountBoundary>,
        );

        expect(screen.getByText('default incorreto')).toBeOnTheScreen();
        expect(useSettingsStore.getState()).toMatchObject({ syncStatus: 'error', syncError: 'offline' });
    });

    it('bloqueia o frame de logout até restaurar o guest', () => {
        useSettingsStore.setState({ activeIdentityEpoch: 4, syncStatus: 'synced' });
        const view = withTheme(
            <SettingsAccountBoundary identityEpoch={5} isAuthenticated={false}>
                <Text>guest</Text>
            </SettingsAccountBoundary>,
        );
        expect(screen.queryByText('guest')).toBeNull();
        act(() => useSettingsStore.setState({ activeIdentityEpoch: null, syncStatus: 'local' }));
        expect(screen.getByText('guest')).toBeOnTheScreen();
        view.unmount();
    });
});
