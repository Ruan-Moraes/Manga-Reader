import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { notifyAuthExpired } from '@/src/shared/api';
import { useSessionStore } from '@/src/shared/store';

import { SessionGate } from '../SessionGate';

const mockReplace = jest.fn();
let mockSegments: string[] = ['(tabs)'];

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace }),
    useSegments: () => mockSegments,
}));

const secureStore = jest.mocked(SecureStore);

describe('MOB-BASE-005/006 SessionGate', () => {
    beforeEach(() => {
        mockSegments = ['(tabs)'];
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false });
        secureStore.getItemAsync.mockResolvedValue(null);
        secureStore.deleteItemAsync.mockResolvedValue();
    });

    it('bloqueia filhos durante hidratação e redireciona visitante ao login', async () => {
        let releaseHydration!: () => void;
        const hydrationGate = new Promise<void>(resolve => {
            releaseHydration = resolve;
        });
        secureStore.getItemAsync.mockImplementation(async () => {
            await hydrationGate;
            return null;
        });

        render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        expect(screen.queryByText('conteúdo')).toBeNull();

        releaseHydration();

        await waitFor(() => expect(screen.getByText('conteúdo')).toBeOnTheScreen());
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('redireciona sessão autenticada para tabs quando está no grupo auth', async () => {
        mockSegments = ['(auth)'];
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));

        render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
        expect(useSessionStore.getState().isAuthenticated).toBe(true);
    });

    it('encerra a sessão local quando o cliente notifica expiração', async () => {
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));
        render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(screen.getByText('conteúdo')).toBeOnTheScreen());

        act(() => notifyAuthExpired());

        await waitFor(() => expect(useSessionStore.getState().isAuthenticated).toBe(false));
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('mr_access_token');
        expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('mr_refresh_token');
    });
});
