import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { HelpTooltip } from '../HelpTooltip';
import { RangeSlider } from '../RangeSlider';

const renderWithTheme = (node: React.ReactElement) => render(<ThemeProvider waitForPlatform={false}>{node}</ThemeProvider>);

jest.mock('react-native', () => {
    const native = jest.requireActual('react-native');
    const react = jest.requireActual('react');
    const wrap = (Component: React.ComponentType) =>
        react.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
            react.useImperativeHandle(ref, () => ({
                measureInWindow: (callback: (...rect: number[]) => void) => {
                    if (props.testID === 'help-tooltip-layer') callback(0, 24, 390, 600);
                    if (props.accessibilityLabel === 'Sobre Saturação') callback(64, mockAnchorY, 24, 24);
                },
            }));
            return react.createElement(Component, props);
        });
    return Object.create(native, {
        View: { value: wrap(native.View) },
        Pressable: { value: wrap(native.Pressable) },
    });
});

let mockAnchorY = 200;

describe('MOB-FEAT-054/AC-002 ajuda dos controles em balão', () => {
    it.each([
        { anchorY: 200, expectedTop: 204 },
        { anchorY: 560, expectedTop: 472 },
    ])('posiciona o balão no espaço disponível junto ao ícone em y=$anchorY', ({ anchorY, expectedTop }) => {
        mockAnchorY = anchorY;
        renderWithTheme(<HelpTooltip label="Sobre Saturação" description="Ajusta a intensidade das cores." />);

        fireEvent.press(screen.getByRole('button', { name: 'Sobre Saturação' }));
        fireEvent(screen.getByTestId('help-tooltip-layer'), 'layout');
        const tooltip = screen.getByTestId('help-tooltip');
        fireEvent(tooltip, 'layout', { nativeEvent: { layout: { height: 60 } } });
        expect(tooltip).toHaveStyle({ left: 64, opacity: 1, top: expectedTop });
    });

    it('abre ao tocar no "?" e fecha pelo fundo ou pelo próprio "?"', () => {
        renderWithTheme(<HelpTooltip label="Sobre Saturação" description="Ajusta a intensidade das cores." />);
        const trigger = screen.getByRole('button', { name: 'Sobre Saturação' });
        expect(screen.queryByText('Ajusta a intensidade das cores.')).toBeNull();

        fireEvent.press(trigger);
        expect(screen.getByText('Ajusta a intensidade das cores.')).toBeOnTheScreen();
        expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));

        fireEvent.press(screen.getByTestId('help-tooltip-backdrop', { includeHiddenElements: true }));
        expect(screen.queryByText('Ajusta a intensidade das cores.')).toBeNull();

        fireEvent.press(trigger);
        fireEvent.press(trigger);
        expect(screen.queryByText('Ajusta a intensidade das cores.')).toBeNull();
    });

    it('fica ao lado do rótulo do slider, sem ocupar uma linha abaixo', () => {
        renderWithTheme(
            <RangeSlider
                label="Espaçamento"
                decrementLabel="Diminuir Espaçamento"
                incrementLabel="Aumentar Espaçamento"
                help={{ label: 'Sobre Espaçamento', description: 'Espaço entre páginas.' }}
                minimum={0}
                maximum={32}
                value={8}
                onChange={jest.fn()}
            />,
        );
        const trigger = screen.getByRole('button', { name: 'Sobre Espaçamento' });
        const labelRow = screen.getByTestId('range-slider-label-row');
        expect(labelRow.props.style).toEqual(expect.objectContaining({ flexDirection: 'row' }));
        expect(within(labelRow).getByRole('button', { name: 'Sobre Espaçamento' })).toBe(trigger);
    });
});
