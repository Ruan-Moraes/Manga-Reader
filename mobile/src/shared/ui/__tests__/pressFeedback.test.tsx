import { Profiler, type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

import { darkTokens, ThemeProvider } from '@/shared/theme';

import { Button } from '../Button';
import { ChoiceRow } from '../ChoiceRow';
import { IconButton } from '../IconButton';
import { ListRow } from '../ListRow';
import { PressableBox } from '../PressableBox';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Mesmo formato que o Reanimated produz ao interpolar cores (`rgba(r, g, b, a)`).
const rgba = (hex: string) => {
    const value = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, 1)`;
};

const theme = (node: ReactElement, reduceMotion = false) => (
    <ThemeProvider initialOverride="dark" reduceMotion={reduceMotion} waitForPlatform={false}>
        {node}
    </ThemeProvider>
);

const frame = (ms = 16) => act(() => jest.advanceTimersByTime(ms));

describe('plano de animações, etapa 2: toque e hover', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('botão pressionado escurece e encolhe sem re-renderizar', () => {
        const onRender = jest.fn();
        render(
            theme(
                <Profiler id="button" onRender={onRender}>
                    {
                        <Button variant="outline" onPress={jest.fn()}>
                            Salvar
                        </Button>
                    }
                </Profiler>,
            ),
        );
        const button = screen.getByRole('button', { name: 'Salvar' });
        const rendersBefore = onRender.mock.calls.length;

        fireEvent(button, 'pressIn');
        frame();

        expect(getAnimatedStyle(button)).toEqual(expect.objectContaining({ backgroundColor: rgba(darkTokens.surfacePressed), transform: [{ scale: 0.97 }] }));
        expect(onRender.mock.calls.length).toBe(rendersBefore);
    });

    it('volta do pressionado em motion.fast e de imediato com movimento reduzido', () => {
        const view = render(
            theme(
                <Button variant="outline" onPress={jest.fn()}>
                    Salvar
                </Button>,
            ),
        );
        let button = screen.getByRole('button', { name: 'Salvar' });
        fireEvent(button, 'pressIn');
        frame();
        fireEvent(button, 'pressOut');
        frame(40);
        const midway = (getAnimatedStyle(button).transform as { scale: number }[])[0].scale;
        expect(midway).toBeGreaterThan(0.97);
        expect(midway).toBeLessThan(1);
        frame(200);
        expect(getAnimatedStyle(button).transform).toEqual([{ scale: 1 }]);

        view.unmount();
        render(
            theme(
                <Button variant="outline" onPress={jest.fn()}>
                    Salvar
                </Button>,
                true,
            ),
        );
        button = screen.getByRole('button', { name: 'Salvar' });
        fireEvent(button, 'pressIn');
        frame();
        fireEvent(button, 'pressOut');
        frame();
        expect(getAnimatedStyle(button).transform).toEqual([{ scale: 1 }]);
    });

    it('hover usa surfaceHover em botão, ícone e linha', () => {
        render(
            theme(
                <>
                    <Button variant="ghost" onPress={jest.fn()}>
                        Ghost
                    </Button>
                    <IconButton icon="ellipsis-horizontal" accessibilityLabel="Mais" bare onPress={jest.fn()} />
                    <ListRow title="Linha" onPress={jest.fn()} />
                </>,
            ),
        );

        for (const name of ['Ghost', 'Mais', 'Linha']) {
            const control = screen.getByRole('button', { name });
            fireEvent(control, 'hoverIn');
            frame(200);
            expect(getAnimatedStyle(control).backgroundColor).toBe(rgba(darkTokens.surfaceHover));
            fireEvent(control, 'hoverOut');
            frame(200);
            expect(getAnimatedStyle(control).backgroundColor).not.toBe(rgba(darkTokens.surfaceHover));
        }
    });

    it('ícone sem fundo responde pela opacidade, sem escala', () => {
        render(theme(<IconButton icon="eye" accessibilityLabel="Mostrar" bare onPress={jest.fn()} />));
        const icon = screen.getByRole('button', { name: 'Mostrar' });

        fireEvent(icon, 'pressIn');
        frame();

        expect(getAnimatedStyle(icon)).toEqual(expect.objectContaining({ opacity: 0.6, transform: [{ scale: 1 }] }));
    });

    it('linha sem ação e linha desativada não reagem ao toque', () => {
        render(
            theme(
                <>
                    <ListRow title="Só leitura" />
                    <ListRow title="Desativada" disabled onPress={jest.fn()} />
                </>,
            ),
        );
        const readOnly = screen.getByLabelText('Só leitura');
        const disabled = screen.getByLabelText('Desativada');

        fireEvent(readOnly, 'hoverIn');
        fireEvent(disabled, 'pressIn');
        frame(200);

        expect(getAnimatedStyle(readOnly).backgroundColor).toBe(rgba(darkTokens.surface));
        expect(getAnimatedStyle(disabled)).toEqual(expect.objectContaining({ backgroundColor: rgba(darkTokens.disabledSurface), opacity: 0.58 }));
    });

    it('linha mostra anel de foco por contorno, sem mudar a borda', () => {
        render(theme(<ListRow title="Foco" onPress={jest.fn()} />));
        const row = screen.getByRole('button', { name: 'Foco' });
        const border = StyleSheet.flatten(row.props.style).borderWidth;

        fireEvent(row, 'focus');

        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Foco' }).props.style)).toEqual(
            expect.objectContaining({ borderWidth: border, outlineColor: darkTokens.focus, outlineWidth: 2 }),
        );
        fireEvent(row, 'blur');
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Foco' }).props.style).outlineWidth).toBe(0);
    });

    it('linha de escolha troca a opacidade por fundo de toque e hover', () => {
        render(
            theme(
                <ChoiceRow
                    label="Tema"
                    value="DARK"
                    options={['DARK', 'LIGHT'] as const}
                    optionLabel={option => option}
                    onChange={jest.fn()}
                    closeLabel="Fechar"
                />,
            ),
        );
        const row = () => screen.getByTestId('choice-row');

        fireEvent(row(), 'pressIn');
        expect(row()).toHaveStyle({ backgroundColor: darkTokens.surfacePressed, opacity: 1 });
        fireEvent(row(), 'pressOut');
        fireEvent(row(), 'hoverIn');
        expect(row()).toHaveStyle({ backgroundColor: darkTokens.surfaceHover });
        fireEvent(row(), 'focus');
        expect(row()).toHaveStyle({ outlineColor: darkTokens.focus, outlineWidth: 2 });
    });
});

describe('PressableBox repassa hover e foco', () => {
    it('resolve estilo e filhos com hovered e focused', () => {
        const onHoverIn = jest.fn();
        const onFocus = jest.fn();
        render(
            <PressableBox
                accessibilityRole="button"
                accessibilityLabel="Caixa"
                onHoverIn={onHoverIn}
                onFocus={onFocus}
                style={({ hovered }) => ({ opacity: hovered ? 0.8 : 1 })}
            >
                {({ hovered, focused }) => <Text>{`${hovered ? 'hover' : 'sem hover'} ${focused ? 'foco' : 'sem foco'}`}</Text>}
            </PressableBox>,
        );
        const box = screen.getByRole('button', { name: 'Caixa' });

        fireEvent(box, 'hoverIn');
        fireEvent(box, 'focus');

        expect(screen.getByText('hover foco')).toBeOnTheScreen();
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Caixa' }).props.style).opacity).toBe(0.8);
        expect(onHoverIn).toHaveBeenCalledTimes(1);
        expect(onFocus).toHaveBeenCalledTimes(1);

        fireEvent(box, 'hoverOut');
        fireEvent(box, 'blur');
        expect(screen.getByText('sem hover sem foco')).toBeOnTheScreen();
    });
});
