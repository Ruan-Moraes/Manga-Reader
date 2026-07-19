import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkles } from 'lucide-react';
import { HeroSection } from '../HeroSection';
import { Button } from '../Button';

describe('HeroSection', () => {
    it('renders as section', () => {
        const { container } = render(<HeroSection title="Título" />);
        expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('renders title as h1', () => {
        render(<HeroSection title="Naruto" />);
        expect(screen.getByRole('heading', { name: /naruto/i, level: 1 })).toBeInTheDocument();
    });

    it('renders eyebrow when provided', () => {
        render(<HeroSection title="Título" eyebrow="Em alta" />);
        expect(screen.getByText('Em alta')).toHaveClass('text-mr-accent');
    });

    it('renders eyebrow icon when provided', () => {
        const { container } = render(<HeroSection title="Título" eyebrow="Em alta" eyebrowIcon={Sparkles} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders description', () => {
        render(<HeroSection title="Título" description="Uma história incrível" />);
        expect(screen.getByText(/uma história incrível/i)).toBeInTheDocument();
    });

    it('renders meta slot', () => {
        render(<HeroSection title="Título" meta={<span>2024</span>} />);
        expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders actions slot', () => {
        render(<HeroSection title="Título" actions={<Button variant="primary">Ler</Button>} />);
        expect(screen.getByRole('button', { name: /ler/i })).toBeInTheDocument();
    });

    it('renders visual slot', () => {
        render(<HeroSection title="Título" visual={<img src="cover.jpg" alt="capa" />} />);
        expect(screen.getByAltText('capa')).toBeInTheDocument();
    });

    it('uses the shared poster background token', () => {
        const { container } = render(<HeroSection title="Título" />);
        const section = container.querySelector('section') as HTMLElement;
        expect(section.style.background).toBe('var(--mr-poster-gradient)');
        expect(screen.getByRole('heading', { name: 'Título' }).parentElement).toHaveClass('text-mr-on-overlay');
    });

    it('uses custom background when provided', () => {
        const { container } = render(<HeroSection title="Título" background="#ff0000" />);
        const section = container.querySelector('section') as HTMLElement;
        expect(section.style.background).toBe('rgb(255, 0, 0)');
    });
});
