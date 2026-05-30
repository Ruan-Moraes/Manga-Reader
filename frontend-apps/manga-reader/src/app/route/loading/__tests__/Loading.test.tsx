import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Loading from '../Loading';

vi.mock('@app/layout/PageShell', () => ({
    default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

describe('Loading', () => {
    it('renders loading heading', () => {
        renderWithProviders(<Loading />);
        expect(screen.getByRole('heading', { name: /carregando/i })).toBeInTheDocument();
    });

    it('renders loading message', () => {
        renderWithProviders(<Loading />);
        expect(screen.getByText(/por favor, aguarde/i)).toBeInTheDocument();
    });

    it('renders main landmark', () => {
        renderWithProviders(<Loading />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
