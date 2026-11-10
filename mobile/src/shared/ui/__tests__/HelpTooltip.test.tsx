import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { HelpTooltip } from '../HelpTooltip';
import { RangeSlider } from '../RangeSlider';

const renderWithTheme = (node: React.ReactElement) => render(<ThemeProvider waitForPlatform={false}>{node}</ThemeProvider>);

describe('MOB-FEAT-054/AC-002 ajuda dos controles em balão', () => {
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
