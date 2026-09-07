import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/entities/session';
import { notifyAuthExpired } from '@/shared/api';

import { SessionGate } from '../SessionGate';

const mockReplace = jest.fn();
let mockSegments: string[] = ['(tabs)'];
let mockParams: { returnTo?: string } = {};

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace }),
    useSegments: () => mockSegments,
    useGlobalSearchParams: () => mockParams,
}));

const secureStore = jest.mocked(SecureStore);

describe('MOB-BASE-005/006 SessionGate', () => {
    beforeEach(() => {
        mockSegments = ['(tabs)'];
        mockParams = {};
        mockReplace.mockClear();
        useSessionStore.setState({ user: null, tokens: null, isAuthenticated: false, identityEpoch: 0 });
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

    it('redireciona sessão autenticada para o status da plataforma quando está no grupo auth', async () => {
        mockSegments = ['(auth)'];
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));

        render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/platform/status'));
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

    it('mantém guest em settings sem tornar as tabs públicas', async () => {
        mockSegments = ['settings', 'privacy'];
        render(
            <SessionGate>
                <Text>settings guest</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(screen.getByText('settings guest')).toBeOnTheScreen());
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it.each([[[]], [['offline-translation']], [['reader', 'title-1', '7.5']]] as const)(
        'mantém a superfície pública %j sem redirecionar guest',
        async routeSegments => {
            mockSegments = [...routeSegments];
            render(
                <SessionGate>
                    <Text>superfície pública</Text>
                </SessionGate>,
            );
            await waitFor(() => expect(screen.getByText('superfície pública')).toBeOnTheScreen());
            expect(mockReplace).not.toHaveBeenCalled();
        },
    );

    it('encaminha guest da plataforma ao login com return-to permitido', async () => {
        mockSegments = ['platform', 'status'];
        render(
            <SessionGate>
                <Text>privado</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(auth)/login', params: { returnTo: '/platform/status' } }));
    });

    it('impede usuário autenticado de abrir as tabs placeholder', async () => {
        mockSegments = ['platform', '(tabs)', 'library'];
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));
        render(
            <SessionGate>
                <Text>tabs</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/platform/status'));
    });

    it('preserva cold deep link durante hidratação e não duplica navegação em rerenders warm', async () => {
        mockSegments = ['settings', 'appearance'];
        let release!: () => void;
        const hydration = new Promise<void>(resolve => {
            release = resolve;
        });
        secureStore.getItemAsync.mockImplementation(async () => {
            await hydration;
            return null;
        });
        const view = render(
            <SessionGate>
                <Text>aparência</Text>
            </SessionGate>,
        );
        expect(screen.queryByText('aparência')).toBeNull();
        release();
        await waitFor(() => expect(screen.getByText('aparência')).toBeOnTheScreen());
        view.rerender(
            <SessionGate>
                <Text>aparência</Text>
            </SessionGate>,
        );
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('deixa path desconhecido de settings seguir para o +not-found sem loop de redirect', async () => {
        mockSegments = ['settings', 'unknown'];
        render(
            <SessionGate>
                <Text>not-found route</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(screen.getByText('not-found route')).toBeOnTheScreen());
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('retorna uma única vez ao destino privado permitido depois do login', async () => {
        mockSegments = ['(auth)', 'login'];
        mockParams = { returnTo: '/settings/privacy' };
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));

        const view = render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/settings/privacy'));
        view.rerender(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    it('permite o mesmo destino em um segundo ciclo de autenticação sem duplicar replace no ciclo', async () => {
        mockSegments = ['(auth)', 'login'];
        mockParams = { returnTo: '/settings/privacy' };
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));
        const view = render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/settings/privacy'));
        expect(mockReplace).toHaveBeenCalledTimes(1);

        mockSegments = ['settings', 'privacy'];
        mockParams = {};
        act(() => useSessionStore.setState({ isAuthenticated: false, identityEpoch: 2, tokens: null, user: null }));
        view.rerender(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );

        mockSegments = ['(auth)', 'login'];
        mockParams = { returnTo: '/settings/privacy' };
        act(() => useSessionStore.setState({ isAuthenticated: true, identityEpoch: 3 }));
        view.rerender(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
        expect(mockReplace).toHaveBeenNthCalledWith(2, '/settings/privacy');

        view.rerender(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        expect(mockReplace).toHaveBeenCalledTimes(2);
    });

    it('rejeita return-to externo e volta para o status interno', async () => {
        mockSegments = ['(auth)', 'login'];
        mockParams = { returnTo: 'https://attacker.example' };
        secureStore.getItemAsync.mockImplementation(async key => (key === 'mr_access_token' ? 'access-1' : 'refresh-1'));
        render(
            <SessionGate>
                <Text>conteúdo</Text>
            </SessionGate>,
        );
        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/platform/status'));
        expect(mockReplace).not.toHaveBeenCalledWith('https://attacker.example');
    });
});
