import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Select } from '../Select';

const OPTIONS = [
    { value: 'a', label: 'Opção A' },
    { value: 'b', label: 'Opção B' },
    { value: 'c', label: 'Opção C', disabled: true },
];

describe('Select', () => {
    it('renderiza opções', () => {
        render(<Select options={OPTIONS} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Opção A')).toBeInTheDocument();
    });

    it('renderiza placeholder', () => {
        render(<Select options={OPTIONS} placeholder="Selecione" />);
        expect(screen.getByText('Selecione')).toBeInTheDocument();
    });

    it('exibe erro', () => {
        render(<Select options={OPTIONS} error="Obrigatório" />);
        expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    });

    it('exibe hint', () => {
        render(<Select options={OPTIONS} hint="Escolha uma" />);
        expect(screen.getByText('Escolha uma')).toBeInTheDocument();
    });

    it('aria-invalid quando erro', () => {
        render(<Select options={OPTIONS} error="Erro" />);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('disabled', () => {
        render(<Select options={OPTIONS} disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('opção com disabled', () => {
        render(<Select options={OPTIONS} />);
        const optC = screen.getByRole('option', { name: 'Opção C' });
        expect(optC).toBeDisabled();
    });
});
