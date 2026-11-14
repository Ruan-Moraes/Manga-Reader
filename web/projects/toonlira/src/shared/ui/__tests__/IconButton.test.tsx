import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { X, Trash2 } from 'lucide-react';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
    it('renderiza com aria-label acessível', () => {
        render(<IconButton icon={X} aria-label="Fechar" />);
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    });

    it('chama onClick ao clicar', async () => {
        const onClick = vi.fn();
        render(<IconButton icon={X} aria-label="Fechar" onClick={onClick} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('desabilitado não chama onClick', async () => {
        const onClick = vi.fn();
        render(<IconButton icon={X} aria-label="Fechar" onClick={onClick} disabled />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('aceita variant primary', () => {
        render(<IconButton icon={Trash2} aria-label="Deletar" variant="primary" />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('aceita prop danger', () => {
        render(<IconButton icon={Trash2} aria-label="Deletar" danger />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
