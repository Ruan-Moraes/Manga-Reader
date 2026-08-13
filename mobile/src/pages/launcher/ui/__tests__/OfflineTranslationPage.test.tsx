import { fireEvent, render, screen } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api } from '@/src/shared/api';

import { OfflineTranslationPage } from '../OfflineTranslationPage';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    router: { back: jest.fn(), push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('MOB-FEAT-010 offline translation shell', () => {
    const apiMock = new AxiosMockAdapter(api);

    beforeEach(() => {
        apiMock.reset();
        mockPush.mockClear();
        mockReplace.mockClear();
    });
    afterAll(() => apiMock.restore());

    it('declara indisponibilidade sem request ou ação fictícia', () => {
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <OfflineTranslationPage />
            </SafeAreaProvider>,
        );

        expect(screen.getByText('O tradutor ainda não está disponível')).toBeOnTheScreen();
        expect(screen.getByText(/Nenhum arquivo pode ser importado ou traduzido/)).toBeOnTheScreen();
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.post).toHaveLength(0);
        expect(screen.queryByText(/Importar/)).toBeNull();

        fireEvent.press(screen.getByRole('button', { name: 'Configurações do aparelho' }));
        expect(mockPush).toHaveBeenCalledWith('/settings');
    });
});
