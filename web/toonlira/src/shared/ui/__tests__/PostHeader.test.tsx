import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { PostHeader } from '../PostHeader';

describe('PostHeader', () => {
    it('renderiza nome, handle e tempo', () => {
        render(<PostHeader name="Mika" handle="mika" time="há 2 horas" />);
        expect(screen.getByText('Mika')).toBeInTheDocument();
        expect(screen.getByText('@mika')).toBeInTheDocument();
        expect(screen.getByText('há 2 horas')).toBeInTheDocument();
    });

    it('omite handle quando ausente', () => {
        render(<PostHeader name="Mika" time="há 2 horas" />);
        expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
    });

    it('nome vira botão quando interativo', async () => {
        const onClick = vi.fn();
        render(<PostHeader name="Mika" onClickName={onClick} nameProfileLabel="Ver perfil" />);
        await userEvent.click(screen.getByRole('button', { name: 'Ver perfil' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('renderiza slots badges e right', () => {
        render(<PostHeader name="Mika" badges={<span>AUTOR</span>} right={<span>4.5</span>} />);
        expect(screen.getByText('AUTOR')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('renderiza o slot meta (ex.: selo editado) inline após o tempo', () => {
        render(<PostHeader name="Mika" time="há 2 horas" meta={<span>(editado)</span>} />);
        expect(screen.getByText('(editado)')).toBeTruthy();
    });
});
