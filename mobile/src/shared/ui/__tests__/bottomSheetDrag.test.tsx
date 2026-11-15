import { useState } from 'react';
import { Keyboard, Text } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { getAnimatedStyle } from 'react-native-reanimated';

import { MOTION_DURATIONS, ThemeProvider } from '@/shared/theme';

import { BottomSheet, SHEET_DRAG_CLOSE_VELOCITY } from '../BottomSheet';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const HEIGHT = 400;

function Sheet({ onClose, reduceMotion = false, refuse = false }: { onClose: jest.Mock; reduceMotion?: boolean; refuse?: boolean }) {
    const [visible, setVisible] = useState(true);
    return (
        <ThemeProvider initialOverride="dark" reduceMotion={reduceMotion} waitForPlatform={false}>
            <BottomSheet
                visible={visible}
                onClose={() => {
                    onClose();
                    // `refuse` simula quem pede confirmação antes de fechar e mantém a folha aberta.
                    if (!refuse) setVisible(false);
                }}
                closeLabel="Fechar"
                title="Fuso horário"
            >
                <Text>Corpo</Text>
            </BottomSheet>
        </ThemeProvider>
    );
}

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const sheet = () => screen.getByTestId('bottom-sheet', { includeHiddenElements: true });
const translateY = () => (getAnimatedStyle(sheet()).transform as { translateY: number }[])[0].translateY;

function open(props: Parameters<typeof Sheet>[0]) {
    render(<Sheet {...props} />);
    fireEvent(sheet(), 'layout', { nativeEvent: { layout: { height: HEIGHT } } });
    advance(MOTION_DURATIONS.sheet + 50);
    expect(translateY()).toBe(0);
}

function drag(translationY: number, velocityY = 0) {
    act(() =>
        fireGestureHandler(getByGestureTestId('bottom-sheet-drag'), [
            { state: State.BEGAN, translationY: 0, velocityY: 0 },
            { state: State.ACTIVE, translationY: translationY / 2, velocityY },
            { state: State.ACTIVE, translationY, velocityY },
            { state: State.END, translationY, velocityY },
        ]),
    );
}

describe('MOB-FEAT-070 fechar a folha puxando para baixo', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('AC-001 arrastar além de 30% da altura fecha pelo onClose, uma vez, e fecha o teclado', () => {
        const onClose = jest.fn();
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        open({ onClose });

        drag(HEIGHT * 0.4);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(dismiss).toHaveBeenCalled();
        advance(MOTION_DURATIONS.exit + 50);
        expect(screen.queryByTestId('bottom-sheet', { includeHiddenElements: true })).toBeNull();
    });

    it('AC-002 soltar antes do limite, devagar, volta para a posição aberta em motion.base', () => {
        const onClose = jest.fn();
        open({ onClose });

        drag(HEIGHT * 0.2, 100);
        advance(16);
        expect(translateY()).toBeGreaterThan(0);
        advance(MOTION_DURATIONS.base + 50);

        expect(translateY()).toBe(0);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('AC-003 puxão rápido fecha mesmo abaixo do limite', () => {
        const onClose = jest.fn();
        open({ onClose });

        drag(HEIGHT * 0.1, SHEET_DRAG_CLOSE_VELOCITY + 200);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('AC-004 só a alça e o cabeçalho iniciam o gesto; o corpo fica fora do detector', () => {
        open({ onClose: jest.fn() });
        const area = screen.getByTestId('bottom-sheet-drag-area');

        expect(within(area).getByTestId('bottom-sheet-handle')).toBeOnTheScreen();
        expect(within(area).getByTestId('bottom-sheet-header')).toBeOnTheScreen();
        expect(within(area).queryByTestId('bottom-sheet-scroll')).toBeNull();
        expect(within(area).queryByText('Corpo')).toBeNull();
    });

    it('para cima a folha só resiste e volta', () => {
        const onClose = jest.fn();
        open({ onClose });

        drag(-300);
        // Logo depois de soltar: deslocada para cima no máximo 24 pt, voltando.
        advance(16);
        expect(translateY()).toBeGreaterThanOrEqual(-24);
        expect(translateY()).toBeLessThan(0);

        advance(MOTION_DURATIONS.base + 50);
        expect(translateY()).toBe(0);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('quem fecha pode recusar: a folha volta para a posição aberta', () => {
        const onClose = jest.fn();
        open({ onClose, refuse: true });

        drag(HEIGHT * 0.5);
        advance(MOTION_DURATIONS.base + 50);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(translateY()).toBe(0);
    });

    it('arrasto interrompido pelo sistema volta para a posição aberta', () => {
        const onClose = jest.fn();
        open({ onClose });

        act(() =>
            fireGestureHandler(getByGestureTestId('bottom-sheet-drag'), [
                { state: State.BEGAN, translationY: 0 },
                { state: State.ACTIVE, translationY: HEIGHT * 0.5 },
                { state: State.CANCELLED, translationY: HEIGHT * 0.5 },
            ]),
        );
        advance(MOTION_DURATIONS.base + 50);

        expect(translateY()).toBe(0);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('AC-005 com movimento reduzido a folha acompanha o dedo e volta sem animação', () => {
        const onClose = jest.fn();
        open({ onClose, reduceMotion: true });

        drag(HEIGHT * 0.2, 100);
        advance(16);

        expect(translateY()).toBe(0);
        expect(onClose).not.toHaveBeenCalled();
    });
});
