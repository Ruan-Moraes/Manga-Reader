import { useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { ThemeProvider } from '@/src/shared/theme';

import { ReaderSettingsControls } from '../ReaderSettingsControls';

function ControlledReaderSettingsControls() {
    const [value, setValue] = useState(DEFAULT_USER_SETTINGS.reader);

    return (
        <ReaderSettingsControls
            capabilities={{ high: true, low: true, medium: true }}
            onChange={patch => setValue(current => ({ ...current, ...patch }))}
            value={value}
        />
    );
}

describe('MOB-FEAT-031 reader settings controls', () => {
    it('combina entradas adequadas e emite apenas o patch alterado', () => {
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls capabilities={{ high: true, low: true, medium: true }} onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Paginado' }));
        fireEvent(view.getByRole('adjustable', { name: 'Saturação' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'decrement' },
        });
        fireEvent(view.getByRole('adjustable', { name: 'Espaçamento' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'increment' },
        });
        fireEvent(view.UNSAFE_getByType(Switch), 'valueChange', false);

        expect(onChange).toHaveBeenCalledWith({ mode: 'PAGED' });
        expect(onChange).toHaveBeenCalledWith({ saturation: 95 });
        expect(onChange).toHaveBeenCalledWith({ gap: 1 });
        expect(onChange).toHaveBeenCalledWith({ autoMarkRead: false });
        expect(view.getByRole('button', { name: 'Qualidade: Automática' })).toBeOnTheScreen();
        expect(['Preto', 'Escuro', 'Papel', 'Claro', 'Branco'].map(name => view.getByRole('radio', { name }))).toHaveLength(5);
    });

    it('mapeia direção, ajuste, qualidade, fundo e preload para patches independentes', () => {
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls capabilities={{ high: true, low: true, medium: true }} onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Webtoon' }));
        fireEvent.press(view.getByRole('radio', { name: 'Altura' }));
        fireEvent.press(view.getByRole('button', { name: 'Qualidade: Automática' }));
        expect(view.getByText('Prioriza nitidez com maior uso de dados.')).toBeOnTheScreen();
        fireEvent.press(view.getByRole('radio', { name: 'Alta' }));
        fireEvent.press(view.getByRole('radio', { name: 'Papel' }));
        fireEvent(view.getByRole('adjustable', { name: 'Pré-carregamento' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'increment' },
        });

        expect(onChange).toHaveBeenCalledWith({ direction: 'WEBTOON' });
        expect(onChange).toHaveBeenCalledWith({ fit: 'HEIGHT' });
        expect(onChange).toHaveBeenCalledWith({ quality: 'HIGH' });
        expect(onChange).toHaveBeenCalledWith({ background: 'PAPER' });
        expect(onChange).toHaveBeenCalledWith({ preload: 4 });
    });

    it('mantém a nova cor de fundo selecionada sem aplicar borda ao item', () => {
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ControlledReaderSettingsControls />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Papel' }));

        expect(view.getByRole('radio', { name: 'Papel' }).props.accessibilityState.selected).toBe(true);
        fireEvent(view.getByTestId('swatch-picker-track'), 'layout', { nativeEvent: { layout: { width: 342 } } });
        expect(view.getByTestId('swatch-picker-surface-PAPER').props.style).toEqual(expect.objectContaining({ width: 68 }));
        expect(StyleSheet.flatten(view.getByTestId('swatch-picker-surface-PAPER').props.style)).toEqual(
            expect.objectContaining({ alignItems: 'center', borderWidth: 0, justifyContent: 'center' }),
        );
        expect(view.UNSAFE_getByProps({ testID: 'swatch-picker-badge-PAPER' })).toBeDefined();

        fireEvent.press(view.getByRole('radio', { name: 'Branco' }));

        expect(view.UNSAFE_queryByProps({ testID: 'swatch-picker-badge-PAPER' })).toBeNull();
        expect(view.UNSAFE_getByProps({ testID: 'swatch-picker-badge-WHITE' })).toBeDefined();
    });

    it('antecipa a seleção no toque e restaura o valor controlado se o gesto for cancelado', () => {
        jest.useFakeTimers();
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls capabilities={{ high: true, low: true, medium: true }} onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );
        const paper = view.getByRole('radio', { name: 'Papel' });

        fireEvent(paper, 'pressIn');

        expect(view.getByRole('radio', { name: 'Papel' }).props.accessibilityState.selected).toBe(true);
        expect(view.UNSAFE_getByProps({ testID: 'swatch-picker-badge-PAPER' })).toBeDefined();

        fireEvent(paper, 'pressOut');
        act(() => jest.runOnlyPendingTimers());

        expect(onChange).not.toHaveBeenCalled();
        expect(view.getByRole('radio', { name: 'Escuro' }).props.accessibilityState.selected).toBe(true);
        expect(view.UNSAFE_queryByProps({ testID: 'swatch-picker-badge-PAPER' })).toBeNull();
        jest.useRealTimers();
    });
});
