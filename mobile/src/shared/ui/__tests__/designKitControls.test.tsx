import { Platform, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { darkTokens, ThemeProvider } from '@/shared/theme';

import { ChoiceGroup } from '../ChoiceGroup';
import { ListRow } from '../ListRow';
import { RangeSlider } from '../RangeSlider';
import { SegmentedControl } from '../SegmentedControl';
import { resolveSwatchWidth, SwatchPicker } from '../SwatchPicker';

jest.mock('react-native-worklets', () => ({
    scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
}));

jest.mock('react-native-reanimated', () => {
    const React = jest.requireActual('react');
    const ReactNative = jest.requireActual('react-native');
    const mockAnimatedView = React.forwardRef((mockProps: Record<string, unknown>, mockRef: unknown) =>
        React.createElement(ReactNative.View, { ...mockProps, ref: mockRef }),
    );

    return {
        __esModule: true,
        default: { View: mockAnimatedView, createAnimatedComponent: (mockComponent: unknown) => mockComponent },
        Easing: {
            cubic: (mockTime: number) => mockTime,
            in: (mockEasing: unknown) => mockEasing,
            out: (mockEasing: unknown) => mockEasing,
            quad: (mockTime: number) => mockTime,
        },
        interpolate: (value: number, input: number[], output: number[]) => output[0] + ((output[1] - output[0]) * (value - input[0])) / (input[1] - input[0]),
        interpolateColor: (value: number, _mockInput: number[], output: string[]) => (value >= 1 ? output[1] : output[0]),
        withTiming: (mockValue: unknown, _mockConfig?: unknown, mockCallback?: (finished: boolean) => void) => {
            mockCallback?.(true);
            return mockValue;
        },
        useAnimatedStyle: (mockFactory: () => Record<string, unknown>) => mockFactory(),
        useSharedValue: (initialValue: unknown) => React.useRef({ value: initialValue }).current,
    };
});

jest.mock('react-native-gesture-handler', () => {
    const React = jest.requireActual('react');
    const chain = (): Record<string, unknown> =>
        new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : () => chain()) }) as Record<string, unknown>;

    return {
        Gesture: { Pan: chain, Tap: chain, Race: chain },
        GestureDetector: ({ children }: { children: unknown }) => React.createElement(React.Fragment, null, children),
    };
});

const withTheme = (node: ReactElement) => render(<ThemeProvider initialOverride="dark">{node}</ThemeProvider>);
const touchTarget = Platform.OS === 'ios' ? 44 : 48;
const colors = { BLACK: '#000000', PAPER: '#EFEDE5', WHITE: '#FFFEFA' } as const;

describe('MOB-FEAT-057 controles unificados', () => {
    it('AC-008 segmentado destaca a opção ativa e responde ao toque no rótulo', () => {
        const onChange = jest.fn();
        withTheme(
            <SegmentedControl
                label="Densidade"
                value="COMFORTABLE"
                options={['COMFORTABLE', 'COMPACT'] as const}
                optionLabel={option => option}
                onChange={onChange}
            />,
        );

        const active = StyleSheet.flatten(screen.getByTestId('segmented-option-surface-COMFORTABLE').props.style);
        const inactive = StyleSheet.flatten(screen.getByTestId('segmented-option-surface-COMPACT').props.style);

        expect(active.backgroundColor).toBe(darkTokens.accent);
        expect(inactive.backgroundColor).toBe('transparent');
        expect(active.minHeight).toBe(inactive.minHeight);
        const option = screen.getByRole('radio', { name: 'COMPACT' });
        expect(option).toHaveStyle({ minHeight: touchTarget });
        fireEvent(option, 'focus');
        expect(screen.getByTestId('segmented-option-surface-COMPACT')).toHaveStyle({ borderColor: darkTokens.focus, borderWidth: 2 });
        fireEvent.press(screen.getByText('COMPACT'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('COMPACT');
    });

    it('AC-009 slider com pílula de valor, trilho, polegar preenchido e limites', () => {
        withTheme(
            <RangeSlider
                label="Saturação"
                value={50}
                minimum={0}
                maximum={100}
                step={5}
                valueLabel={value => `${value}%`}
                decrementLabel="Diminuir"
                incrementLabel="Aumentar"
                onChange={jest.fn()}
            />,
        );

        expect(StyleSheet.flatten(screen.getByTestId('range-slider-value').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.accentSoft, minHeight: 28 }),
        );
        expect(StyleSheet.flatten(screen.getByTestId('range-slider-rail').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.surfaceMuted, borderColor: darkTokens.separator, borderWidth: 1, height: 6 }),
        );
        expect(StyleSheet.flatten(screen.UNSAFE_getByProps({ testID: 'range-slider-thumb' }).props.style)).toEqual(
            expect.objectContaining({
                backgroundColor: darkTokens.accent,
                borderColor: darkTokens.surface,
                borderWidth: 3,
                height: 24,
                outlineColor: darkTokens.accentBorder,
            }),
        );
        expect(screen.getAllByText('0%', { includeHiddenElements: true }).length).toBeGreaterThan(0);
        expect(screen.getAllByText('100%', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    });

    it('AC-010 calcula a mesma largura para todas as amostras a partir da medição', () => {
        expect(resolveSwatchWidth(372, 5, 8)).toBe(68);
        expect(resolveSwatchWidth(100, 0, 8)).toBe(0);
        expect(resolveSwatchWidth(10, 5, 8)).toBe(0);
        expect(resolveSwatchWidth(Number.NaN, 3, 8)).toBe(0);
    });

    it.each([false, true])('AC-010 amostras separadas, altura 48 e borda constante (separated=%s)', separated => {
        const onChange = jest.fn();
        withTheme(
            <SwatchPicker
                separated={separated}
                label="Fundo"
                value="PAPER"
                options={['BLACK', 'PAPER', 'WHITE'] as const}
                optionLabel={option => option}
                optionColor={option => colors[option]}
                onChange={onChange}
            />,
        );

        act(() => fireEvent(screen.getByTestId('swatch-picker-track'), 'layout', { nativeEvent: { layout: { width: 316 } } }));

        expect(StyleSheet.flatten(screen.getByTestId('swatch-picker-track').props.style)).toEqual(expect.objectContaining({ flexDirection: 'row', gap: 8 }));

        const styles = (['BLACK', 'PAPER', 'WHITE'] as const).map(option =>
            StyleSheet.flatten(screen.getByTestId(`swatch-picker-surface-${option}`).props.style),
        );
        expect(styles.map(style => style.width)).toEqual([100, 100, 100]);
        expect(styles.map(style => style.borderWidth)).toEqual([2, 2, 2]);
        expect(styles.map(style => style.height)).toEqual([48, 48, 48]);
        expect(styles[1]).toEqual(expect.objectContaining({ borderColor: darkTokens.accent, borderRadius: 12 }));
        expect(styles[0]).toEqual(expect.objectContaining({ borderColor: darkTokens.borderStrong }));
        expect(screen.UNSAFE_getByProps({ testID: 'swatch-picker-badge-PAPER' })).toBeDefined();
        expect(screen.getByText('PAPER', { includeHiddenElements: true })).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('radio', { name: 'WHITE' }));
        expect(onChange).toHaveBeenCalledWith('WHITE');
    });

    it('AC-011 escolhas empilhadas com 56 de altura, rádio de 22 e descrição', () => {
        withTheme(
            <ChoiceGroup
                layout="stacked"
                label="Modo"
                value="VERTICAL"
                options={['VERTICAL', 'PAGED'] as const}
                optionLabel={option => option}
                optionDescription={option => (option === 'VERTICAL' ? 'Fluxo contínuo' : 'Uma página por vez')}
                onChange={jest.fn()}
            />,
        );

        const selected = StyleSheet.flatten(screen.getByTestId('choice-group-row-VERTICAL').props.style);
        const other = StyleSheet.flatten(screen.getByTestId('choice-group-row-PAGED').props.style);

        expect(selected.minHeight).toBe(other.minHeight);
        expect(selected.backgroundColor).toBe(darkTokens.surfaceSelected);
        expect(selected.alignItems).toBe('center');
        expect(selected.flexDirection).toBe('row-reverse');
        expect(selected.minHeight).toBeGreaterThanOrEqual(56);
        expect(StyleSheet.flatten(screen.UNSAFE_getByProps({ testID: 'choice-group-indicator-VERTICAL' }).props.style)).toEqual(
            expect.objectContaining({ height: 22, width: 22 }),
        );
        expect(screen.getByText('Uma página por vez')).toBeOnTheScreen();
    });

    it('AC-012 linha com tile de ícone usa 56 sem descrição e 64 com descrição', () => {
        const view = withTheme(<ListRow title="Dados e armazenamento" icon="server-outline" onPress={jest.fn()} variant="plain" />);

        expect(StyleSheet.flatten(screen.getByTestId('list-row-icon-tile').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.accentSoft, borderRadius: 12, height: 40, width: 40 }),
        );
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Dados e armazenamento' }).props.style).minHeight).toBe(56);

        view.rerender(
            <ThemeProvider initialOverride="dark">
                <ListRow title="Excluir obra" description="Remove capítulos" icon="trash-outline" tone="danger" onPress={jest.fn()} variant="plain" />
            </ThemeProvider>,
        );

        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Excluir obra' }).props.style).minHeight).toBe(64);
        expect(StyleSheet.flatten(screen.getByTestId('list-row-icon-tile').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.dangerSoft }),
        );
    });

    it('AC-012 uso atual sem tile não muda de altura', () => {
        withTheme(<ListRow title="Versão" description="1.0.0" variant="plain" />);

        expect(screen.queryByTestId('list-row-icon-tile')).toBeNull();
        expect(StyleSheet.flatten(screen.getByLabelText('Versão').props.style).minHeight).toBe(touchTarget);
    });
});
