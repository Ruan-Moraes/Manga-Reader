import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
    it('renderiza sem label', () => {
        render(<Checkbox />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renderiza com label clicável', () => {
        render(<Checkbox label="Aceitar termos" />);
        expect(screen.getByText('Aceitar termos')).toBeInTheDocument();
    });

    it('chama onChange ao clicar', async () => {
        const onChange = vi.fn();
        render(<Checkbox label="Aceitar" onChange={onChange} />);
        await userEvent.click(screen.getByRole('checkbox'));
        expect(onChange).toHaveBeenCalledOnce();
    });

    it('exibe hint', () => {
        render(<Checkbox label="X" hint="Detalhe" />);
        expect(screen.getByText('Detalhe')).toBeInTheDocument();
    });

    it('exibe erro e esconde hint', () => {
        render(<Checkbox label="X" hint="Dica" error="Obrigatório" />);
        expect(screen.getByText('Obrigatório')).toBeInTheDocument();
        expect(screen.queryByText('Dica')).not.toBeInTheDocument();
    });

    it('disabled', () => {
        render(<Checkbox label="X" disabled />);
        expect(screen.getByRole('checkbox')).toBeDisabled();
    });
});
