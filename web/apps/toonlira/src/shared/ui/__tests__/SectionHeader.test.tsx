import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../SectionHeader';
import { Button } from '../Button';

describe('SectionHeader', () => {
    it('renders title as h2 by default', () => {
        render(<SectionHeader title="Em alta" />);
        expect(screen.getByRole('heading', { name: /em alta/i, level: 2 })).toBeInTheDocument();
    });

    it('renders title as h3 when as=h3', () => {
        render(<SectionHeader title="Em alta" as="h3" />);
        expect(screen.getByRole('heading', { name: /em alta/i, level: 3 })).toBeInTheDocument();
    });

    it('renders title as h4 when as=h4', () => {
        render(<SectionHeader title="Em alta" as="h4" />);
        expect(screen.getByRole('heading', { name: /em alta/i, level: 4 })).toBeInTheDocument();
    });

    it('renders eyebrow when provided', () => {
        render(<SectionHeader title="Esta semana" eyebrow="Em alta" />);
        expect(screen.getByText('Em alta')).toBeInTheDocument();
    });

    it('renders meta slot', () => {
        render(<SectionHeader title="Resenhas" meta={<span>247 reviews</span>} />);
        expect(screen.getByText(/247 reviews/i)).toBeInTheDocument();
    });

    it('renders action slot', () => {
        render(<SectionHeader title="Títulos" action={<Button variant="ghost">Ver tudo</Button>} />);
        expect(screen.getByRole('button', { name: /ver tudo/i })).toBeInTheDocument();
    });

    it('applies sm size class', () => {
        const { container } = render(<SectionHeader title="X" size="sm" />);
        expect(container.querySelector('h2')?.className).toMatch(/clamp\(16px/);
    });

    it('applies lg size class', () => {
        const { container } = render(<SectionHeader title="X" size="lg" />);
        expect(container.querySelector('h2')?.className).toMatch(/clamp\(24px/);
    });

    it('passes extra className to header wrapper', () => {
        const { container } = render(<SectionHeader title="X" className="mt-8" />);
        expect(container.querySelector('header')).toHaveClass('mt-8');
    });
});
