import { Modal } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { ChoiceRow } from '../ChoiceRow';

const OPTIONS = ['SAO_PAULO', 'TOKYO', 'UTC'] as const;
const labels = { SAO_PAULO: 'São Paulo', TOKYO: 'Tóquio', UTC: 'UTC' } as const;

const renderRow = (onChange = jest.fn()) => {
    render(
        <ThemeProvider initialOverride="dark">
            <ChoiceRow
                label="Fuso horário"
                value="SAO_PAULO"
                options={OPTIONS}
                optionLabel={option => labels[option]}
                optionDescription={option => (option === 'UTC' ? 'Tempo universal' : undefined)}
                sheetDescription="Usado nas datas do app."
                closeLabel="Fechar"
                onChange={onChange}
            />
        </ThemeProvider>,
    );

    return onChange;
};

describe('MOB-FEAT-062 ChoiceRow', () => {
    it('AC-002 mostra o valor atual e abre a folha com a opção marcada', () => {
        renderRow();

        const row = screen.getByRole('button', { name: 'Fuso horário: São Paulo' });
        expect(row.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));

        fireEvent.press(row);

        expect(screen.getByRole('header', { name: 'Fuso horário' })).toBeOnTheScreen();
        expect(screen.getByText('Usado nas datas do app.')).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'São Paulo' }).props.accessibilityState.selected).toBe(true);
        expect(screen.getByText('Tempo universal')).toBeOnTheScreen();
    });

    it('AC-002 escolher aplica e fecha', () => {
        const onChange = renderRow();

        fireEvent.press(screen.getByRole('button', { name: 'Fuso horário: São Paulo' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Tóquio' }));

        expect(onChange).toHaveBeenCalledWith('TOKYO');
        expect(screen.queryByTestId('choice-row-sheet')).toBeNull();
    });

    it.each([
        ['fechar', () => fireEvent.press(screen.getAllByRole('button', { name: 'Fechar' })[1])],
        ['scrim', () => fireEvent.press(screen.getByTestId('choice-row-backdrop'))],
        ['voltar', () => act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose())],
        ['mesma opção', () => fireEvent.press(screen.getByRole('radio', { name: 'São Paulo' }))],
    ])('AC-002 %s não muda o valor', (_label, close) => {
        const onChange = renderRow();

        fireEvent.press(screen.getByRole('button', { name: 'Fuso horário: São Paulo' }));
        close();

        expect(onChange).not.toHaveBeenCalled();
        expect(screen.queryByTestId('choice-row-sheet')).toBeNull();
    });
});
