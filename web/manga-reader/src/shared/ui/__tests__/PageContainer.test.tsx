import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from '../PageContainer';

describe('PageContainer', () => {
    it('renders children', () => {
        render(<PageContainer>Conteúdo</PageContainer>);
        expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    });

    it('renders as div by default', () => {
        const { container } = render(<PageContainer>x</PageContainer>);
        expect(container.querySelector('div')).toBeInTheDocument();
        expect(container.querySelector('main')).not.toBeInTheDocument();
    });

    it('renders as main when asMain=true', () => {
        const { container } = render(<PageContainer asMain>x</PageContainer>);
        expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('applies narrow max-width class', () => {
        const { container } = render(<PageContainer size="narrow">x</PageContainer>);
        expect(container.firstChild).toHaveClass('max-w-[720px]');
    });

    it('applies wide max-width class', () => {
        const { container } = render(<PageContainer size="wide">x</PageContainer>);
        expect(container.firstChild).toHaveClass('max-w-[1440px]');
    });

    it('applies fluid max-width class', () => {
        const { container } = render(<PageContainer size="fluid">x</PageContainer>);
        expect(container.firstChild).toHaveClass('max-w-none');
    });

    it('passes extra className', () => {
        const { container } = render(<PageContainer className="custom-class">x</PageContainer>);
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies paddingY none', () => {
        const { container } = render(<PageContainer paddingY="none">x</PageContainer>);
        const el = container.firstChild as HTMLElement;
        expect(el.className).not.toMatch(/py-/);
    });
});
