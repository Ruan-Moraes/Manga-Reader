import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Button from '../Button';

describe('Button', () => {
    it('renders a real link when href is provided', () => {
        render(<Button href="/plans">Planos</Button>);

        expect(screen.getByRole('link', { name: 'Planos' })).toHaveAttribute(
            'href',
            '/plans',
        );
    });

    it('forwards button interactions', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<Button onClick={onClick}>Continuar</Button>);

        await user.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('applies the outline visual variant with Tailwind utilities', () => {
        render(<Button variant="outline">Demonstração</Button>);

        expect(
            screen.getByRole('button', { name: 'Demonstração' }),
        ).toHaveClass('border-accent-border/60');
    });

    it('keeps the interactive cursor and motion feedback on CTAs', () => {
        render(<Button>Começar agora</Button>);

        expect(
            screen.getByRole('button', { name: 'Começar agora' }),
        ).toHaveClass(
            'cursor-pointer',
            'transition-[translate,scale,border-color,background-color,color,box-shadow,opacity]',
            'hover:not-disabled:-translate-y-0.5',
            'active:not-disabled:scale-[0.985]',
        );
    });
});
