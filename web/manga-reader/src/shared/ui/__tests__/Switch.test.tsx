import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from '../Switch';

describe('Switch', () => {
    it('renderiza com role switch', () => {
        render(<Switch checked={false} onChange={() => {}} />);
        expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('aria-checked reflete checked prop', () => {
        const { rerender } = render(<Switch checked={false} onChange={() => {}} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
        rerender(<Switch checked={true} onChange={() => {}} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('chama onChange ao clicar', async () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} />);
        await userEvent.click(screen.getByRole('switch'));
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('chama onChange com false quando checked=true', async () => {
        const onChange = vi.fn();
        render(<Switch checked={true} onChange={onChange} />);
        await userEvent.click(screen.getByRole('switch'));
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it('renderiza label e descrição', () => {
        render(<Switch checked={false} onChange={() => {}} label="Notificações" description="Receba alertas" />);
        expect(screen.getByText('Notificações')).toBeInTheDocument();
        expect(screen.getByText('Receba alertas')).toBeInTheDocument();
    });

    it('disabled não chama onChange', async () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} disabled />);
        await userEvent.click(screen.getByRole('switch'));
        expect(onChange).not.toHaveBeenCalled();
    });
});
