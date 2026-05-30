import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Stars, StarsInput } from '../Stars';

describe('Stars (display)', () => {
    it('aria-label padrão', () => {
        render(<Stars value={3} />);
        expect(screen.getByRole('img', { name: '3 de 5 estrelas' })).toBeInTheDocument();
    });

    it('aria-label customizado', () => {
        render(<Stars value={4} label="4 estrelas" />);
        expect(screen.getByRole('img', { name: '4 estrelas' })).toBeInTheDocument();
    });

    it('arredonda valor ao inteiro', () => {
        render(<Stars value={3.4} />);
        expect(screen.getByRole('img', { name: '3.4 de 5 estrelas' })).toBeInTheDocument();
    });
});

describe('StarsInput (interativo)', () => {
    it('renderiza 5 botões', () => {
        render(<StarsInput value={0} onChange={() => {}} />);
        expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('chama onChange ao clicar em estrela', async () => {
        const onChange = vi.fn();
        render(<StarsInput value={0} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: '3 estrelas' }));
        expect(onChange).toHaveBeenCalledWith(3);
    });

    it('deseleciona estrela ao clicar no mesmo valor', async () => {
        const onChange = vi.fn();
        render(<StarsInput value={3} onChange={onChange} />);
        await userEvent.click(screen.getByRole('button', { name: '3 estrelas' }));
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it('aria-pressed reflete valor atual', () => {
        render(<StarsInput value={3} onChange={() => {}} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
        expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
        expect(buttons[3]).toHaveAttribute('aria-pressed', 'false');
    });
});
