import { Modal, Platform, Text } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';
import { BottomSheet } from '@/shared/ui';

import { SHEET_CHAIN_FALLBACK_MS, useChainedSheet } from '../LibraryShelf';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const originalOS = Platform.OS;
const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

describe('plano de animações, etapa 4: folha encadeada pelo fim real', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.useRealTimers();
        setOS(originalOS);
    });

    it('no iOS a próxima folha espera o fechamento da anterior, não um tempo fixo', () => {
        setOS('ios');
        const { result } = renderHook(() => useChainedSheet<string>());

        act(() => result.current.open('menu'));
        act(() => result.current.chain('renomear'));
        expect(result.current.sheet).toBeNull();

        act(() => jest.advanceTimersByTime(400));
        expect(result.current.sheet).toBeNull();

        act(() => result.current.closed());
        expect(result.current.sheet).toBe('renomear');

        act(() => jest.advanceTimersByTime(SHEET_CHAIN_FALLBACK_MS));
        expect(result.current.sheet).toBe('renomear');
    });

    it('no iOS, sem aviso de fechamento, abre pela rede de segurança', () => {
        setOS('ios');
        const { result } = renderHook(() => useChainedSheet<string>());

        act(() => result.current.chain('mover'));
        act(() => jest.advanceTimersByTime(SHEET_CHAIN_FALLBACK_MS));

        expect(result.current.sheet).toBe('mover');
    });

    it('no Android abre a próxima folha na hora', () => {
        setOS('android');
        const { result } = renderHook(() => useChainedSheet<string>());

        act(() => result.current.open('menu'));
        act(() => result.current.chain('excluir'));

        expect(result.current.sheet).toBe('excluir');
    });

    it('sem nada pendente, o aviso de fechamento não abre nada', () => {
        setOS('ios');
        const { result } = renderHook(() => useChainedSheet<string>());

        act(() => result.current.closed());

        expect(result.current.sheet).toBeNull();
    });
});

describe('BottomSheet avisa quando terminou de fechar', () => {
    afterEach(() => setOS(originalOS));

    const sheet = (visible: boolean, onClosed: () => void) => (
        <ThemeProvider initialOverride="dark" reduceMotion waitForPlatform={false}>
            <BottomSheet visible={visible} onClose={jest.fn()} onClosed={onClosed} closeLabel="Fechar" title="Ajustes">
                <Text>Corpo</Text>
            </BottomSheet>
        </ThemeProvider>
    );

    it('no iOS, pelo onDismiss do Modal, e só de uma folha que chegou a abrir', () => {
        setOS('ios');
        const onClosed = jest.fn();
        const view = render(sheet(false, onClosed));
        act(() => screen.UNSAFE_getByType(Modal).props.onDismiss());
        expect(onClosed).not.toHaveBeenCalled();

        view.rerender(sheet(true, onClosed));
        view.rerender(sheet(false, onClosed));
        expect(onClosed).not.toHaveBeenCalled();

        act(() => screen.UNSAFE_getByType(Modal).props.onDismiss());
        expect(onClosed).toHaveBeenCalledTimes(1);
    });

    it('fora do iOS, quando a saída termina', () => {
        setOS('android');
        const onClosed = jest.fn();
        const view = render(sheet(true, onClosed));

        view.rerender(sheet(false, onClosed));

        expect(onClosed).toHaveBeenCalledTimes(1);
    });
});
