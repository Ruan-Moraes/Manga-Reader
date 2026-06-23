import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
    it('renderiza', () => {
        render(<Textarea placeholder="Escreva aqui" />);
        expect(screen.getByPlaceholderText('Escreva aqui')).toBeInTheDocument();
    });

    it('exibe erro', () => {
        render(<Textarea error="Campo vazio" />);
        expect(screen.getByText('Campo vazio')).toBeInTheDocument();
    });

    it('exibe hint', () => {
        render(<Textarea hint="Máx 500 chars" />);
        expect(screen.getByText('Máx 500 chars')).toBeInTheDocument();
    });

    it('aria-invalid quando erro', () => {
        render(<Textarea error="Erro" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('rows padrão = 4', () => {
        render(<Textarea />);
        expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
    });

    it('disabled', () => {
        render(<Textarea disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});
