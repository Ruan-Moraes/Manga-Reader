import { Animated, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import type { ReactElement } from 'react';

import { MOTION_DURATIONS, MOTION_EASING, ThemeProvider } from '@/shared/theme';

import { BottomSheet } from '../BottomSheet';
import { CenterDialog } from '../CenterDialog';
import { runningSkeletonClocks, Skeleton } from '../Skeleton';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const theme = (node: ReactElement, reduceMotion = false) => (
    <ThemeProvider initialOverride="dark" reduceMotion={reduceMotion} waitForPlatform={false}>
        {node}
    </ThemeProvider>
);

const timingConfigs = (spy: jest.SpyInstance) => spy.mock.calls.map(([, config]) => config as Animated.TimingAnimationConfig);

describe('escala de movimento nos componentes compartilhados', () => {
    afterEach(() => jest.restoreAllMocks());

    it('esqueleto divide o ciclo de pulse em duas metades com a curva de pulse', () => {
        const timing = jest.spyOn(Animated, 'timing');

        render(theme(<Skeleton />));

        const configs = timingConfigs(timing);
        expect(configs).toHaveLength(2);
        for (const config of configs) {
            expect(config.duration).toBe(MOTION_DURATIONS.pulse / 2);
            expect(config.easing).toBe(MOTION_EASING.pulse);
        }
    });

    it('vários esqueletos dividem um só laço, que para quando o último sai', () => {
        const loop = jest.spyOn(Animated, 'loop');

        const view = render(
            theme(
                <>
                    <Skeleton />
                    <Skeleton width="60%" />
                    <Skeleton width={40} />
                </>,
            ),
        );

        expect(loop).toHaveBeenCalledTimes(1);
        expect(runningSkeletonClocks()).toBe(1);
        view.unmount();
        expect(runningSkeletonClocks()).toBe(0);
    });

    it('esqueleto com movimento reduzido fica parado e não liga o relógio', () => {
        const loop = jest.spyOn(Animated, 'loop');

        render(theme(<Skeleton />, true));

        expect(loop).not.toHaveBeenCalled();
        expect(runningSkeletonClocks()).toBe(0);
    });

    it('folha inferior entra em sheet e sai em exit, cada uma com a própria altura', () => {
        jest.useFakeTimers();
        const sheet = (visible: boolean) =>
            theme(
                <BottomSheet visible={visible} onClose={jest.fn()} closeLabel="Fechar" title="Ajustes">
                    <Text>Corpo</Text>
                </BottomSheet>,
            );
        const view = render(sheet(true));
        const translateY = () =>
            (getAnimatedStyle(screen.getByTestId('bottom-sheet', { includeHiddenElements: true })).transform as { translateY: number }[])[0].translateY;
        const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

        // Antes de medida a folha não começa a subir.
        advance(MOTION_DURATIONS.sheet);
        expect(translateY()).toBeGreaterThan(0);

        fireEvent(screen.getByTestId('bottom-sheet'), 'layout', { nativeEvent: { layout: { height: 320 } } });
        advance(16);
        // Parte da própria altura (320), não dos 85% da tela.
        expect(translateY()).toBeLessThanOrEqual(320);
        expect(translateY()).toBeGreaterThan(0);
        advance(MOTION_DURATIONS.sheet - 40);
        expect(translateY()).toBeGreaterThan(0);
        advance(60);
        expect(translateY()).toBe(0);

        view.rerender(sheet(false));
        advance(MOTION_DURATIONS.exit - 30);
        expect(translateY()).toBeLessThan(320);
        // Ao fim da saída o Modal desmonta a folha.
        advance(60);
        expect(screen.queryByTestId('bottom-sheet', { includeHiddenElements: true })).toBeNull();
        jest.useRealTimers();
    });

    it('diálogo central entra com base e sai com exit', () => {
        const timing = jest.spyOn(Animated, 'timing');
        const dialog = (visible: boolean) =>
            theme(
                <CenterDialog visible={visible} onClose={jest.fn()} closeLabel="Fechar" title="Título">
                    <Text>Corpo</Text>
                </CenterDialog>,
            );

        const view = render(dialog(true));
        expect(timingConfigs(timing).at(-1)).toEqual(expect.objectContaining({ duration: MOTION_DURATIONS.base, easing: MOTION_EASING.enter }));

        view.rerender(dialog(false));
        expect(timingConfigs(timing).at(-1)).toEqual(expect.objectContaining({ duration: MOTION_DURATIONS.exit, easing: MOTION_EASING.exit }));
    });

    it('AC-010 com movimento reduzido folha e diálogo abrem e fecham sem animação', () => {
        const timing = jest.spyOn(Animated, 'timing');
        const layers = (visible: boolean) =>
            theme(
                <>
                    <BottomSheet visible={visible} onClose={jest.fn()} closeLabel="Fechar" title="Ajustes">
                        <Text>Folha</Text>
                    </BottomSheet>
                    <CenterDialog visible={visible} onClose={jest.fn()} closeLabel="Fechar" title="Título">
                        <Text>Diálogo</Text>
                    </CenterDialog>
                </>,
                true,
            );

        const view = render(layers(true));
        view.rerender(layers(false));

        expect(timing).not.toHaveBeenCalled();
    });
});
