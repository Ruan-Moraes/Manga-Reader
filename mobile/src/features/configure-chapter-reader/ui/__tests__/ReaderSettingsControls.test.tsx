import { useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { ThemeProvider } from '@/shared/theme';

import { ReaderSettingsControls } from '../ReaderSettingsControls';

function ControlledReaderSettingsControls() {
    const [value, setValue] = useState(DEFAULT_USER_SETTINGS.reader);

    return (
        <ReaderSettingsControls
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
                <ReaderSettingsControls onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
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
        expect(view.queryByRole('button', { name: /Qualidade/ })).toBeNull();
        expect(['Preto', 'Escuro', 'Papel', 'Claro', 'Branco'].map(name => view.getByRole('radio', { name }))).toHaveLength(5);
    });

    it('mapeia direção, ajuste, fundo e preload para patches independentes', () => {
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Webtoon' }));
        fireEvent.press(view.getByRole('radio', { name: 'Altura' }));
        fireEvent.press(view.getByRole('radio', { name: 'Papel' }));
        fireEvent(view.getByRole('adjustable', { name: 'Pré-carregamento' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'increment' },
        });

        expect(onChange).toHaveBeenCalledWith({ direction: 'WEBTOON' });
        expect(onChange).toHaveBeenCalledWith({ fit: 'HEIGHT' });
        expect(onChange).toHaveBeenCalledWith({ background: 'PAPER' });
        expect(onChange).toHaveBeenCalledWith({ preload: 4 });
    });

    it('mantém a nova cor de fundo selecionada com amostras de mesma largura e borda estável', () => {
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ControlledReaderSettingsControls />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Papel' }));

        expect(view.getByRole('radio', { name: 'Papel' }).props.accessibilityState.selected).toBe(true);
        fireEvent(view.getByTestId('swatch-picker-track'), 'layout', { nativeEvent: { layout: { width: 372 } } });
        expect(view.getByTestId('swatch-picker-surface-PAPER').props.style).toEqual(expect.objectContaining({ width: 68 }));
        expect(StyleSheet.flatten(view.getByTestId('swatch-picker-surface-PAPER').props.style)).toEqual(
            expect.objectContaining({ alignItems: 'center', borderWidth: 2, justifyContent: 'center' }),
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
                <ReaderSettingsControls onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
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

it('separa categorias compactas e mantém ajuda e alteração de preferências', () => {
    const onChange = jest.fn();
    const node = (category: 'reading' | 'appearance') => (
        <ThemeProvider waitForPlatform={false}>
            <ReaderSettingsControls
                compact
                category={category}
                onChange={onChange}
                value={DEFAULT_USER_SETTINGS.reader}
            />
        </ThemeProvider>
    );
    const screen = render(node('reading'));
    expect(screen.queryByRole('adjustable', { name: 'Saturação' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Paginado' })).toBeOnTheScreen();
    expect(screen.queryByText('Espaço visual entre páginas no fluxo vertical.')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Sobre Espaçamento' }));
    expect(screen.getByText('Espaço visual entre páginas no fluxo vertical.')).toBeOnTheScreen();
    screen.rerender(node('appearance'));
    expect(screen.queryByRole('radio', { name: 'Paginado' })).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Papel' }));
    expect(onChange).toHaveBeenCalledWith({ background: 'PAPER' });
    expect(screen.getByRole('adjustable', { name: 'Saturação' })).toBeOnTheScreen();
});

describe('MOB-FEAT-063 categoria quick da folha do leitor', () => {
    const quick = (reader = DEFAULT_USER_SETTINGS.reader) =>
        render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls category="quick" compact onChange={jest.fn()} value={reader} />
            </ThemeProvider>,
        );

    it('AC-006 mostra modo, direção, ajuste com Original, fundo e saturação, sem qualidade, pré-carregamento nem marcação', () => {
        const view = quick({ ...DEFAULT_USER_SETTINGS.reader, mode: 'PAGED', direction: 'LTR' });
        expect(view.getByRole('radio', { name: 'Paginado' })).toBeOnTheScreen();
        expect(view.getByText('Original')).toBeOnTheScreen();
        expect(view.getByRole('adjustable', { name: 'Saturação' })).toBeOnTheScreen();
        expect(view.getByRole('radio', { name: 'Papel' })).toBeOnTheScreen();
        expect(view.queryByRole('button', { name: /Qualidade/ })).toBeNull();
        expect(view.queryByRole('adjustable', { name: 'Pré-carregamento' })).toBeNull();
        expect(view.UNSAFE_queryByType(Switch)).toBeNull();
        expect(view.queryByRole('adjustable', { name: 'Espaçamento' })).toBeNull();
    });

    it('AC-006 mostra o espaçamento só no fluxo vertical', () => {
        const view = quick({ ...DEFAULT_USER_SETTINGS.reader, mode: 'VERTICAL' });
        expect(view.getByRole('adjustable', { name: 'Espaçamento' })).toBeOnTheScreen();
    });
});
