import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import PublishWork from '../PublishWork';

vi.mock('@feature/contact', () => ({
    ContactForm: () => <div data-testid="contact-form" />,
}));

describe('PublishWork', () => {
    it('renders page title', () => {
        renderWithProviders(<PublishWork />);
        expect(screen.getByText('Publicar trabalho')).toBeInTheDocument();
    });

    it('renders eyebrow', () => {
        renderWithProviders(<PublishWork />);
        expect(screen.getByText('Para criadores')).toBeInTheDocument();
    });

    it('renders description', () => {
        renderWithProviders(<PublishWork />);
        expect(screen.getByText(/autor e deseja publicar/i)).toBeInTheDocument();
    });

    it('renders contact form', () => {
        renderWithProviders(<PublishWork />);
        expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    it('renders as main landmark', () => {
        renderWithProviders(<PublishWork />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
