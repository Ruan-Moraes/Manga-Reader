import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MangaPoster } from '../MangaPoster';

describe('MangaPoster', () => {
    it('renders img when cover provided', () => {
        render(<MangaPoster cover="https://example.com/cover.jpg" alt="Berserk" />);
        expect(screen.getByRole('img', { name: 'Berserk' })).toBeInTheDocument();
    });

    it('renders without cover (gradient fallback)', () => {
        const { container } = render(<MangaPoster />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders as button when onClick provided', () => {
        render(<MangaPoster onClick={vi.fn()} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<MangaPoster onClick={onClick} />);
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalled();
    });

    it('does not render as button without onClick', () => {
        render(<MangaPoster />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies sm radius class', () => {
        const { container } = render(<MangaPoster radius="sm" />);
        expect(container.firstChild).toHaveClass('rounded-mr-sm');
    });

    it('applies elevated shadow class', () => {
        const { container } = render(<MangaPoster elevated />);
        expect(container.firstChild).toHaveClass('shadow-mr-elevated');
    });
});
