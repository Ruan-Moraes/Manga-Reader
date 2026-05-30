import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import AboutUs from '../AboutUs';

describe('AboutUs', () => {
    it('renders page title', () => {
        renderWithProviders(<AboutUs />);
        expect(screen.getByText('Quem somos?')).toBeInTheDocument();
    });

    it('renders eyebrow', () => {
        renderWithProviders(<AboutUs />);
        expect(screen.getByText('A plataforma')).toBeInTheDocument();
    });

    it('renders mission section', () => {
        renderWithProviders(<AboutUs />);
        expect(screen.getByText('Nossa missão')).toBeInTheDocument();
    });

    it('renders community section', () => {
        renderWithProviders(<AboutUs />);
        expect(screen.getByText('Comunidade')).toBeInTheDocument();
    });

    it('renders as main landmark', () => {
        renderWithProviders(<AboutUs />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
