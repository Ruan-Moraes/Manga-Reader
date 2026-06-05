import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { VotePill } from '../VotePill';

describe('VotePill', () => {
    it('exibe o placar líquido', () => {
        render(<VotePill value={7} />);
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('marca aria-pressed conforme a reação ativa', () => {
        render(<VotePill value={3} active="up" upLabel="cima" downLabel="baixo" />);
        expect(screen.getByRole('button', { name: 'cima' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'baixo' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('dispara onUp e onDown', async () => {
        const onUp = vi.fn();
        const onDown = vi.fn();
        render(<VotePill value={0} onUp={onUp} onDown={onDown} upLabel="cima" downLabel="baixo" />);
        await userEvent.click(screen.getByRole('button', { name: 'cima' }));
        await userEvent.click(screen.getByRole('button', { name: 'baixo' }));
        expect(onUp).toHaveBeenCalledOnce();
        expect(onDown).toHaveBeenCalledOnce();
    });

    it('expõe o grupo com label acessível', () => {
        render(<VotePill value={1} label="Votar — comentário" />);
        expect(screen.getByRole('group', { name: 'Votar — comentário' })).toBeInTheDocument();
    });
});
