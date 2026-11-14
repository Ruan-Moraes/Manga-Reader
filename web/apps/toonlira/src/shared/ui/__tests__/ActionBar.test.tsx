import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ActionBar } from '../ActionBar';

describe('ActionBar', () => {
    it('renderiza o slot de voto', () => {
        render(<ActionBar vote={<span>vote</span>} />);
        expect(screen.getByText('vote')).toBeInTheDocument();
    });

    it('mostra o botão responder e dispara onReply', async () => {
        const onReply = vi.fn();
        render(<ActionBar onReply={onReply} replyLabel="Responder" />);
        await userEvent.click(screen.getByRole('button', { name: 'Responder' }));
        expect(onReply).toHaveBeenCalledOnce();
    });

    it('omite responder quando sem onReply', () => {
        render(<ActionBar replyLabel="Responder" />);
        expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument();
    });

    it('renderiza ações extra', () => {
        render(<ActionBar extra={<button type="button">Excluir</button>} />);
        expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    });
});
