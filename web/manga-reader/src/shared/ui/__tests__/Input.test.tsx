import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Search } from 'lucide-react';
import { Input } from '../Input';

describe('Input', () => {
    it('renderiza campo de texto', () => {
        render(<Input placeholder="Digite aqui" />);
        expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument();
    });

    it('exibe mensagem de erro', () => {
        render(<Input error="Campo obrigatório" />);
        expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    });

    it('exibe hint quando sem erro', () => {
        render(<Input hint="Use seu email real" />);
        expect(screen.getByText('Use seu email real')).toBeInTheDocument();
    });

    it('erro sobrescreve hint', () => {
        render(<Input error="Inválido" hint="Dica" />);
        expect(screen.getByText('Inválido')).toBeInTheDocument();
        expect(screen.queryByText('Dica')).not.toBeInTheDocument();
    });

    it('aria-invalid quando há erro', () => {
        render(<Input error="Erro" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('renderiza ícone leading', () => {
        const { container } = render(<Input leadingIcon={Search} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('disabled passa pro input nativo', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});
