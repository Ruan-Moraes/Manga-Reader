import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RadioGroup } from '../Radio';

const OPTIONS = [
    { value: 'a', label: 'Opção A' },
    { value: 'b', label: 'Opção B', hint: 'Detalhe B' },
    { value: 'c', label: 'Opção C', disabled: true },
];

describe('RadioGroup', () => {
    it('renderiza todas as opções', () => {
        render(<RadioGroup name="test" options={OPTIONS} />);
        expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('exibe legend acessível', () => {
        render(<RadioGroup name="test" options={OPTIONS} legend="Escolha" />);
        expect(screen.getByText('Escolha')).toBeInTheDocument();
    });

    it('marca opção selecionada', () => {
        render(<RadioGroup name="test" value="b" options={OPTIONS} onChange={() => {}} />);
        const radios = screen.getAllByRole('radio');
        expect(radios[1]).toBeChecked();
    });

    it('chama onChange ao clicar', async () => {
        const onChange = vi.fn();
        render(<RadioGroup name="test" value="a" options={OPTIONS} onChange={onChange} />);
        const radios = screen.getAllByRole('radio');
        await userEvent.click(radios[1]);
        expect(onChange).toHaveBeenCalledWith('b');
    });

    it('exibe hint', () => {
        render(<RadioGroup name="test" options={OPTIONS} />);
        expect(screen.getByText('Detalhe B')).toBeInTheDocument();
    });

    it('opção disabled', () => {
        render(<RadioGroup name="test" options={OPTIONS} />);
        const radios = screen.getAllByRole('radio');
        expect(radios[2]).toBeDisabled();
    });
});
