import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
    it('exibe imagem quando src fornecido', () => {
        render(<Avatar src="/img.jpg" name="Ana" />);
        expect(screen.getByRole('img', { name: 'Ana' })).toHaveAttribute('src', '/img.jpg');
    });

    it('exibe iniciais quando sem src', () => {
        render(<Avatar name="Carlos Silva" />);
        expect(screen.getByText('CS')).toBeInTheDocument();
    });

    it('exibe ? quando sem name e sem src', () => {
        render(<Avatar />);
        expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('initials prop sobrescreve name', () => {
        render(<Avatar name="Carlos Silva" initials="XY" />);
        expect(screen.getByText('XY')).toBeInTheDocument();
    });

    it('interativo: role button + chama onClick', async () => {
        const onClick = vi.fn();
        render(<Avatar name="Ana" onClick={onClick} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('não interativo: sem role button', () => {
        render(<Avatar name="Ana" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
